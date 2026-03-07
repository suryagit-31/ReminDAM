# ReminDAM - Task Reminder Application

A full-stack task reminder application with authentication, built with React, Supabase, and n8n automation.

## Features

- **User Authentication**
  - Email/Password authentication
  - Google OAuth sign-in
  - JWT token-based session management
  - Secure password storage

- **Task Management**
  - Create tasks with flexible reminder settings
  - Set reminders 1-10 days before due date
  - Choose reminder time (morning/afternoon/evening/custom)
  - Mark tasks as complete
  - Filter tasks by status
  - User-specific task isolation

- **Automated Reminders**
  - Email notifications via n8n workflows
  - Runs every 30 minutes
  - Time-slot based delivery
  - Automatic reminder tracking

## Tech Stack

- **Frontend**: Vite + React + TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Automation**: n8n + Gmail SMTP
- **UI Components**: Lucide React icons
- **Forms**: React Hook Form + Zod validation
- **Notifications**: React Toastify

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase-schema.sql`
3. Enable Google OAuth (optional):
   - Go to Authentication > Providers
   - Enable Google provider
   - Add your Google OAuth credentials
4. Get your API keys from Settings > API

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:4000`

### 5. n8n Workflow Setup

1. Install n8n: `npm install -g n8n`
2. Start n8n: `n8n start`
3. Import workflow from `n8n-workflows.json`
4. Configure credentials:
   - Add Supabase service role key
   - Add Gmail OAuth credentials
5. Set environment variables in n8n:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key (from Supabase Settings > API)
6. Activate the workflow

## Database Schema

### Tasks Table

- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to auth.users)
- `title`: TEXT (Required)
- `description`: TEXT
- `due_date`: DATE (Required)
- `remind_before`: INTEGER (1-10 days)
- `time_slot`: ENUM (morning, afternoon, evening, custom)
- `custom_time`: TIMESTAMP
- `status`: ENUM (pending, completed)
- `email`: TEXT (Required)
- `reminder_sent`: BOOLEAN
- `created_at`: TIMESTAMP

### Row Level Security (RLS)

- Users can only view/edit their own tasks
- Service role (n8n) can read all tasks and update reminder_sent

## Authentication Flow

1. **Sign Up**: User creates account with email/password or Google
2. **Email Verification**: Supabase sends verification email (optional)
3. **Sign In**: User logs in with credentials
4. **JWT Token**: Supabase issues JWT token stored in localStorage
5. **Protected Routes**: Dashboard requires authentication
6. **Session Persistence**: Auto-refresh tokens keep users logged in
7. **Sign Out**: Clears session and redirects to login

## Usage

1. **Create Account**: Sign up with email or Google
2. **Add Task**: Fill out task form with title, due date, and reminder preferences
3. **View Tasks**: See all tasks filtered by status
4. **Mark Complete**: Click button to mark tasks as done
5. **Receive Reminders**: Automated emails sent based on your settings

## Security Features

- Row Level Security (RLS) ensures data isolation
- JWT tokens for stateless authentication
- Secure password hashing (bcrypt)
- CSRF protection via Supabase Auth
- OAuth 2.0 for Google sign-in
- Service role key separation for n8n

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ProtectedRoute.jsx   # Auth guard for routes
│   ├── TaskForm.jsx          # Task creation form
│   ├── TaskList.jsx          # Task list with filters
│   └── TaskItem.jsx          # Individual task card
├── pages/
│   ├── Login.jsx             # Login page
│   ├── SignUp.jsx            # Sign up page
│   └── Dashboard.jsx         # Main app dashboard
├── contexts/
│   └── AuthContext.jsx       # Auth state management
├── lib/
│   ├── supabaseClient.js     # Supabase client config
│   └── dateHelpers.js        # Date utility functions
├── App.jsx                   # Router configuration
├── main.jsx                  # App entry point
└── index.css                 # Global styles
```

## Troubleshooting

### Authentication Issues
- Check Supabase URL and keys in .env
- Verify email confirmation is disabled or email is verified
- Check browser console for errors

### Tasks Not Showing
- Verify RLS policies are enabled
- Check user_id matches authenticated user
- Inspect network tab for Supabase errors

### Reminders Not Sending
- Check n8n workflow is active
- Verify Gmail OAuth credentials
- Check Supabase service role key
- Test workflow manually in n8n

### Google OAuth Not Working
- Verify redirect URLs in Google Console
- Check Google provider is enabled in Supabase
- Ensure credentials are correctly configured

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
