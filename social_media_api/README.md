# Social Media API

A Django REST API for a social media platform with real-time features using WebSockets.

## Features

- **User Management**: Registration, login, user profiles with bio, profile images, and follower/following relationships.
- **Posts**: Create, read, update, delete posts with title, content, and optional video/image uploads.
- **Comments**: Add comments to posts.
- **Likes**: Like/unlike posts.
- **Notifications**: Real-time notifications for likes via WebSockets.
- **Feed**: Timeline feed showing posts from followed users.
- **Real-time Updates**: WebSocket integration for live post updates (likes, comments).
- **JWT Authentication**: Secure authentication using JSON Web Tokens.
- **Permissions**: Proper permissions for post/comment/like actions.

## Tech Stack

- **Backend**: Django 5.2, Django REST Framework
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Real-time**: Django Channels for WebSockets
- **Database**: SQLite (development), configurable for production
- **File Storage**: Local file system for media uploads

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd social_media_api
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   Or install manually:
   ```bash
   pip install Django djangorestframework djangorestframework-simplejwt django-filter channels djangorestframework-nested Pillow
   ```

4. **Apply migrations**:
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser** (optional):
   ```bash
   python manage.py createsuperuser
   ```

6. **Run the development server**:
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000/api/`.

## Usage

### Authentication

All API endpoints except registration and login require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### API Endpoints

#### Accounts

- `POST /api/accounts/register/` - Register a new user
- `POST /api/accounts/login/` - Login and get JWT tokens
- `GET /api/accounts/users/` - List users
- `GET /api/accounts/users/{id}/` - Get user profile
- `POST /api/accounts/users/{id}/follow/` - Follow/unfollow a user

#### Posts

- `GET /api/posts/posts/` - List all posts
- `POST /api/posts/posts/` - Create a new post
- `GET /api/posts/posts/{id}/` - Get post details
- `PUT /api/posts/posts/{id}/` - Update post (author only)
- `DELETE /api/posts/posts/{id}/` - Delete post (author only)
- `POST /api/posts/posts/{id}/like/` - Like/unlike a post

#### Comments

- `GET /api/posts/posts/{post_id}/comments/` - List comments on a post
- `POST /api/posts/posts/{post_id}/comments/` - Add a comment to a post
- `PUT /api/posts/posts/{post_id}/comments/{id}/` - Update comment (author only)
- `DELETE /api/posts/posts/{post_id}/comments/{id}/` - Delete comment (author only)

#### Feed

- `GET /api/posts/feed/` - Get timeline feed (posts from followed users)

### WebSocket Connections

Connect to WebSockets for real-time updates:

- **Notifications**: `ws://localhost:8000/ws/notifications/{user_id}/`
- **Post Updates**: `ws://localhost:8000/ws/posts/{post_id}/`

## Project Structure

```
social_media_api/
├── accounts/          # User management app
├── posts/             # Posts, comments, likes app
├── notifications/     # Notifications app
├── social_media_api/  # Main project settings
├── manage.py
├── db.sqlite3
└── README.md
```

## Development

### Running with Daphne (for WebSockets)

For full WebSocket support, use Daphne:

```bash
pip install daphne
daphne social_media_api.asgi:application
```

### Testing

```bash
python manage.py test
```

### Code Formatting

Use Black for code formatting:

```bash
pip install black
black .
```

## Deployment

For production deployment:

1. Set `DEBUG = False` in settings.py
2. Configure a production database (PostgreSQL recommended)
3. Set up Redis for Channel Layers
4. Use a WSGI server like Gunicorn or ASGI server like Daphne
5. Configure static/media file serving
6. Set proper ALLOWED_HOSTS and SECRET_KEY

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.