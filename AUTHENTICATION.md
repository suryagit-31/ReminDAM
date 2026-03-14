# Authentication Architecture

Comprehensive guide to ReminDAM's authentication system.

## Overview

ReminDAM uses **Supabase Auth** for complete authentication management, which provides:
- JWT token-based authentication
- Session management with auto-refresh
- OAuth providers (Google)
- Secure password hashing (bcrypt)
- Row Level Security (RLS) integration

## Authentication Flow

### Email/Password Sign Up

```
┌─────────┐                ┌──────────┐                ┌──────────┐
│ Browser │                │ Frontend │                │ Supabase │
└────┬────┘                └─────┬────┘                └─────┬────┘
     │                           │                           │
     │  1. Fill sign-up form     │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │                           │ 2. signUp(email, password)│
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │    3. Hash password       │
     │                           │       Create user record  │
     │                           │       Generate JWT        │
     │                           │                           │
     │                           │ 4. Return JWT + user data │
     │                           │<──────────────────────────┤
     │                           │                           │
     │                           │ 5. Store in localStorage  │
     │                           │    Update auth context    │
     │                           │                           │
     │  6. Redirect to Dashboard │                           │
     │<──────────────────────────┤                           │
     │                           │                           │
```

**Code Implementation:**

```javascript
// src/contexts/AuthContext.jsx
const signUp = async (email, password, username) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username  // Stored in user_metadata
      }
    }
  })

  if (error) throw error
  return data
}
```

**What Happens:**
1. User fills form with email, password, username
2. Frontend calls Supabase `signUp()` method
3. Supabase:
   - Hashes password with bcrypt
   - Creates record in `auth.users` table
   - Generates JWT access token (1 hour expiry)
   - Generates refresh token (30 days)
4. Returns user object and session
5. Frontend stores tokens in localStorage
6. AuthContext updates state
7. User redirected to dashboard

### Email/Password Sign In

```
┌─────────┐                ┌──────────┐                ┌──────────┐
│ Browser │                │ Frontend │                │ Supabase │
└────┬────┘                └─────┬────┘                └─────┬────┘
     │                           │                           │
     │  1. Enter credentials     │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │                           │ 2. signInWithPassword()   │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │    3. Verify credentials  │
     │                           │       Check hash          │
     │                           │       Generate JWT        │
     │                           │                           │
     │                           │ 4. Return session         │
     │                           │<──────────────────────────┤
     │                           │                           │
     │                           │ 5. Store tokens           │
     │                           │    Trigger auth state     │
     │                           │                           │
     │  6. Redirect to Dashboard │                           │
     │<──────────────────────────┤                           │
```

**Code Implementation:**

```javascript
const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error
  return data
}
```

### Google OAuth Sign In

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Browser │    │ Frontend │    │ Supabase │    │  Google  │
└────┬────┘    └─────┬────┘    └─────┬────┘    └─────┬────┘
     │               │               │               │
     │ 1. Click Google button        │               │
     ├──────────────>│               │               │
     │               │               │               │
     │               │ 2. signInWithOAuth('google')  │
     │               ├──────────────>│               │
     │               │               │               │
     │               │ 3. Generate OAuth URL         │
     │               │<──────────────┤               │
     │               │               │               │
     │ 4. Redirect to Google         │               │
     ├───────────────────────────────────────────────>│
     │               │               │               │
     │               │               │ 5. Show login │
     │               │               │    screen     │
     │               │               │               │
     │ 6. User authorizes            │               │
     ├───────────────────────────────────────────────>│
     │               │               │               │
     │ 7. Redirect to Supabase callback             │
     │<──────────────────────────────────────────────┤
     │               │               │               │
     │               │ 8. Exchange code for token    │
     │               │               ├──────────────>│
     │               │               │               │
     │               │               │ 9. Return user info
     │               │               │<──────────────┤
     │               │               │               │
     │               │ 10. Create/update user        │
     │               │     Generate JWT              │
     │               │               │               │
     │ 11. Redirect to app with session              │
     │<──────────────────────────────┤               │
     │               │               │               │
     │ 12. Extract session from URL  │               │
     ├──────────────>│               │               │
     │               │               │               │
     │               │ 13. Store tokens & update state
     │               │               │               │
```

**Code Implementation:**

```javascript
const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin  // Return to app after auth
    }
  })

  if (error) throw error
  return data
}
```

**Google OAuth Setup Requirements:**
1. Google Cloud project with OAuth credentials
2. Authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
3. Enabled Google+ API
4. Client ID and Secret configured in Supabase

## JWT Token Structure

### Access Token (JWT)

**Payload Example:**
```json
{
  "aud": "authenticated",
  "exp": 1678901234,
  "sub": "user-uuid-here",
  "email": "user@example.com",
  "phone": "",
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  },
  "user_metadata": {
    "username": "johndoe"
  },
  "role": "authenticated",
  "aal": "aal1",
  "amr": [
    {
      "method": "password",
      "timestamp": 1678897634
    }
  ],
  "session_id": "session-uuid-here"
}
```

**Properties:**
- `sub`: User ID (used for RLS policies)
- `exp`: Expiry timestamp (1 hour from issue)
- `email`: User's email
- `user_metadata`: Custom data (username, etc.)
- `role`: Always "authenticated" for logged-in users

### Refresh Token

- Long-lived token (30 days default)
- Used to get new access tokens
- Stored securely by Supabase client
- Automatically used when access token expires

## Session Management

### Session Persistence

**On App Load:**
```javascript
useEffect(() => {
  // Check for existing session in localStorage
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null)
    setLoading(false)
  })

  // Listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    }
  )

  return () => subscription.unsubscribe()
}, [])
```

**Auto-Refresh:**
- Supabase client automatically refreshes tokens
- Checks token expiry before each request
- Uses refresh token to get new access token
- Transparent to application code

### Session Storage

Tokens are stored in:
- **Browser**: `localStorage` (key: `sb-<project-ref>-auth-token`)
- **Format**: JSON object with access_token, refresh_token, expires_at

**Storage Structure:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "refresh-token-here",
  "expires_at": 1678901234,
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": {
      "username": "johndoe"
    }
  }
}
```

