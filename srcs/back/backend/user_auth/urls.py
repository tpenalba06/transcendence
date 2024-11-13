from django.urls import path
from .views import login42
from django.shortcuts import redirect
from . import views

urlpatterns = [
    path('login/', views.login42, name='login_42'),
    #path('callback/', views.callback_42, name='callback_42'),   # URL pour le callback après authentification

]
