# Rate Monitor Pro - MVP Development Documentation

## Project Overview
Rate Monitor Pro is a comprehensive mortgage rate monitoring and CRM platform designed specifically for mortgage brokers. The application provides real-time rate tracking, automated client notifications, and complete pipeline management.

## Tech Stack
- **Frontend**: React 18 + Vite + TypeScript
- **UI Framework**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe (with webhooks)
- **Edge Functions**: Supabase Edge Functions (Deno)
- **Rate Data Source**: Python scraper → Mortgage News Daily
- **Email**: Resend (planned)
- **Deployment**: Netlify (planned)

## Current Architecture

### Database Schema
**Core Tables:**
- `profiles` - User profile information
- `clients` - Client management with target rates
- `client_notes` - Client interaction history
- `rate_history` - Historical mortgage rate data
- `notifications` - User notifications
- `notification_prefs` - User notification preferences

**Billing Tables:**
- `stripe_customers` - Links users to Stripe customers
- `stripe_subscriptions` - Subscription management
- `billing_history` - Payment history tracking

### Edge Functions
**Active Functions:**
- `stripe-checkout` - Creates Stripe checkout sessions
- `stripe-webhook` - Handles Stripe webhook events
- `stripe-portal` - Creates customer portal sessions
- `rate-webhook` - Receives rate data from Python scraper

### User Authentication Flow
1. User signs up with email/password
2. Email verification required
3. Auto-redirect to onboarding billing page
4. Profile auto-created via database trigger
5. 14-day trial subscription auto-created

### Billing & Subscription System
**Trial System:**
- 14-day free trial (no credit card required)
- Trial auto-created in `useSubscription` hook
- Users can upgrade anytime during trial

**Payment Flow:**
- Stripe checkout integration
- Webhook processes payment events
- Subscription status updates from "trialing" to "active"
- Customer portal handles cancellations/modifications

**Pricing:**
- $49.99/month subscription
- 14-day free trial
- Cancel anytime (active until period end)

## Phase 1 Completed Features ✅

### 1. Foundation Setup
- [x] Supabase project configuration
- [x] Environment variables setup
- [x] Database migrations deployed
- [x] RLS policies implemented
- [x] Local development environment

### 2. Authentication System
- [x] User signup/login with email verification
- [x] Password security (using refs, not state)
- [x] Profile auto-creation trigger
- [x] Auth context and routing protection
- [x] Theme system (light/dark mode)

### 3. Billing Integration
- [x] Stripe checkout sessions
- [x] Webhook signature verification
- [x] Subscription status management
- [x] Trial-to-paid conversion
- [x] Customer portal for cancellations
- [x] Billing history tracking

### 4. Core Infrastructure
- [x] Database schema with all required tables
- [x] Row Level Security policies
- [x] Edge Functions for Stripe integration
- [x] Error handling and logging
- [x] CORS configuration

## Current User Flows

### New User Journey
1. **Landing Page** → Click "Get Started"
2. **Signup Modal** → Enter details, submit
3. **Email Verification** → Check email, click link
4. **Auth Callback** → Verifies email, creates profile
5. **Onboarding Billing** → Shows trial info, optional early upgrade
6. **Dashboard Access** → Full feature access during trial

### Existing User Journey
1. **Login** → Authenticate
2. **Dashboard** → Main application interface
3. **Billing Management** → View subscription, cancel via portal

### Subscription Management
- **Trial Users**: Full access, countdown shown, upgrade prompts
- **Paid Users**: Full access, billing history, portal access
- **Expired Users**: Limited access, forced upgrade flow

## Key Configuration

