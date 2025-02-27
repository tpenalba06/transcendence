from .models import User
from .models import Match
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "is42stud", "profil_pic", "is2FA", "first_name", "last_name", "email", "win_count", "lose_count", ]
        extra_kwargs = {"password": {"write_only": True}}#pour dire a django d;accepter le mdp, dans oin cree un user, mais qu'on ne "return" pas le mdp quand on demande des info sur le user

class CreatUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password", "is42stud", "profil_pic", "is2FA", "mfa_secret", "first_name", "last_name"]
        extra_kwargs = {"password": {"write_only": True}}#pour dire a django d;accepter le mdp, dans oin cree un user, mais qu'on ne "return" pas le mdp quand on demande des info sur le user

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password is not None :
            instance.set_password(password)
        instance.save()
        return (instance)


class MatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = ["result", "date", "user"]
