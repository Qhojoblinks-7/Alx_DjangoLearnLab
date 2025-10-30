# Django Blog Authentication System Documentation

## Overview
This Django blog project includes a comprehensive user authentication system that enables user registration, login, logout, and profile management. The system is built using Django's built-in authentication framework and provides a secure, user-friendly experience.

## Features

### User Registration
- Custom registration form extending Django's UserCreationForm
- Includes email field in addition to username and password
- Automatic login after successful registration
- Form validation and error handling

### User Login
- Standard username/password authentication
- Error messages for invalid credentials
- Redirects to home page after successful login

### User Logout
- Secure logout functionality
- Confirmation message upon logout
- Redirects to home page

### Profile Management
- View current user information (username, email, first name, last name, date joined)
- Edit profile information (email, first name, last name)
- Form validation and success/error messages

## Security Features

### CSRF Protection
- All forms include CSRF tokens to prevent Cross-Site Request Forgery attacks

### Password Security
- Uses Django's built-in password hashing algorithms
- Secure password validation through Django's auth system

### Authentication Checks
- Profile management requires user to be logged in (@login_required decorator)
- Proper session management

## File Structure

```
django_blog/
├── blog/
│   ├── forms.py          # Custom registration form
│   ├── models.py         # Post model (existing)
│   ├── urls.py           # URL patterns for authentication
│   ├── views.py          # Authentication views
│   └── ...
├── templates/
│   ├── base.html         # Base template with auth navigation
│   ├── login.html        # Login page
│   ├── register.html     # Registration page
│   ├── logout.html       # Logout confirmation page
│   ├── profile.html      # Profile management page
│   └── ...
├── static/
│   ├── css/
│   │   └── style.css     # Styles including auth-specific CSS
│   └── js/
│       └── script.js     # Basic JavaScript
└── django_blog/
    ├── settings.py       # Django settings
    ├── urls.py           # Main URL configuration
    └── ...
```

## URL Patterns

- `/` - Home page (post list)
- `/login/` - User login
- `/logout/` - User logout
- `/register/` - User registration
- `/profile/` - User profile management
- `/post/<id>/` - Individual post detail

## Templates

### Base Template (`base.html`)
- Includes navigation that changes based on authentication status
- Shows Login/Register links for anonymous users
- Shows Profile/Logout links for authenticated users

### Authentication Templates
- All templates extend `base.html`
- Include Django message framework for feedback
- CSRF tokens in all forms
- Proper form styling

## Views

### Authentication Views
1. `register_view` - Handles user registration
2. `login_view` - Handles user login
3. `logout_view` - Handles user logout
4. `profile_view` - Handles profile viewing and editing

### Blog Views
1. `post_list` - Displays all blog posts
2. `post_detail` - Displays individual post

## Forms

### CustomUserCreationForm
- Extends Django's UserCreationForm
- Adds email field to registration
- Validates email uniqueness

## Testing the Authentication System

### Manual Testing Steps

1. **Registration Test**
   - Navigate to `/register/`
   - Fill out the registration form with valid data
   - Verify successful registration and automatic login
   - Check that user is redirected to home page

2. **Login Test**
   - Logout if currently logged in
   - Navigate to `/login/`
   - Enter valid credentials
   - Verify successful login and redirect

3. **Invalid Login Test**
   - Try logging in with incorrect credentials
   - Verify error message is displayed

4. **Profile Management Test**
   - Login to an account
   - Navigate to `/profile/`
   - View current profile information
   - Edit profile information and save
   - Verify changes are saved and success message appears

5. **Logout Test**
   - While logged in, click logout
   - Verify logout confirmation and redirect to home

6. **Navigation Test**
   - Verify navigation changes based on authentication status
   - Anonymous users see Login/Register
   - Authenticated users see Profile/Logout

### Security Testing

1. **CSRF Protection**
   - Attempt to submit forms without CSRF tokens (should fail)

2. **Unauthorized Access**
   - Try accessing `/profile/` without being logged in
   - Should redirect to login page

3. **Session Management**
   - Login, close browser, reopen, and check if still logged in
   - Logout and verify session is cleared

## Setup Instructions

1. Ensure Django is installed and project is set up
2. Run migrations: `python manage.py migrate`
3. Start development server: `python manage.py runserver`
4. Access the application at `http://127.0.0.1:8000/`

## Future Enhancements

- Password reset functionality
- Email verification for registration
- Social authentication (Google, Facebook, etc.)
- User roles and permissions
- Profile picture upload
- User bio field
- Account deletion functionality

## Dependencies

- Django 5.2.7
- No additional packages required (uses Django's built-in auth system)

## Notes

- The system uses Django's default User model
- SQLite database is used by default (can be changed to PostgreSQL in settings)
- All templates use Django's template language
- Static files are served through Django's static file system