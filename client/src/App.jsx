import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ServerWakeupLoader from './components/ServerWakeupLoader';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MyBooks from './pages/MyBooks';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile';
import Messages from './pages/Messages';
import BlockedUsers from './pages/BlockedUsers';
import Friends from './pages/Friends';
import BorrowRequests from './pages/BorrowRequests';
import Profile from './pages/Profile';
import Map from './pages/Map';
import Calendar from './pages/Calendar';
import ForgotPassword from './pages/ForgotPassword';
import AuthCallback from './pages/AuthCallback';
import AdminDashboard from './pages/AdminDashboard';
import Contact from './pages/Contact';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Team from './pages/Team';
import VerifyEmail from './pages/VerifyEmail';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import BecomeOrganizer from './pages/BecomeOrganizer';
import OrganizerDashboard from './pages/OrganizerDashboard';
import GetVerified from './pages/GetVerified';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { OnlineStatusProvider } from './context/OnlineStatusContext';
import { NotificationBadgeProvider } from './context/NotificationBadgeContext';
import Books from './pages/Books';
import BookDetails from './pages/BookDetails';
import ModerationNotificationModal from './components/notifications/ModerationNotificationModal';
import LocationWarningModal from './components/ui/LocationWarningModal';
import VersionNotificationManager from './components/notifications/VersionNotificationManager';
import { notificationsAPI } from './utils/api';
import Broadcasts from './pages/Broadcasts';



// Component to handle notification checking
function NotificationHandler() {
  const { user } = useContext(AuthContext);
  const [moderationNotifications, setModerationNotifications] = useState([]);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [hasCheckedNotifications, setHasCheckedNotifications] = useState(false);
  const [showLocationWarning, setShowLocationWarning] = useState(false);
  const [locationWarningUser, setLocationWarningUser] = useState('');

  // Check for moderation notifications when user logs in
  useEffect(() => {
    const checkModerationNotifications = async () => {
      if (user && user._id && !hasCheckedNotifications) {
        try {
          // Add a small delay to ensure everything is loaded
          await new Promise(resolve => setTimeout(resolve, 500));

          const response = await notificationsAPI.getModerationNotifications();
          const notifications = response.data?.data || response.data || [];

          if (notifications.length > 0) {
            setModerationNotifications(notifications);
            setShowModerationModal(true);
          }

          setHasCheckedNotifications(true);
        } catch (error) {
          console.error('Error checking moderation notifications:', error);
          setHasCheckedNotifications(true);
        }
      }
    };

    // Add a small delay before checking notifications
    const timeoutId = setTimeout(checkModerationNotifications, 100);

    return () => clearTimeout(timeoutId);
  }, [user, hasCheckedNotifications]);

  // Reset notification check when user changes
  useEffect(() => {
    if (!user) {
      setHasCheckedNotifications(false);
      setModerationNotifications([]);
      setShowModerationModal(false);
    }
  }, [user]);

  // Listen for global location warning events
  useEffect(() => {
    const handleLocationWarning = (event) => {
      setLocationWarningUser(event.detail.userName);
      setShowLocationWarning(true);
    };

    window.addEventListener('show-location-warning', handleLocationWarning);
    return () => window.removeEventListener('show-location-warning', handleLocationWarning);
  }, []);

  const handleCloseModerationModal = async () => {
    try {
      // Mark notifications as read
      const notificationIds = moderationNotifications.map(n => n._id);
      if (notificationIds.length > 0) {
        await notificationsAPI.markAsRead(notificationIds);
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }

    setShowModerationModal(false);
    setModerationNotifications([]);
  };

  return (
    <>
      <ModerationNotificationModal
        isOpen={showModerationModal}
        onClose={handleCloseModerationModal}
        notifications={moderationNotifications}
      />
      <LocationWarningModal
        isOpen={showLocationWarning}
        onClose={() => setShowLocationWarning(false)}
        userName={locationWarningUser}
      />
    </>
  );
}

function App() {
  const [serverReady, setServerReady] = useState(false);
  const [skipWakeup, setSkipWakeup] = useState(false);

  // Check if user has valid session and server was recently active
  useEffect(() => {
    const token = localStorage.getItem('token');
    const cachedUser = localStorage.getItem('cachedUser');
    const serverStatus = localStorage.getItem('serverStatus');
    
    // If user has valid session and server was recently active, skip wakeup
    if (token && cachedUser && serverStatus) {
      try {
        const { timestamp, isAwake } = JSON.parse(serverStatus);
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        
        if (isAwake && timestamp > fiveMinutesAgo) {
          setSkipWakeup(true);
          setServerReady(true);
          return;
        }
      } catch (error) {
        // Continue with normal wakeup flow
      }
    }
  }, []);

  // Show server wakeup loader only for new users or after long idle
  if (!serverReady && !skipWakeup) {
    return <ServerWakeupLoader onReady={() => setServerReady(true)} />;
  }

  return (
    <Router>
      <AuthProvider>
        <NotificationBadgeProvider>
          <OnlineStatusProvider>
            <Routes>
              {/* Admin Routes - Completely separate from main app layout */}
              <Route path="/admin-dashboard-secure" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              {/* <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} /> */}

              {/* Main App Routes with Layout */}
              <Route path="/*" element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/team" element={<Team />} />

                    <Route path="/books" element={<ProtectedRoute><Books /></ProtectedRoute>} />
                    <Route path="/books/:id" element={<ProtectedRoute><BookDetails /></ProtectedRoute>} />
                    <Route path="/broadcasts" element={<ProtectedRoute><Broadcasts /></ProtectedRoute>} />

                    {/* Protected Routes */}
                    <Route path="/my-books" element={<ProtectedRoute><MyBooks /></ProtectedRoute>} />
                    <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
                    <Route path="/users/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                    <Route path="/profile/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                    <Route path="/blocked-users" element={<ProtectedRoute><BlockedUsers /></ProtectedRoute>} />
                    <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
                    <Route path="/borrow-requests" element={<ProtectedRoute><BorrowRequests /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
                    <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/events/:id" element={<EventDetails />} />
                    <Route path="/become-organizer" element={<ProtectedRoute><BecomeOrganizer /></ProtectedRoute>} />
                    <Route path="/organizer/dashboard" element={<ProtectedRoute><OrganizerDashboard /></ProtectedRoute>} />
                    <Route path="/get-verified" element={<ProtectedRoute><GetVerified /></ProtectedRoute>} />
                  </Routes>
                </Layout>
              } />
            </Routes>

            {/* Global Notification Handler */}
            <NotificationHandler />

            {/* Version Notification Manager */}
            <VersionNotificationManager />

            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </OnlineStatusProvider>
        </NotificationBadgeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
