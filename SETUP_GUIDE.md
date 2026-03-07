# ReminDAM Setup Guide

Complete step-by-step guide to set up ReminDAM with authentication.

## Prerequisites

- Node.js 18+ installed
- Supabase account
- Gmail account (for n8n email sending)

## Part 1: Supabase Setup with Authentication

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: ReminDAM
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to you
4. Click "Create new project" and wait for setup

### Step 2: Configure Authentication

1. In Supabase Dashboard, go to **Authentication** → **Providers**

2. **Email Provider** (Already enabled by default):
   - Toggle "Enable Email provider" to ON
   - Configure email templates (optional):
     - Go to Authentication → Email Templates
     - Customize "Confirm signup" template

3. **Google OAuth** (Optional but recommended):
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials:
     - Go to APIs & Services → Credentials
     - Click "Create Credentials" → "OAuth client ID"
     - Application type: "Web application"
     - Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`
     - Copy Client ID and Client Secret
   - Back in Supabase:
     - Toggle "Enable Google provider" to ON
     - Paste Client ID and Client Secret
     - Click Save

### Step 3: Set Up Database Schema

1. Go to **SQL Editor** in Supabase
2. Click "New Query"
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click "Run" or press Ctrl/Cmd + Enter
5. Verify success:
   - Go to Table Editor
   - You should see "tasks" table
   - Check "Policies" tab to verify RLS is enabled

### Step 4: Get API Keys

1. Go to **Settings** → **API**
2. Copy these keys (you'll need them):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: Used in frontend (.env file)
   - **service_role**: Used in n8n (keep secret!)

## Part 2: Frontend Setup

### Step 1: Configure Environment Variables

1. In the project root, create `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key_here
```

2. Replace with your actual Supabase URL and anon key

### Step 2: Install Dependencies (Already Done)

```bash
npm install
```

### Step 3: Start Development Server

```bash
npm run dev
```

The app should open at `http://localhost:4000`

## Part 3: Test Authentication

### Test 1: Email/Password Sign Up

1. Click "Sign up" link
2. Fill in:
   - Username: testuser
   - Email: your-email@example.com
   - Password: test123456
   - Confirm Password: test123456
3. Click "Sign Up"
4. Check your email for verification (if email confirmation is enabled)
5. You should be redirected to login page

### Test 2: Email/Password Login

1. Enter the email and password from sign up
2. Click "Sign In"
3. You should be redirected to Dashboard
4. Verify you see your username in the header

### Test 3: Google Sign In

1. Click "Sign in with Google"
2. Choose your Google account
3. Grant permissions
4. You should be redirected to Dashboard
5. Your Google email should appear in header

### Test 4: Task Creation with User Association

1. Fill out task form:
   - Title: "Test Task"
   - Due Date: Tomorrow's date
   - Remind Before: 1 day before
   - Email: your-email@example.com
2. Click "Create Task"
3. Verify task appears in task list
4. Check Supabase Table Editor:
   - Go to "tasks" table
   - Find your task
   - Verify `user_id` matches your user ID
   - Get your user ID from Authentication → Users

### Test 5: Data Isolation

1. Create a task while logged in as User A
2. Sign out
3. Create a new account (User B)
4. Sign in as User B
5. Verify you DON'T see User A's tasks
6. Create a task as User B
7. Sign out and sign back in as User A
8. Verify you only see User A's tasks

## Part 4: n8n Workflow Setup

### Step 1: Install n8n

```bash
npm install -g n8n
```

### Step 2: Start n8n

```bash
n8n start
```

Access at `http://localhost:5678`

### Step 3: Configure Gmail Credentials

1. In n8n, go to **Credentials** → **Add Credential**
2. Search for "Gmail OAuth2 API"
3. Click to configure:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Enable Gmail API
   - Use same OAuth credentials from Step 2.3 or create new ones
   - Add authorized redirect URI: `http://localhost:5678/rest/oauth2-credential/callback`
4. Back in n8n:
   - Enter Client ID and Client Secret
   - Click "Connect my account"
   - Authorize access
   - Save credentials

### Step 4: Import Workflow

