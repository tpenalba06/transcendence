from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class User(AbstractUser):
    is42stud = models.BooleanField(default=False)
    first_name = None
    last_name = None
    profil_pic = models.URLField(default="https://wallpapers-clan.com/wp-content/uploads/2022/08/default-pfp-16.jpg")
    sec_id = models.CharField(default="")