import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.generic.websocket import AsyncJsonWebsocketConsumer
import time
import asyncio
import logging
from user.models import User, BlockedUser
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from django.utils import timezone
from django.contrib.auth import get_user_model

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.room_group_name = 'chat_global'
        
        # Join global chat room
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        # Join personal room for direct messages
        self.personal_room = f'user_{self.user.id}'
        await self.channel_layer.group_add(
            self.personal_room,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        await self.channel_layer.group_discard(
            self.personal_room,
            self.channel_name
        )

    @database_sync_to_async
    def is_blocked(self, sender_id, recipient_id):
        return BlockedUser.objects.filter(
            user_id=recipient_id,
            blocked_user_id=sender_id
        ).exists()

    @database_sync_to_async
    def get_user_by_id(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'chat_message')
            
            if message_type == 'chat_message':
                message = data.get('message', '')
                recipient_id = data.get('recipient')
                
                # Check if this is a direct message
                if recipient_id:
                    recipient = await self.get_user_by_id(recipient_id)
                    if not recipient:
                        return
                    
                    # Check if recipient has blocked the sender
                    if await self.is_blocked(self.user.id, recipient_id):
                        return
                    
                    # Send to recipient's personal room
                    await self.channel_layer.group_send(
                        f'user_{recipient_id}',
                        {
                            'type': 'chat_message',
                            'message': {
                                'text': message,
                                'username': self.user.username,
                                'profil_pic': self.user.profil_pic,
                                'isSelf': False,
                                'isDirect': True
                            }
                        }
                    )
                    
                    # Send confirmation to sender
                    await self.channel_layer.group_send(
                        self.personal_room,
                        {
                            'type': 'chat_message',
                            'message': {
                                'text': message,
                                'username': self.user.username,
                                'profil_pic': self.user.profil_pic,
                                'isSelf': True,
                                'isDirect': True,
                                'recipient': recipient.username
                            }
                        }
                    )
                else:
                    # Global chat message
                    # First send to all other users
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message',
                            'message': {
                                'text': message,
                                'username': self.user.username,
                                'profil_pic': self.user.profil_pic,
                                'userId': self.user.id,
                                'isSelf': False
                            }
                        }
                    )
                    
                    # Then send a copy to the sender with isSelf: true
                    await self.send(text_data=json.dumps({
                        'type': 'chat_message',
                        'message': {
                            'text': message,
                            'username': self.user.username,
                            'profil_pic': self.user.profil_pic,
                            'userId': self.user.id,
                            'isSelf': True
                        }
                    }))
            
            elif message_type == 'block_user':
                blocked_user_id = data.get('user_id')
                if blocked_user_id:
                    await database_sync_to_async(BlockedUser.objects.create)(
                        user=self.user,
                        blocked_user_id=blocked_user_id
                    )
            
            elif message_type == 'game_invite':
                recipient_id = data.get('recipient')
                if recipient_id:
                    recipient = await self.get_user_by_id(recipient_id)
                    if recipient and not await self.is_blocked(self.user.id, recipient_id):
                        await self.channel_layer.group_send(
                            f'user_{recipient_id}',
                            {
                                'type': 'game_invite',
                                'invite': {
                                    'from_user': self.user.username,
                                    'from_user_id': self.user.id,
                                    'game_type': 'pong'
                                }
                            }
                        )

        except json.JSONDecodeError:
            pass
        except Exception as e:
            logger.error(f"Error in chat consumer: {str(e)}")

    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message
        }))

    async def game_invite(self, event):
        invite = event['invite']
        await self.send(text_data=json.dumps({
            'type': 'game_invite',
            'invite': invite
        }))

