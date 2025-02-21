from django.urls import re_path
from django.urls import path
from . import consumers

websocket_urlpatterns= [
    path('ws/chat/', consumers.ChatConsumer.as_asgi()),
    path('ws/chat/private/<str:username>/', consumers.ChatConsumer.as_asgi()),
    path('ws/online/', consumers.OnlineUsersConsumer.as_asgi())
]