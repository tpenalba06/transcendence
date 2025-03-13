from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import User, Friend, Match, UserSession, BlockedUser
from .serializers import UserSerializer, CreatUserSerializer, MatchSerializer, FriendSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from django.shortcuts import render
import jwt
import logging
import pyotp
import qrcode
import io
import base64
import datetime

logger = logging.getLogger(__name__)

from django.shortcuts import render
from .models import User
from .models import Match
from .models import User, UserSession, BlockedUser
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from .serializers import UserSerializer, CreatUserSerializer, MatchSerializer
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from django.http import JsonResponse
import logging
logger = logging.getLogger(__name__)
import jwt, datetime
import pyotp
import qrcode
import io
import base64
# Create your views here.

def check2fa(user, code):
    totp = pyotp.TOTP(user.mfa_secret)
    if totp.verify(code):
        user.is2FA = True
        user.save()
        return True
    return (False)

def is2fa(username):
    user = User.objects.filter(username=username).first()
    if user is None:
        return (False)
    if user.is2FA == True :
        return (True)
    return (False)

def getQrcode(request):
    myPath = request.build_absolute_uri()
    token_string = myPath.split("?")[1]
    token = jwt.decode(token_string, 'secret', algorithms=['HS256'])
    user_id = token.get('id')
    user = User.objects.get(id=user_id)


    if not user.mfa_secret:
        user.mfa_secret = pyotp.random_base32()
        user.save()

    otp_uri = pyotp.tOTP(user.mfa_secret).provisioning_uri(
        name=user.username,
        issuer_name="SnowPong"
    )

    qr = qrcode.make(otp_uri)
    buffer = io.BytesIO()
    qr.save(buffer, format="PNG")

    buffer.seek(0)
    qr_code = base64.b64encode(buffer.getvalue()).decode("utf-8")

    qr_code_data_uri = f"data:image/png;base64,{qr_code}"
    data = {
        "qrcode": qr_code_data_uri,
        "key" : user.mfa_secret
    }
    
    return JsonResponse(data, safe=False)

class CreatUserView(APIView):
    def post(self, request):
        try:
            myData = request.data
            username = myData.get('username', '')
            password = myData.get('password', '')

            # Validate required fields
            if not username or not password:
                return JsonResponse({
                    'success': False,
                    'error': 'Username and password are required'
                })

            # Check if username exists
            if User.objects.filter(username=username).exists():
                return JsonResponse({
                    'success': False,
                    'error': 'Username already exists'
                })

            # Check if username contains _42
            if "_42" in username:
                return JsonResponse({
                    'success': False,
                    'error': 'Username cannot contain _42'
                })

            # Create user
            myUserToSave = CreatUserSerializer(data=myData)
            if myUserToSave.is_valid(raise_exception=True):
                user = myUserToSave.save()
                logger.info("User created successfully: %s", username)
                return JsonResponse({
                    'success': True,
                    'username': username
                })

        except Exception as e:
            logger.error("Error creating user: %s", str(e))
            return JsonResponse({
                'success': False,
                'error': str(e)
            })

class LoginView(APIView):
    def post(self, request):
        username = request.data['username']
        password = request.data['password']
        code2fa = request.data['code2fa']

        user = User.objects.filter(username=username).first()

        if user is None:
            logging.info("PAS BON 1")
            return Response(False)
        
        if (user.is42stud==False):
            if not user.check_password(password):
                logging.info("PAS BON 2")
                return Response(False)
        if (is2fa(username)) :
            if (code2fa == ""):
                return JsonResponse({"is2fa": "true"}, safe=False)
            else :
                if (check2fa(user ,code2fa)):
                    pass
                else :
                    raise AuthenticationFailed('pas bon code 2FA')

        payload = {
            'id' : user.id,
            'exp' : datetime.datetime.utcnow() + datetime.timedelta(minutes=1000000000),
            'iat' : datetime.datetime.utcnow()
        }

        token = jwt.encode(payload, 'secret', algorithm='HS256')

        response = Response()

        response.data = {
            'jwt' : token
        }
        # decode = jwt.decode(token, 'secret', algorithms=['HS256'])
        # logging.info("MON TOKEN C'EST ->>>>>>>> %s", decode.get('id'))

        return response


