from django.urls import path, include

urlpatterns = [
    path('user/', include("user.urls")),
    path('auth/', include("user_auth.urls")),
]