
import React, { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';

// Context Providers
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { APIKeyManagementProvider } from '@/context/APIKeyManagementContext';
import { AdminSettingsProvider } from '@/context/AdminSettingsContext';
import { NotificationProvider } from '@/context/NotificationContext'; 
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { AdvancedVideoCallProvider } from '@/context/AdvancedVideoCallContext';
import { CallStateProvider } from '@/context/CallStateContext';
import { WebSocketChatProvider } from '@/context/WebSocketChatContext'; 

// Components
import ScrollToTop from '@/components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import PageTransition from '@/components/PageTransition';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import CookieConsent from '@/components/CookieConsent';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';
import OfflineBanner from '@/components/OfflineBanner';
import { ToastContextProvider } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import AnnouncementManager from '@/components/AnnouncementManager'; 
import MunalAIChatWrapper from '@/components/MunalAIChatWrapper';
import { HeroSlideProvider } from '@/contexts/HeroSlideContext';

import { useSourceProtection } from '@/hooks/useSourceProtection';

// Services
import { audioRingingService } from '@/services/audioRingingService';
import { registerServiceWorker } from '@/utils/serviceWorkerManager';
import { initNativeApp } from '@/utils/native';

// PWA
import InstallPrompt from '@/components/pwa/InstallPrompt';
import OfflineIndicator from '@/components/pwa/OfflineIndicator';

// Styles
import '@/styles/responsive.css';

// Layouts
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const UserLayout = lazy(() => import('@/layouts/UserLayout'));

// Critical Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage'));
import AdminLoginPage from '@/pages/AdminLoginPage';
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));

// Feature Pages
const FeatureOverviewPage = lazy(() => import('@/pages/features/FeatureOverviewPage'));
const FeatureMeetingsPage = lazy(() => import('@/pages/features/FeatureMeetingsPage'));
const FeatureTranscriptionsPage = lazy(() => import('@/pages/features/FeatureTranscriptionsPage'));
const FeatureSearchPage = lazy(() => import('@/pages/features/FeatureSearchPage'));
const FeatureChatMessagingPage = lazy(() => import('@/pages/features/FeatureChatMessagingPage'));
const FeatureTeamsPage = lazy(() => import('@/pages/features/FeatureTeamsPage'));
const FeatureFileManagementPage = lazy(() => import('@/pages/features/FeatureFileManagementPage'));
const FeatureAnalyticsPage = lazy(() => import('@/pages/features/FeatureAnalyticsPage'));
const FeatureDashboardPage = lazy(() => import('@/pages/features/FeatureDashboardPage'));
const FeatureVoiceChatPage = lazy(() => import('@/pages/features/FeatureVoiceChatPage'));
const FeatureCalendarIntegrationPage = lazy(() => import('@/pages/features/FeatureCalendarIntegrationPage'));
const FeatureVideoCallsPage = lazy(() => import('@/pages/features/FeatureVideoCallsPage'));
const FeatureApprovalsPage = lazy(() => import('@/pages/features/FeatureApprovalsPage'));
const FeatureTextToAudioPage = lazy(() => import('@/pages/features/FeatureTextToAudioPage'));
const FeatureTextToVideoPage = lazy(() => import('@/pages/features/FeatureTextToVideoPage'));
const FeatureQuickRecordPage = lazy(() => import('@/pages/features/FeatureQuickRecordPage'));
const FeatureESignaturePage = lazy(() => import('@/pages/features/FeatureESignaturePage'));
const FeatureShiftsPage = lazy(() => import('@/pages/features/FeatureShiftsPage'));
const FeatureIRSORPage = lazy(() => import('@/pages/features/FeatureIRSORPage'));
const FeatureNotificationsPage = lazy(() => import('@/pages/features/FeatureNotificationsPage'));
const FeatureAIChatPage = lazy(() => import('@/pages/features/FeatureAIChatPage'));

// Solution Pages (GEO)
const HealthcareSolutionPage = lazy(() => import('@/pages/solutions/HealthcareSolutionPage'));
const EducationSolutionPage = lazy(() => import('@/pages/solutions/EducationSolutionPage'));
const LegalSolutionPage = lazy(() => import('@/pages/solutions/LegalSolutionPage'));
const FinanceSolutionPage = lazy(() => import('@/pages/solutions/FinanceSolutionPage'));

// Payment Pages
const PaymentSuccessPage = lazy(() => import('@/pages/PaymentSuccessPage'));

