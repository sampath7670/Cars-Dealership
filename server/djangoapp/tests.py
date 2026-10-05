import json
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase, Client, override_settings
from .models import Review

@override_settings(SENTIMENT_URL='', DEALER_SERVICE_URL='')
class DealershipTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('seed_data', verbosity=0)
        cls.user = get_user_model().objects.create_user('testdriver', password='RoadTest-42!Safe')

    def post(self, path, data):
        return self.client.post('/djangoapp/' + path, json.dumps(data), content_type='application/json')

    def test_dealers_and_kansas_filter(self):
        all_dealers = self.client.get('/djangoapp/get_dealers').json()['dealers']
        self.assertEqual(len(all_dealers), 8)
        kansas = self.client.get('/djangoapp/get_dealers/Kansas').json()['dealers']
        self.assertEqual(len(kansas), 3)
        self.assertTrue(all(d['state'] == 'Kansas' for d in kansas))
        self.assertEqual(self.client.get('/djangoapp/dealer/1').json()['dealer']['city'], 'Kansas City')
        self.assertEqual(self.client.get('/djangoapp/dealer/999').status_code, 404)

    def test_makes_models_and_sentiment(self):
        cars = self.client.get('/djangoapp/get_cars').json()
        self.assertEqual(len(cars['car_makes']), 5)
        self.assertEqual(len(cars['car_models']), 10)
        self.assertEqual(self.client.get('/djangoapp/analyze/Fantastic%20services').json()['sentiment'], 'positive')
        self.assertEqual(self.client.get('/djangoapp/analyze/Terrible%20service').json()['sentiment'], 'negative')

    def test_login_logout_and_registration(self):
        self.assertEqual(self.post('login', {'username':'testdriver','password':'incorrect'}).status_code, 401)
        self.assertEqual(self.post('login', {'username':'testdriver','password':'RoadTest-42!Safe'}).status_code, 200)
        self.assertEqual(self.client.get('/djangoapp/session').json()['username'], 'testdriver')
        self.assertEqual(self.post('logout', {}).status_code, 200)
        self.assertIsNone(self.client.get('/djangoapp/session').json()['username'])
        data = {'username':'newdriver','first_name':'New','last_name':'Driver','email':'new@example.com','password':'Safe-Road-92!'}
        self.assertEqual(self.post('register', data).status_code, 200)
        self.assertTrue(get_user_model().objects.get(username='newdriver').check_password(data['password']))
        self.assertEqual(self.post('register', data).status_code, 400)

    def test_csrf_is_required_for_login(self):
        client = Client(enforce_csrf_checks=True)
        response = client.post('/djangoapp/login', json.dumps({'username':'testdriver','password':'RoadTest-42!Safe'}), content_type='application/json')
        self.assertEqual(response.status_code, 403)
        token = client.get('/djangoapp/csrf').json()['csrfToken']
        response = client.post('/djangoapp/login', json.dumps({'username':'testdriver','password':'RoadTest-42!Safe'}), content_type='application/json', HTTP_X_CSRFTOKEN=token)
        self.assertEqual(response.status_code, 200)

    def test_review_auth_validation_and_identity(self):
        data = {'dealer_id':1,'review':'Fantastic services. Friendly and helpful staff.','rating':5,'purchase':False,'name':'Spoofed'}
        self.assertEqual(self.post('add_review', data).status_code, 401)
        self.client.force_login(self.user)
        self.assertEqual(self.post('add_review', {**data,'rating':9}).status_code, 400)
        self.assertEqual(self.post('add_review', {**data,'dealer_id':999}).status_code, 404)
        self.assertEqual(self.post('add_review', {**data,'purchase':True,'car_model_id':999}).status_code, 400)
        response = self.post('add_review', data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['review']['name'], 'testdriver')
        self.assertEqual(response.json()['review']['sentiment'], 'positive')
        self.assertEqual(len(self.client.get('/djangoapp/reviews/dealer/1').json()['reviews']), 2)

    def test_purchase_details_and_invalid_json(self):
        self.client.force_login(self.user)
        response = self.post('add_review', {'dealer_id':1,'review':'Great visit and purchase.','rating':4,'purchase':True,'car_model_id':1,'purchase_date':'2025-06-10'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['review']['car_make'], 'Toyota')
        self.assertEqual(self.client.post('/djangoapp/login','not-json',content_type='application/json').status_code, 400)
        self.assertEqual(self.client.get('/djangoapp/logout').status_code, 405)

    @override_settings(SENTIMENT_URL='http://sentiment:5000')
    @patch('djangoapp.views.requests.get')
    def test_sentiment_service_failure_does_not_save_review(self, mocked):
        import requests
        mocked.side_effect = requests.RequestException()
        self.client.force_login(self.user)
        before = Review.objects.count()
        self.assertEqual(self.post('add_review', {'dealer_id':1,'review':'Great experience','rating':5}).status_code, 503)
        self.assertEqual(Review.objects.count(), before)
