# HTTPS Deployment Configuration

This document provides instructions for configuring your web server to support HTTPS for the Django application.

## Prerequisites

- SSL/TLS certificate (can be obtained from Let's Encrypt for free)
- Web server (Apache, Nginx, or similar)
- Domain name pointing to your server

## Django Settings for Production

Ensure the following settings are configured in `settings.py`:

```python
DEBUG = False
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True
```

## Nginx Configuration

Create a configuration file `/etc/nginx/sites-available/yourdomain.com`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Django
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /path/to/your/static/files/;
    }

    # Media files
    location /media/ {
        alias /path/to/your/media/files/;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Apache Configuration

Create a configuration file `/etc/apache2/sites-available/yourdomain.com.conf`:

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    Redirect permanent / https://yourdomain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com

    # SSL configuration
    SSLEngine on
    SSLCertificateFile /path/to/your/certificate.crt
    SSLCertificateKeyFile /path/to/your/private.key
    SSLProtocol all -SSLv2 -SSLv3
    SSLCipherSuite HIGH:!aNULL:!MD5

    # Security headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"

    # Proxy to Django
    ProxyPass / http://127.0.0.1:8000/
    ProxyPassReverse / http://127.0.0.1:8000/

    # Static files
    Alias /static/ /path/to/your/static/files/
    <Directory "/path/to/your/static/files/">
        Require all granted
    </Directory>

    # Media files
    Alias /media/ /path/to/your/media/files/
    <Directory "/path/to/your/media/files/">
        Require all granted
    </Directory>
</VirtualHost>
```

Enable the site and required modules:
```bash
sudo a2enmod ssl proxy proxy_http headers
sudo a2ensite yourdomain.com
sudo systemctl reload apache2
```

## Testing HTTPS

1. Visit your site with `https://` prefix
2. Check that HTTP requests redirect to HTTPS
3. Use SSL Labs' SSL Test: https://www.ssllabs.com/ssltest/
4. Verify security headers are present in responses

## Certificate Renewal

For Let's Encrypt certificates, set up automatic renewal:

```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
