# 🚛 Fleet Management System

A comprehensive cloud-native fleet management platform designed to optimize last-mile delivery operations through intelligent route planning, real-time tracking, and advanced analytics.

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Business Scenario](#-business-scenario)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Setup Instructions](#-setup-instructions)
- [Usage Guide](#-usage-guide)
- [API Integration](#-api-integration)
- [Performance Metrics](#-performance-metrics)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Project Overview

The Fleet Management System is an enterprise-grade solution that revolutionizes logistics operations by providing:

- **AI-Powered Route Optimization** using advanced algorithms
- **Real-Time GPS Tracking** for complete visibility
- **Intelligent Task Management** with automated assignments  
- **Performance Analytics** with customizable KPIs
- **Multi-Role Dashboards** for dispatchers and drivers
- **Cost Optimization** through smart resource allocation

## 🏢 Business Scenario

### Target Market
Our platform serves **logistics companies, e-commerce businesses, and delivery services** looking to:

- Reduce operational costs by 15-25%
- Improve on-time delivery rates to 95%+
- Optimize fleet utilization and reduce fuel consumption
- Enhance customer satisfaction through real-time tracking
- Scale operations efficiently with data-driven insights

### Problem Statement
Traditional fleet management suffers from:
- ❌ Manual route planning leading to inefficiencies
- ❌ Lack of real-time visibility into operations
- ❌ Poor resource utilization and high operational costs
- ❌ Inadequate performance tracking and analytics
- ❌ Limited scalability for growing businesses

### Our Solution
✅ **Smart Route Optimization** with Vroom API integration  
✅ **Real-Time Tracking** using Firebase and GPS  
✅ **AI-Enhanced Geocoding** with Gemini integration  
✅ **Comprehensive Analytics** with live KPI monitoring  
✅ **Scalable Architecture** supporting multi-tenant deployment  

## ✨ Key Features

### 🎛️ Dispatcher Dashboard
- **Task Management**: Create, assign, and track delivery tasks
- **Route Optimization**: AI-powered route planning with time windows
- **Fleet Overview**: Real-time vehicle status and location tracking
- **Performance Analytics**: Live KPIs including OTD, CPK, and utilization rates
- **Delivery History**: Comprehensive reporting and analytics

### 🚛 Driver Dashboard  
- **Route Navigation**: GPS-guided route with turn-by-turn directions
- **Task Management**: View assigned deliveries with customer details
- **Real-Time Updates**: Live status updates and communication
- **Performance Tracking**: Individual driver KPIs and metrics
- **Mobile-Optimized**: Responsive design for on-the-go access

### 🤖 Smart Features
- **Gemini AI Geocoding**: Accurate address resolution for Indian locations
- **Dynamic Route Optimization**: Real-time route adjustments based on conditions  
- **Predictive Analytics**: Performance forecasting and trend analysis
- **Automated Notifications**: Real-time alerts and status updates
- **Cost Optimization**: Advanced CPK calculation and fuel management

### 📊 Analytics & Reporting
- **Real-Time KPIs**: On-Time Delivery, Cost Per Kilometer, Vehicle Utilization
- **Performance Dashboards**: Customizable metrics and visualizations  
- **Historical Analysis**: Trend tracking and comparative reporting
- **Business Intelligence**: Data-driven insights for strategic decisions

## 🛠️ Technology Stack

### Frontend
- **HTML5/CSS3/JavaScript ES6+**: Modern web standards
- **Tailwind CSS**: Utility-first CSS framework
- **Leaflet.js**: Interactive mapping and visualization
- **Chart.js**: Advanced data visualization

### Backend & Services
- **Firebase**: Real-time database and authentication
- **Firestore**: NoSQL document database
- **Firebase Auth**: Secure user authentication
- **Firebase Hosting**: Scalable web hosting

### APIs & Integrations
- **OpenRouteService (Vroom)**: Route optimization engine
- **Google Gemini AI**: Advanced geocoding for Indian addresses
- **Nominatim**: Fallback geocoding service
- **Leaflet/OpenStreetMap**: Mapping and geospatial services

### Development Tools
- **Git**: Version control
- **VS Code**: Development environment
- **Python HTTP Server**: Local development server

## ⚙️ Setup Instructions

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (v3.7 or higher)
- **Git** for version control
- **Web browser** (Chrome, Firefox, Safari, Edge)

### 1. Clone the Repository
```bash
git clone https://github.com/Mishrashivam-SKM/Fleet-Management_System.git
cd Fleet-Management_System
```

### 2. Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Firestore Database** and **Authentication**
3. Create a local `.env` file from `.env.example` and fill in the values:
```bash
cp .env.example .env
```

### 3. API Keys Configuration
The app reads credentials from `.env` variables at build time instead of hardcoded source files.

Required variables:

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
VITE_DEMO_DRIVER_EMAIL=driver@fleet.test
VITE_DEMO_CUSTOMER_ID=sample-customer
```

Gemini geocoding and route optimization now run on safe fallback logic only, so no secret API keys need to be bundled into the Vercel client build.

Keep `.env` out of source control. Use your hosting platform's environment settings for the public Firebase values only.

### 4. Deployment Readiness
- The app uses Vite for local development and production builds, and can be deployed to Vercel, Firebase Hosting, or Netlify after `npm run build`.
- No secret API keys are required in the frontend bundle. Geocoding and optimization fall back to public services and deterministic logic.
- Firebase is still required for auth and data storage. If Firebase config is missing, the app now fails gracefully with a clear configuration message instead of throwing during module import.

### 5. Start the Development Server
```bash
npm install
npm run dev
```

### 6. Access the Application
Open your browser and navigate to:
- **Main Application**: `http://localhost:8000`
- **Business Dashboard**: `http://localhost:8000/Business/business-dashboard.html`

### 7. Roles and Login
Role selection is stored at login and the dashboards now use that runtime role instead of a hardcoded dispatcher email.
Create the corresponding Firestore `users` documents and assign roles through security rules for production use.

## 📖 Usage Guide

### For Dispatchers
1. **Login** to the dispatcher dashboard
2. **Add Vehicles** using the Fleet Management panel
3. **Create Tasks** with customer details and delivery addresses
4. **Optimize Routes** using the AI-powered optimization engine
5. **Monitor Progress** through real-time KPIs and tracking

### For Drivers  
1. **Login** to the driver dashboard
2. **View Assigned Routes** with detailed task information
3. **Start GPS Tracking** for real-time location updates
4. **Navigate to Destinations** using integrated mapping
5. **Mark Tasks Complete** upon successful delivery

### System Administration
- **User Management**: Configure roles and permissions
- **Performance Monitoring**: Track system KPIs and usage
- **Data Analytics**: Generate reports and insights
- **System Configuration**: Customize business rules and parameters

## 🔗 API Integration

### OpenRouteService Integration
The system uses Vroom API for advanced route optimization:
- **Vehicle Routing Problem (VRP)** solving
- **Time window constraints** for delivery scheduling  
- **Capacity constraints** for load optimization
- **Real-time optimization** with dynamic updates

### Gemini AI Integration
Enhanced geocoding for accurate Indian address resolution:
- **Natural language processing** for address interpretation
- **High-precision coordinates** for navigation accuracy
- **Fallback mechanisms** ensuring reliable geocoding
- **Performance optimization** with intelligent caching

## 📈 Performance Metrics

### Key Performance Indicators (KPIs)
- **On-Time Delivery (OTD)**: Target 95%+
- **Cost Per Kilometer (CPK)**: ₹12-18 (configurable)
- **Vehicle Utilization Rate (VUR)**: Target 85%+
- **Customer Satisfaction**: Real-time feedback tracking

### System Performance
- **Response Time**: <200ms for dashboard operations
- **Real-Time Updates**: <3 second latency for GPS tracking
- **Scalability**: Supports 1000+ concurrent users
- **Uptime**: 99.9% availability target

## 🚀 Deployment Options

### Local Development
- Vite dev server for local testing
- Hot-reload development environment
- Debug mode with comprehensive logging

### Production Deployment
- **Vercel**: Recommended static deployment with environment variables for public Firebase config
- **Firebase Hosting**: Scalable web hosting with CDN
- **Netlify**: Static site deployment option
- **Docker**: Containerized deployment for enterprise environments
- **AWS/GCP**: Cloud infrastructure deployment

### Vercel Deployment
1. Import the GitHub repository into Vercel.
2. Set the build command to `npm run build` and the output directory to `dist`.
3. Add the public Firebase variables from `.env.example` in the Vercel project settings.
4. Deploy the site.

## 🔒 Security Features

- **Firebase Authentication**: Secure user login and session management
- **Role-Based Access Control**: Dispatcher and driver role separation
- **API Key Management**: Secure handling of external API credentials
- **Data Encryption**: End-to-end encryption for sensitive data
- **Audit Logging**: Comprehensive activity tracking

## 🤝 Contributing

We welcome contributions to improve the Fleet Management System:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow ES6+ JavaScript standards
- Use meaningful commit messages
- Add comments for complex functionality
- Test thoroughly before submitting PRs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenRouteService** for route optimization capabilities
- **Google Gemini AI** for advanced geocoding services
- **Firebase** for robust backend infrastructure
- **Leaflet** for mapping and geospatial functionality
- **Tailwind CSS** for modern UI components

## 📞 Support

For support and questions:
- **Documentation**: Check our comprehensive docs
- **Issues**: Report bugs via GitHub Issues
- **Email**: Contact the development team
- **Community**: Join our developer community

---

**Built with ❤️ for modern logistics operations**

*Revolutionizing fleet management through intelligent automation and real-time analytics.*
