import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

username = 'driver1'
password = 'password123'
email = 'driver1@example.com'

if not User.objects.filter(username=username).exists():
    user = User.objects.create_user(username=username, email=email, password=password, role='driver')
    print(f"Driver user '{username}' created successfully.")
else:
    print(f"Driver user '{username}' already exists.")
