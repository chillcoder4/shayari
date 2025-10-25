
# Shayari Gem — Romantic Gemini Shayari App

This is a static frontend + Netlify Functions project that demonstrates using Google Gemini (server-side)
to enhance a user-provided shayari: suggestions, translations, and image prompts. The frontend runs in the browser;
all calls to Gemini are proxied through Netlify Functions so your API key stays secret.

## Files
- index.html — frontend
- style.css — styles
- app.js — frontend logic calling serverless functions
- netlify/functions/generate.js — Netlify function that calls Gemini to produce suggestions/translations/images
- netlify/functions/buildzip.js — builds downloadable zip with text and images
- netlify/functions/package.json — dependencies for functions (Netlify will install these automatically)
- README.md — this file

## Deployment (Netlify)
1. Create a new Netlify site from GitHub and push this repository.
2. In Netlify dashboard > Site settings > Build & deploy > Environment, set the variable `GEMINI_API_KEY` to your Google Gemini API key.
3. Netlify build settings: set build command to `npm --prefix netlify/functions install && echo 'no build'` (or configure to run any build if you add one)
4. Ensure Netlify deploys and that serverless functions are enabled. The frontend will call `/.netlify/functions/generate`.

## Notes & Caveats
- The SDK usage and exact model names depend on what your API key has access to (Gemini model names vary over time).
- Image generation behavior and returning real image URLs depends on your Gemini plan and model support.
- For production, lock down usage, validate inputs, and add usage quotas and billing checks.
- This sample uses placeholder images if the image generation isn't available.
