#!/bin/bash

# TrekHubIndia - GitHub Repository Setup Script
# This script sets up the GitHub repository for the TrekHubIndia project

echo "🚀 Setting up TrekHubIndia GitHub Repository..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
else
    echo "✅ Git repository already initialized"
fi

# Add .gitignore if not present (should already be there)
if [ ! -f ".gitignore" ]; then
    echo "❌ Error: .gitignore file not found. Please ensure .gitignore exists."
    exit 1
fi

# Check for sensitive files that shouldn't be committed
echo "🔍 Checking for sensitive files..."
if [ -f ".env.local" ] || [ -f ".env.local.production" ]; then
    echo "⚠️  Warning: Found .env.local files. These should not be committed!"
    echo "   Please remove them or ensure they're in .gitignore"
    exit 1
fi

# Stage all files (respecting .gitignore)
echo "📦 Staging files for commit..."
git add .

# Check what's being staged
echo "📋 Files to be committed:"
git status --porcelain | head -20
echo "..."
echo "Total files: $(git status --porcelain | wc -l)"

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: TrekHubIndia - Complete trekking website

Features:
- Next.js 15 with TypeScript
- Supabase database with RLS
- Lucia Auth authentication
- Admin approval-based booking system
- AI chatbot with Google Gemini
- Blog system with AI generation
- Email notifications with Resend
- Image management system
- SEO optimization
- Production-ready configuration

Tech Stack:
- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS
- Backend: Supabase, PostgreSQL, Lucia Auth
- AI: Google Gemini API
- Email: Resend API
- Deployment: Vercel-ready with security headers"

# Set main branch
echo "🌿 Setting main branch..."
git branch -M main

# Instructions for adding remote and pushing
echo ""
echo "✅ Repository setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new repository on GitHub named 'trekhubindia'"
echo "2. Copy the repository URL"
echo "3. Run the following commands:"
echo ""
echo "   git remote add origin https://github.com/YOURUSERNAME/trekhubindia.git"
echo "   git push -u origin main"
echo ""
echo "🔧 Alternative: If you want to create the repo via GitHub CLI:"
echo "   gh repo create trekhubindia --public --description 'Complete trekking website with booking system, admin panel, and AI chatbot'"
echo "   git remote add origin https://github.com/YOURUSERNAME/trekhubindia.git"
echo "   git push -u origin main"
echo ""
echo "🌟 Repository will include:"
echo "   - $(find . -type f -not -path './node_modules/*' -not -path './.next/*' -not -path './.git/*' | wc -l) files"
echo "   - Complete source code"
echo "   - Documentation (README.md, DEPLOYMENT.md)"
echo "   - Production configuration"
echo "   - Database migrations"
echo "   - Essential scripts"
echo ""
echo "❌ Excluded from upload:"
echo "   - node_modules/ (dependencies)"
echo "   - .next/ (build cache)"
echo "   - .env.local* (sensitive environment files)"
echo "   - Log files and system files"
echo ""
echo "🚀 Ready for production deployment!"
