# user_auth/views.py

import requests
import logging
import os
from django.http import JsonResponse
from user.serializers import CreatUserSerializer, UserSerializer
from user.models import User
logger = logging.getLogger(__name__)

# {} ==> dictionnaire --> .get("element" acceder a l'element) 
# [] ==> tableaux --> .append(ajouter un element)

def login42(request):
    fullPath = request.get_full_path()
    myCode = fullPath.split("/auth/login/?")[1]

    url42 = "https://api.intra.42.fr/oauth/token"
    myClientId = os.environ.get('42_ID')
    mySecret = os.environ.get('42_SECRET')
    myRedirect = os.environ.get('42_REDIRECT_URI')

    myData = {
        "grant_type": "authorization_code",
        "client_id": myClientId,
        "client_secret": mySecret,
        "code": myCode,
        "redirect_uri": myRedirect,
    }

    myResponseTmp = requests.post(url42, data=myData)
    myResponse = myResponseTmp.json()

    my42Token = myResponse.get("access_token")

    response = requests.get("https://api.intra.42.fr/v2/me", headers={
        'Authorization': 'Bearer %s' % my42Token
    })

    my42Response = response.json()
    try:
        myLogin = my42Response.get("login")
    except AttributeError as e:
        logger.error("Erreur lors de l'accès à l'attribut 'get': %s", e)

    my42Picture = my42Response.get("image")
    link = my42Picture.get("link") if my42Picture else None  
    # JE RECUP TOUS MES ELEMENTS UTILS A MON USER
    logger.info("MON LOGIN --> %s", myLogin)
    logger.info("MA PP FDP --> %s", link)

    # Check if user already exists
    username_42 = myLogin + "_42"
    try:
        existing_user = User.objects.get(username=username_42)
        # Update profile picture in case it changed
        existing_user.profil_pic = link
        existing_user.save()
        return JsonResponse({"username": username_42}, safe=False)
    except User.DoesNotExist:
        # Create new user if they don't exist
        my42UserInfo = {
            "username": username_42,
            "profil_pic": link,
            "is42stud": True,
            "password": "password_default"
        }
        user_serializer = CreatUserSerializer(data=my42UserInfo)
        if user_serializer.is_valid():
            user = user_serializer.save()
            logger.info("Utilisateur créé avec succès : %s", user)
            return JsonResponse(user_serializer.data, safe=False)
        else:
            logger.error("Erreur de validation du serializer : %s", user_serializer.errors)
            return JsonResponse({"error": "Failed to create user"}, status=400)
    
    return JsonResponse({"username": username_42}, safe=False)