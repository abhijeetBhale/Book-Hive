import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MyBooks from './pages/MyBooks';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile';
import Messages from './pages/Messages';
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
import VerifyEmail from './pages/VerifyEmail';
import Events from './pages/Events';
import BecomeOrganizer from './pages/BecomeOrganizer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { OnlineStatusProvider } from './context/OnlineStatusContext';
import { NotificationBadgeProvider } from './context/NotificationBadgeContext';
import Books from './pages/Books';
import BookDetails from './pages/BookDetails';
import ModerationNotificationModal from './components/notifications/ModerationNotificationModal';
import { notificationsAPI } from './utils/api';



// Component to handle notification checking
function NotificationHandler() {
  const { user } = useContext(AuthContext);
  const [moderationNotifications, setModerationNotifications] = useState([]);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [hasCheckedNotifications, setHasCheckedNotifications] = useState(false);

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
    <ModerationNotificationModal
      isOpen={showModerationModal}
      onClose={handleCloseModerationModal}
      notifications={moderationNotifications}
    />
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationBadgeProvider>
          <OnlineStatusProvider>
            <Routes>
              {/* Hidden Admin Route - Completely separate from main app layout */}
              <Route path="/admin-dashboard-secure" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

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

                    <Route path="/books" element={<ProtectedRoute><Books /></ProtectedRoute>} />
                    <Route path="/books/:id" element={<ProtectedRoute><BookDetails /></ProtectedRoute>} />

                    {/* Protected Routes */}
                    <Route path="/my-books" element={<ProtectedRoute><MyBooks /></ProtectedRoute>} />
                    <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
                    <Route path="/users/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                    <Route path="/profile/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                    <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
                    <Route path="/borrow-requests" element={<ProtectedRoute><BorrowRequests /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
                    <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/become-organizer" element={<ProtectedRoute><BecomeOrganizer /></ProtectedRoute>} />
                  </Routes>
                </Layout>
              } />
            </Routes>

            {/* Global Notification Handler */}
            <NotificationHandler />

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
