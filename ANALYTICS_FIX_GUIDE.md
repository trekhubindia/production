# Analytics Fix Guide

## Issues Fixed ✅

### 1. **Admin Analytics - Mock Data Replaced**
- ✅ **Fixed**: `getBasicMetrics()` now uses real database queries
- ✅ **Real Data**: Total bookings, revenue, active users, pending approvals
- ✅ **Calculations**: Conversion rate, average booking value from actual data
- ✅ **Trends**: Monthly trends calculated from real booking data
- ✅ **Top Destinations**: Calculated from confirmed bookings

### 2. **Google Analytics Issues**

#### **Problem**: Google Analytics not detecting properly
#### **Solutions**:

**A. Missing Environment Variables**
Add these to your `.env.local` file:

```bash
# Google Analytics Configuration
GOOGLE_ANALYTICS_PROPERTY_ID=your_property_id_here
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}

# Alternative: Use Google Analytics 4 Property ID
GA4_PROPERTY_ID=your_ga4_property_id
```

**B. Get Your Google Analytics Property ID**:
1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property
3. Go to Admin → Property Settings
4. Copy the Property ID (format: `123456789`)

**C. Set up Google Service Account** (for server-side analytics):
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a service account
3. Download the JSON key
4. Add the entire JSON as `GOOGLE_SERVICE_ACCOUNT_KEY` environment variable

## Current Status

### ✅ **Working Now**:
- **Basic Metrics**: Real data from database
- **Booking Analytics**: Actual booking counts and revenue
- **User Analytics**: Real active user counts
- **Monthly Trends**: Calculated from actual data
- **Top Destinations**: Based on confirmed bookings

### ⚠️ **Still Mock Data** (to be fixed):
- Recent Activity (needs real activity log)
- Alerts (needs real alert system)
- Performance Charts (needs real time-series data)
- User Statistics (needs user segmentation)
- Revenue Analytics (needs payment method data)

## Next Steps

### **Immediate Actions**:
1. **Add Environment Variables**: Set up Google Analytics property ID
2. **Test Real Data**: Check admin dashboard for real metrics
3. **Verify GA Tracking**: Use browser dev tools to check GA requests

### **Future Improvements**:
1. Replace remaining mock data functions
2. Add real-time analytics
3. Implement user activity logging
4. Add alert system based on real conditions

## Testing

### **Admin Analytics**:
1. Go to `/admin/analytics`
2. Check if data shows real numbers (not mock data)
3. Verify monthly trends reflect actual booking patterns

### **Google Analytics**:
1. Open browser dev tools → Network tab
2. Visit your website
3. Look for requests to `google-analytics.com` or `googletagmanager.com`
4. Check console for GA initialization messages

### **Debug Mode**:
- GA Debugger component shows in development mode
- Check browser console for GA status messages
- Verify dataLayer is populated

## Environment Variables Template

Add to your `.env.local`:

```bash
# Google Analytics
GOOGLE_ANALYTICS_PROPERTY_ID=123456789
NEXT_PUBLIC_GA_TRACKING_ID=G-582SPBJ9HH

# Google Service Account (for server-side analytics)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

## Verification

After implementing:
1. **Admin Dashboard**: Shows real booking/revenue data
2. **Google Analytics**: Properly tracks page views and events
3. **No Mock Data**: All metrics reflect actual business data
4. **Real-time Updates**: Data updates as new bookings come in
