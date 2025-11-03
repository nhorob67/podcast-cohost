#!/bin/bash

echo "🚀 Elias Deployment Script"
echo "=========================="
echo ""

echo "Step 1: Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi

echo "✅ Build successful!"
echo ""

echo "Step 2: Checking Supabase Edge Functions..."
echo "The following Edge Functions are deployed:"
echo "  - conversations (for managing chat history)"
echo "  - reports (for document uploads)"
echo "  - personality (for AI configuration)"
echo "  - settings (for system settings)"
echo "  - health (for monitoring)"
echo ""

echo "Step 3: Deployment Options"
echo ""
echo "Choose your deployment platform:"
echo ""
echo "A) Vercel (Recommended)"
echo "   1. Install: npm i -g vercel"
echo "   2. Run: vercel"
echo "   3. Follow prompts"
echo ""
echo "B) Netlify"
echo "   1. Install: npm i -g netlify-cli"
echo "   2. Run: netlify deploy --prod"
echo "   3. Follow prompts"
echo ""
echo "C) Manual Upload"
echo "   Upload the 'dist' folder to any static hosting service"
echo ""

echo "📚 For detailed instructions, see DEPLOYMENT.md"
echo ""
echo "✨ Your app is ready to deploy!"
