from django.contrib.auth.models import AnonymousUser
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs, parse_qsl, unquote
import jwt
import logging

logger = logging.getLogger(__name__)

class WebSocketAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        try:
            # Get token from query string
            query_string = scope.get('query_string', b'').decode()
            query_params = dict(parse_qsl(query_string))
            token = query_params.get('token', '')
            
            # URL decode the token
            token = unquote(token)

            # Get user from token
            user = await get_user(token)
            
            # Only set auth_success if user is authenticated
            scope['user'] = user
            if user.is_authenticated:
                logger.info(f"WebSocket auth successful for user: {user.username}")
            else:
                logger.error("WebSocket auth failed: User is not authenticated")
                
            return await self.app(scope, receive, send)
        except Exception as e:
            logger.error(f"Error in WebSocket middleware: {str(e)}")
            scope['user'] = AnonymousUser()
            return await self.app(scope, receive, send)

@database_sync_to_async
def get_user(token_key):
    try:
        # Remove 'Bearer ' prefix if present
        if token_key.startswith('Bearer '):
            token_key = token_key[7:]
            
        logger.info(f"Attempting to decode token: {token_key[:10]}...")
        
        # Decode the JWT token using the same secret as in views.py
        decoded_data = jwt.decode(token_key, 'secret', algorithms=["HS256"])
        logger.info(f"Full decoded token data: {decoded_data}")
        
        user_id = decoded_data.get('id')
        logger.info(f"Extracted user ID from token: {user_id}")
        
        # Get the user from database
        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
            logger.info(f"Found user in database: {user.username} (ID: {user.id})")
            return user
        except User.DoesNotExist:
            logger.error(f"No user found in database with ID: {user_id}")
            return AnonymousUser()
            
    except jwt.ExpiredSignatureError:
        logger.error("Token has expired")
        return AnonymousUser()
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid token: {str(e)}")
        return AnonymousUser()
    except Exception as e:
        logger.error(f"Error authenticating WebSocket connection: {str(e)}")
        return AnonymousUser()
