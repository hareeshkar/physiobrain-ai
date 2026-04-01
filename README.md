<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/852518b9-dc8c-4721-8fd6-159d5c8cb57c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `MINIMAX_API_KEY` in [.env.local](.env.local)
3. Run the app:
   `npm run dev`

## Deploy on Vercel

1. Push the repo to GitHub.
2. Import the project into Vercel.
3. Set `MINIMAX_API_KEY` in the Vercel project environment variables.
4. Deploy.

The frontend is a Vite SPA and the chat endpoint is exposed as a Vercel Function at `/api/chat`.
