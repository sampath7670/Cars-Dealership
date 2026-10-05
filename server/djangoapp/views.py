import json
from datetime import date
from functools import wraps
from urllib.parse import quote
import requests
from django.conf import settings
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import render
from django.views.decorators.http import require_GET, require_POST
from .models import CarMake, CarModel, Dealer, Review
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

def result(**data):
    return JsonResponse({'status': 200, **data})

def error(message, status=400):
    return JsonResponse({'status': status, 'error': message}, status=status)

def json_body(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            if not isinstance(data, dict):
                raise ValueError()
        except (ValueError, UnicodeDecodeError):
            return error('A JSON object is required.')
        return view(request, data, *args, **kwargs)
    return wrapped

def service(path, payload=None):
    response = requests.request('POST' if payload is not None else 'GET', settings.DEALER_SERVICE_URL.rstrip('/') + path, json=payload, headers={'X-Service-Token': settings.SERVICE_TOKEN}, timeout=8)
    response.raise_for_status()
    return response.json()

def sentiment(text):
    if settings.SENTIMENT_URL:
        response = requests.get(settings.SENTIMENT_URL.rstrip('/') + '/analyze/' + quote(text, safe=''), timeout=8)
        response.raise_for_status()
        return response.json()
    scores = analyzer.polarity_scores(text)
    label = 'positive' if scores['compound'] >= .05 else 'negative' if scores['compound'] <= -.05 else 'neutral'
    return {'sentiment': label, 'scores': scores, 'text': text}

@require_GET
def csrf(request):
    return result(csrfToken=get_token(request))

@require_GET
def session(request):
    return result(username=request.user.username if request.user.is_authenticated else None)

@require_POST
@json_body
def register(request, data):
    required = ['username', 'first_name', 'last_name', 'email', 'password']
    if any(not isinstance(data.get(k), str) or not data[k].strip() for k in required):
        return error('All five fields are required.')
    user = get_user_model()(username=data['username'].strip(), first_name=data['first_name'].strip(), last_name=data['last_name'].strip(), email=data['email'].strip())
    try:
        user.full_clean(exclude=['password'])
        validate_email(user.email)
        validate_password(data['password'], user)
        with transaction.atomic():
            user.set_password(data['password'])
            user.save()
    except (ValidationError, IntegrityError) as exc:
        return error(' '.join(exc.messages) if isinstance(exc, ValidationError) else 'Username already exists.')
    login(request, user)
    return result(username=user.username, message='Registration successful')

@require_POST
@json_body
def login_user(request, data):
    if not isinstance(data.get('username'), str) or not isinstance(data.get('password'), str):
        return error('Username and password are required.')
    user = authenticate(request, username=data['username'], password=data['password'])
    if user is None:
        return error('Invalid username or password.', 401)
    login(request, user)
    return result(username=user.username, message='Login successful')

@require_POST
def logout_user(request):
    logout(request)
    return result(message='Logout successful')

@require_GET
def dealers(request, state='All'):
    state = request.GET.get('state', state)
    try:
        if settings.DEALER_SERVICE_URL:
            values = service('/fetchDealers')['dealers']
            if state != 'All':
                values = [d for d in values if d['state'].casefold() == state.casefold()]
        else:
            rows = Dealer.objects.order_by('id')
            if state != 'All':
                rows = rows.filter(state__iexact=state)
            values = list(rows.values())
        return result(dealers=values)
    except requests.RequestException:
        return error('Dealer service is temporarily unavailable.', 503)

@require_GET
def dealer(request, dealer_id):
    try:
        if settings.DEALER_SERVICE_URL:
            return result(dealer=service(f'/fetchDealer/{dealer_id}')['dealer'])
        row = Dealer.objects.filter(pk=dealer_id).values().first()
        return result(dealer=row) if row else error('Dealer not found.', 404)
    except requests.RequestException:
        return error('Dealer service is unavailable or dealer was not found.', 503)

@require_GET
def reviews(request, dealer_id):
    try:
        if settings.DEALER_SERVICE_URL:
            return result(reviews=service(f'/fetchReview/dealer/{dealer_id}')['reviews'])
        if not Dealer.objects.filter(pk=dealer_id).exists():
            return error('Dealer not found.', 404)
        return result(reviews=list(Review.objects.filter(dealer_id=dealer_id).values()))
    except requests.RequestException:
        return error('Review service is temporarily unavailable.', 503)

@require_GET
def cars(request):
    makes = [{'id': make.id, 'name': make.name, 'models': list(make.models.values('id', 'name', 'year'))} for make in CarMake.objects.prefetch_related('models').order_by('name')]
    return result(car_makes=makes, car_models=list(CarModel.objects.values('id', 'name', 'year', 'make__name')))

@require_POST
@json_body
def add_review(request, data):
    if not request.user.is_authenticated:
        return error('Log in to post a review.', 401)
    try:
        dealer_id = int(data.get('dealer_id', 0))
        rating = data.get('rating', 5)
        if type(rating) is not int or not 1 <= rating <= 5:
            raise ValueError('Choose a rating from 1 to 5.')
        text = data.get('review', '')
        if not isinstance(text, str) or not 3 <= len(text.strip()) <= 3000:
            raise ValueError('Review must contain 3 to 3000 characters.')
        purchase = data.get('purchase', False)
        if type(purchase) is not bool:
            raise ValueError('Purchase must be true or false.')
        car = None
        purchased_on = None
        if purchase:
            car = CarModel.objects.filter(pk=data.get('car_model_id')).select_related('make').first()
            if not car:
                raise ValueError('Choose a valid vehicle.')
            purchased_on = date.fromisoformat(data.get('purchase_date', ''))
            if purchased_on > date.today():
                raise ValueError('Purchase date cannot be in the future.')
        if settings.DEALER_SERVICE_URL:
            service(f'/fetchDealer/{dealer_id}')
        elif not Dealer.objects.filter(pk=dealer_id).exists():
            return error('Dealer not found.', 404)
        label = sentiment(text)['sentiment']
        values = {'dealer_id': dealer_id, 'name': request.user.get_full_name() or request.user.username, 'review': text.strip(), 'rating': rating, 'purchase': purchase, 'purchase_date': purchased_on, 'car_make': car.make.name if car else '', 'car_model': car.name if car else '', 'car_year': car.year if car else None, 'sentiment': label}
        if settings.DEALER_SERVICE_URL:
            values['purchase_date'] = str(purchased_on) if purchased_on else None
            saved = service('/insertReview', values)
            return result(review=saved['review'])
        row = Review.objects.create(user=request.user, **values)
        return result(review=Review.objects.filter(pk=row.pk).values().get())
    except (ValueError, TypeError) as exc:
        return error(str(exc) or 'Invalid review details.')
    except requests.RequestException:
        return error('A supporting service is unavailable. Please try again.', 503)

@require_GET
def analyze(request, text):
    if not 1 <= len(text) <= 3000:
        return error('Text must contain 1 to 3000 characters.')
    try:
        return result(**sentiment(text))
    except requests.RequestException:
        return error('Sentiment service is temporarily unavailable.', 503)

@require_GET
def index(request):
    get_token(request)
    return render(request, 'index.html')

@require_GET
def health(request):
    return result(service='Cars Dealership')
