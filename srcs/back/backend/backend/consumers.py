from channels.generic.websocket import AsyncWebsocketConsumer
import json
import time
import asyncio
import logging

#logging.basicConfig(level=logging.DEBUG)  # Définir le niveau des logs
#logger = logging.getLogger(__name__)     # Créer un logger avec un nom unique

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


class PongConsumer(AsyncWebsocketConsumer):
    ball_pos = [500, 500]
    ball_velocity = [2, 2]
    left_paddle_pos = [0, 500]
    right_paddle_pos = [0, 500]
    score = [0, 0]
    game_task = None
    up_limit = 120
    down_limit = 800

    async def connect(self):
        await self.accept()

        await self.send(text_data=json.dumps({
            'type':'connection_established',
            'message':'You are now connected!'
        }))

        self.ball_pos = [500, 500]


    async def receive(self, text_data):
        data_json = json.loads(text_data)
        message = data_json['message']

        #logger.info(self.ball_pos)

        if (message == "left_paddle_down"):
            if self.left_paddle_pos[1] > self.down_limit:
                return

            self.left_paddle_pos[1] += 1
            await self.send(text_data=json.dumps({
                'type':'left_paddle_down',
                'message': self.left_paddle_pos[1]
            }))
        if (message == "left_paddle_up"):
            
            if self.left_paddle_pos[1] < self.up_limit:
                return

            self.left_paddle_pos[1] -= 1
            await self.send(text_data=json.dumps({
                'type':'left_paddle_up',
                'message': self.left_paddle_pos[1]
            }))
        if (message == "right_paddle_up"):
            if self.right_paddle_pos[1] > self.up_limit:
                return
            
            self.right_paddle_pos[1] -= 1
            await self.send(text_data=json.dumps({
                'type':'right_paddle_up',
                'message': self.right_paddle_pos[1]
            }))
        if (message == "right_paddle_down"):
            if self.right_paddle_pos[1] < self.down_limit:
                return

            self.right_paddle_pos[1] += 1
            await self.send(text_data=json.dumps({
                'type':'right_paddle_down',
                'message': self.right_paddle_pos[1]
            }))

        if self.game_task == None:
            self.game_task = asyncio.create_task(self.main_loop())


    async def disconnect(self, close_code):
        logger.info("salut mon pote")
    
    async def main_loop(self):
        while True:
            if (self.ball_pos[1] > self.up_limit or self.ball_pos[1] < self.down_limit):
                self.ball_velocity[1] *= -1

            self.ball_pos[0] += self.ball_velocity[0]
            self.ball_pos[1] += self.ball_velocity[1]

            #logger.info(f"{self.ball_pos}")

            await self.send(text_data=json.dumps({
                'type':'ball_pos',
                'message': self.ball_pos
            }))
            await asyncio.sleep(1 / 30)
        



