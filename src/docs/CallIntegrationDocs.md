
# Video Call Integration Documentation

## Overview
The EchoNote Video Call system is built on two primary contexts:
1. `AdvancedVideoCallContext`: Handles low-level WebRTC connections, media streams (camera/mic/screen), and participant management.
2. `CallStateContext`: Manages the high-level application state, including UI view switching (chat vs. video), call history, and notifications.

## Key Components

### 1. FullScreenVideoCallView.jsx
The main video call interface. It replaces the chat view when a call is active.
- **Features**: 
  - Dynamic participant grid
  - Active speaker view (via screen sharing)
  - Control bar for mute/camera/recording
  - Modal integration for settings and ending calls

### 2. CallStateContext.jsx
Global state provider.
- **Hook**: `useCallState()`
- **Key Properties**:
  - `isCallViewOpen`: Boolean, determines if the full-screen video UI is visible.
  - `incomingCall`: Object or null, triggers the notification modal.
  - `callHistory`: Array of past call objects.
- **Key Functions**:
  - `initiateCall(id, name, type)`: Starts outgoing call process.
  - `acceptIncomingCall()`: Joins the call.
  - `terminateCall()`: Ends call and saves to history.

### 3. WorkspaceMemberChat.jsx
The container component that switches between the standard chat view and the `FullScreenVideoCallView`.
- Integrates `CallNotificationModal` for incoming alerts.
- Displays `CallHistorySection` in the sidebar/footer.

## Integration Guide

### How to Start a Call
In any component (like `UserInfoHeader`), use the hook:
