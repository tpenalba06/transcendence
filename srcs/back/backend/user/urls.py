from django.urls import path, include
from .views import CreatUserView, getUser#, set_id
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    #path('set_secID/', set_id,name="set_secID"),
    path('getUser/', getUser, name="getUser"),
    path('register/', CreatUserView.as_view(), name="register"),
    path('token/', TokenObtainPairView.as_view(), name="get_token"),
    path('token/refresh/', TokenRefreshView.as_view(), name="refresh"),
]