def getUser(request):
    try:
        # Try getting token from query parameters first
        token = request.GET.get('token')
        
        if not token:
            # Try getting token from cookies
            token = request.COOKIES.get('jwt')
            
            if not token:
                # Try getting token from Authorization header
                auth_header = request.headers.get('Authorization')
                if auth_header and auth_header.startswith('Token '):
                    token = auth_header.split(' ')[1]
                else:
                    return JsonResponse({'error': 'Unauthenticated!'}, status=401)

        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token expired!'}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({'error': 'Invalid token!'}, status=401)

        # Get username from query parameters if provided
        username = request.GET.get('username')
        if username:
            user = User.objects.filter(username=username).first()
            if not user:
                return JsonResponse({'error': 'User not found!'}, status=404)
        else:
            user = User.objects.filter(id=payload['id']).first()
            if not user:
                return JsonResponse({'error': 'User not found!'}, status=404)
            
        serializer = UserSerializer(user)
        return JsonResponse(serializer.data, safe=False)
    except Exception as e:
        logger.error(f"Error in getUser: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

def getMatches(request):
    myPath = request.build_absolute_uri()
    token_string = myPath.split("?")[1]
    token = jwt.decode(token_string, 'secret', algorithms=['HS256'])
    user_id = token.get('id')
    matches = Match.objects.filter(user=user_id)

    matchesSer = MatchSerializer(matches, many=True)
    return JsonResponse(matchesSer.data, safe=False)

def getTourney(request):
    myPath = request.build_absolute_uri()
    token_string = myPath.split("?")[1]
    tourney = Tourney.objects.get(tourney_id=token_string)

    logger.info(tourney)
    tourneySer = TourneySerializer(tourney, many=False)
    return JsonResponse(tourneySer.data, safe=False)

class EditUserView(APIView):
    def post (self, request):
        token_string = request.data['userToken']
        token = jwt.decode(token_string, 'secret', algorithms=['HS256'])
        user_id = token.get('id')
        user = User.objects.get(id=user_id)

        fname = request.data['fname']
        lname = request.data['lname']
        pp = request.data['newpp']
        mail = request.data['newmail']

        if fname:
            user.first_name = fname
        if lname:
            user.last_name = lname
        if pp:
            user.profil_pic = pp
        if mail:
            user.email = mail
        user.save()
        return Response(request.data)

class Enable2FAView(APIView):
    def post(self, request):
        token_string = request.data['userToken']
        token = jwt.decode(token_string, 'secret', algorithms=['HS256'])
        user_id = token.get('id')
        myUser = User.objects.get(id=user_id)

        code = request.data['code2fa']
        if (check2fa(myUser, code)):
            myUser.is2FA = True
            myUser.save()
            return Response(True)
        else :
            return Response(False)

class Disable2FAView(APIView):
    def post(self, request):
        token_string = request.data['userToken']
        token = jwt.decode(token_string, 'secret', algorithms=['HS256'])
        user_id = token.get('id')
        myUser = User.objects.get(id=user_id)

        myUser.is2FA = False
        myUser.save()
        return Response(True)

# def verify_2fa_otp(user, otp):
#     totp = pyotp.TOTP(user.mfa_secret)
#     totp.verify(otp)

class AddMatchStats(APIView):
    def post(self, request):
        token_string = request.data['userToken']
        token = jwt.decode(token_string, 'secret', algorithms=['HS256'])
        user_id = token.get('id')
        myUser = User.objects.get(id=user_id)

        #create match
        match = Match(user=myUser, result=request.data['result'], date=request.data['date'],
                      score_left=request.data['score_left'], score_right=request.data['score_right'],
                      time=request.data['time'], type=request.data['type'], longest_exchange=request.data['longest_exchange'],
                      shortest_exchange=request.data['shortest_exchange'])
        match.save()

        if (request.data['result'] == "VICTOIRE"):
            myUser.win_count = myUser.win_count + 1
        else:
            myUser.lose_count = myUser.lose_count + 1

        myUser.save()
        return Response(True)
    

class AddTourneyStats(APIView):
    def post(self, request):
        token_string = request.data['userToken']
        token = jwt.decode(token_string, 'secret', algorithms=['HS256'])
        user_id = token.get('id')
        myUser = User.objects.get(id=user_id)

        tourney = Tourney(user=myUser, name1=request.data['name1'], name2=request.data['name2'],
                          name3=request.data['name3'], name4=request.data['name4'],
                          name5=request.data['name5'], name6=request.data['name6'],
                          name7=request.data['name7'], name8=request.data['name8'],
                          tourney_id=request.data['tourney_id'])

        tourney.save()
        return Response(True)

class AddWinnerToTourney(APIView):
    def post(self, request):
        tourney_id = request.data['tourney_id']
        tourney = Tourney.objects.get(tourney_id=tourney_id)

        winner = request.data['winner']
        match_number = request.data['match_number']
        if (match_number == 1):
            tourney.winner_match1 = winner
        if (match_number == 2):
            tourney.winner_match2 = winner        
        if (match_number == 3):
            tourney.winner_match3 = winner
        if (match_number == 4):
            tourney.winner_match4 = winner
        if (match_number == 5):
            tourney.winner_match5 = winner
        if (match_number == 6):
            tourney.winner_match6 = winner
        if (match_number == 7):
            tourney.winner_match7 = winner
        
        tourney.save()
        return Response(True)

    
class AddTourneyWinCount(APIView):
    def post(self, request):
        token_string = request.data['userToken']
        token = jwt.decode(token_string, 'secret', algorithms=['HS256'])
        user_id = token.get('id')
        myUser = User.objects.get(id=user_id)

        myUser.tourney_win_count = myUser.tourney_win_count + 1

        myUser.save()
        return Response(True)

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

class FriendView(APIView):
    def get(self, request):
        try:
            token = request.GET.get('token')
            if not token:
                return JsonResponse({'error': 'Token required'}, status=401)

            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
            user = User.objects.get(id=payload['id'])
            
            friends = Friend.objects.filter(user=user)
            serializer = FriendSerializer(friends, many=True)
            return JsonResponse(serializer.data, safe=False)
        except Exception as e:
            logger.error(f"Error in FriendView.get: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)

    def post(self, request):
        try:
            token = request.GET.get('token')
            if not token:
                return JsonResponse({'error': 'Token required'}, status=401)

            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
            user = User.objects.get(id=payload['id'])
            
            # Try to get username from both URL params and request body
            friend_username = request.GET.get('username') or request.data.get('username')
            if not friend_username:
                return JsonResponse({'error': 'Username required'}, status=400)

            # Prevent adding self as friend
            if user.username == friend_username:
                return JsonResponse({'error': 'Cannot add yourself as a friend'}, status=400)

            friend = User.objects.filter(username=friend_username).first()
            if not friend:
                return JsonResponse({'error': 'User not found'}, status=404)

            if Friend.objects.filter(user=user, friend=friend).exists():
                return JsonResponse({'error': 'Already friends'}, status=400)

            friendship = Friend.objects.create(user=user, friend=friend)
            serializer = FriendSerializer(friendship)
            return JsonResponse(serializer.data, safe=False)
        except Exception as e:
            logger.error(f"Error in FriendView.post: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)

    def delete(self, request, username):
        try:
            token = request.GET.get('token')
            if not token:
                return JsonResponse({'error': 'Token required'}, status=401)

            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
            user = User.objects.get(id=payload['id'])
            
            friend = User.objects.filter(username=username).first()
            if not friend:
                return JsonResponse({'error': 'User not found'}, status=404)

            friendship = Friend.objects.filter(user=user, friend=friend)
            if not friendship.exists():
                return JsonResponse({'error': 'Not friends'}, status=404)

            friendship.delete()
            return JsonResponse({'message': 'Friend removed successfully'})
        except Exception as e:
            logger.error(f"Error in FriendView.delete: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)