// User Pages
const UserDashboard = lazy(() => import('@/pages/user/UserDashboard')); 
const NotFound = lazy(() => import('@/pages/NotFound'));
const PricingPage = lazy(() => import('@/pages/PricingPage'));
const MeetingDetailPage = lazy(() => import('@/pages/MeetingDetailPage'));
const SharedMeetingPage = lazy(() => import('@/pages/SharedMeetingPage'));
const SharedRecordingPage = lazy(() => import('@/pages/SharedRecordingPage'));
const WorkspaceDetailPage = lazy(() => import('@/pages/WorkspaceDetailPage'));
const ShiftManagementPage = lazy(() => import('@/pages/ShiftManagementPage'));
const TimeClockReportsPage = lazy(() => import('@/pages/TimeClockReportsPage'));
const FileManagementPage = lazy(() => import('@/pages/FileManagementPage'));
const ESignaturePage = lazy(() => import('@/pages/ESignaturePage'));
const PDFEditorPage = lazy(() => import('@/pages/PDFEditorPage'));
const DocHubPage = lazy(() => import('@/pages/DocHubPage'));
const ApprovalsPage = lazy(() => import('@/pages/ApprovalsPage'));
const OrgDashboardPage = lazy(() => import('@/pages/OrgDashboardPage'));

// AI Pages
const TranscriptionPage = lazy(() => import('@/pages/TranscriptionPage'));
const NewTranscriptionPage = lazy(() => import('@/pages/NewTranscriptionPage')); 
const TranscriptionManagementPage = lazy(() => import('@/pages/TranscriptionManagementPage')); 
const TranscriptionHistoryPage = lazy(() => import('@/pages/TranscriptionHistoryPage')); 
const TranscriptionDetailPage = lazy(() => import('@/pages/TranscriptionDetailPage'));
const SummarizationPage = lazy(() => import('@/pages/SummarizationPage'));
const AIFeaturesPage = lazy(() => import('@/pages/AIFeaturesPage'));
const APIKeyConfigurationPage = lazy(() => import('@/pages/APIKeyConfigurationPage'));

// Chat Pages
const VoiceChatPage = lazy(() => import('@/pages/VoiceChatPage'));
const VideoCallPage = lazy(() => import('@/pages/VideoCallPage'));
const WorkspaceChatPage = lazy(() => import('@/pages/WorkspaceChatPage')); 
const VideoConferencingPage = lazy(() => import('@/pages/VideoConferencingPage')); 
const RecentChatsPage = lazy(() => import('@/pages/RecentChatsPage'));
const QuickRecordPage = lazy(() => import('@/pages/QuickRecordPage'));
const TextToAudioPage = lazy(() => import('@/pages/user/TextToAudioPage'));
const TextToVideoPage = lazy(() => import('@/pages/TextToVideoPage'));
const MessageSettingsPage = lazy(() => import('@/pages/MessageSettingsPage'));