### Environment Variables
```
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Stripe Configuration
- **Product**: Rate Monitor Pro
- **Price ID**: `price_1SBN3EEsyVlivUjUSmGaeyvt` (test)
- **Webhook Events**: 
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `invoice.payment_succeeded`

## Phase 2 Planning 🚧

### 2.1 CRM Functionality Enhancement
**Immediate Goals:**
- [ ] Redesign AddClientModal UX/UI
- [ ] Test add/edit client workflows
- [ ] Verify client notes system
- [ ] Test search and filtering
- [ ] Pipeline stage management

### 2.2 Real Rate Data Integration
**Goals:**
- [ ] Python scraper for Mortgage News Daily
- [ ] Rate webhook endpoint testing
- [ ] Historical rate data population
- [ ] Rate chart display improvements

### 2.3 Rate Alerts System
**Goals:**
- [ ] Resend email integration
- [ ] Rate monitoring logic
- [ ] Email template creation
- [ ] Alert triggering system

## Development Guidelines

### Code Organization
- Components organized by feature (`/components/CRM/`, `/components/Auth/`)
- Hooks in `/hooks/` directory
- Utilities in `/lib/` directory
- Edge Functions in `/supabase/functions/`

### Database Patterns
- All tables use UUID primary keys
- Timestamps with `created_at`/`updated_at`
- Soft deletes with `deleted_at`
- RLS policies for user data isolation

### Security Considerations
- All sensitive data uses RLS policies
- Webhook signature verification required
- Password fields use refs (not state)
- Environment variables for all secrets

## Known Issues & Technical Debt
- [ ] Client schema has both `broker_id` and `user_id` (migration cleaned up)
- [ ] Some unused legacy Edge Functions (cleaned up)
- [ ] Rate data currently uses mock data
- [ ] Email notifications not yet implemented

## Success Metrics for MVP
- [ ] 10+ beta users signed up
- [ ] 5+ users complete onboarding
- [ ] 3+ users add clients to CRM
- [ ] 1+ user subscribes to paid plan
- [ ] Rate data updates regularly
- [ ] Zero critical bugs reported

---

**Last Updated**: September 26, 2025
**Phase**: 2.1 - CRM Enhancement
**Next Milestone**: Improved AddClientModal UX

# Rate Monitor Pro MVP

A comprehensive rate monitoring and CRM platform for mortgage loan officers to track rates and manage client relationships.

## 🚀 Project Status

### ✅ Phase 1 Complete - Authentication & Billing
- Full authentication system (signup, login, email verification)
- Complete Stripe billing integration with webhooks
- 14-day trial system that auto-creates for new users
- Subscription management with Stripe Customer Portal
- Clean database schema with all required tables
- All Supabase Edge Functions working

### ✅ Phase 2 Complete - CRM Foundation
- **Improved AddClientModal**: 3-step wizard with validation
  - Step 1: Basic client info (name, email, phone)
  - Step 2: Loan details (amount, rate, credit score, type)
  - Step 3: Notes and summary
  - Real-time form validation (email format, phone digits, credit score ranges)
  - Proper input backgrounds and visual feedback

- **Enhanced ClientDetailsModal**: Full note management
  - Add/delete client notes with timestamps
  - Different note types (general, stage_change, call, email, meeting)
  - Fixed input isolation (no more cloning between cards)
  - Proper confirmation dialogs

- **Client Management**: Complete CRUD operations
  - Delete clients with confirmation
  - Updated ClientCard with glassmorphism effects
  - Better visual hierarchy and premium UI
  - Proper error handling and user feedback

- **Database Improvements**:
  - Created `client_notes` table with RLS policies
  - Soft delete support for clients
  - Proper foreign key relationships and cascading

### 🎯 Phase 3 Goal - Two-Section CRM Pipeline
- **Rate Monitor Section**: Closed deals for refi tracking
- **Active Pipeline Section**: Drag-and-drop kanban board
- Volume tracking and analytics dashboard
- Smart automations and rate alerts

## 🛠 Tech Stack
- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS with glassmorphism effects
- **Backend**: Supabase (auth, database, edge functions)
- **Payments**: Stripe (billing, webhooks, customer portal)
- **Rate Data**: Python scraping from Mortgage News Daily

## 🔧 Current User Flow
1. **Signup** → Email verification → Onboarding billing page
2. **14-day trial** starts automatically → User explores features
3. **Subscribe anytime** → Stripe checkout → Active subscription
4. **CRM Management**: Add clients, manage notes, track pipeline
5. **Cancel through** Stripe portal (remains active until period end)

## 📁 Key Files Structure
```
src/
├── components/
│   ├── CRM/
│   │   ├── AddClientModal.tsx (3-step wizard)
│   │   ├── ClientCard.tsx (glassmorphism effects)
│   │   ├── ClientDetailsModal.tsx (note management)
│   │   └── EditClientModal.tsx
│   └── ui/ (reusable components)
├── pages/
│   └── CRM.tsx (main CRM page)
├── utils/
│   └── clientUtils.ts (delete operations)
└── lib/
    └── supabase.ts (database client)
