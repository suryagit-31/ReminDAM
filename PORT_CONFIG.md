# Port Configuration

## Current Settings

**Development Server Port:** `4000`

The application runs on `http://localhost:4000` when you start the dev server.

---

## Configuration Location

**File:** `vite.config.js`

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000,        // ← Development server port
    open: true         // Auto-open browser
  }
})
```

---

## Starting the Application

```bash
npm run dev
```

**Browser opens automatically at:**
```
http://localhost:4000
```

---

## Changing the Port

To use a different port, edit `vite.config.js`:

```javascript
server: {
  port: 3000,  // Change to your preferred port
  open: true
}
```

---

## Why Port 4000?

- Custom user preference
- Avoids conflicts with other services
- Easy to remember
- Not a commonly used port

---

## Port Conflicts

If port 4000 is already in use, you'll see an error:

```
Error: Port 4000 is already in use
```

**Solutions:**

1. **Change port in vite.config.js**
2. **Kill the process using port 4000:**
   ```bash
   # Windows
   netstat -ano | findstr :4000
   taskkill /PID <PID> /F

   # Linux/Mac
   lsof -ti:4000 | xargs kill -9
   ```

---

## Production Build

Port only affects development server. Production builds are static files served by your hosting provider (Vercel, Netlify, etc.) on their configured ports (usually 80/443).

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

Preview server also runs on port 4000 (configured in vite.config.js).

---

## OAuth Redirect URLs

When configuring OAuth providers (Google), use:

**Development:**
```
http://localhost:4000
```

**Production:**
```
https://yourdomain.com
```

The redirect happens automatically via `window.location.origin` in the code, so it adapts to whatever port/domain you're using.

---

## n8n Workflow URLs

n8n runs on its own port (default 5678):

```
http://localhost:5678
```

This is separate from your frontend application.

---

## Summary

| Service | Port | URL |
|---------|------|-----|
| **Frontend Dev** | 4000 | http://localhost:4000 |
| **n8n** | 5678 | http://localhost:5678 |
| **Supabase** | N/A | https://your-project.supabase.co |

---

## Quick Reference

**Start frontend:**
```bash
npm run dev
# Opens http://localhost:4000
```

**Start n8n:**
```bash
n8n start
# Opens http://localhost:5678
```

**Both running simultaneously is fine!**

They use different ports and don't conflict.
