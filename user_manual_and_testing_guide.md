User Manual & End-to-End Testing Guide
Document Version: Final
Date: September 28, 2025

This document provides the complete project structure, setup instructions, and detailed user journeys to fully test the Fleet Management Platform.

1. Project Folder Structure

Organize your files using this structure for a clean, manageable codebase. The names below are the exact filenames you should use.

fleet-management-app/
│
├── index.html
│
├── src/
│   ├── api/
│   │   ├── config.js
│   │   └── firestoreService.js
│   │
│   ├── components/
│   │   ├── dispatcherDashboard.js
│   │   ├── driverDashboard.js
│   │   ├── MapView.js
│   │   ├── ReportsView.js
│   │   ├── RoutesView.js
│   │   ├── TaskFormModal.js
│   │   └── VehicleFormModal.js
│   │
│   ├── data/
│   │   ├── mockData.js
│   │   └── models.js
│   │
│   ├── services/
│   │   ├── minHeap.js
│   │   ├── optimizationService.js
│   │   └── reportingService.js
│   │
│   └── app.js
│
├── project_completion_report.md
├── study.md
└── user_manual_and_testing_guide.md

2. How to Start the Web App (Step-by-Step)

Prerequisites:

A Firebase project with Authentication (Email/Password enabled) and Cloud Firestore (in Test Mode).

An OpenRouteService (ORS) developer account and API key.

Configuration:

Open /src/api/config.js and fill in your actual FIREBASE_CONFIG and ORS_API_KEY. This is mandatory.

Run Locally:

Download all project files.

Install Node.js from nodejs.org.

Open your terminal and run: npm install -g http-server

In your terminal, navigate to your project folder (e.g., cd path/to/fleet-management-app).

Start the server: http-server

Open your browser to http://127.0.0.1:8080.

3. End-to-End Testing Journey

Part A: Initial Setup

Create Users in Firebase: In your Firebase Authentication console, create three users:

dispatcher@example.com (password: password123)

priya@example.com (password: password123)

amit@example.com (password: password123)

Firestore: Ensure your Cloud Firestore database is empty.

Part B: The Dispatcher's Journey

Login & Fleet Setup:

Log in as dispatcher@example.com.

The dashboard will be empty. In the "Fleet Management" section, click "+ Add Vehicle".

Create Vehicle 1:

Vehicle ID: VAN-01

Driver Name: Priya Sharma

Driver Email: priya@example.com

Max Capacity: 100

Shift Start/End: Sep 29, 2025, 09:00 AM to Sep 29, 2025, 05:00 PM.

Click "Add Vehicle". It will appear in the list and on the map.

Create Vehicle 2 (VAN-02, Driver: Amit Kumar, Email: amit@example.com, Capacity: 80).

Task Management & Optimization:

In "Task Management", click "+ New Task".

Create Task 1: (Customer: Croma, Volume: 70, Location: 19.2582, 72.9735, Deadline: 12:00 PM on Sep 29).

Create Task 2: (Customer: Reliance, Volume: 50, Location: 19.1764, 72.9591, Deadline: 2:30 PM on Sep 29).

Click "Optimize Routes".

Expected Result: The system should generate a plan. Since the total volume (120) exceeds VAN-01's capacity, the optimizer will create a two-vehicle solution, assigning one task to VAN-01 and the other to VAN-02.

Fleet Editing:

Click "Edit" on VAN-02. Change the capacity to 90. Save changes. The update will reflect instantly.

Part C: The Driver's Journey

Log out from the dispatcher account.

Log in as priya@example.com.

Expected Result: The dashboard will show only the task assigned to VAN-01 (Croma). Priya will not see the task assigned to Amit.

Click "Mark Complete". The UI will update, and the task status will change in Firestore.

