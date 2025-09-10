# Advanced Features and Security

This Django project demonstrates custom user models, permissions management, and security best practices.

## Custom User Model

- Extends AbstractUser with email as USERNAME_FIELD
- Adds date_of_birth and profile_photo fields
- Custom manager for user creation

## Permissions

The Book model has the following custom permissions:
- can_view_book: Can view books
- can_create_book: Can create books
- can_edit_book: Can edit books
- can_delete_book: Can delete books

## Groups

Three groups are set up:
- Viewers: can_view_book
- Editors: can_view_book, can_create_book, can_edit_book
- Admins: all permissions

## Security Measures Implemented

### Settings Security
- DEBUG = False (prevents sensitive information leakage in production)
- ALLOWED_HOSTS specified (prevents HTTP Host header attacks)
- SECURE_BROWSER_XSS_FILTER = True (enables browser XSS filtering)
- X_FRAME_OPTIONS = 'DENY' (prevents clickjacking)
- SECURE_CONTENT_TYPE_NOSNIFF = True (prevents MIME type sniffing)
- CSRF_COOKIE_SECURE = True (CSRF cookies over HTTPS only)
- SESSION_COOKIE_SECURE = True (session cookies over HTTPS only)
- SECURE_SSL_REDIRECT = True (redirects HTTP to HTTPS)
- SECURE_HSTS_SECONDS = 31536000 (enforces HTTPS for one year)

### CSRF Protection
- All form templates include {% csrf_token %} to prevent CSRF attacks

### SQL Injection Prevention
- All database queries use Django's ORM, which automatically parameterizes inputs
- User inputs are validated using Django forms

### Content Security Policy (CSP)
- Custom middleware adds CSP headers to reduce XSS risk
- Policy allows only self-hosted content and blocks inline scripts/styles except for 'unsafe-inline' on styles

## Setup

1. Run migrations: `python manage.py makemigrations && python manage.py migrate`
2. Create groups: `python manage.py create_groups`
3. Create superuser: `python manage.py createsuperuser`
4. Run server: `python manage.py runserver`

## Testing Security

### Permissions Testing
1. Create users and assign to groups via admin
2. Login as different users and test access to:
   - /books/ (list books - requires can_view_book)
   - /books/add/ (add book - requires can_create_book)
   - /books/<id>/edit/ (edit book - requires can_edit_book)
   - /books/<id>/delete/ (delete book - requires can_delete_book)

Users without permissions will get 403 Forbidden.

### Security Headers Testing
1. Run the server and visit any page
2. Check response headers for:
   - Content-Security-Policy
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff

### CSRF Testing
1. Submit forms without CSRF tokens (should fail)
2. Submit forms with valid CSRF tokens (should succeed)

### XSS Testing
1. Try injecting scripts in form inputs
2. Verify CSP blocks unauthorized scripts

## Security Review

### Implemented Security Measures

#### HTTPS and Secure Redirects
- **SECURE_SSL_REDIRECT = True**: All HTTP requests are automatically redirected to HTTPS
- **SECURE_HSTS_SECONDS = 31536000**: HTTP Strict Transport Security enforces HTTPS for one year
- **SECURE_HSTS_INCLUDE_SUBDOMAINS = True**: HSTS policy applies to all subdomains
- **SECURE_HSTS_PRELOAD = True**: Site can be included in browser HSTS preload lists

#### Secure Cookies
- **SESSION_COOKIE_SECURE = True**: Session cookies are only transmitted over HTTPS
- **CSRF_COOKIE_SECURE = True**: CSRF tokens are only transmitted over HTTPS

#### Security Headers
- **X_FRAME_OPTIONS = 'DENY'**: Prevents clickjacking attacks by denying iframe embedding
- **SECURE_CONTENT_TYPE_NOSNIFF = True**: Prevents MIME type sniffing attacks
- **SECURE_BROWSER_XSS_FILTER = True**: Enables browser's built-in XSS filtering
- **Content-Security-Policy**: Custom middleware sets CSP headers to reduce XSS risk

#### Other Security Features
- **DEBUG = False**: Prevents sensitive information leakage in production
- **ALLOWED_HOSTS**: Specified to prevent HTTP Host header attacks
- **CSRF Protection**: All forms include {% csrf_token %} tags
- **SQL Injection Prevention**: All queries use Django ORM with automatic parameterization
- **Custom User Model**: Extends AbstractUser for better security
- **Permissions System**: Granular permissions control access to book operations

### Security Benefits

1. **Data Protection**: HTTPS ensures all data transmission is encrypted
2. **Man-in-the-Middle Prevention**: SSL redirects and HSTS prevent downgrade attacks
3. **Session Security**: Secure cookies prevent interception of session data
4. **XSS Mitigation**: CSP and XSS filters reduce cross-site scripting risks
5. **Clickjacking Prevention**: Frame options deny unauthorized embedding
6. **Content Protection**: Content type sniffing prevention blocks certain attacks
7. **Access Control**: Permissions system enforces role-based access

### Areas for Improvement

1. **Certificate Management**: Implement automated SSL certificate renewal
2. **Monitoring**: Add security monitoring and logging
3. **Rate Limiting**: Implement rate limiting to prevent brute force attacks
4. **Security Headers**: Consider additional headers like Referrer-Policy
5. **Dependency Updates**: Regularly update Django and dependencies for security patches

### Deployment Considerations

See `deployment.md` for detailed HTTPS configuration instructions for web servers like Nginx and Apache.
