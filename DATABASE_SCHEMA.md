# Database Schema & User Mapping

## Complete Database Architecture

ReminDAM uses two main tables:
1. **auth.users** - Managed by Supabase Auth (stores user accounts)
2. **public.tasks** - Your application data (stores tasks with user_id)

---

## 1. Authentication Schema (auth.users)

### Table: `auth.users`
**Schema:** `auth` (not `public`)
**Managed by:** Supabase Auth (automatically created, don't create manually)

### Full Structure:

```sql
CREATE TABLE auth.users (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Email authentication
    email TEXT UNIQUE,
    encrypted_password TEXT,              -- Bcrypt hashed password
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    email_change TEXT,
    email_change_token_new TEXT,
    email_change_token_current TEXT,
    email_change_sent_at TIMESTAMP WITH TIME ZONE,
    email_change_confirm_status SMALLINT DEFAULT 0,

    -- Account confirmation
    confirmation_token TEXT,
    confirmation_sent_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,

    -- Password recovery
    recovery_token TEXT,
    recovery_sent_at TIMESTAMP WITH TIME ZONE,

    -- Reauthentication
    reauthentication_token TEXT,
    reauthentication_sent_at TIMESTAMP WITH TIME ZONE,

    -- Phone authentication (optional)
    phone TEXT UNIQUE,
    phone_confirmed_at TIMESTAMP WITH TIME ZONE,
    phone_change TEXT,
    phone_change_token TEXT,
    phone_change_sent_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    raw_app_meta_data JSONB,              -- Provider info, roles
    raw_user_meta_data JSONB,             -- Custom data (username, profile)

    -- Administration
    is_super_admin BOOLEAN DEFAULT false,
    is_sso_user BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_sign_in_at TIMESTAMP WITH TIME ZONE,

    -- Account status
    invited_at TIMESTAMP WITH TIME ZONE,
    banned_until TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

### Important Fields Explained:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | **Primary key** - Used as `user_id` in tasks table |
| `email` | TEXT | User's email address (unique) |
| `encrypted_password` | TEXT | Bcrypt hashed password (never plain text) |
| `raw_user_meta_data` | JSONB | Custom user data (username, etc.) |
| `raw_app_meta_data` | JSONB | Provider info (email, google, etc.) |
| `confirmed_at` | TIMESTAMP | When email was verified |
| `last_sign_in_at` | TIMESTAMP | Last login time |

### Example Data in auth.users:

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "john@example.com",
  "encrypted_password": "$2a$10$...",  // Bcrypt hash
  "email_confirmed_at": "2024-03-07T10:30:00Z",
  "raw_user_meta_data": {
    "username": "johndoe"  // Set during sign-up
  },
  "raw_app_meta_data": {
    "provider": "email",
    "providers": ["email"]
  },
  "created_at": "2024-03-07T10:30:00Z",
  "updated_at": "2024-03-07T10:30:00Z",
  "last_sign_in_at": "2024-03-07T12:00:00Z"
}
```

---

## 2. Tasks Schema (public.tasks)

### Table: `public.tasks`
**Schema:** `public` (your application schema)
**Managed by:** You (created via SQL script)

### Full Structure:

```sql
CREATE TABLE public.tasks (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- USER MAPPING: Links to auth.users
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Task details
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,

    -- Reminder settings
    remind_before INTEGER NOT NULL CHECK (remind_before IN (1, 2, 3, 5, 7, 10)),
    time_slot time_slot_enum NOT NULL DEFAULT 'morning',
    custom_time TIMESTAMP WITH TIME ZONE,

    -- Status and email
    status status_enum NOT NULL DEFAULT 'pending',
    email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),

    -- Automation tracking
    reminder_sent BOOLEAN NOT NULL DEFAULT false,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enum types
CREATE TYPE time_slot_enum AS ENUM ('morning', 'afternoon', 'evening', 'custom');
CREATE TYPE status_enum AS ENUM ('pending', 'completed');
```

### Field Explanations:

| Field | Type | Constraint | Purpose |
|-------|------|------------|---------|
| `id` | UUID | PRIMARY KEY | Unique task identifier |
| `user_id` | UUID | **FOREIGN KEY → auth.users(id)** | **Links task to user** |
| `title` | TEXT | NOT NULL | Task title |
| `description` | TEXT | - | Optional task details |
| `due_date` | DATE | NOT NULL | When task is due |
| `remind_before` | INTEGER | IN (1,2,3,5,7,10) | Days before to remind |
| `time_slot` | ENUM | morning/afternoon/evening/custom | When to send reminder |
| `custom_time` | TIMESTAMP | - | Custom reminder time |
| `status` | ENUM | pending/completed | Task status |
| `email` | TEXT | NOT NULL, valid email | Where to send reminder |
| `reminder_sent` | BOOLEAN | DEFAULT false | Tracking if reminder sent |
| `created_at` | TIMESTAMP | DEFAULT now() | When task was created |

### Example Data in tasks:

```json
{
  "id": "task-uuid-here",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",  // Links to auth.users.id
  "title": "Submit project report",
  "description": "Final report for Q1 2024",
  "due_date": "2024-03-15",
  "remind_before": 5,
  "time_slot": "morning",
  "custom_time": null,
  "status": "pending",
  "email": "john@example.com",
  "reminder_sent": false,
  "created_at": "2024-03-07T14:30:00Z"
}
```

---

## 3. User-to-Task Mapping

### How It Works:

```
┌─────────────────────────┐
│     auth.users          │
│  (Supabase Auth)        │
├─────────────────────────┤
│ id: UUID (PK)           │ ◄──┐
│ email: TEXT             │    │
│ encrypted_password      │    │
│ raw_user_meta_data      │    │
│   - username            │    │
│ created_at              │    │
└─────────────────────────┘    │
                               │
                               │ FOREIGN KEY
                               │ RELATIONSHIP
                               │
┌─────────────────────────┐    │
│     public.tasks        │    │
│  (Your App Data)        │    │
├─────────────────────────┤    │
│ id: UUID (PK)           │    │
│ user_id: UUID (FK) ─────────┘
│ title: TEXT             │
│ description: TEXT       │
│ due_date: DATE          │
│ status: ENUM            │
└─────────────────────────┘
```

### Foreign Key Constraint:

```sql
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
```

**What this means:**
- `user_id` must exist in `auth.users.id`
- Cannot create task with invalid `user_id`
- If user is deleted, all their tasks are deleted (CASCADE)

### Creating a Task (Frontend Code):

```javascript
const { user } = useAuth()  // user.id comes from JWT token

// Insert task with user_id
const { data, error } = await supabase
  .from('tasks')
  .insert({
    title: 'My Task',
    user_id: user.id,  // ← Maps task to current user
    due_date: '2024-03-15',
    remind_before: 5,
    time_slot: 'morning',
    email: user.email,
    status: 'pending'
  })
```

### What Happens:
1. User signs in → JWT token contains `user.id`
2. Frontend gets `user.id` from `useAuth()` context
3. Task is created with `user_id = user.id`
4. Database stores task with foreign key reference
5. RLS policies ensure user can only see their own tasks

---

## 4. Row Level Security (RLS)

### How RLS Enforces User Isolation:

RLS policies use `auth.uid()` function which extracts the user ID from the JWT token.

### RLS Policy: SELECT (Read)

```sql
CREATE POLICY "Users can view their own tasks"
  ON tasks
  FOR SELECT
  USING (auth.uid() = user_id);
```

**How it works:**
1. User makes request with JWT token in header
2. Supabase validates JWT and extracts `sub` claim (user ID)
3. PostgreSQL sets `auth.uid()` to that user ID
4. Query: `SELECT * FROM tasks WHERE auth.uid() = user_id`
5. Only tasks where `user_id` matches JWT are returned

### Example Flow:

```
User A (ID: aaa-111) signs in
  ↓
JWT token contains: { sub: "aaa-111", ... }
  ↓
User A queries: SELECT * FROM tasks
  ↓
PostgreSQL executes: SELECT * FROM tasks WHERE auth.uid() = user_id
  ↓
auth.uid() returns "aaa-111"
  ↓
Query becomes: SELECT * FROM tasks WHERE "aaa-111" = user_id
  ↓
Only returns tasks where user_id = "aaa-111"
```

### All RLS Policies:

```sql
-- READ: Users can only see their own tasks
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- CREATE: Users can only create tasks for themselves
CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own tasks
CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own tasks
CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 5. Complete User Journey

### Sign Up:

```
1. User fills form:
   - username: "johndoe"
   - email: "john@example.com"
   - password: "securepass123"

2. Frontend calls:
   supabase.auth.signUp({
     email: "john@example.com",
     password: "securepass123",
     options: {
       data: { username: "johndoe" }
     }
   })

3. Supabase creates record in auth.users:
   INSERT INTO auth.users (
     id,                   -- Generated: aaa-111
     email,                -- "john@example.com"
     encrypted_password,   -- Bcrypt hash
     raw_user_meta_data    -- { username: "johndoe" }
   )

4. Returns JWT token with payload:
   {
     sub: "aaa-111",      // User ID
     email: "john@example.com",
     user_metadata: {
       username: "johndoe"
     }
   }

5. Frontend stores JWT in localStorage
```

### Create Task:

```
1. User fills task form and submits

2. Frontend code:
   const { user } = useAuth()  // user.id = "aaa-111"

   supabase.from('tasks').insert({
     user_id: user.id,    // "aaa-111"
     title: "My Task",
     due_date: "2024-03-15",
     remind_before: 5,
     time_slot: "morning",
     email: user.email,
     status: "pending"
   })

3. Database inserts:
   INSERT INTO tasks (
     id,        -- Generated: task-xyz
     user_id,   -- "aaa-111" (links to auth.users.id)
     title,     -- "My Task"
     ...
   )

4. RLS policy checks:
   WITH CHECK (auth.uid() = user_id)
   → auth.uid() returns "aaa-111" from JWT
   → user_id is "aaa-111"
   → Check passes ✓
```

### Fetch Tasks:

```
1. Frontend requests:
   supabase.from('tasks').select('*')

2. Database executes with RLS:
   SELECT * FROM tasks
   WHERE auth.uid() = user_id

3. auth.uid() extracts from JWT: "aaa-111"

4. Query becomes:
   SELECT * FROM tasks
   WHERE "aaa-111" = user_id

5. Returns only tasks where user_id = "aaa-111"
```

---

## 6. Database Indexes

For performance, we create indexes on frequently queried columns:

```sql
CREATE INDEX idx_tasks_user_id ON tasks(user_id);        -- Fast user task lookup
CREATE INDEX idx_tasks_status ON tasks(status);          -- Fast status filtering
CREATE INDEX idx_tasks_reminder_sent ON tasks(reminder_sent);  -- n8n queries
CREATE INDEX idx_tasks_due_date ON tasks(due_date);      -- Date-based queries
```

---

## 7. Data Isolation Testing

### Test Scenario:

```sql
-- User A creates tasks
INSERT INTO tasks (user_id, title) VALUES
  ('aaa-111', 'User A Task 1'),
  ('aaa-111', 'User A Task 2');

-- User B creates tasks
INSERT INTO tasks (user_id, title) VALUES
  ('bbb-222', 'User B Task 1'),
  ('bbb-222', 'User B Task 2');

-- User A queries (JWT has sub: "aaa-111")
SELECT * FROM tasks;  -- Returns only Task 1 & 2 (User A's)

-- User B queries (JWT has sub: "bbb-222")
SELECT * FROM tasks;  -- Returns only Task 1 & 2 (User B's)

-- Admin with service_role key
SELECT * FROM tasks;  -- Returns ALL tasks (bypasses RLS)
```

---

## 8. Summary

### User Authentication Table:
- **Location:** `auth.users` (managed by Supabase)
- **Purpose:** Store user accounts, credentials, metadata
- **Access:** Automatic via Supabase Auth

### Tasks Table:
- **Location:** `public.tasks` (your application)
- **Purpose:** Store user-specific tasks
- **Link:** `user_id` → `auth.users.id` (foreign key)

### Mapping:
- ✅ Each task has `user_id` field
- ✅ `user_id` references `auth.users(id)`
- ✅ Foreign key ensures referential integrity
- ✅ CASCADE delete removes tasks when user deleted
- ✅ RLS policies enforce `auth.uid() = user_id`
- ✅ JWT token contains user ID in `sub` claim
- ✅ Complete data isolation between users

### Remind Before Values:
- ✅ Now supports: 1, 2, 3, 5, 7, 10 days
- ✅ Database constraint enforces valid values
- ✅ Frontend dropdown updated with all options

---

**You now have complete user-to-task mapping with database-level security!**
