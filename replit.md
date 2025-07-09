# SEVA - Ambulance Aggregator & Emergency Assistance Platform

## Overview

SEVA is a comprehensive emergency assistance platform designed for India, providing ambulance aggregation, real-time tracking, first aid guidance, and hospital finder services. The application uses a modern full-stack architecture with React frontend, Express backend, and Firebase for real-time features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with custom styling
- **Styling**: TailwindCSS with custom CSS variables for theming
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Maps**: Leaflet.js with OpenStreetMap tiles (replacing Google Maps)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Real-time Features**: Firebase Realtime Database for live tracking
- **Session Management**: PostgreSQL-based sessions with connect-pg-simple
- **Build System**: ESBuild for server compilation

### Authentication Strategy
- **Firebase Authentication**: Used exclusively for driver login
- **No Patient Authentication**: Patients can request ambulances without registration
- **Session-based**: Server uses PostgreSQL sessions for internal state

## Key Components

### Database Schema
The application uses a hybrid approach with PostgreSQL for persistent data and Firebase for real-time features:

**PostgreSQL Tables (Drizzle ORM)**:
- `ambulances`: Driver information, location, status, and contact details
- `requests`: Patient requests with emergency details and location
- `hospitals`: Hospital directory with specialties and ratings

**Firebase Realtime Database**:
- Real-time ambulance location tracking
- Live request status updates
- Driver availability status

### Core Pages
1. **Home Page**: Landing page with emergency numbers and service navigation
2. **Find Ambulance**: Location-based ambulance discovery with real-time tracking
3. **Track Ambulance**: Live tracking of assigned ambulance with ETA
4. **First Aid**: AI-powered first aid guidance using Google Gemini
5. **Hospitals**: Hospital finder with specialty filtering
6. **Driver Dashboard**: Driver-only interface for managing requests and location

### External Integrations
- **Google Gemini AI**: Powers the first aid assistance chat
- **Firebase**: Authentication and real-time database
- **Leaflet + OpenStreetMap**: Map visualization and location services
- **Geolocation API**: Browser-based location detection

## Data Flow

### Patient Request Flow
1. Patient accesses home page (no login required)
2. Clicks "Request Ambulance" → Opens modal for details
3. Provides name, phone, and emergency description
4. System captures geolocation automatically
5. Request stored in PostgreSQL and Firebase simultaneously
6. Available drivers notified via Firebase real-time updates

### Driver Workflow
1. Driver logs in via Firebase Authentication
2. System tracks driver location in real-time via Firebase
3. Driver receives request notifications
4. Driver can accept requests, updating status in both databases
5. Live location sharing continues until request completion

### Real-time Tracking
- Patient location captured during request
- Driver location updated continuously via Firebase
- Both locations displayed on Leaflet map
- ETA calculated based on current positions

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **firebase**: Authentication and real-time database
- **drizzle-orm**: Type-safe SQL query builder
- **leaflet**: Map library for location visualization
- **@google/genai**: Google Gemini AI integration
- **@tanstack/react-query**: Server state management

### UI Dependencies
- **@radix-ui/react-***: Accessible UI components
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **wouter**: Lightweight React router

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with HMR
- **Database**: Neon Database (serverless PostgreSQL)
- **Environment Variables**: Firebase config and database URL

### Production Build
- **Frontend**: Vite builds static assets to `dist/public`
- **Backend**: ESBuild compiles server to `dist/index.js`
- **Database Migrations**: Drizzle Kit handles schema changes
- **Static Assets**: Served by Express in production

### Environment Configuration
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `VITE_FIREBASE_API_KEY`: Firebase project API key
- `VITE_FIREBASE_PROJECT_ID`: Firebase project identifier
- `VITE_FIREBASE_APP_ID`: Firebase app identifier
- `VITE_GEMINI_API_KEY`: Google Gemini API key

### Key Design Decisions

1. **Hybrid Database Approach**: PostgreSQL for persistent data, Firebase for real-time features
   - **Rationale**: Combines SQL reliability with real-time capabilities
   - **Trade-off**: Increased complexity but better performance for live tracking

2. **No Patient Authentication**: Reduces friction during emergencies
   - **Rationale**: Emergency situations require immediate access
   - **Trade-off**: Less user tracking but faster response times

3. **Leaflet over Google Maps**: Open-source mapping solution
   - **Rationale**: Cost-effective and customizable
   - **Trade-off**: Less feature-rich but sufficient for tracking needs

4. **AI-Powered First Aid**: Google Gemini for emergency guidance
   - **Rationale**: Provides immediate medical assistance
   - **Trade-off**: Requires API costs but adds significant value

5. **TypeScript Throughout**: End-to-end type safety
   - **Rationale**: Reduces runtime errors and improves maintainability
   - **Trade-off**: Initial setup complexity but long-term benefits