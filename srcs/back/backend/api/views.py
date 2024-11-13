from django.shortcuts import render
from .models import User
from rest_framework import generics
from .serializers import UserSerializer
from rest_framework.permissions import AllowAny#, IsAuthenticated
# Create your views here.

class CreatUserView(generics.CreateAPIView):
    queryset = User.objects.all()#pour regarder tout les objets de ma classe pour ne pas cree un user qui existe deja
    serializer_class = UserSerializer#dire a la "view" quel genre de donne on a besooin pour faire un nouveau user
    permission_classes = [AllowAny]#determine qui a le droit d'avoir accee a cette "view"

 