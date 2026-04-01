# Vercel Deployment - Environment Variables Setup Guide

## 🚨 Why You're Getting a 500 Error

**Root Cause**: Environment variables (API keys) are not being passed to the Vercel Functions from the dashboard.

**Solution**: Properly configure them in Vercel Project Settings.

---

## ✅ Step-by-Step Setup

### 1. Get Your API Keys Ready

Before you start, have these ready:
- **MINIMAX_API_KEY**: From your MiniMax account
- **GEMINI_API_KEY**: From Google AI Studio (https://aistudio.google.com)
- **OPENROUTER_API_KEY** (optional): From OpenRouter

### 2. Add Environment Variables to Vercel

**Method A: Via Vercel Dashboard (Recommended)**

1. Go to **Vercel Dashboard** → Select your `physiobrain-ai` project
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: `MINIMAX_API_KEY` | **Value**: `<your_actual_key>` | **Environments**: Production, Preview, Development
   - **Name**: `GEMINI_API_KEY` | **Value**: `<your_actual_key>` | **Environments**: Production, Preview, Development
   - **Name**: `OPENROUTER_API_KEY` | **Value**: `<your_actual_key>` | **Environments**: Production, Preview, Development

4. Click **Save**

**Method B: Via Vercel CLI**

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add MINIMAX_API_KEY
# (paste your actual key when prompted)

vercel env add GEMINI_API_KEY
# (paste your actual key when prompted)
```

### 3. Redeploy Your Project

After adding environment variables, **redeploy**:

**Option A: Git Push (Auto Deploy)**
```bash
git add api/ vercel.json
git commit -m "fix: Update API endpoint for Vercel compatibility"
git push origin main
# Vercel will auto-redeploy
```

**Option B: Manual Redeploy via Dashboard**
1. Go to Vercel Dashboard → Deployments
2. Click the three dots (...) on the latest deployment
3. Select "Redeploy"

**Option C: Vercel CLI**
```bash
vercel --prod
```

### 4. Verify Environment Variables Are Set

Visit the debug endpoint:
```
https://your-app.vercel.app/api/debug
```

You should see:
```json
{
  "MINIMAX_API_KEY": "✅ SET",
  "GEMINI_API_KEY": "✅ SET",
  "OPENROUTER_API_KEY": "✅ SET"
}
```

If you see `❌ MISSING` for any variable, it's not configured correctly.

---

## 🔧 Troubleshooting

### Issue: Still Getting 500 Error

**Check 1: Is the variable in Vercel Settings?**
- Go to Vercel Dashboard → Settings → Environment Variables
- Make sure `MINIMAX_API_KEY` exists with a value

**Check 2: Did you redeploy after adding variables?**
- Environment variables only work for **new deployments**
- Redeploy via Vercel Dashboard or `git push`
- Check the deployment log to verify

**Check 3: Is the API key valid?**
- Test your MiniMax API key directly: https://console.minimax.io
- Verify the key hasn't expired
- Check you're using the key from the correct MiniMax account

**Check 4: Visit debug endpoint**
```bash
curl https://your-app.vercel.app/api/debug
```

### Issue: Error says "MINIMAX_API_KEY is NOT configured"

This means the environment variable isn't reaching the function. **Solution**:
1. Make sure you added it in Vercel Settings (not .env.local)
2. Redeploy the project
3. Wait 30 seconds for the deployment to finish
4. Test again

### Issue: Error says "Authentication Failed (401)"

The API key is configured but **invalid**. **Solution**:
1. Verify the key is correct in MiniMax dashboard
2. Generate a new key and update Vercel Settings
3. Redeploy

---

## 📋 Vercel Environment Variables Best Practices

### ✅ DO:
- Store sensitive keys in Vercel Settings (NOT in .env files)
- Use descriptive names: `MINIMAX_API_KEY` not just `KEY`
- Set environment for Production, Preview, AND Development
- Rotate keys if exposed or unused
- Test with `/api/debug` after changes

### ❌ DON'T:
- Hardcode keys in your code (they will be exposed!)
- Commit `.env` files to git
- Use the same key across multiple projects
- Forget to redeploy after adding/changing variables

---

## 🚀 Final Verification Checklist

- [ ] MINIMAX_API_KEY added to Vercel Settings
- [ ] GEMINI_API_KEY added to Vercel Settings  
- [ ] Set for Production, Preview, Development environments
- [ ] Project redeployed (via git push or manual redeploy)
- [ ] Deployment status is "Ready" (green checkmark)
- [ ] Visited `/api/debug` and confirmed ✅ for all keys
- [ ] Generated a case in the UI - no 500 error

---

## 🆘 Still Not Working?

1. Check Vercel deployment logs:
   - Vercel Dashboard → Deployments → Latest → Click deployment
   - Look for any error messages in "Functions" tab

2. Check browser console errors:
   - Open DevTools (F12) → Console tab
   - Look for network errors when generating a case

3. Test the API directly:
```bash
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":[{"type":"text","text":"Hello"}]}]}'
```

4. Visit debug endpoint for current status:
```bash
curl https://your-app.vercel.app/api/debug
```

---

**If all else fails**, file an issue on GitHub with:
- Screenshot from `/api/debug`
- Error message from browser console
- Vercel deployment URL
- Verification that keys are in Vercel Settings
