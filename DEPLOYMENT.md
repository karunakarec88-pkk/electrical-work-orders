# Deployment Guide

Follow these steps to upload your project to **GitHub** and **Firebase Hosting**.

## 1. Upload to GitHub
1. Open your terminal in the project folder.
2. Run these commands:
   ```bash
   git add .
   git commit -m "Final migration: Firebase and UI refinements"
   ```
3. Create a new repository on [GitHub](https://github.com/new).
4. Copy the remote URL and run:
   ```bash
   git remote add origin YOUR_GITHUB_URL
   git push -u origin main
   ```

## 2. Upload to Firebase (Cloud)
1. Install Firebase tools if you haven't:
   ```bash
   npm install -g firebase-tools
   ```
2. Login to your account:
   ```bash
   firebase login
   ```
3. Deploy the project:
   ```bash
   firebase deploy
   ```

## 3. Security Check
- Ensure you have published your **Firestore Rules** in the Firebase Console.
- Ensure **Anonymous Authentication** is enabled in the Firebase Console.

*Your app is now live and secure!*