```

## 🗄️ Database Schema
- `users` - User accounts and profiles
- `subscriptions` - Stripe billing data
- `clients` - Client information and loan details
- `client_notes` - Timestamped notes and activity logs
- `rate_data` - Historical rate information (planned)

## 🔜 Next Steps
1. Build two-section CRM layout (Rate Monitor + Active Pipeline)
2. Implement drag-and-drop functionality for pipeline stages
3. Add volume tracking and analytics
4. Create rate monitoring alerts system
5. Polish UI with premium glassmorphism effects

## 🚧 Known Issues
- Rate monitoring backend not yet implemented
- Need drag-and-drop library integration
- Volume tracking dashboard pending

## 💡 Key Features Working
- ✅ User authentication and billing
- ✅ Client CRUD operations
- ✅ Note management with timestamps
- ✅ Form validation and error handling
- ✅ Glassmorphism UI effects
- ✅ Dark mode support
- ✅ Responsive design

---

**Last Updated**: Phase 2 Complete - CRM Foundation Ready
**Next Milestone**: Two-Section Pipeline Structure

# Mortgage CRM Platform

A comprehensive customer relationship management system designed specifically for mortgage brokers, featuring active pipeline management and rate monitoring for refinancing opportunities.

## Phase 2 Complete: MVP CRM System ✅

### Key Features

#### 🎯 Two-Section Pipeline Management
- **Active Pipeline**: Drag-and-drop kanban board (Prospect → Qualified → Application → Processing → Closing)
- **Rate Monitor**: Closed mortgage tracking with refinancing opportunity analysis
- Real-time stage transitions with automatic database sync
- Smart closing flow that creates mortgage records automatically

#### 💎 Premium User Experience
- Glassmorphism UI with dark theme and gradient accents
- Multi-step forms with real-time validation
- Professional $1000/mo software feel with smooth animations
- Responsive design for desktop and mobile

#### 📊 Comprehensive Loan Tracking
- **14 Loan Types**: Conventional, FHA, VA, USDA, Jumbo, Bank Statement, Asset-Based, Non-QM, DSCR, Hard Money, Construction, Land, Reverse, Custom
- **9 Loan Terms**: 10yr, 15yr, 20yr, 25yr, 30yr, 40yr, Interest Only, ARM, Custom
- Combined storage format for flexible loan product tracking
- Proper mortgage payment calculations using amortization formula

#### 🔄 Advanced Client Management
- New vs Past client workflows (Pipeline vs Rate Monitor)
- Complete CRUD operations for clients and mortgages
- Notes system with activity tracking and deletion capability
- Stage change logging with client communication history

#### 💰 Financial Intelligence
- Accurate P&I payment calculations with proper disclaimers
- Dynamic refi opportunity assessment (Excellent/Good/Monitor/Low Priority)
- Monthly and annual savings projections
- Live savings preview in editing interfaces

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom glassmorphism components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Deployment**: [Your deployment platform]

## Database Schema

### Core Tables
- `clients` - Active pipeline client management
- `mortgages` - Closed loan tracking for rate monitoring
- `client_notes` - Activity logging and communication history
- `profiles` - User account management

### Key Relationships
- One-to-many: clients → client_notes
- One-to-one: clients → mortgages (for closed loans)
- User isolation via `user_id` foreign keys

## Project Structure

```
src/
├── components/
│   ├── CRM/
│   │   ├── AddClientModal.tsx          # New/Past client forms
│   │   ├── EditClientModal.tsx         # Multi-step client editing
│   │   ├── EditMortgageModal.tsx       # Mortgage details editing
│   │   ├── MortgageDetailsModal.tsx    # Rate monitor details
│   │   ├── ClosingModal.tsx           # Loan closing workflow
│   │   ├── PipelineStats.tsx          # Dashboard statistics
│   │   ├── ActivePipelineSection.tsx  # Kanban pipeline
│   │   ├── RateMonitorSection.tsx     # Closed loan monitoring
│   │   ├── StageColumn.tsx            # Drag-drop columns
│   │   ├── PipelineClientCard.tsx     # Active client cards
│   │   └── RateMonitorCard.tsx        # Closed loan cards
│   └── ui/
│       ├── Button.tsx                 # Premium button components
│       ├── Input.tsx                  # Form input components
│       ├── Select.tsx                 # Dropdown components
│       ├── Modal.tsx                  # Modal wrapper
│       └── Card.tsx                   # Card containers
├── pages/
│   └── CRM.tsx                        # Main CRM dashboard
├── contexts/
│   └── AuthContext.tsx               # Authentication state
├── utils/
│   └── clientUtils.ts                # Client management utilities
└── lib/
    └── supabase.ts                   # Database client & types
```

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Environment variables configured

### Installation

1. Clone the repository
```bash
git clone [repository-url]
cd mortgage-crm
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
# Add your Supabase URL and anon key
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Features in Detail

### Active Pipeline Management
- **Drag & Drop**: Smooth card movement between stages
- **Real-time Updates**: Instant database synchronization
- **Stage Validation**: Smart validation before stage transitions
- **Visual Feedback**: Glassmorphism effects during interactions

### Rate Monitor System
- **Closed Loan Tracking**: Complete mortgage details storage
- **Refi Analysis**: Automatic opportunity identification
- **Savings Calculations**: Accurate P&I comparisons with market rates
- **Client Communication**: Integrated contact and notes management

### Form System
- **Multi-step Workflows**: Progressive disclosure for complex forms
- **Real-time Validation**: Immediate feedback on user input
- **Conditional Fields**: Dynamic form fields based on selections
- **Auto-save**: Change detection and unsaved work warnings

## Phase 3 Roadmap: Rate Scraping & Automation

### Planned Features
- **Automated Rate Scraping**: Daily collection from major lenders
- **Smart Notifications**: Refi opportunity alerts and rate drop notifications
- **Advanced Analytics**: Pipeline conversion tracking and ROI analysis
- **Email/SMS Automation**: Automated client communication workflows
- **Rate History Tracking**: Historical rate data for trend analysis

### Technical Goals
- Rate scraping engine with error handling and retry logic
- Notification system with configurable triggers
- Enhanced dashboard with analytics and reporting
- API integrations for rate data sources

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the established patterns
3. Test thoroughly in local environment
4. Submit a pull request with detailed description

## License

[Your license choice]

## Support

For technical issues or feature requests, please [contact information or issue tracker].

---

**Current Status**: Phase 2 MVP Complete - Production Ready
**Next Phase**: Rate Scraping & Automation Engine

# Mortgage Broker CRM & Rate Monitoring System

A comprehensive CRM solution for mortgage brokers with automated rate monitoring, client pipeline management, and real-time refinancing opportunity detection.

## 🎯 Current Status: Pre-MVP Development

### ✅ Completed Features

**Core CRM Functionality:**
- Client pipeline management with stage tracking
- Mortgage record management and closing workflow
- Client notes and activity logging
- Contact management with communication tracking

**Live Rate Monitoring:**
- Automated daily rate scraping from Mortgage News Daily
- Support for 6 loan types: 30yr/15yr conventional, FHA, VA, jumbo, ARM
- Loan-type specific market comparisons (FHA vs FHA, VA vs VA, etc.)
- Real-time opportunity calculations using proper amortization formulas
- Visual progress bars showing client proximity to target rates

**Rate Infrastructure:**
- Supabase Edge Function for rate scraping (Deno/TypeScript)
- GitHub Actions automation (weekdays 4 PM EST)
- Historical rate storage with trend tracking
- Dynamic market rate integration replacing hardcoded values

### 🚧 In Development (MVP Completion)

**Remaining Core Features:**
1. **Historical rate charts** - Trend visualization for each loan type
2. **Rate alerts system** - Automated client target monitoring
3. **Resend email integration** - Professional notification infrastructure
4. **Client notifications** - Welcome, auth, and opportunity alerts
5. **Trend analysis dashboard** - Market direction indicators

**Code Quality Phase:**
- Refactor 600+ line files into smaller components
- Remove debug logs and optimize structure
- Final testing and MVP validation

## 🏗️ Technical Architecture

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Supabase client for data management
- Lucide React for icons

**Backend:**
- Supabase PostgreSQL database
- Edge Functions for rate scraping
- Row Level Security (RLS) for data protection
- Real-time subscriptions for live updates

**Rate Scraping:**
- Deno-based Edge Function
- Mortgage News Daily integration
- 6 loan types with daily updates
- Error handling and retry logic

**Automation:**
- GitHub Actions for scheduled execution
- Secure API key management
- Automated error monitoring and reporting

## 📊 Database Schema

