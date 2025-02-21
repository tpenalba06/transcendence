from django.urls import path
from .views import login42

urlpatterns = [
    path('login/', login42, name='login_42'),
    #path('callback/', views.callback_42, name='callback_42'),   # URL pour le callback après authentification

]
