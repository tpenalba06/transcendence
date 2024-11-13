# user_auth/views.py

import requests
import logging
from django.http import HttpResponseRedirect, JsonResponse
from django.conf import settings
from django.shortcuts import redirect
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from api.serializers import UserSerializer
from api.models import User

logger = logging.getLogger(__name__)


CLIENT_ID = 'u-s4t2ud-efb8810a6794b0509ab1b30b4baeb56fff909df009eb5c29cde1d675f5309a75'
CLIENT_SECRET = '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'

REDIRECT_URI = 'http://localhost:5173/check42user'


# {} ==> dictionnaire --> .get("element" acceder a l'element) 
# [] ==> tableaux --> .append(ajouter un element)

def login42(request):
    fullPath = request.get_full_path()
    myCode = fullPath.split("/auth/login/?")[1]

    url42 = "https://api.intra.42.fr/oauth/token"
    myClientId = CLIENT_ID
    mySecret = CLIENT_SECRET
    myRedirect = REDIRECT_URI

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
    myLogin = my42Response.get("login")
    my42Picture = my42Response.get("image")
    link = my42Picture.get("link")
    # JE RECUP TOUS MES ELEMENTS UTILS A MON USER
    logger.info("MON LOGIN --> %s", myLogin)
    logger.info("MA PP FDP --> %s", my42Picture)
    # JE REMPLIE TOUS CES ELEMENTS DANS UN JSON
    my42UserInfo = {
        "username" : myLogin,
        "profilePicture" : link,
        "is42stud" : True
    }
    # AVEC CE JSON JE CREE UN OBJET USER GRACE A USERSERIALIZER
    
    user_serializer = UserSerializer(data=my42UserInfo)

# 4. VALIDATION DES DONNEES ET ENREGISTREMENT EN DB SI TOUT EST OK
    if user_serializer.is_valid():
        user = user_serializer.save()  # JE SAVE CE USER EN DB
        logger.info("Utilisateur créé avec succès : %s", user)
    else:
        logger.error("Erreur de validation du serializer : %s", user_serializer.errors)
        
    
    # logger.info("Mon JSON ---> %s", myUser)
    return JsonResponse({"response": "test"}, safe=False)