**Core Tables:**
- `clients` - Client information and pipeline stages
- `mortgages` - Closed loan records for rate monitoring  
- `rate_history` - Historical market rates by loan type
- `client_notes` - Communication logs and activity tracking

**Rate Data Structure:**
```sql
rate_history (
  id, rate_date, rate_type, rate_value, 
  term_years, loan_type, created_at
)
```

**Supported Loan Types:**
- `conventional` (30yr: 6.38%, 15yr: 5.90%)
- `fha` (30yr: 6.09%)
- `va` (30yr: 6.10%) 
- `jumbo` (30yr: 6.29%)
- `arm` (7/6 SOFR: 5.82%)

## 🔄 Rate Monitoring Workflow

1. **Daily Scraping:** GitHub Actions triggers rate fetch weekdays at 4 PM EST
2. **Data Storage:** Latest rates stored in `rate_history` table
3. **Opportunity Detection:** System compares client rates to current market
4. **Visual Indicators:** Progress bars show target rate proximity
5. **Savings Calculations:** Real-time P&I payment comparisons

## 💡 Key Business Features

**Intelligent Opportunity Scoring:**
- Loan-type specific comparisons (no more generic rates)
- Monthly savings calculations with proper amortization
- Opportunity levels: Excellent (>$300/mo), Good (>$150/mo), Monitor (>$50/mo)
- Visual progress tracking toward client targets

**Pipeline Management:**
- Stage tracking: prospect → qualified → application → closed
- Automated note generation for stage changes
- Client deletion with cascade protection
- Comprehensive contact management

**Rate Monitoring:**
- Real-time market rate display
- Historical trend tracking (building over time)
- Client-specific target monitoring
- Refinancing opportunity alerts (coming soon)

## 🚀 Deployment

**Edge Function Deployment:**
```bash
supabase functions deploy rate-fetch
```

**GitHub Actions Setup:**
- Repository secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Workflow file: `.github/workflows/daily-rates.yml`
- Automated execution Monday-Friday

**Environment Variables:**
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📈 Post-MVP Roadmap

**Advanced Features:**
- AI chatbot for client communication
- AI voice calling for automated outreach
- Advanced analytics and reporting
- Multi-lender rate comparisons
- Mobile application

**Integrations:**
- CRM system integrations
- Marketing automation
- Document management
- E-signature workflows

## 🛠️ Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Deploy edge functions
supabase functions deploy

