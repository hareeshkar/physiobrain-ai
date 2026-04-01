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
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✅ SET' : '❌ MISSING',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? '✅ SET' : '❌ MISSING',
    APP_URL: process.env.APP_URL || 'Not configured',
  };

  const allEnvKeys = Object.keys(process.env).filter(key => 
    key.includes('API') || key.includes('KEY') || key === 'NODE_ENV'
  );

  return res.status(200).json({
    status: 'debug',
    message: 'Environment variables status (check Vercel dashboard to set them)',
    configured: envVars,
    allApiRelatedEnvs: allEnvKeys,
    instructions: {
      step1: 'Go to Vercel Dashboard → Project Settings → Environment Variables',
      step2: 'Add these variables (get actual values from your API providers):',
      step3: 'MINIMAX_API_KEY: Your MiniMax API key',
      step4: 'GEMINI_API_KEY: Your Google Gemini API key',
      step5: 'OPENROUTER_API_KEY: Your OpenRouter API key (optional)',
      step6: 'Redeploy the project after adding variables',
    },
  });
}
