from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class User(AbstractUser):
    username = models.CharField(max_length=11, unique=(True))
    is42stud = models.BooleanField(default=False)
    first_name = models.CharField(default="Undefined")
    last_name = models.CharField(default="Undefined")
    email = models.CharField(default="Undefined")
    profil_pic = models.URLField(default="https://wallpapers-clan.com/wp-content/uploads/2022/08/default-pfp-16.jpg")
    is2FA = models.BooleanField(default=False, null=True)
    mfa_secret = models.CharField(max_length=32, blank=True, null=True)
    win_count = models.BigIntegerField(default=0)
    lose_count = models.BigIntegerField(default=0)


class Match(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    result = models.CharField(max_length=15)
    date = models.DateField()

class UserSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'user_sessions'

class BlockedUser(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_blocking')
    blocked_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_blocked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'blocked_users'
        unique_together = ('user', 'blocked_user')