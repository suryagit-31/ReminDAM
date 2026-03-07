# User-to-Task Mapping Visual Guide

## Complete Authentication & Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    USER SIGNS UP / LOGS IN                   │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   SUPABASE AUTH SYSTEM                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          auth.users TABLE (Auto-managed)           │    │
│  ├────────────────────────────────────────────────────┤    │
│  │  id (UUID) ◄───────────── PRIMARY KEY              │    │
│  │  email                                             │    │
│  │  encrypted_password (bcrypt)                       │    │
│  │  raw_user_meta_data: { username: "johndoe" }      │    │
│  │  created_at                                        │    │
│  │  last_sign_in_at                                   │    │
│  └────────────────────────────────────────────────────┘    │
│                            │                                 │
│                            │ Generates                       │
│                            ▼                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │               JWT TOKEN (Stored in Browser)        │    │
│  ├────────────────────────────────────────────────────┤    │
│  │  {                                                 │    │
│  │    "sub": "aaa-111-bbb-222",  ◄── USER ID         │    │
│  │    "email": "john@example.com",                   │    │
│  │    "user_metadata": {                             │    │
│  │      "username": "johndoe"                        │    │
│  │    },                                             │    │
│  │    "exp": 1678901234                              │    │
│  │  }                                                 │    │
│  └────────────────────────────────────────────────────┘    │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            │ Token sent with every request
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                 FRONTEND (React + AuthContext)               │
│                                                              │
│  const { user } = useAuth()                                 │
│  // user.id = "aaa-111-bbb-222" (from JWT)                 │
│                                                              │
│  // Creating a task:                                         │
│  supabase.from('tasks').insert({                            │
│    user_id: user.id,  ◄─── LINKS TO auth.users.id         │
│    title: "My Task",                                        │
│    due_date: "2024-03-15",                                  │
│    remind_before: 5                                         │
│  })                                                          │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            │ SQL INSERT with user_id
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL + RLS)                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         public.tasks TABLE (Your Data)             │    │
│  ├────────────────────────────────────────────────────┤    │
│  │  id (UUID) - Primary Key                           │    │
│  │  user_id (UUID) ──────┐                           │    │
│  │  title                │  FOREIGN KEY               │    │
│  │  description          │                            │    │
│  │  due_date             │  REFERENCES ───────────────┼────┐
│  │  remind_before: 1,2,3,5,7,10                       │    │
│  │  time_slot            │                            │    │
│  │  status               │                            │    │
│  │  reminder_sent        │                            │    │
│  └───────────────────────┼────────────────────────────┘    │
│                          │                                  │
│                          │ Points to auth.users.id          │
│                          └──────────────────────────────────┼───┐
│                                                              │   │
│  ┌────────────────────────────────────────────────────┐    │   │
│  │          ROW LEVEL SECURITY (RLS) POLICIES         │    │   │
│  ├────────────────────────────────────────────────────┤    │   │
│  │                                                     │    │   │
│  │  SELECT: auth.uid() = user_id                     │    │   │
│  │  INSERT: auth.uid() = user_id                     │    │   │
│  │  UPDATE: auth.uid() = user_id                     │    │   │
│  │  DELETE: auth.uid() = user_id                     │    │   │
│  │                                                     │    │   │
│  │  auth.uid() extracts user ID from JWT token       │    │   │
│  └────────────────────────────────────────────────────┘    │   │
└──────────────────────────────────────────────────────────────┘   │
                                                                    │
                    FOREIGN KEY RELATIONSHIP                       │
                                                                    │
     auth.users.id  ◄───────────────────────────────────────────────┘
```

---

## Example: Complete Flow

### 1. User Signs Up

```javascript
// Frontend
supabase.auth.signUp({
  email: "john@example.com",
  password: "secure123",
  options: {
    data: { username: "johndoe" }
  }
})
```

**Creates in Database:**
```sql
-- auth.users table (automatic)
INSERT INTO auth.users (
  id,                    -- Generated: aaa-111-bbb-222
  email,                 -- "john@example.com"
  encrypted_password,    -- "$2a$10$..." (bcrypt hash)
  raw_user_meta_data     -- {"username": "johndoe"}
)
```

**Returns JWT:**
```json
{
  "sub": "aaa-111-bbb-222",
  "email": "john@example.com",
  "user_metadata": {
    "username": "johndoe"
  }
}
```

---

### 2. User Creates Task

```javascript
// Frontend (user is logged in)
const { user } = useAuth()
// user.id = "aaa-111-bbb-222"

supabase.from('tasks').insert({
  user_id: user.id,           // "aaa-111-bbb-222"
  title: "Submit report",
  due_date: "2024-03-15",
  remind_before: 5,
  time_slot: "morning",
  email: "john@example.com",
  status: "pending"
})
```

**Database INSERT:**
```sql
INSERT INTO tasks (
  id,              -- Generated: task-xyz-123
  user_id,         -- "aaa-111-bbb-222" ◄─── LINKS TO auth.users.id
  title,           -- "Submit report"
  due_date,        -- "2024-03-15"
  remind_before,   -- 5
  time_slot,       -- "morning"
  email,           -- "john@example.com"
  status           -- "pending"
)
```

**RLS Check (INSERT policy):**
```sql
WITH CHECK (auth.uid() = user_id)

