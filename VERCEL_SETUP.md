# Vercel Deployment - MiniMax Only Setup

## Quick Start

PhysioBrain AI uses **MiniMax exclusively**. Just one environment variable needed.

## Setup Steps

### 1. Vercel Dashboard Configuration

1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add: `MINIMAX_API_KEY` = your_actual_key
4. Set for: Production, Preview, Development
5. Save

### 2. Verify Endpoint

After deployment, visit: `https://your-app.vercel.app/api/debug`

Should show: `"MINIMAX_API_KEY": "✅ SET"`

### 3. If 500 Error Persists

- Verify key in Vercel Settings
- Redeploy project (git push or manual)
- Wait 30 seconds for deployment
- Check /api/debug endpoint

## That's It!

No Gemini, OpenRouter, or other APIs needed. MiniMax handles everything.
