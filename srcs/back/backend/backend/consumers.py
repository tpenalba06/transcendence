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
import random

logging.basicConfig(level=logging.DEBUG)  # Définir le niveau des logs
logger = logging.getLogger(__name__)     # Créer un logger avec un nom unique

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
    connected_users = {}  # Class variable to track connected users

    @classmethod
    def is_user_online(cls, user_id):
        return user_id in cls.connected_users

    async def connect(self):
        self.user = self.scope["user"]
        OnlineUsersConsumer.connected_users[self.user.id] = self.channel_name

        # Join online users group
        await self.channel_layer.group_add(
            'online_users',
            self.channel_name
        )

        await self.accept()
        await self.update_online_users()

    async def disconnect(self, close_code):
        if self.user.id in OnlineUsersConsumer.connected_users:
            del OnlineUsersConsumer.connected_users[self.user.id]

        await self.channel_layer.group_discard(
            'online_users',
            self.channel_name
        )
        await self.update_online_users()

    @database_sync_to_async
    def get_online_users(self):
        from user.serializers import UserSerializer
        users = User.objects.filter(id__in=OnlineUsersConsumer.connected_users.keys())
        return UserSerializer(users, many=True).data

    async def update_online_users(self):
        online_users = await self.get_online_users()
        await self.channel_layer.group_send(
            'online_users',
            {
                'type': 'online_users_update',
                'users': online_users
            }
        )

    async def online_users_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'online_users',
            'users': event['users']
        }))

class GlobalConsumer(AsyncWebsocketConsumer):
    

    async def connect(self):
        await self.accept()

        await self.send(text_data=json.dumps({
            'type':'connection_established',
            'message':'You are now connected!'
        }))

    async def receive(self, text_data):
        data_json = json.loads(text_data)
        message = data_json['message']

        if (message == "left_paddle_down"):
            if self.left_paddle_pos[1] > self.down_limit:
                return

            self.left_paddle_pos[1] += 1
            await self.send(text_data=json.dumps({
                'type':'left_paddle_down',
                'message': self.left_paddle_pos[1]
        }))

        if self.game_task == None:
            self.game_task = asyncio.create_task(self.main_loop())


    async def disconnect(self, close_code):
        logger.info("salut mon pote")

