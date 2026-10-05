from django.contrib import admin
from django.urls import path, re_path
from djangoapp import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('djangoapp/csrf', views.csrf),
    path('djangoapp/session', views.session),
    path('djangoapp/register', views.register),
    path('djangoapp/login', views.login_user),
    path('djangoapp/logout', views.logout_user),
    path('djangoapp/get_dealers', views.dealers),
    path('djangoapp/get_dealers/<str:state>', views.dealers),
    path('djangoapp/dealer/<int:dealer_id>', views.dealer),
    path('djangoapp/reviews/dealer/<int:dealer_id>', views.reviews),
    path('djangoapp/review/dealer/<int:dealer_id>', views.reviews),
    path('djangoapp/get_cars', views.cars),
    path('djangoapp/add_review', views.add_review),
    path('djangoapp/analyze/<path:text>', views.analyze),
    path('health', views.health),
    re_path(r'^(?:|login/?|register/?|dealer/\d+/?|postreview/\d+/?)$', views.index),
]
