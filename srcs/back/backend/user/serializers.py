from .models import User
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password", "is42stud", "profil_pic"]
        extra_kwargs = {"password": {"write_only": True}}#pour dire a django d;accepter le mdp, dans oin cree un user, mais qu'on ne "return" pas le mdp quand on demande des info sur le user

class CreatUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}#pour dire a django d;accepter le mdp, dans oin cree un user, mais qu'on ne "return" pas le mdp quand on demande des info sur le user

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
