from django.shortcuts import render
from .models import User, UserSession, BlockedUser
from rest_framework.views import APIView
from .serializers import UserSerializer, CreatUserSerializer
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import TokenAuthentication
from rest_framework import status
from django.http import JsonResponse
import logging
import jwt, datetime
import pyotp
import qrcode
import base64
import io

logger = logging.getLogger(__name__)

def check2fa(user, code):
    try:
        totp = pyotp.TOTP(user.mfa_secret)
        if totp.verify(code):
            user.is2FA = True
            user.save()
            return True
        return False
    except Exception as e:
        logger.error(f"2FA verification error for user {user.username}: {str(e)}")
        return False

def is2fa(username):
    try:
        user = User.objects.filter(username=username).first()
        if user is None:
            return False
        return user.is2FA
    except Exception as e:
        logger.error(f"2FA check error for username {username}: {str(e)}")
        return False

class CreatUserView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            myData = request.data
            logger.info(f"Attempting to create user with data: {myData}")
            
            # Check if username already exists
            if User.objects.filter(username=myData.get('username')).exists():
                logger.warning(f"Username {myData.get('username')} already exists")
                return Response({'error': 'Username already exists'}, status=400)
            
            myUserToSave = CreatUserSerializer(data=myData)
            if myUserToSave.is_valid(raise_exception=True):
                user = myUserToSave.save()
                logger.info(f"Successfully created user: {user.username}")
                return Response(myUserToSave.data, status=201)
        except ValidationError as e:
            logger.error(f"Validation error during user creation: {str(e)}")
            return Response({'error': str(e)}, status=400)
        except Exception as e:
            logger.error(f"Unexpected error during user creation: {str(e)}")
            return Response({'error': 'An unexpected error occurred'}, status=500)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            code2fa = request.data.get('code2fa', '')

            logger.info(f"Login attempt for user: {username}")
            
            user = User.objects.filter(username=username).first()
            if user is None:
                logger.warning(f"Login failed: User {username} not found")
                raise AuthenticationFailed('Invalid credentials')
            
            if not user.is42stud and not user.check_password(password):
                logger.warning(f"Login failed: Invalid password for user {username}")
                raise AuthenticationFailed('Invalid credentials')

            # Deactivate any existing sessions for this user
            UserSession.objects.filter(user=user, is_active=True).update(is_active=False)

            if is2fa(username):
                if not code2fa:
                    logger.info(f"2FA required for user {username}")
                    return JsonResponse({"is2fa": "true"}, safe=False)
                if not check2fa(user, code2fa):
                    logger.warning(f"Login failed: Invalid 2FA code for user {username}")
                    raise AuthenticationFailed('Invalid 2FA code')

            payload = {
                'id': user.id,
                'username': user.username,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30),
                'iat': datetime.datetime.utcnow()
            }

            token = jwt.encode(payload, 'secret', algorithm='HS256')

            # Create new session
            UserSession.objects.create(
                user=user,
                token=f"Bearer {token}",
                is_active=True
            )

            logger.info(f"User {username} logged in successfully")
            response = Response()
            response.set_cookie(key='jwt', value=token, httponly=True)
            response.data = {
                'jwt': token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'profil_pic': user.profil_pic,
                    'is2FA': user.is2FA
                }
            }
            return response

        except AuthenticationFailed as e:
            logger.error(f"Authentication failed for user {username}: {str(e)}")
            return Response({'error': str(e)}, status=401)
        except Exception as e:
            logger.error(f"Unexpected error during login: {str(e)}")
            return Response({'error': 'An unexpected error occurred'}, status=500)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def post(self, request):
        try:
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                return Response({'error': 'No authorization token provided'}, status=401)

            # Find and deactivate the session
            session = UserSession.objects.filter(token=auth_header, is_active=True).first()
            if session:
                session.is_active = False
                session.save()
                logger.info(f"User {session.user.username} logged out successfully")
                return Response({'message': 'Logged out successfully'})
            
            return Response({'message': 'No active session found'})
        except Exception as e:
            logger.error(f"Error during logout: {str(e)}")
            return Response({'error': 'An error occurred during logout'}, status=500)

