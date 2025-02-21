from django.urls import path
from .views import LoginView, CreatUserView, LogoutView, BlockedUsersView
from .views import getUser, getQrcode

urlpatterns = [
    path('getUser/', getUser, name="getUser"),
    path('register/', CreatUserView.as_view(), name="register"),
    path('token/', LoginView.as_view(), name="login"),
    path('logout/', LogoutView.as_view(), name="logout"),
    path('qrcode/', getQrcode, name="get_qrcode"),
    path('blocked/', BlockedUsersView.as_view(), name="blocked_users"),
    path('blocked/<int:user_id>/', BlockedUsersView.as_view(), name="unblock_user"),
]