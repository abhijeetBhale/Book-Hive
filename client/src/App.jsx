import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import ForgotPassword from './pages/ForgotPassword';
import AuthCallback from './pages/AuthCallback';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Books from './pages/Books';
import BookDetails from './pages/BookDetails';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            <Route path="/books" element={<ProtectedRoute><Books /></ProtectedRoute>} />
            <Route path="/books/:id" element={<ProtectedRoute><BookDetails /></ProtectedRoute>} />

            {/* Protected Routes */}
            <Route path="/my-books" element={<ProtectedRoute><MyBooks /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="/users/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
            
            {/* ========== FIX IS HERE ========== */}
            <Route path="/borrow-requests" element={<ProtectedRoute><BorrowRequests /></ProtectedRoute>} />
            {/* =============================== */}
            
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;