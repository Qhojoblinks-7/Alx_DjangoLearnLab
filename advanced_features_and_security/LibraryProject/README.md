# LibraryProject

A Django project for managing a library system.

## Project Structure

```
LibraryProject/
├── LibraryProject/          # Django project directory
│   ├── __init__.py
│   ├── settings.py         # Project settings
│   ├── urls.py            # URL configuration
│   ├── asgi.py            # ASGI configuration
│   └── wsgi.py            # WSGI configuration
├── manage.py              # Django management script
└── README.md             # This file
```

## Getting Started

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install Django:
```bash
pip install django
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Create a superuser:
```bash
python manage.py createsuperuser
```

5. Run the development server:
```bash
python manage.py runserver
```

## Features

- Django admin interface for managing library data
- SQLite database (default)
- Ready for app development

## Next Steps

1. Create Django apps for specific functionality (e.g., books, members, loans)
2. Define models for your library data
3. Create views and templates
4. Set up URL routing for your apps
