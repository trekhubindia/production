# Deployment Guide - Nomadic Travels

This guide covers deploying the Nomadic Travels website to production.

## 🚀 Quick Deploy to Vercel

### 1. Prepare Repository
```bash
# Ensure all changes are committed
git add .
git commit -m "Production ready"
git push origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables (see below)
5. Deploy

### 3. Environment Variables for Vercel

Add these in your Vercel dashboard under Settings > Environment Variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Lucia Auth
LUCIA_SECRET=your_lucia_secret

# App URLs
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app

# Email Configuration
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# AI Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Optional: Stripe (if using payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Optional: Analytics
GOOGLE_ANALYTICS_PROPERTY_ID=your_ga_property_id
GOOGLE_SERVICE_ACCOUNT_KEY=your_service_account_json
```

## 🗄️ Database Setup

### 1. Supabase Production Database
1. Create a new Supabase project for production
2. Run all migrations from `supabase/migrations/`
3. Set up Row Level Security policies
4. Create admin user

### 2. Run Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 3. Create Admin User
```bash
# Run the admin user creation script
node scripts/create-admin-user.js
```

## 🌐 Custom Domain Setup

### 1. Add Domain to Vercel
1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### 2. Update Environment Variables
Update these variables with your custom domain:
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## 📧 Email Configuration

### 1. Resend Setup
1. Create account at [resend.com](https://resend.com)
2. Verify your domain
3. Get API key
4. Update environment variables

### 2. Domain Verification
Add these DNS records to your domain:
- SPF record
- DKIM record
- DMARC record (optional)

## 🤖 AI Setup

### 1. Google AI Studio
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Create API key
3. Add to environment variables

### 2. Configure AI Features
- Chatbot responses
- Blog generation
- Topic suggestions

## 🔒 Security Checklist

### Production Security
- [ ] Environment variables secured
- [ ] Database RLS policies enabled
- [ ] Admin panel access restricted
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting implemented

### Database Security
- [ ] Service role key secured
- [ ] RLS policies tested
- [ ] Backup strategy in place
- [ ] Connection limits configured

## 📊 Monitoring Setup

### 1. Error Tracking
Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Vercel Analytics

### 2. Performance Monitoring
- Core Web Vitals
- Database query performance
- API response times

## 🚀 Alternative Deployment Options

### Netlify
1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables

### Railway
1. Connect GitHub repository
2. Add environment variables
3. Deploy with automatic builds

### DigitalOcean App Platform
1. Create new app from GitHub
2. Configure build settings
3. Add environment variables
4. Deploy

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run lint
```

## 🧪 Pre-deployment Testing

### 1. Local Production Build
```bash
npm run build
npm start
```

### 2. Test Checklist
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] Booking system functional
- [ ] Admin panel accessible
- [ ] Email notifications working
- [ ] AI chatbot responding
- [ ] Database connections stable

## 📝 Post-deployment Tasks

### 1. Verify Deployment
- [ ] Website accessible
- [ ] SSL certificate active
- [ ] All features working
- [ ] Admin panel functional
- [ ] Database connected

### 2. Setup Monitoring
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Uptime monitoring setup
- [ ] Backup verification

### 3. Documentation
- [ ] Update README with production URLs
- [ ] Document any production-specific configurations
- [ ] Share access credentials with team

## 🆘 Troubleshooting

### Common Issues

**Build Failures**
- Check environment variables
- Verify dependencies
- Review build logs

**Database Connection Issues**
- Verify Supabase credentials
- Check RLS policies
- Test service role key

**Email Not Working**
- Verify Resend API key
- Check domain verification
- Test email templates

**AI Features Not Working**
- Verify Google AI API key
- Check API quotas
- Test AI endpoints

### Support
- Check Vercel deployment logs
- Review Supabase logs
- Monitor error tracking tools

---

🎉 **Congratulations!** Your Nomadic Travels website is now live in production!
