from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True)
    username = None  # Remove username field
    USERNAME_FIELD = 'email'  # Use email as username
    REQUIRED_FIELDS = []  # No required fields since email is the username
    
    def __str__(self): 
        return self.email
