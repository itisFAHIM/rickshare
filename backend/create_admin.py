import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_superuser():
    username = 'admin'
    email = 'admin@example.com'
    password = 'password123'

    if not User.objects.filter(username=username).exists():
        print(f"Creating superuser '{username}'...")
        # Since we have a custom user model, we need to check required fields.
        # Assuming standard createsuperuser behavior works with the custom model manager.
        try:
            User.objects.create_superuser(username=username, email=email, password=password)
            print(f"Superuser '{username}' created successfully.")
            print(f"Password: {password}")
        except Exception as e:
            print(f"Failed to create superuser: {e}")
            # Fallback: check fields. simpletest might be required if custom model is strict
    else:
        print(f"Superuser '{username}' already exists.")
        # We won't change the password here to avoid resetting verified credentials if they match,
        # but for dev environment 'password123' is implied.
        print(f"Password: {password} (Estimated)")

if __name__ == "__main__":
    create_superuser()
