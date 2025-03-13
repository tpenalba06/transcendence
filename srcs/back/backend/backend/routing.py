from django.urls import re_path
from django.urls import path
from . import consumers

websocket_urlpatterns= [
    re_path('ws/global', consumers.GlobalConsumer.as_asgi()),
    path('ws/pong/<str:roomid>', consumers.PongConsumer.as_asgi()),
    path('ws/multipong/<str:roomid>', consumers.MultiPongConsumer.as_asgi()),
    path('ws/chat/', consumers.ChatConsumer.as_asgi()),
    path('ws/chat/private/<str:username>/', consumers.ChatConsumer.as_asgi()),
    path('ws/online/', consumers.OnlineUsersConsumer.as_asgi()),
]