1. In n8n, click **Workflows** → **Import from File**
2. Select `n8n-workflows.json`
3. Click "Import"

### Step 5: Configure Environment Variables

1. Click on "Fetch Pending Tasks" node
2. Update URL:
   - Replace `{{$env.VITE_SUPABASE_URL}}` with your actual Supabase URL
3. Update headers:
   - Replace `{{$env.SUPABASE_SERVICE_ROLE_KEY}}` with your service_role key
4. Repeat for "Update reminder_sent" node

**Better Option**: Set environment variables in n8n:
- Create `.n8nrc` file or use environment variables:

```bash
export VITE_SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 6: Test Workflow

1. Click "Execute Workflow" button
2. Check for errors in each node
3. Verify:
   - Tasks are fetched
   - Filters are applied correctly
   - Email is sent (check your inbox)
   - Database is updated (reminder_sent = true)

### Step 7: Activate Workflow

1. Toggle "Active" switch in top-right
2. Workflow will now run every 30 minutes

## Part 5: Verification Checklist

- [ ] Supabase project created
- [ ] Database schema executed successfully
- [ ] RLS policies are enabled
- [ ] Google OAuth configured (optional)
- [ ] Frontend .env file configured
- [ ] Can sign up with email/password
- [ ] Can sign in with email/password
- [ ] Can sign in with Google (if configured)
- [ ] Can create tasks
- [ ] Tasks show correct user_id in database
- [ ] Can only see own tasks (data isolation works)
- [ ] Can mark tasks as complete
- [ ] Can filter tasks by status
- [ ] n8n installed and running
- [ ] Gmail credentials configured
- [ ] Workflow imported successfully
- [ ] Workflow variables configured
- [ ] Test email received
- [ ] reminder_sent updated in database
- [ ] Workflow activated

## Common Issues and Solutions

### Issue: "Missing Supabase environment variables"
**Solution**: Check `.env` file exists and has correct format. Restart dev server.

### Issue: "Invalid login credentials"
**Solution**:
- Verify email and password are correct
- Check if email verification is required
- Check Supabase Auth logs

### Issue: Google OAuth "redirect_uri_mismatch"
**Solution**:
- Ensure redirect URI in Google Console matches Supabase callback URL exactly
- Format: `https://xxxxx.supabase.co/auth/v1/callback`

### Issue: Tasks not showing
**Solution**:
- Check browser console for errors
- Verify RLS policies are enabled
- Check Network tab for failed requests
- Ensure user_id is being set correctly

### Issue: Can see other users' tasks
**Solution**:
- RLS policies not enabled or incorrect
- Re-run the RLS policy section of schema SQL
- Check that `auth.uid()` matches `user_id`

### Issue: n8n not sending emails
**Solution**:
- Check Gmail credentials are authorized
- Verify "Less secure app access" is enabled (or use App Password)
- Check Supabase service_role key is correct
- Test workflow manually

### Issue: reminder_sent not updating
**Solution**:
- Check service role key has proper permissions
- Verify RLS policy allows service role to update
- Check n8n node configuration

## Next Steps

1. **Customize Email Templates**: Modify n8n workflow email HTML
2. **Add More Features**: Due date editing, task deletion, recurring tasks
3. **Deploy**: Use Vercel/Netlify for frontend, keep Supabase/n8n running
4. **Monitor**: Set up Supabase logs and n8n error notifications
5. **Scale**: Add indexes, optimize queries, implement caching

## Security Best Practices

1. **Never commit** `.env` file to Git
2. **Use service_role key** only in trusted backend (n8n)
3. **Enable email verification** in production
4. **Set up password reset** flow
5. **Monitor auth logs** for suspicious activity
6. **Use HTTPS** in production
7. **Rotate keys** periodically
8. **Implement rate limiting** on auth endpoints
9. **Add CAPTCHA** for sign up (optional)
10. **Enable 2FA** for admin accounts

## Support

If you encounter issues:
1. Check Supabase logs (Dashboard → Logs)
2. Check browser console errors
3. Check n8n execution logs
4. Review this guide again
5. Check Supabase documentation
6. Open an issue on GitHub

Happy task managing!
