# Authentication System - Quick Setup Guide

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Backend API
Edit `src/app/services/auth.service.ts` and update:
```typescript
private readonly API_URL = 'http://localhost:3000/api/auth';
```

### 3. Tailwind CSS
Already configured in:
- `tailwind.config.js`
- `postcss.config.js`
- `src/styles.css`

## File Structure

```
src/app/
├── pages/
│   ├── sign-in/
│   │   ├── sign-in.component.ts
│   │   ├── sign-in.component.html
│   │   └── sign-in.component.css
│   ├── sign-up/
│   │   ├── sign-up.component.ts
│   │   ├── sign-up.component.html
│   │   └── sign-up.component.css
│   └── dashboard/
│       ├── dashboard.component.ts
│       ├── dashboard.component.html
│       └── dashboard.component.css
├── services/
│   ├── auth.service.ts          # JWT handling, login/signup/logout
│   └── theme.service.ts         # Dark/light mode toggle
├── guards/
│   └── auth.guard.ts            # Protects routes
├── interceptors/
│   └── auth.interceptor.ts      # Adds JWT to requests
├── models/
│   └── auth.model.ts            # TypeScript interfaces
├── app.routes.ts                # Routing configuration
├── app.config.ts                # App configuration
├── app.ts                        # Root component
└── app.html                      # Root template
```

## API Requirements

Your backend must provide these endpoints:

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response (200):
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Sign Up
```
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

Response (201):
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": { ... }
}
```

### Refresh Token (Optional)
```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response (200):
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

## Usage

### Run Development Server
```bash
npm start
# Visit http://localhost:4200
```

### Build for Production
```bash
npm run build
# Output in dist/ folder
```

## Key Features

- ✅ JWT-based authentication
- ✅ Login & Sign-up forms with validation
- ✅ OAuth placeholders (Google, LinkedIn)
- ✅ Protected routes with auth guard
- ✅ Automatic JWT token refresh
- ✅ Dark/Light mode toggle
- ✅ Theme persistence in localStorage
- ✅ Responsive design with Tailwind CSS
- ✅ Form validation with Angular Reactive Forms
- ✅ Error handling and user feedback
- ✅ Password visibility toggle
- ✅ HTTP Interceptor for JWT injection

## Security Features

- Token validation before API calls
- Automatic token refresh on 401 errors
- Logout clears all tokens
- Protected routes check authentication
- Form validation prevents invalid data submission
- Error messages don't expose sensitive info

## Customization

### Change API URL
Edit `src/app/services/auth.service.ts`:
```typescript
private readonly API_URL = 'https://api.yourdomain.com/auth';
```

### Change Token Keys
Edit `src/app/services/auth.service.ts`:
```typescript
private readonly TOKEN_KEY = 'your_custom_key';
private readonly REFRESH_TOKEN_KEY = 'your_custom_refresh_key';
```

### Customize Theme Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  cyber: {
    bg: '#your-bg-color',
    card: '#your-card-color',
    // ... other colors
  }
}
```

## Common Issues

### OAuth Not Working
- OAuth buttons currently log to console
- Implement actual OAuth flow with provider SDKs
- Update click handlers in sign-in/sign-up components

### Token Expires Immediately
- Check backend token expiration time
- Verify `exp` claim in JWT
- Ensure server time is correct

### Theme Not Persisting
- Check browser localStorage permissions
- Ensure browser allows localStorage
- Check console for errors

### Auth Guard Not Redirecting
- Verify route has `canActivate: [authGuard]`
- Check that `isAuthenticated()` returns correct value
- Ensure token is in localStorage

## Testing

### Test Login Flow
1. Navigate to http://localhost:4200/sign-in
2. Enter test credentials
3. Check browser Network tab for POST request
4. Verify token in localStorage
5. Should redirect to /dashboard

### Test Protected Routes
1. Without token: Try /dashboard → redirects to /sign-in
2. With token: /dashboard should load
3. Invalid token: Should redirect to /sign-in

### Test Theme Toggle
1. Click theme button
2. Page should switch dark/light
3. Refresh page → theme persists

## Next Steps

1. Implement OAuth (Google, LinkedIn)
2. Add password reset flow
3. Implement 2FA
4. Add remember-me functionality
5. Implement session timeout
6. Add request/response logging
7. Set up error tracking
8. Add analytics

## Support

See `AUTH_DOCUMENTATION.md` for:
- Detailed authentication flow
- Security considerations
- API configuration
- Advanced troubleshooting