-- auth.uid() extracts from JWT → "aaa-111-bbb-222"
-- user_id in INSERT → "aaa-111-bbb-222"
-- Match? YES ✓ → INSERT allowed
```

---

### 3. User Fetches Tasks

```javascript
// Frontend
const { data, error } = await supabase
  .from('tasks')
  .select('*')
```

**Database Query with RLS:**
```sql
-- User makes this query:
SELECT * FROM tasks

-- RLS policy transforms it to:
SELECT * FROM tasks
WHERE auth.uid() = user_id

-- auth.uid() from JWT → "aaa-111-bbb-222"
-- Becomes:
SELECT * FROM tasks
WHERE "aaa-111-bbb-222" = user_id

-- Returns ONLY tasks where user_id = "aaa-111-bbb-222"
```

**Result:**
```javascript
[
  {
    id: "task-xyz-123",
    user_id: "aaa-111-bbb-222",  // User's ID
    title: "Submit report",
    status: "pending"
  },
  // ... more tasks for this user only
]
```

---

### 4. Different User Cannot See Tasks

**User B logs in:**
- User B ID: `"ccc-333-ddd-444"`
- User B queries: `SELECT * FROM tasks`

**RLS applies:**
```sql
SELECT * FROM tasks
WHERE "ccc-333-ddd-444" = user_id

-- Returns ONLY User B's tasks
-- User A's tasks (user_id = "aaa-111-bbb-222") are NOT returned
```

**Result: Complete Data Isolation ✓**

---

## Remind Before Values

### Database Constraint:

```sql
remind_before INTEGER NOT NULL CHECK (remind_before IN (1, 2, 3, 5, 7, 10))
```

**Allowed Values:**
- ✅ 1 day before
- ✅ 2 days before
- ✅ 3 days before
- ✅ 5 days before
- ✅ 7 days before
- ✅ 10 days before

**Frontend Dropdown:**
```javascript
const remindBeforeOptions = [
  { value: 1, label: '1 day before' },
  { value: 2, label: '2 days before' },
  { value: 3, label: '3 days before' },
  { value: 5, label: '5 days before' },   // ← Added!
  { value: 7, label: '7 days before' },
  { value: 10, label: '10 days before' }
]
```

---

## Security Summary

### ✅ Database-Level Security:

1. **Foreign Key Constraint:**
   - `user_id` MUST exist in `auth.users.id`
   - Cannot create orphaned tasks
   - CASCADE delete removes tasks when user deleted

2. **Row Level Security (RLS):**
   - Enforced at PostgreSQL level
   - Cannot be bypassed from frontend
   - Uses JWT token claims automatically

3. **Password Security:**
   - Bcrypt hashing (cost 10)
   - Never stored in plain text
   - Never returned in API responses

4. **Token Security:**
   - JWT signed with HS256
   - Short expiry (1 hour)
   - Auto-refresh for seamless UX
   - Contains minimal claims

---

## Key Tables Relationship

```
┌─────────────────────────┐
│      auth.users         │
│ (Authentication Data)   │
├─────────────────────────┤
│ id (PK)                 │ ◄──────┐
│ email                   │        │
│ encrypted_password      │        │
│ raw_user_meta_data      │        │
│   { username: ... }     │        │
└─────────────────────────┘        │
                                   │
                                   │ FOREIGN KEY
                    ON DELETE CASCADE
                                   │
┌─────────────────────────┐        │
│     public.tasks        │        │
│  (Application Data)     │        │
├─────────────────────────┤        │
│ id (PK)                 │        │
│ user_id (FK) ───────────────────┘
│ title                   │
│ due_date                │
│ remind_before           │
│   ∈ {1,2,3,5,7,10}     │
│ time_slot               │
│ status                  │
└─────────────────────────┘
```

---

## Verification Commands

### Check User-Task Mapping:

```sql
-- See all users and their tasks
SELECT
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->>'username' as username,
  t.id as task_id,
  t.title,
  t.status
FROM auth.users u
LEFT JOIN public.tasks t ON u.id = t.user_id
ORDER BY u.email, t.created_at;
```

### Verify RLS is Working:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'tasks';
-- Should show: rowsecurity = true

-- Check policies exist
SELECT * FROM pg_policies WHERE tablename = 'tasks';
-- Should show 4+ policies
```

### Test Data Isolation:

```sql
-- Create test users and tasks
INSERT INTO tasks (user_id, title) VALUES
  ('user-a-uuid', 'User A Task'),
  ('user-b-uuid', 'User B Task');

-- As User A (JWT with sub: user-a-uuid)
SELECT * FROM tasks;  -- Should only see "User A Task"

-- As User B (JWT with sub: user-b-uuid)
SELECT * FROM tasks;  -- Should only see "User B Task"
```

---

## Summary Checklist

- ✅ `auth.users` stores user accounts (Supabase managed)
- ✅ `public.tasks` stores tasks (you manage)
- ✅ `user_id` foreign key links tables
- ✅ RLS enforces `auth.uid() = user_id`
- ✅ JWT token contains user ID in `sub` claim
- ✅ Complete data isolation between users
- ✅ Remind before: 1, 2, 3, 5, 7, 10 days
- ✅ Database constraint enforces valid values
- ✅ CASCADE delete keeps data clean

**Your authentication and user mapping is production-ready!** 🎉
