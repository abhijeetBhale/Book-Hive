import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { BookProvider } from './context/BookContext';

// Layout & Components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Users from './pages/Users';
import MyBooks from './pages/MyBooks';
import BorrowRequests from './pages/BorrowRequests';
import Map from './pages/Map';
import Messages from './pages/Messages';
import Friends from './pages/Friends';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AuthCallback from './pages/AuthCallback';
import ForgotPassword from './pages/ForgotPassword';

function App() {
  return (
    // FIX: <Router> must wrap the providers so hooks like useNavigate are available in the context.
    <Router>
      <AuthProvider>
        <BookProvider>
          <div className="min-h-screen">
            <Layout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/map" element={<Map />} />
                <Route path="/profile/:userId" element={<UserProfile />} />
                
                {/* --- NEW ROUTES FOR PRIVACY AND TERMS --- */}
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />

                {/* --- THE CRITICAL NEW ROUTE --- */}
                {/* This route will "catch" the user returning from Google login */}
                <Route path="/auth/callback" element={<AuthCallback />} />

                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Protected Routes */}
                <Route path="/users" element={
                  <ProtectedRoute>
                    <Users />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/my-books" element={
                  <ProtectedRoute>
                    <MyBooks />
                  </ProtectedRoute>
                } />
                <Route path="/borrow-requests" element={
                  <ProtectedRoute>
                    <BorrowRequests />
                  </ProtectedRoute>
                } />
                <Route path="/messages" element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                } />
                <Route path="/friends" element={
                  <ProtectedRoute>
                    <Friends />
                  </ProtectedRoute>
                } />
              </Routes>
            </Layout>
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 1500,
                style: {
                  background: '#fff',
                  color: '#374151',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  borderRadius: '12px',
                  padding: '16px',
                },
              }}
            />
          </div>
        </BookProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;