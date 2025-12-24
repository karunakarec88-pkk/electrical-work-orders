# Security Policy

This document outlines the security measures implemented in the **Electrical Work Orders** project and provides a checklist for safe deployment to GitHub.

## 🔒 Implemented Security Features

### 1. Database Security (Cloud Firestore)
- **Role-Based Access**: Access to data is restricted using Firebase Security Rules.
- **Authentication Required**: All read/write operations require a valid Firebase Authentication session (Anonymous Auth).
- **Deletion Protection**: Critical collections are protected from accidental full-collection deletion.

### 2. User Authentication
- **Password Hashing**: Passwords are not stored in plain text. They are hashed using **SHA-256** before comparison.
- **Client-Side Enforcement**: UI modules (Admin/Owner/Technician) are hidden based on the logged-in role.

### 3. Data Protection (GitHub Safety)
- **Environment Isolation**: Sensitive keys and local configuration are stored in `.env.local`, which is strictly excluded from Git via `.gitignore`.
- **Archive Exclusion**: Large `.zip` and `.docx` source files are excluded to prevent accidental leakage of legacy data.

### 4. API Key Restrictions
- While the Firebase API Key is public in web applications, it is secured for this project by **Firestore Security Rules**.
- **Recommended**: Go to the Google Cloud Console (APIs & Services) and restrict your API Key to only allow your GitHub Pages or Firebase Hosting domain.

## 🚀 Pre-Upload Checklist

Before pushing to GitHub, ensure you have checked the following:

- [ ] **No Secret Keys**: Verify that no API keys or passwords have been typed directly into `js/` files (other than the public Firebase config).
- [ ] **Firestore Rules Active**: Ensure the rules in `firestore.rules` are published in your Firebase Console.
- [ ] **Anonymous Auth Enabled**: Ensure the Anonymous sign-in provider is enabled in Firebase.
- [ ] **Private Repository**: It is recommended to keep this repository **Private** if it contains sensitive business logic.

## Reporting a Vulnerability

If you discover a security vulnerability, please do not open a public issue. Instead, contact the project maintainer directly.
