# MindNest Frontend

A modern, responsive web application for the MindNest mental health platform. Built with Next.js 15, React 19, TypeScript, and Tailwind CSS, this frontend provides a comprehensive interface for patients, therapists, and administrators to manage mental health services.

## 🚀 Features

- **Multi-Role Support**: Separate interfaces for patients, therapists, and administrators
- **Authentication System**: Secure login/register with JWT token management
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Booking**: Interactive appointment booking system
- **Dashboard Views**: Role-specific dashboards with personalized content
- **Therapist Discovery**: Find and book sessions with mental health professionals
- **Appointment Management**: View, cancel, and manage appointments
- **Profile Management**: User profile and settings management
- **Admin Panel**: Comprehensive admin interface for platform management
- **TypeScript**: Full type safety and better development experience
- **Modern UI Components**: Reusable UI components with Radix UI

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm, yarn, pnpm, or bun package manager
- MindNest backend services running:
  - Auth Service (port 3001)
  - User Service (port 3002)
  - Therapist Service (port 3003)
  - Booking Service (port 3000)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mindnest-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Backend Service URLs
   NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:3001
   NEXT_PUBLIC_USER_SERVICE_URL=http://localhost:3002
   NEXT_PUBLIC_THERAPIST_SERVICE_URL=http://localhost:3003
   NEXT_PUBLIC_BOOKING_SERVICE_URL=http://localhost:3000

   # Optional: Production URLs
   # NEXT_PUBLIC_AUTH_SERVICE_URL=https://auth.mindnest.com
   # NEXT_PUBLIC_USER_SERVICE_URL=https://user.mindnest.com
   # NEXT_PUBLIC_THERAPIST_SERVICE_URL=https://therapist.mindnest.com
   # NEXT_PUBLIC_BOOKING_SERVICE_URL=https://booking.mindnest.com
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Architecture

```
mindnest-frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/              # Authentication pages
│   │   │   ├── login/         # Login page
│   │   │   └── register/      # Registration page
│   │   ├── dashboard/         # Dashboard pages
│   │   │   ├── user/          # Patient dashboard
│   │   │   ├── therapist/     # Therapist dashboard
│   │   │   ├── find-therapists/ # Therapist discovery
│   │   │   ├── appointments/  # Appointment management
│   │   │   ├── profile/       # User profile
│   │   │   └── settings/      # User settings
│   │   ├── admin/             # Admin panel
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/            # Reusable components
│   │   ├── ui/               # Base UI components
│   │   │   ├── button.tsx    # Button component
│   │   │   ├── card.tsx      # Card component
│   │   │   ├── input.tsx     # Input component
│   │   │   ├── select.tsx    # Select component
│   │   │   └── table.tsx     # Table component
│   │   ├── BookingModal.tsx  # Booking modal
│   │   └── Navigation.tsx    # Navigation component
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx   # Authentication context
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   │   ├── api.ts           # API client utilities
│   │   ├── auth.ts          # Authentication utilities
│   │   ├── bookingApi.ts    # Booking service API
│   │   ├── therapistApi.ts  # Therapist service API
│   │   ├── userApi.ts       # User service API
│   │   └── utils.ts         # General utilities
│   └── middleware.ts        # Next.js middleware
├── public/                  # Static assets
├── next.config.ts          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## 🔐 Authentication & Authorization

### User Roles
- **User (Patient)**: Can book sessions, view appointments, manage profile
- **Psychiatrist (Therapist)**: Can manage schedule, view patient bookings, update availability
- **Admin**: Can manage users, therapists, and platform settings

### Authentication Flow
1. User registers/logs in through `/auth` pages
2. JWT tokens are stored in localStorage and cookies
3. Middleware protects routes based on user role
4. AuthContext provides authentication state throughout the app

### Protected Routes
- `/dashboard/*` - Requires authentication
- `/admin/*` - Requires admin role
- `/dashboard/therapist/*` - Requires psychiatrist role
- `/dashboard/user/*` - Requires user role

## 🎨 UI Components

### Base Components
Built with Radix UI primitives and styled with Tailwind CSS:

- **Button**: Various styles and states
- **Card**: Content containers with shadows
- **Input**: Form input fields with validation
- **Select**: Dropdown selection components
- **Table**: Data display tables

### Custom Components
- **BookingModal**: Interactive appointment booking
- **Navigation**: Role-based navigation menu
- **AuthContext**: Authentication state management

## 🔌 API Integration

### Service Architecture
The frontend integrates with multiple microservices:

- **Auth Service** (`/api/auth/*`): Authentication and user management
- **User Service** (`/api/users/*`): User profile and data
- **Therapist Service** (`/api/therapists/*`): Therapist profiles and availability
- **Booking Service** (`/api/bookings/*`): Appointment scheduling

### API Client
Centralized API client with:
- Automatic token management
- Error handling
- Type-safe responses
- Request/response interceptors

## 📱 Pages & Features

### Public Pages
- **Homepage** (`/`): Landing page with features and call-to-action
- **Login** (`/auth/login`): User authentication
- **Register** (`/auth/register`): User registration

### User Dashboard (`/dashboard/user`)
- View upcoming appointments
- Find and book therapists
- Manage profile and settings
- View booking history

### Therapist Dashboard (`/dashboard/therapist`)
- Manage availability schedule
- View patient bookings
- Update profile and specialties
- Handle appointment requests

### Admin Panel (`/admin`)
- User management
- Therapist verification
- Platform analytics
- System settings

## 🎯 Key Features

### Booking System
- Interactive calendar interface
- Real-time availability checking
- Session type selection
- Booking confirmation and reminders

### Therapist Discovery
- Search and filter therapists
- View therapist profiles and specialties
- Read reviews and ratings
- Book sessions directly

### Appointment Management
- View upcoming and past appointments
- Cancel or reschedule bookings
- Session notes and feedback
- Payment integration (future)

### Profile Management
- Update personal information
- Manage preferences
- View booking history
- Security settings

## 🛡️ Security Features

### Client-Side Security
- JWT token management
- Secure token storage
- Automatic token refresh
- Role-based access control

### Data Protection
- HTTPS enforcement
- Secure API communication
- Input validation
- XSS protection

## 🚀 Development

### Available Scripts
```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Code Quality
- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Next.js**: Built-in optimizations
- **Tailwind CSS**: Utility-first styling


## 📊 Performance

### Optimizations
- **Next.js 15**: Latest performance features
- **React 19**: Concurrent features and improvements
- **Image Optimization**: Automatic image optimization
- **Code Splitting**: Automatic route-based splitting
- **Static Generation**: Pre-rendered pages where possible

### Monitoring
- Built-in Next.js analytics
- Performance monitoring
- Error tracking
- User analytics

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Other Platforms
- **Netlify**: Static site deployment
- **AWS Amplify**: Full-stack deployment
- **Docker**: Containerized deployment

### Environment Variables
Set the following in your deployment platform:
- `NEXT_PUBLIC_AUTH_SERVICE_URL`
- `NEXT_PUBLIC_USER_SERVICE_URL`
- `NEXT_PUBLIC_THERAPIST_SERVICE_URL`
- `NEXT_PUBLIC_BOOKING_SERVICE_URL`

## 🔧 Configuration

### Next.js Config
```typescript
// next.config.ts
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};
```

### Tailwind CSS
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```



## 🔄 Version History

- **v0.1.0**: Initial release
  - Multi-role authentication system
  - Dashboard interfaces for all user types
  - Booking and appointment management
  - Therapist discovery and booking
  - Admin panel for platform management
  - Responsive design with Tailwind CSS
  - TypeScript integration
  - Next.js 15 with App Router