// Video & Meetings
const AdvancedVideoCallInterface = lazy(() => import('@/components/video/AdvancedVideoCallInterface'));
const MeetingCallPage = lazy(() => import('@/pages/MeetingCallPage'));
const MeetingCalendarPage = lazy(() => import('@/pages/MeetingCalendarPage'));
const MeetingListPage = lazy(() => import('@/pages/MeetingListPage'));
const MeetingsPage = lazy(() => import('@/pages/MeetingsPage'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const MeetingRoomPage = lazy(() => import('@/pages/MeetingRoomPage'));
const InstantMeetingRoom = lazy(() => import('@/pages/InstantMeetingRoom'));
const MeetingProcessingPage = lazy(() => import('@/pages/MeetingProcessingPage'));
const MeetingTranscriptPage = lazy(() => import('@/pages/MeetingTranscriptPage'));

// Payment Pages
const PaymentPage = lazy(() => import('@/pages/PaymentPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const UserBillingPage = lazy(() => import('@/pages/UserBillingPage'));
const UserPaymentMethodsPage = lazy(() => import('@/pages/user/UserPaymentMethodsPage'));
const UserPaymentHistoryPage = lazy(() => import('@/pages/user/UserPaymentHistoryPage'));
const UserPaymentCheckoutPage = lazy(() => import('@/pages/user/UserPaymentCheckoutPage'));
const UserPlansPage = lazy(() => import('@/pages/user/UserPlansPage'));
const UserCouponsPage = lazy(() => import('@/pages/user/UserCouponsPage'));
const UserTransactionsPage = lazy(() => import('@/pages/user/UserTransactionsPage'));
const UserMyAnalyticsPage = lazy(() => import('@/pages/user/UserMyAnalyticsPage'));

// Analytics & Reports
const AnalyticsDashboardPage = lazy(() => import('@/pages/AnalyticsDashboardPage'));
const ReportManagementPage = lazy(() => import('@/pages/ReportManagementPage'));

// Auth Pages
const OTPLoginPage = lazy(() => import('@/pages/OTPLoginPage'));
const PasswordResetPage = lazy(() => import('@/pages/PasswordResetPage'));
const PasswordUpdatePage = lazy(() => import('@/pages/PasswordUpdatePage'));
const UserProfilePage = lazy(() => import('@/pages/UserProfilePage'));
const UserSettingsPage = lazy(() => import('@/pages/UserSettingsPage'));

// Portal & Support
const WorkspacesPage = lazy(() => import('@/pages/WorkspacesPage'));
const HelpPage = lazy(() => import('@/pages/HelpPage'));
const SupportPage = lazy(() => import('@/pages/SupportPage'));
const MessagesPage = lazy(() => import('@/pages/MessagesPage'));
const UserSupportTicketsPage = lazy(() => import('@/pages/UserSupportTicketsPage'));
const UserSupportTicketDetailPage = lazy(() => import('@/pages/UserSupportTicketDetailPage'));
const UserWorkspace = lazy(() => import('@/pages/UserWorkspace'));
const ChatMessagesPage = lazy(() => import('@/pages/ChatMessagesPage'));

// Use Cases
const UseCasesIndex = lazy(() => import('@/pages/UseCases/UseCasesIndex'));
const SalesTeams = lazy(() => import('@/pages/UseCases/SalesTeams'));
const CustomerSuccess = lazy(() => import('@/pages/UseCases/CustomerSuccess'));
const ProductTeams = lazy(() => import('@/pages/UseCases/ProductTeams'));
const EngineeringTeams = lazy(() => import('@/pages/UseCases/EngineeringTeams'));
const HRRecruiting = lazy(() => import('@/pages/UseCases/HRRecruiting'));
const Healthcare = lazy(() => import('@/pages/UseCases/Healthcare'));
const Education = lazy(() => import('@/pages/UseCases/Education'));
const Government = lazy(() => import('@/pages/UseCases/Government'));
const Legal = lazy(() => import('@/pages/UseCases/Legal'));
const Finance = lazy(() => import('@/pages/UseCases/Finance'));

// Resources
const ResourcesIndex = lazy(() => import('@/pages/Resources/ResourcesIndex'));
const Documentation = lazy(() => import('@/pages/Resources/Documentation'));
const APIReference = lazy(() => import('@/pages/Resources/APIReference'));
const Blog = lazy(() => import('@/pages/Resources/Blog'));
const Community = lazy(() => import('@/pages/Resources/Community'));

// Downloads
const DownloadsIndex = lazy(() => import('@/pages/Downloads/DownloadsIndex'));
const ChromeExtension = lazy(() => import('@/pages/Downloads/ChromeExtension'));
const DesktopApp = lazy(() => import('@/pages/Downloads/DesktopApp'));
const MobileApp = lazy(() => import('@/pages/Downloads/MobileApp'));

// Company
const About = lazy(() => import('@/pages/Company/About'));
const Careers = lazy(() => import('@/pages/Company/Careers'));
const Press = lazy(() => import('@/pages/Company/Press'));

// Product
const Pricing = lazy(() => import('@/pages/Product/Pricing'));
const Security = lazy(() => import('@/pages/Product/Security'));
const Roadmap = lazy(() => import('@/pages/Product/Roadmap'));

// Legal
const Contact = lazy(() => import('@/pages/Legal/Contact'));
const Privacy = lazy(() => import('@/pages/Legal/Privacy'));
const Terms = lazy(() => import('@/pages/Legal/Terms'));
const ManageCookies = lazy(() => import('@/pages/Legal/ManageCookies'));
const Trademarks = lazy(() => import('@/pages/Legal/Trademarks'));
const SecurityPage = lazy(() => import('@/pages/Legal/SecurityPage'));
const AIChatPage = lazy(() => import('@/pages/AIChatPage'));
const ContactFormPage = lazy(() => import('@/pages/ContactFormPage'));

// Admin Pages
const AdminUsers = lazy(() => import('@/pages/AdminUsers'));
const AdminSettings = lazy(() => import('@/pages/AdminSettings'));
const AdminAnalytics = lazy(() => import('@/pages/AdminAnalytics'));
const AdminAdvancedAnalyticsPage = lazy(() => import('@/pages/admin/AdminAdvancedAnalyticsPage'));
const AdminStorageQuotasPage = lazy(() => import('@/pages/admin/AdminStorageQuotasPage'));
const AdminReports = lazy(() => import('@/pages/AdminReports'));
const AdminProfile = lazy(() => import('@/pages/AdminProfile'));
const AdminContent = lazy(() => import('@/pages/AdminContent'));
const AdminWorkspace = lazy(() => import('@/pages/AdminWorkspace'));
const AdminSystemHealthPage = lazy(() => import('@/pages/AdminSystemHealthPage'));
const AdminDataHealthPage = lazy(() => import('@/pages/admin/AdminDataHealthPage'));
const AdminTicketsPage = lazy(() => import('@/pages/AdminTicketsPage'));
const AdminSupportTicketsPage = lazy(() => import('@/pages/AdminSupportTicketsPage'));
const AdminMessagesPage = lazy(() => import('@/pages/AdminMessagesPage'));
const AdminBroadcastsPage = lazy(() => import('@/pages/admin/AdminBroadcastsPage'));
const AdminBillingPage = lazy(() => import('@/pages/admin/AdminBillingPage'));
const AdminUserManagementPage = lazy(() => import('@/pages/admin/AdminUserManagementPage'));
const AdminPaymentGatewaysPage = lazy(() => import('@/pages/admin/AdminPaymentGatewaysPage'));
const AdminAPISettingsPage = lazy(() => import('@/pages/admin/AdminAPISettingsPage'));
const AdminIntegrationsPage = lazy(() => import('@/pages/admin/AdminIntegrationsPage'));
const AdminAPILogs = lazy(() => import('@/pages/admin/AdminAPILogs'));
const AdminIntegrationLogs = lazy(() => import('@/pages/admin/AdminIntegrationLogs'));
const AdminSettingsPersistenceTest = lazy(() => import('@/pages/admin/AdminSettingsPersistenceTest'));
const AdminDocumentation = lazy(() => import('@/pages/admin/AdminDocumentation'));
const AdminTranscriptionSettingsPage = lazy(() => import('@/pages/admin/AdminTranscriptionSettingsPage')); 
const AdminVideoSettingsPage = lazy(() => import('@/pages/admin/AdminVideoSettingsPage'));
const AdminStripeSettingsPage = lazy(() => import('@/pages/admin/AdminStripeSettingsPage'));
const AdminPlansPage = lazy(() => import('@/pages/admin/AdminPlansPage'));
const AdminCouponsPage = lazy(() => import('@/pages/admin/AdminCouponsPage'));
const AdminTaxRatesPage = lazy(() => import('@/pages/admin/AdminTaxRatesPage'));
const AdminTransactionsPage = lazy(() => import('@/pages/admin/AdminTransactionsPage'));
const AdminAuditLogsPage = lazy(() => import('@/pages/admin/AdminAuditLogsPage'));
const AdminMonitoringDashboard = lazy(() => import('@/pages/admin/AdminMonitoringDashboard'));
const AdminSecurityPolicies = lazy(() => import('@/pages/admin/AdminSecurityPolicies'));
const AdminMeetingAnalytics = lazy(() => import('@/pages/admin/AdminMeetingAnalytics'));
const AdminCloudStoragePage = lazy(() => import('@/pages/admin/AdminCloudStoragePage'));
const AdminVideoHistoryPage = lazy(() => import('@/pages/admin/AdminVideoHistoryPage'));
const AdminApprovalTemplatesPage = lazy(() => import('@/pages/admin/AdminApprovalTemplatesPage'));
const AdminOrganizationsPage = lazy(() => import('@/pages/admin/AdminOrganizationsPage'));
const AdminShiftsPage = lazy(() => import('@/pages/admin/AdminShiftsPage'));
const AdminIRTemplatesPage = lazy(() => import('@/pages/admin/AdminIRTemplatesPage'));
const AdminFormsPage = lazy(() => import('@/pages/admin/AdminFormsPage'));
const AdminModulePermissionsPage = lazy(() => import('@/pages/admin/AdminModulePermissionsPage'));
const AdminWorkspaceDetailPage = lazy(() => import('@/pages/admin/AdminWorkspaceDetailPage'));
const AdminWorkspacesPage = lazy(() => import('@/pages/admin/AdminWorkspacesPage'));
const AdminChatModerationPage = lazy(() => import('@/pages/admin/AdminChatModerationPage'));
const Admin2FADashboardPage = lazy(() => import('@/pages/admin/Admin2FADashboardPage'));
const AdminPDFTemplatesPage = lazy(() => import('@/pages/admin/AdminPDFTemplatesPage'));
const AdminSystemUpdatesPage = lazy(() => import('@/pages/admin/AdminSystemUpdatesPage'));
const AdminTrashPage = lazy(() => import('@/pages/admin/AdminTrashPage'));
const AdminNewsletterPage = lazy(() => import('@/pages/admin/AdminNewsletterPage'));
const IntegrationsPage = lazy(() => import('@/pages/IntegrationsPage'));
const APISettingsPage = lazy(() => import('@/pages/APISettingsPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));

function SourceProtection() { useSourceProtection(); return null; }

function App() {
  useEffect(() => {
    registerServiceWorker();
    initNativeApp().catch(() => {});
    const handleInteraction = () => {
      audioRingingService.resumeContext();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);
  
  // Global handler for chunk loading errors in lazy imports
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      const error = event.reason;
      const errorMessage = error?.message || error?.toString() || '';
      
      // Check if it's a chunk loading error
      if (
        errorMessage.includes('Loading chunk') ||
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Loading CSS chunk') ||
        errorMessage.includes('ChunkLoadError')
      ) {
        console.warn('[App] Chunk load error detected in promise rejection');
        event.preventDefault();
        
        // Check if we've already tried reloading recently
        const lastReload = sessionStorage.getItem('chunk_reload_timestamp');
        const now = Date.now();
        
        if (!lastReload || (now - parseInt(lastReload, 10)) > 30000) {
          sessionStorage.setItem('chunk_reload_timestamp', now.toString());
          
          // Clear caches and reload
          if ('caches' in window) {
            caches.keys().then(names => {
              Promise.all(names.map(name => caches.delete(name))).then(() => {
                window.location.reload(true);
              });
            });
          } else {
            window.location.reload(true);
          }
        }
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ToastContextProvider>
        <ThemeProvider>
          <AuthProvider>
              <AdminSettingsProvider>
                <APIKeyManagementProvider>
                  <Router>
                    <NotificationProvider>
                      <WorkspaceProvider>
                        <WebSocketChatProvider>
                          <AdvancedVideoCallProvider>
                            <CallStateProvider>
                              <HeroSlideProvider>
                              <AnnouncementManager />
                              <MunalAIChatWrapper />
                              <ScrollToTop />
                              <SourceProtection />
                              <InstallPrompt />
                              <OfflineIndicator />
                              
                              <Suspense fallback={
                                <div className="min-h-screen flex items-center justify-center bg-violet-50 dark:bg-slate-950">
                                <LoadingSpinner size="large" />
                              </div>
                            }>
                            <Routes>
                              {/* Public Routes */}
                              <Route path="/" element={<LandingPage />} />
                              <Route path="/contact" element={<PageTransition><ContactFormPage /></PageTransition>} />
                              <Route path="/features" element={<FeatureOverviewPage />} />
                              <Route path="/features/overview" element={<FeatureOverviewPage />} />
                              <Route path="/features/meetings" element={<FeatureMeetingsPage />} />
                              <Route path="/features/transcriptions" element={<FeatureTranscriptionsPage />} />
                              <Route path="/features/search" element={<FeatureSearchPage />} />
                              <Route path="/features/chat-messaging" element={<FeatureChatMessagingPage />} />
                              <Route path="/features/teams" element={<FeatureTeamsPage />} />
                              <Route path="/features/file-management" element={<FeatureFileManagementPage />} />
                              <Route path="/features/analytics" element={<FeatureAnalyticsPage />} />
                              <Route path="/features/dashboard" element={<FeatureDashboardPage />} />
                              <Route path="/features/voice-chat" element={<FeatureVoiceChatPage />} />
                              <Route path="/features/calendar-integration" element={<FeatureCalendarIntegrationPage />} />
                              <Route path="/features/video-calls" element={<FeatureVideoCallsPage />} />
                              <Route path="/features/approvals" element={<FeatureApprovalsPage />} />
                              <Route path="/features/text-to-audio" element={<FeatureTextToAudioPage />} />
                              <Route path="/features/text-to-video" element={<FeatureTextToVideoPage />} />
                              <Route path="/features/quick-record" element={<FeatureQuickRecordPage />} />
                              <Route path="/features/esignature" element={<FeatureESignaturePage />} />
                              <Route path="/features/shifts" element={<FeatureShiftsPage />} />
                              <Route path="/features/ir-sor" element={<FeatureIRSORPage />} />
                              <Route path="/features/notifications" element={<FeatureNotificationsPage />} />
                              <Route path="/features/ai-chat" element={<FeatureAIChatPage />} />
                              
                              {/* Industry Solution Pages (GEO) */}
                              <Route path="/solutions/healthcare" element={<HealthcareSolutionPage />} />
                              <Route path="/solutions/education" element={<EducationSolutionPage />} />
                              <Route path="/solutions/legal" element={<LegalSolutionPage />} />
                              <Route path="/solutions/finance" element={<FinanceSolutionPage />} />

                              <Route path="/login" element={<LoginPage />} />
                              <Route path="/login/otp" element={<OTPLoginPage />} />
                              <Route path="/signup" element={<SignupPage />} />
                              <Route path="/verify-email" element={<VerifyEmailPage />} />
                              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                              <Route path="/password-reset" element={<PasswordResetPage />} />
                              <Route path="/pricing" element={<PricingPage />} />
                              <Route path="/payment/success" element={<PaymentSuccessPage />} />
                              <Route path="/shared/:shareToken" element={<SharedMeetingPage />} />
                              <Route path="/shared/recording/:shareToken" element={<SharedRecordingPage />} />
                              <Route path="/checkout/:planId" element={<CheckoutPage />} />

                              <Route path="/ai-chat" element={<AIChatPage />} />

                              <Route path="/update-password" element={
                                <ProtectedRoute>
                                  <PasswordUpdatePage />
                                </ProtectedRoute>
                              } />

                              {/* Protected User Routes */}
                              <Route element={
                                <ProtectedRoute>
                                  <UserLayout />
                                </ProtectedRoute>
                              }>
                                <Route path="/dashboard" element={<UserDashboard />} />
                                <Route path="/user/dashboard" element={<UserDashboard />} />
                                <Route path="/quick-record" element={<QuickRecordPage />} />
                                <Route path="/text-to-audio" element={<TextToAudioPage />} />
                                <Route path="/text-to-video" element={<TextToVideoPage />} />
                                <Route path="/reports" element={<ReportsPage />} />
                                <Route path="/meetings" element={<MeetingsPage />} />
                                <Route path="/meeting/:id" element={<MeetingDetailPage />} />
                                <Route path="/meeting-calendar" element={<MeetingCalendarPage />} />
                                <Route path="/my-meetings" element={<MeetingListPage />} />
                                
                                <Route path="/transcriptions" element={<TranscriptionHistoryPage />} />
                                <Route path="/transcription/history" element={<TranscriptionHistoryPage />} />
                                <Route path="/transcription/new" element={<NewTranscriptionPage />} /> 
                                <Route path="/transcriptions/manage" element={<TranscriptionManagementPage />} />
                                <Route path="/transcriptions/:id" element={<TranscriptionDetailPage />} />
                                <Route path="/transcribe-new" element={<TranscriptionPage />} />
                                <Route path="/summarize" element={<SummarizationPage />} />
                                <Route path="/ai-features" element={<AIFeaturesPage />} />
                                
                                <Route path="/voice-chat" element={<VoiceChatPage />} />
                                <Route path="/video-call" element={<VideoCallPage />} />
                                <Route path="/files" element={<FileManagementPage />} />
                                <Route path="/dochub" element={<DocHubPage />} />
                                <Route path="/esignature" element={<Navigate to="/dochub?tab=esignature" replace />} />
                                <Route path="/pdf-editor" element={<Navigate to="/dochub?tab=pdf-editor" replace />} />
                                <Route path="/approvals" element={<ApprovalsPage />} />
                                <Route path="/org-dashboard" element={<OrgDashboardPage />} />
                                
                                <Route path="/workspaces" element={<WorkspacesPage />} />
                                <Route path="/workspace/chat" element={<WorkspaceChatPage />} />
                                <Route path="/workspace/video-conferencing" element={<VideoConferencingPage />} /> 
                                <Route path="/workspace/:workspaceId/manage" element={<WorkspaceDetailPage />} />
                                <Route path="/workspace/:workspaceId/shifts" element={<ShiftManagementPage />} />
                                <Route path="/workspace/:workspaceId/time-clock-reports" element={<TimeClockReportsPage />} />
                                <Route path="/workspace/:id" element={<WorkspaceDetailPage />} /> 
                                <Route path="/calendar" element={<CalendarPage />} />
                                <Route path="/meet/:meetingId" element={<InstantMeetingRoom />} />
                                <Route path="/meeting/:meetingId" element={<InstantMeetingRoom />} />
                                <Route path="/workspace/meeting/:meetingId" element={<InstantMeetingRoom />} />
                                <Route path="/workspace/meeting-old/:meetingId" element={<MeetingRoomPage />} />
                                <Route path="/meeting/:meetingId/processing" element={<MeetingProcessingPage />} />
                                <Route path="/meeting-transcripts/:id" element={<MeetingTranscriptPage />} />

                                <Route path="/workspace/:workspaceId/call/:callId" element={<AdvancedVideoCallInterface />} />
                                
                                <Route path="/billing" element={<UserBillingPage />} />
                                <Route path="/user/payment-methods" element={<UserPaymentMethodsPage />} />
                                <Route path="/user/payment-history" element={<UserPaymentHistoryPage />} />
                                <Route path="/user/checkout" element={<UserPaymentCheckoutPage />} />
                                <Route path="/user/plans" element={<UserPlansPage />} />
                                <Route path="/user/coupons" element={<UserCouponsPage />} />
                                <Route path="/user/transactions" element={<UserTransactionsPage />} />
                                <Route path="/my-analytics" element={<UserMyAnalyticsPage />} />

                                <Route path="/support" element={<SupportPage />} />
                                <Route path="/support-tickets" element={<UserSupportTicketsPage />} />
                                <Route path="/support-tickets/:ticketId" element={<UserSupportTicketDetailPage />} />
                                <Route path="/messages" element={<MessagesPage />} />
                                <Route path="/messages/settings" element={<MessageSettingsPage />} />
                                <Route path="/chat-messages" element={<ChatMessagesPage />} />
                                <Route path="/recent-chats" element={<RecentChatsPage />} />
                                
                                <Route path="/integrations" element={<IntegrationsPage />} />
                                <Route path="/integrations/settings" element={<IntegrationsPage />} />
                                <Route path="/settings/api" element={<APISettingsPage />} />
                                <Route path="/settings/api-keys" element={<APIKeyConfigurationPage />} />
                                
                                <Route path="/profile" element={<UserProfilePage />} />
                                <Route path="/settings" element={<UserSettingsPage />} />
                                <Route path="/help" element={<HelpPage />} />
                                <Route path="/settings/billing" element={<UserBillingPage />} />
                                <Route path="/my-workspaces" element={<UserWorkspace />} />
                                <Route path="/analytics" element={<AnalyticsDashboardPage />} />
                              </Route>

                              <Route path="/meeting/:id/live" element={
                                <ProtectedRoute>
                                  <MeetingCallPage />
                                </ProtectedRoute>
                              } />
                              
                              <Route path="/use-cases" element={<UseCasesIndex />} />
                              <Route path="/use-cases/sales" element={<SalesTeams />} />
                              <Route path="/use-cases/customer-success" element={<CustomerSuccess />} />
                              <Route path="/use-cases/product" element={<ProductTeams />} />
                              <Route path="/use-cases/engineering" element={<EngineeringTeams />} />
                              <Route path="/use-cases/hr" element={<HRRecruiting />} />
                              <Route path="/use-cases/healthcare" element={<Healthcare />} />
                              <Route path="/use-cases/education" element={<Education />} />
                              <Route path="/use-cases/government" element={<Government />} />
                              <Route path="/use-cases/legal" element={<Legal />} />
                              <Route path="/use-cases/finance" element={<Finance />} />

                              <Route path="/resources" element={<ResourcesIndex />} />
                              <Route path="/resources/docs" element={<Documentation />} />
                              <Route path="/resources/api" element={<APIReference />} />
                              <Route path="/resources/blog" element={<Blog />} />
                              <Route path="/resources/community" element={<Community />} />

                              <Route path="/downloads" element={<DownloadsIndex />} />
                              <Route path="/downloads/chrome-extension" element={<ChromeExtension />} />
                              <Route path="/downloads/desktop-app" element={<DesktopApp />} />
                              <Route path="/downloads/mobile-app" element={<MobileApp />} />

                              <Route path="/company/about" element={<About />} />
                              <Route path="/company/careers" element={<Careers />} />
                              <Route path="/company/press" element={<Press />} />
                              <Route path="/contact" element={<Contact />} />

                              <Route path="/product/pricing" element={<PricingPage />} />
                              <Route path="/product/security" element={<Security />} />
                              <Route path="/product/roadmap" element={<Roadmap />} />

                              <Route path="/legal/privacy" element={<Privacy />} />
                              <Route path="/legal/terms" element={<Terms />} />
                              <Route path="/legal/cookies" element={<ManageCookies />} />
                              <Route path="/legal/trademarks" element={<Trademarks />} />
                              <Route path="/legal/security" element={<SecurityPage />} />
                              <Route path="/legal/contact" element={<Contact />} />

                              {/* Admin Routes */}
                              <Route path="/admin/login" element={<AdminLoginPage />} />
                              <Route path="/admin" element={
                                <AdminProtectedRoute>
                                  <AdminLayout />
                                </AdminProtectedRoute>
                              }>
                                <Route index element={<AdminDashboard />} />
                                <Route path="dashboard" element={<AdminDashboard />} />
                                <Route path="users" element={<AdminUserManagementPage />} />
                                <Route path="settings" element={<AdminSettings />} />
                                <Route path="analytics" element={<AdminAnalytics />} /> 
                                <Route path="advanced-analytics" element={<AdminAdvancedAnalyticsPage />} />
                                <Route path="storage-quotas" element={<AdminStorageQuotasPage />} />
                                <Route path="reports" element={<AdminReports />} /> 
                                <Route path="billing" element={<AdminBillingPage />} />
                                <Route path="workspaces" element={<AdminWorkspacesPage />} />
                                <Route path="workspaces/:id" element={<AdminWorkspaceDetailPage />} />
                                <Route path="reports" element={<ReportsPage />} />
                                <Route path="chat-moderation" element={<AdminChatModerationPage />} />
                                <Route path="shifts" element={<AdminShiftsPage />} />
                                <Route path="profile" element={<AdminProfile />} />
                                <Route path="content" element={<AdminContent />} />
                                <Route path="health" element={<AdminSystemHealthPage />} />
                                <Route path="data-health" element={<AdminDataHealthPage />} />
                                <Route path="tickets" element={<AdminTicketsPage />} />
                                <Route path="support-tickets" element={<AdminSupportTicketsPage />} />
                                <Route path="messages" element={<AdminMessagesPage />} />
                                <Route path="broadcasts" element={<AdminBroadcastsPage />} />
                                <Route path="api-settings" element={<AdminAPISettingsPage />} />
                                <Route path="integrations" element={<AdminIntegrationsPage />} />
                                <Route path="documentation" element={<AdminDocumentation />} />
                                <Route path="payment-gateways" element={<AdminPaymentGatewaysPage />} />
                                <Route path="plans" element={<AdminPlansPage />} />
                                <Route path="coupons" element={<AdminCouponsPage />} />
                                <Route path="tax-rates" element={<AdminTaxRatesPage />} />
                                <Route path="transactions" element={<AdminTransactionsPage />} />
                                <Route path="transcription-settings" element={<AdminTranscriptionSettingsPage />} />
                                <Route path="video-settings" element={<AdminVideoSettingsPage />} />
                                <Route path="stripe-settings" element={<AdminStripeSettingsPage />} />
                                <Route path="api-logs" element={<AdminAPILogs />} />
                                <Route path="integration-logs" element={<AdminIntegrationLogs />} />
                                <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                                <Route path="monitoring" element={<AdminMonitoringDashboard />} />
                                <Route path="security-policies" element={<AdminSecurityPolicies />} />
                                <Route path="2fa-dashboard" element={<Admin2FADashboardPage />} />
                                <Route path="pdf-templates" element={<AdminPDFTemplatesPage />} />
                                <Route path="meeting-analytics" element={<AdminMeetingAnalytics />} />
                                <Route path="cloud-storage" element={<AdminCloudStoragePage />} />
                                <Route path="video-history" element={<AdminVideoHistoryPage />} />
                                <Route path="approval-templates" element={<AdminApprovalTemplatesPage />} />
                                <Route path="organizations" element={<AdminOrganizationsPage />} />
                                <Route path="ir-sor-templates" element={<AdminIRTemplatesPage />} />
                                <Route path="forms" element={<AdminFormsPage />} />
                                <Route path="module-permissions" element={<AdminModulePermissionsPage />} />
                                <Route path="system-updates" element={<AdminSystemUpdatesPage />} />
                                <Route path="trash" element={<AdminTrashPage />} />
                                <Route path="newsletter" element={<AdminNewsletterPage />} />
                                <Route path="debug-settings" element={<AdminSettingsPersistenceTest />} />
                                <Route path="*" element={<AdminDashboard />} />
                              </Route>
                              
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </Suspense>
                          <Toaster />
                          <CookieConsent />
                          <PushNotificationPrompt />
                          <OfflineBanner />
                          </HeroSlideProvider>
                        </CallStateProvider>
                      </AdvancedVideoCallProvider>
                    </WebSocketChatProvider>
                  </WorkspaceProvider>
                </NotificationProvider>
              </Router>
            </APIKeyManagementProvider>
          </AdminSettingsProvider>
      </AuthProvider>
        </ThemeProvider>
      </ToastContextProvider>
    </ErrorBoundary>
  );
}

export default App;
