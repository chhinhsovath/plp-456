# Vercel Environment Variables Setup

## Required Environment Variables

### Google Gemini API Key
This is required for the AI Analysis feature in observation forms.

**Variable Name:** `GOOGLE_GEMINI_API_KEY`  
**Value:** Your Google Gemini API key

## How to Set Up in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:
   - **Name:** `GOOGLE_GEMINI_API_KEY`
   - **Value:** `AIzaSyAR6mcYvSkONVy6IhzfGD--QwYPJw6viGI`
   - **Environment:** Select all (Production, Preview, Development)
4. Click **Save**
5. Redeploy your project for the changes to take effect

## Local Development

For local development, the API key is already configured in `.env.local`:

```bash
GOOGLE_GEMINI_API_KEY=AIzaSyAR6mcYvSkONVy6IhzfGD--QwYPJw6viGI
```

## Verifying the Setup

After deployment, you can verify the AI Analysis is working by:
1. Creating a new observation
2. Filling out the form and navigating to Step 4 (Review & Submit)
3. Clicking the "Analyze" button in the AI Analysis section
4. The AI should provide analysis of the observation data

## Security Note

Never commit API keys directly in your code. Always use environment variables for sensitive information.