# Run rate scraper manually
curl -H "Authorization: Bearer YOUR_KEY" YOUR_FUNCTION_URL
```

## 📋 Current MVP Completion Status

- [x] Core CRM functionality
- [x] Live rate scraping infrastructure  
- [x] Loan-type specific calculations
- [x] Visual progress indicators
- [ ] Historical rate charts
- [ ] Rate alerts system
- [ ] Email notification infrastructure
- [ ] Code refactoring and optimization

**Target MVP Completion:** Next development phase focusing on historical charts, alerts, and notifications before final code audit and launch preparation.

# Rate Monitor Pro - Premium Mortgage Broker CRM

A premium glassmorphism-designed mortgage broker CRM with real-time rate monitoring, historical analytics, and intelligent client management. Built with Vite + React + TypeScript + Supabase.

## 🚀 Features Completed

### ✅ Historical Rate Data Integration
- **3,996+ historical records** imported from FRED (Federal Reserve Economic Data)
- **5 years of data** (September 2020 - September 2025) covering:
  - 30yr Conventional (261 weekly records from Freddie Mac)
  - 30yr VA (1,245 daily records from Optimal Blue)
  - 30yr FHA (1,245 daily records from Optimal Blue)  
  - 30yr Jumbo (1,245 daily records from Optimal Blue)
  - 15yr Conventional (261 weekly records from Freddie Mac)

### ✅ Premium Historical Rate Chart
- **Interactive toggles** for each loan type with emoji icons
- **Time range selection** (30D, 90D, 1Y, 5Y views)
- **Real-time data integration** from Supabase database
- **Professional tooltips** with precise rate data
- **Glassmorphism design** for premium SaaS appearance
- **Responsive layout** works on all screen sizes

### ✅ Database Architecture
- **Optimized schema** with proper column mapping:
  - `rate_value` (numeric) - The actual rate percentage
  - `rate_date` (date) - Date of the rate
  - `loan_type` (varchar) - Type of loan (conventional, va, fha, jumbo, 15yr_conventional)
  - `term_years` (integer) - Loan term (15 or 30 years)
  - `rate_type` (text) - Type of rate (market, promotional, etc.)

### ✅ Data Import System
- **Automated CSV import script** (`src/scripts/rate_import_script.ts`)
- **FRED data parsing** with support for multiple CSV formats
- **Bulk insert optimization** with chunked processing
- **Environment variable configuration** for different setups

### ✅ Real-Time Rate Integration
- **Live rate fetching** from existing rate monitoring system
- **Current rate cards** with trend indicators
- **Rate comparison tables** with client matching counts
- **Development tools** for testing and debugging

## 🔧 Current Development Status

### 🐛 Known Issues
1. **Conventional line visibility** - Data loads correctly (52 points confirmed) but line not visible on chart
2. **Rate accuracy variance** - Small discrepancy between our data (6.30%) and MND source (6.38%)

### 🚧 In Progress
- **Premium glassmorphism UI** implementation
- **Real alert system** (currently uses mock alerts)
- **Dynamic client matching** (currently shows random counts)

## 🛠 Technology Stack

- **Frontend**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS with glassmorphism design
- **Charts**: Recharts library for interactive visualizations
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Icons**: Lucide React
- **Environment**: Node.js with TypeScript execution via tsx

## 📁 Project Structure

```
src/
├── components/
│   ├── CRM/                     # CRM-specific components
│   │   ├── RateMonitorCard.tsx  # Rate cards for CRM tab
│   │   └── TargetProgressBar.tsx
│   ├── RateMonitor/             # Rate Monitor tab components
│   │   └── HistoricalRateChart.tsx  # Premium historical chart
│   ├── Dashboard/               # Dashboard components
│   └── ui/                      # Reusable UI components
├── lib/
│   ├── supabase.ts             # Supabase client configuration
│   └── rateService.ts          # Rate data management
├── pages/
│   ├── Dashboard.tsx           # Main dashboard
│   ├── RateMonitor.tsx         # Rate monitoring page
│   └── CRM.tsx                 # Client management
├── scripts/
│   └── rate_import_script.ts   # Historical data import utility
└── data/                       # CSV files for import
    ├── MORTGAGE30US.csv        # 30yr Conventional (Freddie Mac)
    ├── OBMMIVA30YF.csv         # 30yr VA (Optimal Blue)
    ├── OBMMIFHA30YF.csv        # 30yr FHA (Optimal Blue)
    └── OBMMIJUMBO30YF.csv      # 30yr Jumbo (Optimal Blue)
```

## 🗃 Database Schema

### rate_history Table
```sql
CREATE TABLE rate_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rate_value NUMERIC NOT NULL,
  rate_date DATE NOT NULL,
  loan_type VARCHAR NOT NULL,
  term_years INTEGER,
  rate_type TEXT DEFAULT 'market',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- Supabase project with database
- Environment variables configured

### Environment Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Installation
```bash
npm install
npm install recharts dotenv tsx  # Additional dependencies
```

### Import Historical Data
```bash
# Place CSV files in /data folder
npx tsx src/scripts/rate_import_script.ts
```

### Development
```bash
npm run dev
```

## 📊 Data Sources

- **Freddie Mac PMMS** - Weekly 30yr and 15yr conventional rates
- **Optimal Blue** - Daily VA, FHA, and Jumbo rates via FRED
- **FRED (Federal Reserve Economic Data)** - All historical data sourced from St. Louis Fed

## 🎯 Next Development Phase

### Immediate Priorities
1. **Fix conventional line chart visibility**
2. **Resolve rate accuracy discrepancies**
3. **Implement real alert system based on client data**
4. **Add dynamic client matching calculations**

### Upcoming Features
1. **Complete glassmorphism UI transformation**
2. **Real-time rate change calculations (24h/7d)**
3. **Market volatility analysis from historical data**
4. **Email/SMS notification system**
5. **Advanced trend analysis and predictions**

## 🏆 Goals

Transform from a basic rate monitoring tool into a **premium $1000/month SaaS experience** with:
- Professional glassmorphism design throughout
- Real-time, accurate data (no mock data)
- Intelligent automation and insights
- Advanced analytics and forecasting

---

**Status**: MVP in active development | **Target**: Premium SaaS transformation | **Data**: 3,996+ historical records loaded