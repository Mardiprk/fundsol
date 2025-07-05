# CSRF Protection in FundSol

This document explains how Cross-Site Request Forgery (CSRF) protection is implemented in the FundSol application.

## Overview

CSRF protection is a security measure that prevents attackers from tricking users into performing unwanted actions on a web application where they're authenticated. In FundSol, we implement CSRF protection using a token-based approach.

## Implementation Details

### 1. CSRF Token Generation and Storage

CSRF tokens are generated using UUID v4 for strong randomness. The tokens are stored as cookies with the following properties:

```typescript
{
  name: 'csrf-token',
  value: generateCsrfToken(),
  httpOnly: false, // Allows JavaScript access
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax', // More compatible than 'strict'
  path: '/'
}
```

Notes:
- `httpOnly: false` allows client-side JavaScript to read the token
- `sameSite: 'lax'` provides better compatibility across browsers while still offering protection
- `secure: true` in production ensures the cookie is only sent over HTTPS

### 2. CSRF Validation Process

1. For each mutating request (POST, PUT, DELETE, PATCH), the middleware checks for a valid CSRF token
2. The token must be sent in the `X-CSRF-Token` header
3. The header token must match the value in the `csrf-token` cookie
4. If validation fails, a 403 Forbidden response is returned

### 3. Key Components

#### CSRF Utility Module (`lib/csrf.ts`)

Contains core functions for CSRF management:

- `generateCsrfToken()` - Creates a new random token
- `setCsrfCookie(response)` - Sets the CSRF token cookie
- `getCsrfTokenFromRequest(request)` - Gets token from request cookies
- `getClientCsrfToken()` - Gets token from client-side cookies
- `validateCsrfToken(request)` - Validates token in a request
- `addCsrfToHeaders(headers)` - Adds CSRF token to request headers
- `createCsrfErrorResponse(debug)` - Creates a standardized CSRF error response

#### Middleware (`middleware.ts`)

Handles CSRF validation for all API routes:

- Sets a CSRF token cookie if not present
- Validates CSRF tokens for mutating operations
- Applies special rules for exempted routes

#### Security Provider (`components/security/security-provider.tsx`)

Provides CSRF functionality to React components:

- `getCsrfToken()` - Gets the current CSRF token
- `addCsrfToHeaders(headers)` - Adds CSRF token to request headers
- `secureFetch(url, options)` - Enhanced fetch with automatic CSRF token handling
- `refreshCsrfToken()` - Forces a refresh of the CSRF token

#### CSRF API (`app/api/csrf/route.ts`)

Dedicated API endpoints for CSRF token management:

- `GET /api/csrf` - Gets current token status
- `GET /api/csrf?refresh=true` - Forces a new token generation
- `POST /api/csrf` - Tests CSRF token validation

### 4. Usage in Forms

Forms should use the `secureFetch` function from the `useSecurity` hook:

```typescript
const { secureFetch } = useSecurity();

// When submitting a form
const response = await secureFetch('/api/some-endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(formData)
});
```

This automatically includes the CSRF token in the request headers.

### 5. Debugging CSRF Issues

The `CsrfDebug` component provides visual feedback about CSRF token status:

- Shows if tokens exist in client and server
- Allows manual token refresh
- Provides test functionality to verify CSRF submission

### 6. CSRF Exemptions

Some routes are exempt from CSRF validation:

- `/api/csrf` - CSRF management endpoints
- `/api/health` - Health check endpoint
- Test endpoints like `/api/csrf-test` and `/api/bypass-campaign`

## Best Practices

1. Always use `secureFetch` from the `useSecurity` hook for API calls
2. Ensure all mutating operations have a valid CSRF token
3. If encountering CSRF errors, try refreshing the token
4. Use the debug component for troubleshooting
5. Never send sensitive operations via GET requests

## Common Issues

### Token Mismatch

If the tokens don't match, it could be due to:
- Session expiration
- Browser cookie settings
- Client-side JavaScript errors
- Network issues

Solution: Use the `refreshCsrfToken()` function to get a fresh token.

### Missing Token

If the token is missing entirely, it could be due to:
- Cookie blocking by browsers
- Privacy settings
- Middleware not running properly

Solution: Visit `/api/csrf?refresh=true` to force a new token creation.

### Cross-Domain Issues

CSRF tokens are tied to your domain. If making requests across subdomains:
- Ensure both domains set the same CSRF cookie
- Consider using a different authentication mechanism for API-only endpoints

## Security Considerations

1. CSRF tokens are effective against CSRF attacks but not against XSS
2. Using `httpOnly: false` allows JavaScript access for ease of use, but makes tokens vulnerable to XSS attacks
3. Additional security layers (Content-Security-Policy, etc.) help mitigate XSS risks

## Testing CSRF Protection

1. Use the built-in test functionality in the `CsrfDebug` component
2. Try making API requests without a token (should be rejected)
3. Try making requests with an invalid token (should be rejected)
4. Verify that legitimate requests with valid tokens succeed

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN Web Docs: SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite) 