class OnlineUsersConsumer(AsyncWebsocketConsumer):
    connected_users = {}  # Store user info by channel_name to handle multiple tabs

    async def connect(self):
        logger.info("OnlineUsers: New connection attempt")
        
        # Get user from scope
        user = self.scope["user"]
        logger.info(f"OnlineUsers: User from scope: {user}")
        
        if not user.is_authenticated:
            logger.error("OnlineUsers: User is not authenticated")
            await self.close()
            return
            
        try:
            # Accept the connection first
            await self.accept()

            # Store user info by channel name to handle multiple tabs/connections
            self.user = user
            OnlineUsersConsumer.connected_users[self.channel_name] = {
                'id': user.id,
                'username': user.username,
                'profil_pic': user.profil_pic,
                'last_seen': timezone.now()
            }
            logger.info(f"OnlineUsers: Added user {user.username} (ID: {user.id}) to connected_users")
            logger.info(f"OnlineUsers: Current connected users: {OnlineUsersConsumer.connected_users}")

            # Add to room group
            await self.channel_layer.group_add("online_users", self.channel_name)
            logger.info(f"OnlineUsers: Added {self.channel_name} to online_users group")
            
            # Broadcast updated user list
            await self.update_online_users()

        except Exception as e:
            logger.error(f"OnlineUsers: Error in connect: {e}")
            await self.close()
            return

    async def disconnect(self, close_code):
        logger.info(f"OnlineUsers: Disconnect with code {close_code}")
        try:
            # Remove this connection from connected_users
            if self.channel_name in OnlineUsersConsumer.connected_users:
                user_info = OnlineUsersConsumer.connected_users.pop(self.channel_name)
                logger.info(f"OnlineUsers: Removed user {user_info['username']} connection {self.channel_name}")
                
                await self.channel_layer.group_discard("online_users", self.channel_name)
                await self.update_online_users()
        except Exception as e:
            logger.error(f"OnlineUsers: Error in disconnect: {e}")

    @database_sync_to_async
    def get_online_users(self):
        try:
            # Get unique users from all connections
            unique_users = {}
            
            for channel_name, user_info in OnlineUsersConsumer.connected_users.items():
                username = user_info['username']
                
                # Only keep the most recent connection for each user
                if username not in unique_users or user_info['last_seen'] > unique_users[username]['last_seen']:
                    unique_users[username] = user_info

            # Convert to list for response
            users = [
                {
                    'id': info['id'],
                    'username': info['username'],
                    'profil_pic': info['profil_pic'],
                    'last_seen': info['last_seen'].isoformat()
                }
                for info in unique_users.values()
            ]
            
            logger.info(f"OnlineUsers: Retrieved all unique users: {users}")
            return users
        except Exception as e:
            logger.error(f"OnlineUsers: Error getting online users: {e}")
            return []

    async def update_online_users(self):
        try:
            # Clean up inactive connections (more than 30 minutes without activity)
            current_time = timezone.now()
            inactive_threshold = current_time - timezone.timedelta(minutes=30)
            
            inactive_channels = [
                channel_name
                for channel_name, user_info in OnlineUsersConsumer.connected_users.items()
                if user_info['last_seen'] < inactive_threshold
            ]
            
            for channel_name in inactive_channels:
                user_info = OnlineUsersConsumer.connected_users.pop(channel_name)
                logger.info(f"OnlineUsers: Removed inactive user {user_info['username']} connection {channel_name} (last seen: {user_info['last_seen']})")

            # Log current state
            logger.info(f"OnlineUsers: Active connections after cleanup: {len(OnlineUsersConsumer.connected_users)}")
            for channel, info in OnlineUsersConsumer.connected_users.items():
                logger.info(f"OnlineUsers: Active user - {info['username']} on {channel} (last seen: {info['last_seen']})")

            users = await self.get_online_users()
            message = {
                'type': 'online_users_update',
                'users': users
            }
            logger.info(f"OnlineUsers: Broadcasting update with {len(users)} users")
            await self.channel_layer.group_send("online_users", message)
        except Exception as e:
            logger.error(f"OnlineUsers: Error in update_online_users: {e}")

    async def online_users_update(self, event):
        try:
            logger.info(f"OnlineUsers: Sending update to client: {event}")
            await self.send(text_data=json.dumps({
                'type': 'online_users',
                'users': event['users']
            }))
        except Exception as e:
            logger.error(f"OnlineUsers: Error in online_users_update: {e}")