class MultiPongConsumer(AsyncJsonWebsocketConsumer):
    
    players = {}
    ball_pos = {}
    ball_direction = {}
    ball_speed = {}
    left_paddle_pos = {}
    right_paddle_pos = {}
    score = {}
    game_task = {}
    up_limit = 60
    down_limit = 440
    score_to_win = 5
    is_ai = False
    difficulty = "medium"
    nb_players_connected = {}
    map_index = {}
    design_index = {}
    points = {}

    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['roomid']
        self.room_group_name = f'game_{self.room_name}'

        logger.info(f"Player connected to room {self.room_group_name}")


        # Join the game group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Send connection established message
        await self.send_message("connection_established_type", "connection_established")

        # Initialize game state
        if self.room_name not in MultiPongConsumer.nb_players_connected:
            MultiPongConsumer.nb_players_connected[self.room_name] = 1
        else:
            MultiPongConsumer.nb_players_connected[self.room_name] += 1
        if (MultiPongConsumer.nb_players_connected[self.room_name] > 2):
            return

        if self.room_name not in MultiPongConsumer.players:
            MultiPongConsumer.players[self.room_name] = [None, None]
        if self.room_name not in MultiPongConsumer.ball_pos:
            MultiPongConsumer.ball_pos[self.room_name] = [400, 250]
        if self.room_name not in MultiPongConsumer.ball_speed:
            MultiPongConsumer.ball_speed[self.room_name] = 2
        if self.room_name not in MultiPongConsumer.ball_direction:
            MultiPongConsumer.ball_direction[self.room_name] = [1, 1]
        if self.room_name not in MultiPongConsumer.left_paddle_pos:
            MultiPongConsumer.left_paddle_pos[self.room_name] = [0, 250]
        if self.room_name not in MultiPongConsumer.right_paddle_pos:
            MultiPongConsumer.right_paddle_pos[self.room_name] = [0, 250]
        if self.room_name not in MultiPongConsumer.score:
            MultiPongConsumer.score[self.room_name] = [0, 0]
        if self.room_name not in MultiPongConsumer.map_index:
            MultiPongConsumer.map_index[self.room_name] = -1
        if self.room_name not in MultiPongConsumer.design_index:
            MultiPongConsumer.design_index[self.room_name] = -1
        if self.room_name not in MultiPongConsumer.points:
            MultiPongConsumer.points[self.room_name] = -1
        if self.room_name not in MultiPongConsumer.game_task:
            MultiPongConsumer.game_task[self.room_name] = None

        if MultiPongConsumer.nb_players_connected[self.room_name] == 2:
            await self.send_message("begin_countdown_type", "oui")

        logger.info(f"nb player connected  to {self.room_name} = {MultiPongConsumer.nb_players_connected[self.room_name]}")

    async def receive(self, text_data):
        data_json = json.loads(text_data)
        message = data_json['message']
        id = data_json['id']

        logger.info(self.ball_pos)

        if (message == "on_connect"):
            if (MultiPongConsumer.players[self.room_name][0] == None):
                MultiPongConsumer.players[self.room_name][0] = id
            else:
                MultiPongConsumer.players[self.room_name][1] = id

            if (MultiPongConsumer.map_index[self.room_name] != -1):           
                await self.channel_layer.group_send(
                    self.room_group_name,{
                        'type':'game_custom_options_type',
                        'design_index': MultiPongConsumer.design_index[self.room_name],
                        'map_index': MultiPongConsumer.map_index[self.room_name],
                        'points': MultiPongConsumer.points[self.room_name]
                    })

        if (message == "begin_game" and MultiPongConsumer.game_task[self.room_name] == None):
            MultiPongConsumer.game_task[self.room_name] = asyncio.create_task(self.main_loop())
            logger.info(f"game started")

        if (message == "game_custom_options"):
            MultiPongConsumer.map_index[self.room_name] = data_json['map']
            MultiPongConsumer.design_index[self.room_name] = data_json['design']
            MultiPongConsumer.points[self.room_name] = data_json['points']

        if (message == "paddle_down"):
            # Left
            if (id == MultiPongConsumer.players[self.room_name][0]):

                if MultiPongConsumer.left_paddle_pos[self.room_name][1] > self.down_limit:
                    return

                MultiPongConsumer.left_paddle_pos[self.room_name][1] += 5
            
                await self.send_message("left_paddle_down_type", MultiPongConsumer.left_paddle_pos[self.room_name][1])

            # Right
            else:
                
                if MultiPongConsumer.right_paddle_pos[self.room_name][1] > self.down_limit:
                    return

                MultiPongConsumer.right_paddle_pos[self.room_name][1] += 5
                await self.send_message("right_paddle_down_type", MultiPongConsumer.right_paddle_pos[self.room_name][1])


        if (message == "paddle_up"):
            # Left
            if (id == MultiPongConsumer.players[self.room_name][0]):

                if MultiPongConsumer.left_paddle_pos[self.room_name][1] < self.up_limit:
                    return

                MultiPongConsumer.left_paddle_pos[self.room_name][1] -= 5
                await self.send_message("left_paddle_up_type", MultiPongConsumer.left_paddle_pos[self.room_name][1])

            # Right
            else:
                if MultiPongConsumer.right_paddle_pos[self.room_name][1] < self.up_limit:
                    return

                MultiPongConsumer.right_paddle_pos[self.room_name][1] -= 5
                await self.send_message("right_paddle_up_type", MultiPongConsumer.right_paddle_pos[self.room_name][1])


    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        MultiPongConsumer.nb_players_connected[self.room_name] -= 1
        logger.info(f"nb player connected  to {self.room_name} = {MultiPongConsumer.nb_players_connected[self.room_name]}")

        await self.send_message("winner_type", "YOU")

        if MultiPongConsumer.game_task[self.room_name]:
            MultiPongConsumer.game_task[self.room_name].cancel()

    async def main_loop(self):
        while True:
            # Ceilling and Floor Ball Detection
            if (MultiPongConsumer.ball_pos[self.room_name][1] + MultiPongConsumer.ball_direction[self.room_name][1] > 490 or MultiPongConsumer.ball_pos[self.room_name][1] + MultiPongConsumer.ball_direction[self.room_name][1] < 10):
                MultiPongConsumer.ball_direction[self.room_name][1] *= -1
               # await self.send(text_data=json.dumps({
               #     'type':'hit'
               # }))

            # right side
            if (MultiPongConsumer.ball_pos[self.room_name][0] + MultiPongConsumer.ball_direction[self.room_name][0] > 750):
                if (MultiPongConsumer.ball_pos[self.room_name][1] < MultiPongConsumer.right_paddle_pos[self.room_name][1] + 60 and MultiPongConsumer.ball_pos[self.room_name][1] > MultiPongConsumer.right_paddle_pos[self.room_name][1] - 60):
                    MultiPongConsumer.ball_direction[self.room_name][0] *= -1
                    MultiPongConsumer.ball_speed[self.room_name] += 1
                else:
                    MultiPongConsumer.score[self.room_name][0] += 1
                    # check winner
                    if (MultiPongConsumer.score[self.room_name][0] >= MultiPongConsumer.points[self.room_name]):
                        await self.send_message("winner_type", "LEFT")
                        MultiPongConsumer.game_task[self.room_name].cancel()

                    await self.channel_layer.group_send(
                        self.room_group_name,{
                            'type':'score_type',
                            'left': MultiPongConsumer.score[self.room_name][0],
                            'right': MultiPongConsumer.score[self.room_name][1]
                        })
                    MultiPongConsumer.ball_pos[self.room_name] = [400, 250]
                    MultiPongConsumer.ball_speed[self.room_name] = 3

            # left side
            if (MultiPongConsumer.ball_pos[self.room_name][0] + MultiPongConsumer.ball_direction[self.room_name][0] < 50):
                if (MultiPongConsumer.ball_pos[self.room_name][1] < MultiPongConsumer.left_paddle_pos[self.room_name][1] + 60 and MultiPongConsumer.ball_pos[self.room_name][1] > MultiPongConsumer.left_paddle_pos[self.room_name][1] - 60):
                    MultiPongConsumer.ball_direction[self.room_name][0] *= -1
                    MultiPongConsumer.ball_speed[self.room_name] += 1
                else:
                    MultiPongConsumer.score[self.room_name][1] += 1

                    # check winner
                    if (MultiPongConsumer.score[self.room_name][1] >= MultiPongConsumer.points[self.room_name]):
                        await self.send_message("winner_type", "RIGHT")
                        MultiPongConsumer.game_task[self.room_name].cancel()

                    await self.channel_layer.group_send(
                        self.room_group_name,{
                            'type':'score_type',
                            'left': MultiPongConsumer.score[self.room_name][0],
                            'right': MultiPongConsumer.score[self.room_name][1]
                        })

                    # re-init ball
                    MultiPongConsumer.ball_pos[self.room_name] = [400, 250]
                    MultiPongConsumer.ball_speed[self.room_name] = 3


            MultiPongConsumer.ball_pos[self.room_name][0] += MultiPongConsumer.ball_direction[self.room_name][0] * MultiPongConsumer.ball_speed[self.room_name]
            MultiPongConsumer.ball_pos[self.room_name][1] += MultiPongConsumer.ball_direction[self.room_name][1] * MultiPongConsumer.ball_speed[self.room_name]

            await self.channel_layer.group_send(
                self.room_group_name,{
                    'type':'ball_pos_type',
                    'x': MultiPongConsumer.ball_pos[self.room_name][0],
                    'y': MultiPongConsumer.ball_pos[self.room_name][1] 
                })
            await asyncio.sleep(1 / 30)

    async def ball_pos_type(self, event):
        await self.send_json({
                'type': "ball_pos",
                'x': event['x'],
                'y': event['y']
            })
        
    async def left_paddle_down_type(self, event):
        await self.send_json({
                'type': "left_paddle_down",
                'message': event['message']
            })
        
    async def begin_countdown_type(self, event):
        await self.send_json({
                'type': "begin_countdown",
                'message': ""
            })
        

    async def connection_established_type(self, event):
        await self.send_json({
                'type': "connection_established",
                'message': "connection_established"
            })
        
    async def left_paddle_up_type(self, event):
        await self.send_json({
                'type': "left_paddle_up",
                'message': event['message']
            })
        
    async def right_paddle_down_type(self, event):
        await self.send_json({
                'type': "right_paddle_down",
                'message': event['message']
            })
        
    async def right_paddle_up_type(self, event):
        await self.send_json({
                'type': "right_paddle_up",
                'message': event['message']
            })

    async def winner_type(self, event):
        await self.send_json({
                'type': "winner",
                'message': event['message']
            })

    async def score_type(self, event):
        await self.send_json({
                'type': "score",
                'left': event['left'],
                'right': event['right']
            })
        
    async def game_custom_options_type(self, event):
        await self.send_json({
                'type': "game_custom_options",
                'design_index': event['design_index'],
                'map_index': event['map_index'],
                'points': event['points']
            })

    async def send_message(self, _type, message):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": _type,
                "message": message
            }
        )



