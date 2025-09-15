# Overview

Financeito is a personal finance management application built with Next.js and TypeScript. The system uses NextAuth for secure user authentication and integrates with the Pluggy API for Open Finance functionality, allowing users to connect their bank accounts and sync financial transactions. The application features a modern dark-themed UI with glassmorphism effects and data visualization through charts.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: Next.js 14 with TypeScript and App Router
- **Styling**: Tailwind CSS with custom dark theme and glassmorphism effects
- **UI Components**: Custom liquid-style components with backdrop blur effects
- **Navigation**: Fluid circular menu inspired by 21st.dev design replacing traditional sidebar
- **Data Visualization**: Recharts library for financial charts (pie, bar, line charts)
- **Animation**: Framer Motion for smooth transitions and interactions
- **Loading States**: Comprehensive skeleton system for all dashboard components
- **Empty States**: Informative empty states with actionable CTAs for better UX

## Backend Architecture
- **API Layer**: Next.js API routes for RESTful endpoints
- **Database ORM**: Prisma Client for type-safe database operations
- **Authentication**: NextAuth-based session management
- **Security Features**:
  - Data encryption for sensitive information using AES-256-GCM
  - Secure cookie configuration with environment-based flags

## Data Storage
- **Primary Database**: PostgreSQL (configured via Prisma)
- **Schema Design**: User accounts, financial accounts, transactions, and encrypted data storage
- **Data Encryption**: Sensitive data encrypted before database storage
- **Backup System**: Google Drive integration for automated database exports

## Authentication & Authorization
- **Session Management**: NextAuth sessions stored in cookies
- **Cookie Security**: Environment-aware secure flag configuration
- **Route Protection**: Middleware-based authentication checks

## External Dependencies

### Financial Services
- **Pluggy API**: Open Finance integration for bank account connectivity and transaction synchronization
- **Bank Account Linking**: Secure connection to financial institutions
- **Transaction Sync**: Automated import of financial transactions

### Communication Services
- **SMTP Integration**: Nodemailer for email notifications and communications
- **Email Templates**: Basic email functionality for user communications

### Cloud Services
- **Google Drive API**: Automated backup system for database exports
- **Service Account Authentication**: Secure API access for backup operations

### Development & Deployment
- **TrueNAS SCALE**: Target deployment platform with Docker support
- **Cloudflare**: DNS management and SSL termination
- **Environment Configuration**: Comprehensive environment variable management for different deployment stages