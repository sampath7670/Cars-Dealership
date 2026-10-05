from django.conf import settings
from django.db import models

class CarMake(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    def __str__(self):
        return self.name

class CarModel(models.Model):
    make = models.ForeignKey(CarMake, on_delete=models.CASCADE, related_name='models')
    name = models.CharField(max_length=60)
    year = models.PositiveIntegerField()
    class Meta:
        constraints = [models.UniqueConstraint(fields=['make', 'name', 'year'], name='unique_car_model')]
    def __str__(self):
        return f'{self.make.name} {self.name} ({self.year})'

class Dealer(models.Model):
    full_name = models.CharField(max_length=120)
    city = models.CharField(max_length=80)
    address = models.CharField(max_length=180)
    state = models.CharField(max_length=40)
    zip = models.CharField(max_length=10)
    phone = models.CharField(max_length=30)
    email = models.EmailField()
    def __str__(self):
        return self.full_name

class Review(models.Model):
    dealer = models.ForeignKey(Dealer, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    name = models.CharField(max_length=150)
    review = models.TextField(max_length=3000)
    rating = models.PositiveSmallIntegerField(default=5)
    purchase = models.BooleanField(default=False)
    purchase_date = models.DateField(null=True, blank=True)
    car_make = models.CharField(max_length=50, blank=True)
    car_model = models.CharField(max_length=60, blank=True)
    car_year = models.PositiveIntegerField(null=True, blank=True)
    sentiment = models.CharField(max_length=10, default='neutral')
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-created_at', '-id']
        constraints = [models.CheckConstraint(condition=models.Q(rating__gte=1, rating__lte=5), name='rating_between_1_and_5')]
