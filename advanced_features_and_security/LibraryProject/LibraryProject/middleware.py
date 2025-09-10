class ContentSecurityPolicyMiddleware:
    """
    Middleware to add Content Security Policy (CSP) headers to responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.csp_policy = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self';"
        )

    def __call__(self, request):
        response = self.get_response(request)
        response['Content-Security-Policy'] = self.csp_policy
        return response
