# Quick Start Guide

Get ReminDAM up and running in 5 minutes!

## Prerequisites Check

✓ Node.js installed? Run: `node --version` (should be 18+)
✓ Supabase account? Sign up at [supabase.com](https://supabase.com)

## Step 1: Supabase Setup (2 minutes)

1. **Create Project**
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Name: `ReminDAM`
   - Set database password
   - Click "Create new project"

2. **Run Database Schema**
   - Wait for project to finish setting up
   - Go to "SQL Editor" in left sidebar
   - Click "New Query"
   - Open `supabase-schema.sql` from this project
   - Copy all contents and paste into SQL Editor
   - Click "Run" (or Ctrl+Enter)
   - ✓ Should see "Success. No rows returned"

3. **Get API Keys**
   - Go to Settings → API
   - Copy "Project URL" (e.g., `https://xxx.supabase.co`)
   - Copy "anon public" key

## Step 2: Configure Environment (30 seconds)

1. Create `.env` file in project root:
   ```bash
   # Windows
   copy .env.example .env

   # Mac/Linux
   cp .env.example .env
   ```

2. Edit `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## Step 3: Start Application (1 minute)

```bash
# Already installed dependencies
npm run dev
```

Open http://localhost:4000

## Step 4: Test Authentication (2 minutes)

### Create Account
1. Click "Sign up"
2. Enter:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `test123456`
   - Confirm Password: `test123456`
3. Click "Sign Up"
4. You'll be redirected to login

### Sign In
1. Enter the credentials you just created
2. Click "Sign In"
3. You should see the Dashboard!

### Create First Task
1. Fill out the form:
   - Title: "Test Task"
   - Description: "My first task"
   - Due Date: Select tomorrow
   - Remind Before: "1 day before"
   - Reminder Time: "Morning (9:00 AM)"
   - Email: Your email
2. Click "Create Task"
3. Task appears in the list below!

## You're Done! 🎉

You now have:
- ✓ Working authentication (email/password)
- ✓ User-specific task management
- ✓ Task creation and completion
- ✓ Real-time updates
- ✓ Secure data isolation

## Optional: Enable Google Sign-In

1. **Google Cloud Console**
   - Go to https://console.cloud.google.com
   - Create new project (or use existing)
   - Enable "Google+ API"
   - Create OAuth 2.0 credentials
   - Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret

2. **Supabase Dashboard**
   - Go to Authentication → Providers
   - Enable "Google"
   - Paste Client ID and Client Secret
   - Save

3. **Test**
   - Sign out from ReminDAM
   - Click "Sign in with Google"
   - Choose your Google account
   - Should redirect to Dashboard

## Optional: Set Up Email Reminders (n8n)

For automated email reminders, see detailed instructions in `SETUP_GUIDE.md`, Part 4.

**Quick version:**
```bash
# Install n8n globally
npm install -g n8n

# Start n8n
n8n start
```

Then follow Part 4 in SETUP_GUIDE.md.

## Next Steps

- **Read**: `README.md` for full feature list
- **Setup n8n**: `SETUP_GUIDE.md` Part 4 for email automation
- **Customize**: Edit components in `src/components/`
- **Deploy**: Build for production with `npm run build`

## Troubleshooting

**Can't sign up?**
- Check console for errors (F12)
- Verify .env file has correct values
- Restart dev server: Ctrl+C then `npm run dev`

**Tasks not showing?**
- Check Supabase Table Editor → tasks table
- Verify RLS policies are enabled
- Check that user_id is being set

**Google sign-in not working?**
- Verify redirect URI matches exactly
- Check Google OAuth credentials are enabled
- Look for errors in browser console

## Architecture Overview

```
┌─────────────────────────────────────────┐
│           React Frontend                │
│  (Vite + TailwindCSS + React Router)   │
└────────────┬────────────────────────────┘
             │
             │ JWT Auth + REST API
             │
┌────────────▼────────────────────────────┐
│        Supabase Backend                 │
│  - PostgreSQL Database                  │
│  - Authentication (JWT)                 │
│  - Row Level Security                   │
│  - Real-time subscriptions              │
└────────────┬────────────────────────────┘
             │
             │ Service Role API
             │
┌────────────▼────────────────────────────┐
│          n8n Automation                 │
│  - Scheduled workflow (30 min)          │
│  - Gmail email sending                  │
│  - Task filtering logic                 │
└─────────────────────────────────────────┘
```

## Key Features Implemented

✓ Email/Password Authentication
✓ Google OAuth Integration
✓ JWT Token Management
✓ Session Persistence
✓ Protected Routes
✓ User-specific Data (RLS)
✓ Task CRUD Operations
✓ Real-time Updates
✓ Task Status Management
✓ Responsive Design
✓ Form Validation
✓ Toast Notifications

## What's NOT Included Yet

- Email reminders (requires n8n setup)
- Password reset flow
- Email verification enforcement
- Task editing/deletion
- Task search/sorting
- User profile management
- Task categories/tags
- Dark mode
- Mobile app

## File Structure

```
D:\ReminDAM\
├── src/
│   ├── components/          # React components
│   │   ├── ProtectedRoute.jsx
│   │   ├── TaskForm.jsx
│   │   ├── TaskItem.jsx
│   │   └── TaskList.jsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.jsx
│   ├── lib/                 # Utilities
│   │   ├── dateHelpers.js
│   │   └── supabaseClient.js
│   ├── pages/               # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   └── SignUp.jsx
│   ├── App.jsx              # Root component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── supabase-schema.sql      # Database schema
├── n8n-workflows.json       # Automation workflows
├── .env                     # Environment variables (YOU CREATE THIS)
├── .env.example             # Environment template
├── package.json             # Dependencies
└── README.md                # Full documentation
```

## Questions?

Check `SETUP_GUIDE.md` for detailed step-by-step instructions.

---

**Built with ❤️ using React, Supabase, and n8n**
