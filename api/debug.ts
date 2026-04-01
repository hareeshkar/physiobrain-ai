import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Debug endpoint to check if environment variables are properly configured
 * Visit: https://your-vercel-app.vercel.app/api/debug
 */
export default function handler(
  req: VercelRequest,
  res: VercelResponse<any>,
) {
  // Only allow in development or with debug flag
  if (process.env.NODE_ENV === 'production' && req.query.debug !== process.env.DEBUG_PASSWORD) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    MINIMAX_API_KEY: process.env.MINIMAX_API_KEY ? '✅ SET' : '❌ MISSING',
    APP_URL: process.env.APP_URL || 'Not configured',
  };

  const allEnvKeys = Object.keys(process.env).filter(key => 
    key.includes('API') || key.includes('KEY') || key === 'NODE_ENV'
  );

  return res.status(200).json({
    status: 'debug',
    message: 'Environment variables status (PhysioBrain AI uses MiniMax API only)',
    configured: envVars,
    allApiRelatedEnvs: allEnvKeys,
    instructions: {
      step1: 'Go to Vercel Dashboard → Project Settings → Environment Variables',
      step2: 'Add these variables:',
      step3: 'MINIMAX_API_KEY: Your MiniMax API key (required)',
      step4: 'APP_URL: Your deployment URL (optional, for local use http://localhost:5173)',
      step5: 'Redeploy the project after adding variables',
    },
  });
}
