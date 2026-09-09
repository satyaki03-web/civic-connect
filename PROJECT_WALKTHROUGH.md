# Civic Connect - Project Walkthrough

This document outlines the architecture, data flow, and key features of the **Civic Connect** platform. You can use this material to build your presentation (PPT).

## 1. Overview
**Civic Connect** is a two-part platform designed to streamline civic hazard reporting and resolution. 
It bridges the gap between citizens (who report issues like potholes, electricity cutoffs, etc.) and municipal administrators (who triage, track, and resolve these issues).

## 2. Core Architecture
The application is built using a modern, fast, and scalable stack:
*   **Frontend**: React (Vite) + TypeScript.
*   **Styling**: Tailwind CSS for responsive, mobile-first, and highly polished UI.
*   **Animations**: Framer Motion (via `motion/react`) for smooth, app-like transitions.
*   **Map Integration**: Leaflet (`react-leaflet`) for geographical mapping of incidents.
*   **Database/Backend**: Firebase Firestore (NoSQL Document database) for real-time data sync.
*   **Icons**: `lucide-react` for a consistent, professional iconography system.

## 3. Platform Modules (How Things Work)

### A. The Citizen App (Mobile-First View)
**Component**: `frontend/components/CitizenApp.tsx`
*   **Purpose**: Allows citizens to rapidly document and submit civic hazards.
*   **Key Features**:
    *   **Live Camera Integration**: Accesses the device's camera (with a custom, polished UI reticle) to capture hazards directly.
    *   **Smart Geolocation**: Uses the HTML5 Geolocation API (`navigator.geolocation`) to automatically attach precise GPS coordinates to the report.
    *   **AI Auto-Categorization (Simulated)**: Analyzes the captured image to pre-fill the issue category (e.g., Pothole, Graffiti) and priority. 
    *   **Editable Drafts**: Before submission, users can override the AI-suggested category, change the priority, and write detailed descriptions of the problem.
    *   **Real-time Tracking**: Citizens have a localized dashboard to track their active reports and view estimated completion times (ETAs).
    *   **Deletion**: Allows users to delete reports if they were uploaded by mistake.

### B. The Municipal Dashboard (Desktop View)
**Component**: `frontend/components/AdminDashboard.tsx`
*   **Purpose**: A control center for city officials and administrators to triage and dispatch repair teams.
*   **Key Features**:
    *   **Interactive Map**: A full-scale interactive map (centered locally) plotting all reported issues. Pins are color-coded based on the report status (Reported, In Progress, Resolved).
    *   **Kanban Board System**: A drag-and-drop-style column layout that automatically categorizes issues by status. Administrators can click buttons on each ticket to advance their state (e.g., moving a ticket from "Reported" to "In Progress").
    *   **Analytics & KPIs**: Top-level metric cards showing Active Issues, High Priority incidents, and 30-day Resolution counts. Clicking these cards opens detailed operational progress modals.

### C. The Data Layer (Real-time Sync)
**Component**: `frontend/context/ReportContext.tsx`
*   **Purpose**: The central brain handling state and database communication.
*   **How it Works**:
    *   **Firestore Sync**: It connects to Firebase Firestore and sets up real-time snapshot listeners (`onSnapshot`). Whenever a citizen submits a report, or an admin changes a status, the database updates, and this context instantly syncs the changes across all connected screens.
    *   **Graceful Fallback**: If Firebase is not initialized, it safely falls back to local Mock Data, ensuring the UI never crashes and remains presentable for demos.
    *   **Data Handling**: Exposes functions (`addReport`, `updateReportStatus`, `deleteReport`) that the React components consume.

## 4. Key Selling Points (For PPT)
*   **Instant Sync**: Because of Firestore, an admin sees a report the exact second a citizen submits it. No page refreshes required.
*   **AI-Enhanced Input**: Reduces friction for citizens by doing the heavy lifting (auto-tagging issues), while keeping humans in the loop (editable text boxes).
*   **Accessible Design**: High contrast colors, clear iconography, and fluid animations make it easy for non-technical users to adopt.

## 5. File Structure Reference
*   `frontend/App.tsx`: The router that switches between the Citizen View and Admin View based on login.
*   `frontend/types.ts`: TypeScript definitions ensuring data consistency (Report structure, Location coordinates, Status enum).
*   `firestore.rules`: Security configuration that dictates who can read/write to the database.
