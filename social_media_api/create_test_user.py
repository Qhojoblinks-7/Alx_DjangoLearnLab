#!/usr/bin/env python
"""
Script to create a test user for development
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'social_media_api.settings')
django.setup()

from accounts.models import User
from django.contrib.auth.hashers import make_password

def create_test_user():
    """Create a test user if it doesn't exist"""
    username = 'testuser'
    password = 'testpass123'
    email = 'test@example.com'

    if User.objects.filter(username=username).exists():
        print(f'Test user "{username}" already exists.')
        return

    user = User.objects.create(
        username=username,
        email=email,
        password=make_password(password)
    )

    print(f'✅ Created test user:')
    print(f'   Username: {username}')
    print(f'   Password: {password}')
    print(f'   Email: {email}')

if __name__ == '__main__':
    create_test_user()