class PongConsumer(AsyncWebsocketConsumer):
    ball_pos = {}
    ball_direction = {}
    ball_speed = {}
    left_paddle_pos = {}
    right_paddle_pos = {}
    score = {}
    game_task = {}
    up_limit = 60
    down_limit = 440
    score_to_win = {}
    is_ai = {}
    difficulty = {}
    ai_direction_go_up = {}
    longest_exchange = {}
    shortest_exchange = {}
    current_exchange = {}

    async def change_ai_direction_easy(self, time): 
        await asyncio.sleep(time)
        PongConsumer.ai_direction_go_up[self.room_name] = bool(random.getrandbits(1))

        new_time = random.uniform(1, 2)
        asyncio.create_task(self.change_ai_direction_easy(new_time))

    async def change_ai_direction_medium(self, time):
        await asyncio.sleep(time)

        if (PongConsumer.ball_pos[self.room_name][1] <= PongConsumer.right_paddle_pos[self.room_name][1]):
            ran = random.random()
            if (ran <= 0.90):
                PongConsumer.ai_direction_go_up[self.room_name] = True
            else:
                PongConsumer.ai_direction_go_up[self.room_name] = False
        else :
            ran = random.random()
            if (ran <= 0.90):
                PongConsumer.ai_direction_go_up[self.room_name] = False
            else:
                PongConsumer.ai_direction_go_up[self.room_name] = True
        new_time = random.uniform(0.3, 0.5)
        asyncio.create_task(self.change_ai_direction_medium(new_time))

    async def change_ai_direction_hard(self, time): 
        await asyncio.sleep(time)

        if (PongConsumer.ball_pos[self.room_name][1] <= PongConsumer.right_paddle_pos[self.room_name][1]):
            ran = random.random()
            if (ran <= 0.96):
                PongConsumer.ai_direction_go_up[self.room_name] = True
            else:
                PongConsumer.ai_direction_go_up[self.room_name] = False
        else :
            ran = random.random()
            if (ran <= 0.96):
                PongConsumer.ai_direction_go_up[self.room_name] = False
            else:
                PongConsumer.ai_direction_go_up[self.room_name] = True
        new_time = random.uniform(0.2, 0.3)
        asyncio.create_task(self.change_ai_direction_medium(new_time))

    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['roomid']
        self.room_group_name = f'game_{self.room_name}'

        # Join the game group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        await self.send(text_data=json.dumps({
            'type':'connection_established',
            'message':'You are now connected!'
        }))

        PongConsumer.ball_pos[self.room_name] = [400, 250]
        PongConsumer.ball_speed[self.room_name] = 3
        PongConsumer.ball_direction[self.room_name] = [1, 1]
        PongConsumer.left_paddle_pos[self.room_name] = [0, 250]
        PongConsumer.right_paddle_pos[self.room_name] = [0, 250]
        PongConsumer.score[self.room_name] = [0, 0]
        PongConsumer.longest_exchange[self.room_name] = 0
        PongConsumer.shortest_exchange[self.room_name] = 10000
        PongConsumer.current_exchange[self.room_name] = 0
        

    async def receive(self, text_data):
        data_json = json.loads(text_data)
        message = data_json['message']

        logger.info(self.ball_pos)

        if (message == "isAi"):
            PongConsumer.is_ai[self.room_name] = data_json['value']
        if (message == "difficulty"):
            PongConsumer.difficulty[self.room_name] = data_json['value']
            if (PongConsumer.difficulty[self.room_name] == 'easy'):
                asyncio.create_task(self.change_ai_direction_easy(0.5))
            elif (PongConsumer.difficulty[self.room_name] == 'medium'):
                asyncio.create_task(self.change_ai_direction_medium(0.3))
            else:
                asyncio.create_task(self.change_ai_direction_hard(1))

        if (message == "points"):
            PongConsumer.score_to_win[self.room_name] = data_json['value']

        if (message == "left_paddle_down"):
            if PongConsumer.left_paddle_pos[self.room_name][1] > self.down_limit:
                return

            PongConsumer.left_paddle_pos[self.room_name][1] += 2
            await self.send(text_data=json.dumps({
                'type':'left_paddle_down',
                'message': PongConsumer.left_paddle_pos[self.room_name][1]
            }))
        if (message == "left_paddle_up"):
            
            if PongConsumer.left_paddle_pos[self.room_name][1] < self.up_limit:
                return

            PongConsumer.left_paddle_pos[self.room_name][1] -= 2
            await self.send(text_data=json.dumps({
                'type':'left_paddle_up',
                'message': PongConsumer.left_paddle_pos[self.room_name][1]
            }))
        if (message == "right_paddle_up"):
            if PongConsumer.right_paddle_pos[self.room_name][1] < self.up_limit:
                return
            
            PongConsumer.right_paddle_pos[self.room_name][1] -= 2
            await self.send(text_data=json.dumps({
                'type':'right_paddle_up',
                'message': PongConsumer.right_paddle_pos[self.room_name][1]
            }))
        if (message == "right_paddle_down"):
            if PongConsumer.right_paddle_pos[self.room_name][1] > self.down_limit:
                return

            PongConsumer.right_paddle_pos[self.room_name][1] += 2
            await self.send(text_data=json.dumps({
                'type':'right_paddle_down',
                'message': PongConsumer.right_paddle_pos[self.room_name][1]
            }))

        if (message == "begin_game"):
            PongConsumer.game_task[self.room_name] = asyncio.create_task(self.main_loop())


    async def disconnect(self, close_code):
        logger.info("salut mon pote")

        if (PongConsumer.game_task[self.room_name] != None):
            PongConsumer.game_task[self.room_name].cancel()

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        await self.close()


    async def main_loop(self):
        while True:
            # Bot
            if (PongConsumer.is_ai[self.room_name]):
                if (not PongConsumer.ai_direction_go_up[self.room_name]):
                    if (PongConsumer.right_paddle_pos[self.room_name][1] < self.down_limit):
                        PongConsumer.right_paddle_pos[self.room_name][1] += 12
                        await self.send(text_data=json.dumps({
                            'type':'right_paddle_down',
                            'message': PongConsumer.right_paddle_pos[self.room_name][1]
                        }))
                else:
                    if (PongConsumer.ball_pos[self.room_name][1] < PongConsumer.right_paddle_pos[self.room_name][1] and PongConsumer.right_paddle_pos[self.room_name][1] > self.up_limit):
                        PongConsumer.right_paddle_pos[self.room_name][1] -= 12
                        await self.send(text_data=json.dumps({
                            'type':'right_paddle_up',
                            'message': PongConsumer.right_paddle_pos[self.room_name][1]
                        }))
                

            # Ceilling and Floor Ball Detection
            if (PongConsumer.ball_pos[self.room_name][1] + PongConsumer.ball_direction[self.room_name][1] > 490 or PongConsumer.ball_pos[self.room_name][1] + PongConsumer.ball_direction[self.room_name][1] < 10):
                PongConsumer.ball_direction[self.room_name][1] *= -1
                await self.send(text_data=json.dumps({
                    'type':'hit',
                    'dx': PongConsumer.ball_direction[self.room_name][0],
                    'dy': PongConsumer.ball_direction[self.room_name][1]
                }))

            # right side
            if (PongConsumer.ball_pos[self.room_name][0] + PongConsumer.ball_direction[self.room_name][0] > 750):
                if (PongConsumer.ball_pos[self.room_name][1] < PongConsumer.right_paddle_pos[self.room_name][1] + 60 and PongConsumer.ball_pos[self.room_name][1] > PongConsumer.right_paddle_pos[self.room_name][1] - 60):
                    PongConsumer.ball_direction[self.room_name][0] *= -1
                    PongConsumer.ball_speed[self.room_name] += 1
                    PongConsumer.current_exchange[self.room_name] += 1

                else:
                    PongConsumer.score[self.room_name][0] += 1
                    if (PongConsumer.current_exchange[self.room_name] > PongConsumer.longest_exchange[self.room_name]):
                        PongConsumer.longest_exchange[self.room_name] = PongConsumer.current_exchange[self.room_name]
                    if (PongConsumer.current_exchange[self.room_name] < PongConsumer.shortest_exchange[self.room_name]):
                        PongConsumer.shortest_exchange[self.room_name] = PongConsumer.current_exchange[self.room_name]
                    PongConsumer.current_exchange[self.room_name] = 0

                    # check winner
                    if (PongConsumer.score[self.room_name][0] >= PongConsumer.score_to_win[self.room_name]):
                        await self.send(text_data=json.dumps({
                            'type':'winner',
                            'winner': "LEFT",
                            'longest_exchange' : PongConsumer.longest_exchange[self.room_name],
                            'shortest_exchange' : PongConsumer.shortest_exchange[self.room_name]
                        }))
                        PongConsumer.game_task[self.room_name].cancel()

                    await self.send(text_data=json.dumps({
                        'type':'score',
                        'left': PongConsumer.score[self.room_name][0],
                        'right': PongConsumer.score[self.room_name][1],
                        'winner': "LEFT"
                    }))

                    PongConsumer.ball_pos[self.room_name] = [400, 250]
                    PongConsumer.ball_speed[self.room_name] = 3

            # left side
            if (PongConsumer.ball_pos[self.room_name][0] + PongConsumer.ball_direction[self.room_name][0] < 50):
                if (PongConsumer.ball_pos[self.room_name][1] < PongConsumer.left_paddle_pos[self.room_name][1] + 60 and PongConsumer.ball_pos[self.room_name][1] > PongConsumer.left_paddle_pos[self.room_name][1] - 60):
                    PongConsumer.ball_direction[self.room_name][0] *= -1
                    PongConsumer.ball_speed[self.room_name] += 1
                    PongConsumer.current_exchange[self.room_name] += 1

                else:
                    PongConsumer.score[self.room_name][1] += 1
                    if (PongConsumer.current_exchange[self.room_name] > PongConsumer.longest_exchange[self.room_name]):
                        PongConsumer.longest_exchange[self.room_name] = PongConsumer.current_exchange[self.room_name]
                    if (PongConsumer.current_exchange[self.room_name] < PongConsumer.shortest_exchange[self.room_name]):
                        PongConsumer.shortest_exchange[self.room_name] = PongConsumer.current_exchange[self.room_name]
                    PongConsumer.current_exchange[self.room_name] = 0

                    # check winner
                    if (PongConsumer.score[self.room_name][1] >= PongConsumer.score_to_win[self.room_name]):
                        await self.send(text_data=json.dumps({
                            'type':'winner',
                            'winner': "RIGHT",
                            'longest_exchange' : PongConsumer.longest_exchange[self.room_name],
                            'shortest_exchange' : PongConsumer.shortest_exchange[self.room_name]
                        }))
                        PongConsumer.game_task[self.room_name].cancel()

                    
                    await self.send(text_data=json.dumps({
                        'type':'score',
                        'left': PongConsumer.score[self.room_name][0],
                        'right': PongConsumer.score[self.room_name][1],
                        'winner': "RIGHT"
                    }))

                    # re-init ball
                    PongConsumer.ball_pos[self.room_name] = [400, 250]
                    PongConsumer.ball_speed[self.room_name] = 3


            PongConsumer.ball_pos[self.room_name][0] += PongConsumer.ball_direction[self.room_name][0] * PongConsumer.ball_speed[self.room_name]
            PongConsumer.ball_pos[self.room_name][1] += PongConsumer.ball_direction[self.room_name][1] * PongConsumer.ball_speed[self.room_name]

            await self.send(text_data=json.dumps({
                'type':'ball_pos',
                'x': PongConsumer.ball_pos[self.room_name][0],
                'y': PongConsumer.ball_pos[self.room_name][1]
            }))
            await asyncio.sleep(1 / 30)