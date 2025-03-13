from django.urls import path
from .views import *

urlpatterns = [
    path('getUser/', getUser, name="getUser"),
    path('getMatches/', getMatches, name="getMatches"),
    path('register/', CreatUserView.as_view(), name="register"),
    path('token/', LoginView.as_view(), name="login"),
    path('qrcode/', getQrcode, name="get_qrcode"),
    path('edit/', EditUserView.as_view(), name="EditUser"),
    path('active2fa/',Enable2FAView.as_view() ,name="active2fa"),
    path('desactiver2fa/',Disable2FAView.as_view() ,name="desactiver2fa"),
    path('addMatchStats/', AddMatchStats.as_view() ,name="addMatchStats"),
    path('blocked/', BlockedUsersView.as_view(), name="blocked_users"),
    path('blocked/<int:user_id>/', BlockedUsersView.as_view(), name="unblock_user"),
    path('friends/', FriendView.as_view(), name='friends'),
    path('friends/<str:username>/', FriendView.as_view(), name='remove_friend'),
    path('addTourneyStats/', AddTourneyStats.as_view() ,name="addTourneyStats"),
    path('addWinnerToTourney/', AddWinnerToTourney.as_view() ,name="addWinnerToTourney"),
    path('addTourneyWinCount/', AddTourneyWinCount.as_view() ,name="addTourneyWinCount"),
]