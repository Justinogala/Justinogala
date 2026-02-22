
# Munal Application Testing Checklist

This document outlines the testing procedures to verify the functionality of the Munal application.

## 1. Authentication (User)

- [ ] **Sign Up**:
    - Navigate to `/signup`.
    - Enter valid name, email, and password.
    - Submit form.
    - Verify redirection to `/dashboard`.
    - Verify user name is displayed in the dashboard welcome message.
- [ ] **Login**:
    - Log out if currently logged in.
    - Navigate to `/login`.
    - Enter correct credentials.
    - Submit form.
    - Verify redirection to `/dashboard`.
- [ ] **Logout**:
    - Click profile avatar in navigation.
    - Select "Log out".
    - Verify redirection to `/login` or home page.
    - Try accessing `/dashboard` manually; should redirect to login.
- [ ] **Password Reset**:
    - Navigate to `/login`.
    - Click "Forgot password?".
    - Enter email.
    - Verify success message appears.

## 2. User Dashboard & Features

- [ ] **Dashboard Loading**:
    - Access `/dashboard`.
    - Verify stats cards load correctly.
    - Verify recent transcriptions list is populated (mock data).
    - Verify "Quick Actions" buttons function (navigation works).
- [ ] **Navigation**:
    - Test all links in `UserNavigation`: Dashboard, Transcriptions, Meetings, Workspaces, Files, Analytics.
    - Verify active state highlights correctly.
    - Test mobile menu toggling on small screens.
- [ ] **Transcriptions**:
    - Navigate to `/transcriptions` or `/transcribe-new`.
    - Verify page loads.
- [ ] **Profile**:
    - Navigate to `/profile`.
    - Verify user details are displayed.

## 3. Admin Authentication & Dashboard

- [ ] **Admin Login**:
    - Navigate to `/admin/login`.
    - Enter `admin@munal.com` / `Admin@123456`.
    - Submit form.
    - Verify redirection to `/admin/dashboard`.
- [ ] **Admin Dashboard**:
    - Verify system overview stats load.
    - Verify recent system logs load.
- [ ] **Admin Navigation**:
    - Test links: Dashboard, Users, Workspaces, Analytics, Reports, Settings.
    - Verify Logout works correctly.
- [ ] **Protected Routes**:
    - Try accessing `/admin/dashboard` without logging in (incognito window).
    - Verify redirection to `/admin/login`.

## 4. Responsiveness

- [ ] **Desktop**: Verify layout on wide screens (>1024px).
- [ ] **Tablet**: Verify layout on tablet size (~768px). Check hamburger menus.
- [ ] **Mobile**: Verify layout on mobile size (<480px). Ensure no horizontal scrolling issues.

## 5. Services & Integrations

- [ ] **Data Persistence**:
    - Reload page while logged in.
    - Verify session is maintained.
- [ ] **Mock Services**:
    - Verify file upload (mock) works in Files section.
    - Verify admin stats loading (mock service).

## 6. Sign-off

**Verified by:** ____________________
**Date:** ____________________