class BlockedUsersView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get(self, request):
        """Get list of users blocked by the current user"""
        try:
            user = request.user
            logger.debug(f"Fetching blocked users for user: {user.username} (ID: {user.id})")
            
            blocked_users = BlockedUser.objects.filter(user=user).select_related('blocked_user')
            logger.info(f"Found {blocked_users.count()} blocked users for {user.username}")
            
            blocked_list = [{
                'id': block.blocked_user.id,
                'username': block.blocked_user.username,
                'profil_pic': block.blocked_user.profil_pic if block.blocked_user.profil_pic else None
            } for block in blocked_users]
            
            logger.debug(f"Returning blocked users list: {blocked_list}")
            return Response(blocked_list, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error getting blocked users: {str(e)}", exc_info=True)
            return Response({'error': 'Failed to get blocked users'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """Block a user"""
        try:
            user_id = request.data.get('user_id')
            logger.debug(f"Blocking user request received. User ID to block: {user_id}")
            
            if not user_id:
                logger.warning("Block user request missing user_id parameter")
                return Response({'error': 'user_id is required'}, status=400)

            # Don't allow self-blocking
            if int(user_id) == request.user.id:
                logger.warning(f"User {request.user.username} attempted to block themselves")
                return Response({'error': 'Cannot block yourself'}, status=400)

            # Check if user exists
            try:
                blocked_user = User.objects.get(id=user_id)
                logger.debug(f"Found user to block: {blocked_user.username}")
            except User.DoesNotExist:
                logger.warning(f"Attempted to block non-existent user ID: {user_id}")
                return Response({'error': 'User not found'}, status=404)

            # Create block if it doesn't exist
            block, created = BlockedUser.objects.get_or_create(
                user=request.user,
                blocked_user=blocked_user
            )
            
            if created:
                logger.info(f"User {request.user.username} blocked {blocked_user.username}")
            else:
                logger.info(f"User {request.user.username} already had {blocked_user.username} blocked")

            return Response({'message': f'User {blocked_user.username} blocked successfully'})
        except Exception as e:
            logger.error(f"Error blocking user: {str(e)}", exc_info=True)
            return Response({'error': 'Failed to block user'}, status=500)

    def delete(self, request, user_id):
        """Unblock a user"""
        try:
            logger.debug(f"Unblock request received for user ID: {user_id}")
            
            # Try to find and delete the block
            try:
                block = BlockedUser.objects.get(
                    user=request.user,
                    blocked_user_id=user_id
                )
                username = block.blocked_user.username
                logger.info(f"Found block record: {request.user.username} -> {username}")
                
                block.delete()
                logger.info(f"User {request.user.username} unblocked {username}")
                
                return Response({'message': f'User {username} unblocked successfully'})
            except BlockedUser.DoesNotExist:
                logger.warning(f"No block found for user ID {user_id} by {request.user.username}")
                return Response({'error': 'Block not found'}, status=404)
        except Exception as e:
            logger.error(f"Error unblocking user: {str(e)}", exc_info=True)
            return Response({'error': 'Failed to unblock user'}, status=500)

def getQrcode(request):
    try:
        myPath = request.build_absolute_uri()
        token_string = myPath.split("?")[1]
        token = jwt.decode(token_string, 'secret', algorithms=['HS256'])
        user_id = token.get('id')
        user = User.objects.get(id=user_id)

        if not user.mfa_secret:
            user.mfa_secret = pyotp.random_base32()
            user.save()

        otp_uri = pyotp.totp.TOTP(user.mfa_secret).provisioning_uri(
            name=user.username,
            issuer_name="SnowPong"
        )

        qr = qrcode.make(otp_uri)
        buffer = io.BytesIO()
        qr.save(buffer, format="PNG")

        buffer.seek(0)
        qr_code = base64.b64encode(buffer.getvalue()).decode("utf-8")

        qr_code_data_uri = f"data:image/png;base64,{qr_code}"
        
        return JsonResponse({"qrcode": qr_code_data_uri}, safe=False)
    except Exception as e:
        logger.error(f"Error generating QR code: {str(e)}")
        return Response({'error': 'An unexpected error occurred'}, status=500)

def getUser(request):
    try:
        token = request.COOKIES.get('jwt')

        if not token:
            # Try getting token from Authorization header
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Token '):
                token = auth_header.split(' ')[1]
            else:
                raise AuthenticationFailed('Unauthenticated!')

        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token!')

        user = User.objects.filter(id=payload['id']).first()
        if not user:
            raise AuthenticationFailed('User not found!')
            
        serializer = UserSerializer(user)
        return Response(serializer.data)
    except AuthenticationFailed as e:
        return Response({'error': str(e)}, status=401)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
