from django.urls import path
from . import views

urlpatterns = [
	path("", views.pong, name="pong"),
	path("selection/", views.pong, name="selection"),
]
