from django.contrib import admin
from .models import CarMake, CarModel, Dealer, Review
admin.site.site_header = 'Cars Dealership Administration'
admin.site.site_title = 'Cars Dealership Admin'
admin.site.register([CarMake, CarModel, Dealer, Review])
