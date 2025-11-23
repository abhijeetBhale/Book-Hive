import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole) {
    // Admin and superadmin can access everything
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';
    
    if (!isAdmin && user.role !== requiredRole) {
      toast.error(`Access denied. ${requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1)} privileges required.`);
      return <Navigate to="/" replace />;
    }

    // Check if organizer is verified
    if (requiredRole === 'organizer' && !user.verified && !isAdmin) {
      toast.error('Your organizer account is pending verification. Please wait for admin approval.');
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;