# Vercel Deployment Guide

Complete guide to deploy ReminDAM to Vercel.

---

## Prerequisites

✅ Git repository initialized (Done!)
✅ Initial commit created (Done!)
✅ Production build tested (Done!)
✅ Vercel account (You'll create this)

---

## Step 1: Create GitHub Repository (5 minutes)

### Option A: Using GitHub Desktop

1. **Download GitHub Desktop:**
   - Visit: https://desktop.github.com
   - Install and sign in

2. **Publish Repository:**
   - Open GitHub Desktop
   - File → Add Local Repository
   - Choose: `D:\ReminDAM`
   - Click "Publish repository"
   - Name: `remindam`
   - Description: "Task reminder application with authentication"
   - ☑️ Keep this code private (optional)
   - Click "Publish repository"

### Option B: Using Command Line

```bash
# Create repository on GitHub first at: https://github.com/new

# Then run these commands:
git remote add origin https://github.com/YOUR_USERNAME/remindam.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Vercel (3 minutes)

### 2.1 Create Vercel Account

1. **Go to:** https://vercel.com/signup
2. **Click:** "Continue with GitHub"
3. **Authorize** Vercel to access your GitHub

### 2.2 Import Project

1. **Go to:** https://vercel.com/new
2. **Find your repository:** `remindam`
3. **Click:** "Import"

### 2.3 Configure Project

**Framework Preset:** Vite (should auto-detect)

**Root Directory:** `./` (leave default)

**Build Command:**
```
npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```
npm install
```

### 2.4 Add Environment Variables ⚠️ IMPORTANT

Click **"Environment Variables"** and add:

**Variable 1:**
```
Name:  VITE_SUPABASE_URL
Value: https://lybgnvumnamykcsesnza.supabase.co
```

**Variable 2:**
```
Name:  VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YmdudnVtbmFteWtjc2VzbnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4OTc1NDUsImV4cCI6MjA4ODQ3MzU0NX0.4HsC1Q9q3zW6VnFt3jMnk9fQk4-fnXzQH5vT__eOKfI
```

⚠️ **Important:** Make sure to add BOTH variables!

### 2.5 Deploy

Click **"Deploy"**

Vercel will:
1. Clone your repository
2. Install dependencies
3. Run build command
4. Deploy to production

**Wait ~2-3 minutes for deployment to complete.**

---

## Step 3: Configure Supabase for Production

After deployment, you'll get a URL like: `https://remindam-xxx.vercel.app`

### 3.1 Update Supabase Auth Settings

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select your project

2. **Go to Authentication → URL Configuration**
   - Click **Authentication** in sidebar
   - Click **URL Configuration**

3. **Add Site URL:**
   ```
   https://your-app-name.vercel.app
   ```

4. **Add Redirect URLs:**
   ```
   https://your-app-name.vercel.app/**
   https://your-app-name.vercel.app/auth/callback
   ```

5. **Click Save**

### 3.2 Update Google OAuth (If Configured)

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com

2. **Navigate to:** APIs & Services → Credentials

3. **Edit your OAuth 2.0 Client:**
   - Find your OAuth client
   - Click edit (pencil icon)

4. **Add Authorized redirect URIs:**
   ```
   https://lybgnvumnamykcsesnza.supabase.co/auth/v1/callback
   ```

5. **Click Save**

---

## Step 4: Test Your Deployment

1. **Visit your Vercel URL:**
   ```
   https://your-app-name.vercel.app
   ```

2. **Test Sign Up:**
   - Click "Sign up"
   - Create test account
   - Should work successfully

3. **Test Sign In:**
   - Sign in with test account
   - Should redirect to dashboard

4. **Test Google OAuth (if configured):**
   - Click "Sign in with Google"
   - Should authenticate successfully

5. **Test Task Creation:**
   - Create a task
   - Should appear in list
   - Should persist after refresh

---

## Step 5: Custom Domain (Optional)

### Add Custom Domain

1. **In Vercel Dashboard:**
   - Go to your project
   - Click "Settings" → "Domains"

2. **Add Domain:**
   - Enter: `yourdomain.com`
   - Click "Add"

3. **Configure DNS:**
   - Add CNAME record pointing to Vercel
   - Follow Vercel's instructions

4. **Update Supabase:**
   - Add `https://yourdomain.com` to Site URL
   - Add to Redirect URLs

---

## Vercel Configuration Files

### vercel.json (Already Created)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**What this does:**
- Configures build settings
- Enables SPA routing (all routes → index.html)
- Optimizes for Vite framework

---

## Deployment Workflow

### For Future Updates

1. **Make changes locally**
2. **Test locally:** `npm run dev`
3. **Commit changes:**
   ```bash
   git add .
   git commit -m "Your commit message"
   ```
4. **Push to GitHub:**
   ```bash
   git push
   ```
5. **Vercel auto-deploys** (takes 2-3 min)

### View Deployments

- Go to: https://vercel.com/dashboard
- Click your project
- See all deployments with preview URLs

---

## Environment Variables Management

### View/Edit Environment Variables

1. **In Vercel Dashboard:**
   - Go to your project
   - Settings → Environment Variables

2. **Add/Edit/Delete** as needed

3. **Redeploy** to apply changes:
   - Deployments tab → Click "..." → Redeploy

### Different Environments

Vercel supports:
- **Production:** Main branch deployments
- **Preview:** Pull request deployments
- **Development:** Local development

You can set different env vars for each!

---

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution:**
1. Check Environment Variables in Vercel dashboard
2. Ensure both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Redeploy the project

### Issue: "Authentication not working"

**Solution:**
1. Check Supabase Site URL includes Vercel domain
2. Check Redirect URLs include Vercel domain
3. For Google OAuth, update authorized redirect URIs

### Issue: "Tasks not showing/saving"

**Solution:**
1. Check browser console for errors
2. Verify Supabase connection (Network tab)
3. Check database schema is executed
4. Verify RLS policies are enabled

### Issue: "Build failed"

**Solution:**
1. Check build logs in Vercel
2. Test build locally: `npm run build`
3. Check all dependencies are in package.json
4. Ensure no TypeScript errors

### Issue: "Page shows 404"

**Solution:**
1. Check `vercel.json` has rewrites configuration
2. Ensure `outputDirectory: "dist"` is correct
3. Verify build completed successfully

---

## Performance Optimization

### Already Optimized:

✅ **Code Splitting:** Vite automatically splits code
✅ **Minification:** Production builds are minified
✅ **Tree Shaking:** Unused code removed
✅ **Gzip Compression:** Enabled by Vercel
✅ **CDN:** Vercel Edge Network globally distributed

### Bundle Size:

```
dist/assets/index.css   28.71 kB │ gzip:   5.92 kB
dist/assets/index.js   404.34 kB │ gzip: 118.15 kB
```

**Total gzipped:** ~124 KB (Very good!)

---

## Monitoring & Analytics

### Vercel Analytics (Optional)

1. **Enable Analytics:**
   - Project Settings → Analytics
   - Click "Enable"

2. **View Metrics:**
   - Real-time visitors
   - Page views
   - Performance scores
   - Core Web Vitals

### Supabase Logs

1. **View Database Logs:**
   - Supabase Dashboard → Logs
   - See all queries and errors

2. **Authentication Logs:**
   - Authentication → Logs
   - Track sign-ups, sign-ins, errors

---

## Security Checklist

### Before Going Live:

- [x] Environment variables not committed to Git
- [x] `.env` in `.gitignore`
- [x] HTTPS enabled (automatic with Vercel)
- [ ] Supabase Site URL configured
- [ ] Redirect URLs configured
- [x] RLS policies enabled
- [x] API keys are anon keys (not service_role)
- [ ] Email verification enabled (optional)
- [ ] Rate limiting configured (Supabase)

---

## Costs

### Vercel

**Hobby Plan (Free):**
- ✅ Unlimited projects
- ✅ HTTPS included
- ✅ 100 GB bandwidth/month
- ✅ Automatic deployments
- ✅ Preview deployments
- ⚠️ One user only

**Pro Plan ($20/month):**
- Everything in Hobby
- Multiple team members
- Analytics
- More bandwidth

### Supabase

**Free Tier:**
- ✅ 500 MB database
- ✅ 5 GB bandwidth/month
- ✅ 50,000 monthly active users
- ✅ Authentication included
- ⚠️ Projects pause after 1 week inactivity

**Pro Plan ($25/month):**
- 8 GB database
- 250 GB bandwidth
- No project pausing
- Daily backups

---

## Summary

### What You've Deployed:

✅ Frontend application on Vercel
✅ Automatic HTTPS
✅ Global CDN distribution
✅ Automatic deployments from GitHub
✅ Environment variables configured
✅ SPA routing enabled

### What's Not Deployed Yet:

⏳ n8n workflows (requires separate hosting)
⏳ Custom domain (optional)
⏳ Analytics (optional)

### Your URLs:

**Local Development:**
```
http://localhost:4000
```

**Production (Vercel):**
```
https://your-app-name.vercel.app
```

**Supabase Backend:**
```
https://lybgnvumnamykcsesnza.supabase.co
```

---

## Next Steps

1. ✅ **Test your deployment** thoroughly
2. 📧 **Set up n8n for email reminders** (separate guide)
3. 🎨 **Add custom domain** (optional)
4. 📊 **Enable analytics** (optional)
5. 🔒 **Enable email verification** in Supabase
6. 📱 **Test on mobile devices**
7. 🚀 **Share with users!**

---

## Quick Reference

**Deploy Command:**
```bash
git add .
git commit -m "Your changes"
git push
```

**Vercel Dashboard:**
```
https://vercel.com/dashboard
```

**View Logs:**
- Vercel: Project → Deployments → Click deployment → Logs
- Supabase: Dashboard → Logs

**Redeploy:**
- Vercel: Deployments → "..." → Redeploy

---

**Congratulations! Your app is now live on Vercel!** 🎉

Visit your deployment URL and share it with the world!
