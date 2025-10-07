# Nomadic Travels - Trekking Website

A comprehensive Next.js 15 trekking website with booking system, admin panel, and AI chatbot integration.

## 🚀 Features

- **Trek Management**: Complete trek catalog with detailed information
- **Booking System**: Admin approval-based booking workflow
- **User Authentication**: Lucia Auth with session management
- **Admin Panel**: Comprehensive dashboard for managing treks, bookings, and users
- **AI Chatbot**: Google Gemini AI integration for customer support
- **Blog System**: AI-powered blog generation with subscription management
- **Email Notifications**: Automated email system using Resend
- **Image Management**: Integrated image upload and gallery system
- **SEO Optimized**: Next.js SEO with structured data and sitemap

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Lucia Auth
- **Email**: Resend API
- **AI**: Google Gemini AI
- **Animations**: Framer Motion
- **UI Components**: Radix UI, Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Resend account (for emails)
- Google AI Studio account (for chatbot)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nomadic-travels.git
   cd nomadic-travels
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your environment variables in `.env.local`

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the migrations in `supabase/migrations/`
   - Update your environment variables with Supabase credentials

5. **Run the development server**
   ```bash
   npm run dev
   ```

## 🌐 Environment Variables

### Required Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `LUCIA_SECRET` | Secret key for Lucia Auth |
| `NEXT_PUBLIC_APP_URL` | Your application URL |
| `RESEND_API_KEY` | Resend API key for emails |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini AI API key |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (if using payments) |
| `GOOGLE_ANALYTICS_PROPERTY_ID` | Google Analytics property ID |
| `NEXT_PUBLIC_OPENROUTESERVICE_API_KEY` | OpenRouteService API key for maps |

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Heroku
- DigitalOcean App Platform

## 📁 Project Structure

```
├── src/
│   ├── app/                 # Next.js 13+ app directory
│   ├── components/          # React components
│   ├── lib/                 # Utility functions and configurations
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
├── supabase/
│   └── migrations/          # Database migrations
├── scripts/                 # Utility scripts
└── data/                    # Static data files
```

## 🗃️ Database Schema

The application uses Supabase with the following main tables:
- `treks` - Trek information
- `trek_slots` - Available booking slots
- `bookings` - User bookings
- `auth_user` - User authentication (Lucia Auth)
- `blogs` - Blog posts
- `blog_subscribers` - Newsletter subscribers

## 👨‍💼 Admin Panel

Access the admin panel at `/admin` with admin credentials.

**Default Admin Account:**
- Email: `admin@nomadictravels.shop`
- Password: `Admin@123`

**Admin Features:**
- Trek management
- Booking management
- User management
- Blog management
- Analytics dashboard

## 🤖 AI Features

### Chatbot
- Google Gemini AI integration
- Context-aware responses
- Trek-specific information

### Blog Generation
- AI-powered content creation
- Topic suggestions
- Automatic formatting and TOC generation

## 📧 Email System

The application uses Resend for transactional emails:
- Booking confirmations
- Admin notifications
- Newsletter subscriptions
- Password reset emails

## 🔒 Security Features

- Row Level Security (RLS) on database
- Lucia Auth for session management
- Input validation and sanitization
- CSRF protection
- Rate limiting

## 🧪 Testing

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact: support@nomadictravels.shop

## 🔄 Version History

- **v1.0.0** - Initial release with core features
  - Trek management system
  - Booking workflow
  - Admin panel
  - AI chatbot integration
  - Blog system

---

Made with ❤️ by Nomadic Travels Team