## Protected Routes

### Implementation

```javascript
// src/components/ProtectedRoute.jsx
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
```

**Usage:**
```javascript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

**Flow:**
1. Route accessed
2. ProtectedRoute checks auth state
3. If loading: show spinner
4. If no user: redirect to /login
5. If user exists: render children (Dashboard)

## Row Level Security (RLS)

### How RLS Works

RLS policies use the JWT token's `sub` (subject) claim as `auth.uid()` in PostgreSQL.

**Policy Example:**
```sql
CREATE POLICY "Users can view their own tasks"
  ON tasks
  FOR SELECT
  USING (auth.uid() = user_id);
```

**What Happens:**
1. Frontend makes request with JWT in header
2. Supabase validates JWT
3. Extracts `sub` claim (user ID)
4. PostgreSQL sets `auth.uid()` to that value
5. RLS policy checks: `auth.uid() = user_id`
6. Only matching rows returned

### RLS Policies in ReminDAM

**SELECT (Read):**
```sql
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);
```
Users can only see tasks where `user_id` matches their JWT `sub`.

**INSERT (Create):**
```sql
CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```
Users can only create tasks with their own `user_id`.

**UPDATE (Modify):**
```sql
CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```
Users can only update their own tasks and can't change `user_id`.

**DELETE (Remove):**
```sql
CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
```
Users can only delete their own tasks.

### Service Role Bypass

For n8n automation, use the Supabase `service_role` key.

In Supabase, requests made with the `service_role` key **bypass RLS**, so you should **not** add any “allow all” RLS policies for normal clients. Those policies would weaken isolation for authenticated users if they ever applied to non-service requests.

**Security Note:** Service role key must NEVER be exposed in frontend code!

## API Requests with Auth

### Automatic Header Injection

Supabase client automatically adds JWT to requests:

```javascript
// Frontend code
const { data, error } = await supabase
  .from('tasks')
  .select('*')

// Behind the scenes, Supabase adds:
// Authorization: Bearer eyJhbGc...
// apikey: your-anon-key
```

### Manual Auth Headers (for n8n)

```javascript
{
  "apikey": "your-service-role-key",
  "Authorization": "Bearer your-service-role-key",
  "Content-Type": "application/json"
}
```

## Security Features

### Password Security
- Hashed with bcrypt (cost factor 10)
- Salted automatically
- Never stored in plain text
- Never returned in API responses

### JWT Security
- Signed with HS256 algorithm
- Short expiry (1 hour)
- Verified on every request
- Contains minimal claims (no sensitive data)

### Session Security
- Refresh tokens stored securely
- HttpOnly cookies (optional)
- CSRF protection
- Auto-logout on token expiry

### HTTPS Enforcement
- All auth endpoints require HTTPS in production
- Tokens never sent over HTTP
- Supabase enforces SSL/TLS

### Rate Limiting
- Built-in rate limiting on auth endpoints
- Prevents brute force attacks
- Configurable limits per endpoint

## Common Auth Patterns

### Check if User is Logged In

```javascript
const { user } = useAuth()

if (user) {
  // User is logged in
  console.log('User ID:', user.id)
  console.log('Email:', user.email)
}
```

### Get User Metadata

```javascript
const { user } = useAuth()

const username = user?.user_metadata?.username
const provider = user?.app_metadata?.provider
```

### Conditional Rendering

```javascript
{user ? (
  <Dashboard />
) : (
  <Login />
)}
```

### Protected API Calls

```javascript
// Automatically includes auth token
const { data, error } = await supabase
  .from('tasks')
  .insert({
    title: 'New Task',
    user_id: user.id  // From auth context
  })
```

## Debugging Auth Issues

### Check Current Session

```javascript
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('User:', session?.user)
console.log('Access Token:', session?.access_token)
```

### Check Token Expiry

```javascript
const expiresAt = session?.expires_at
const now = Math.floor(Date.now() / 1000)

if (expiresAt < now) {
  console.log('Token expired!')
}
```

### Listen for Auth Events

```javascript
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
  console.log('Session:', session)
})

// Events: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED
```

### Verify RLS Policies

```sql
-- Check if policies exist
SELECT * FROM pg_policies WHERE tablename = 'tasks';

-- Test policy as user
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM tasks;
```

## Best Practices

1. **Never expose service_role key** in frontend
2. **Use RLS policies** for all tables with user data
3. **Validate user_id** matches auth.uid() on inserts
4. **Auto-refresh tokens** to maintain session
5. **Clear tokens** on sign out
6. **Use HTTPS** in production
7. **Implement proper error handling**
8. **Add loading states** during auth checks
9. **Redirect after auth** to improve UX
10. **Monitor auth logs** in Supabase dashboard

## Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [JWT.io](https://jwt.io/) - Decode and inspect JWTs
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [OAuth 2.0 Spec](https://oauth.net/2/)

---

**Authentication is the foundation of secure applications. ReminDAM implements industry-standard practices for user security.**
