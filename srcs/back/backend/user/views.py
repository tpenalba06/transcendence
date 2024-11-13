from django.shortcuts import render
from .models import User
from rest_framework import generics
from rest_framework.views import APIView
from .serializers import UserSerializer, CreatUserSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.http import JsonResponse
import logging
logger = logging.getLogger(__name__)
# Create your views here.

class CreatUserView(generics.CreateAPIView):
    queryset = User.objects.all()#pour regarder tout les objets de ma classe pour ne pas cree un user qui existe deja
    serializer_class = CreatUserSerializer#dire a la "view" quel genre de donne on a besooin pour faire un nouveau user
    permission_classes = [AllowAny]#determine qui a le droit d'avoir accee a cette "view"

    # def post(self, request, *args, **kwargs):
    #     logger.info(request.data)
    #     myData = request.data

    #     myUsername = myData.get("username")
    #     myPassword = myData.get("password")

    #     myUserData = {
    #         "username": myUsername,
    #         "password": myPassword
    #     }

    #     myUserToSave = UserSerializer(data=myUserData)

    #     if myUserToSave.is_valid():
    #         myUserToSave.save()
        
    #     logger.info("LE USER EST CREEE")
    #     return JsonResponse({"mabite": "0"}, safe=False)


def getUser(request):
    myPath = request.build_absolute_uri()
    idd = myPath.split("?")[1]

    myUser = User.objects.get(sec_id=idd)
    #myUser = User.objects.get(sec_id=myUsername)

    #logger.info("OBJET DB myUser ---> %s", myUser)
    myUserSer = UserSerializer(myUser)

    #logger.info("myUserSer ---> %s", myUserSer)

    myUserFinal = myUserSer.data

    #logger.info("myUserFinal ---> %s", myUserFinal)

    return JsonResponse(myUserFinal, safe=False)


        
