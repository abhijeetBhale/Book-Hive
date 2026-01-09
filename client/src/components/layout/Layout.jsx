import React, { useContext, useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';
import { AuthContext } from '../../context/AuthContext';
import { PlusCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import FloatingVerificationButton from '../ui/FloatingVerificationButton';
import VersionNotificationManager from '../notifications/VersionNotificationManager';

const Layout = ({ children }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // 1. State to manage the Floating Action Button's visibility
  const [isFabVisible, setIsFabVisible] = useState(true);
  
  // Ref to hold the timeout ID, preventing re-renders on change
  const scrollTimeoutRef = useRef(null);

  // Define pages where the Add New Book button should be visible
  const allowedPages = ['/', '/map'];

  // 2. Effect to handle the scroll event
  useEffect(() => {
    const handleScroll = () => {
      // Hide the button as soon as the user starts scrolling
      setIsFabVisible(false);

      // Clear the previous timeout if it exists
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set a new timeout to show the button after scrolling has stopped
      scrollTimeoutRef.current = setTimeout(() => {
        setIsFabVisible(true);
      }, 200); // 200ms delay after the last scroll event
    };

    // Add the event listener when the component mounts
    window.addEventListener('scroll', handleScroll);

    // Clean up the event listener and timeout when the component unmounts
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <>
      <Navbar />
      <main className="pt-20 w-full">
        {children}
      </main>
      
      {/* Floating Verification Button - Shows for non-verified users */}
      <FloatingVerificationButton />
      
      {/* Version Notification Manager - Shows notification bell and popups */}
      <VersionNotificationManager />
      
      {/* Floating Action Button for Adding Books - Only show on Home and Map pages */}
      {user && allowedPages.includes(location.pathname) && (
        <Link
          to="/my-books"
          // 3. Conditionally apply classes for the animation
          className={`group fixed bottom-8 right-8 bg-gradient-to-r from-[#4F46E5] to-purple-600 text-white p-5 rounded-3xl shadow-2xl hover:shadow-[#4F46E5]/25 hover:shadow-3xl hover:scale-110 transition-all duration-300 z-40 fab-button ${isFabVisible ? 'fab-visible' : 'fab-hidden'}`}
          title="Add New Book"
        >
          <PlusCircle className="h-7 w-7" />
          <span className="absolute right-full mr-4 whitespace-nowrap bg-gray-900 text-white px-4 py-2 rounded-2xl text-sm font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl">
            Add New Book
          </span>
        </Link>
      )}
    </>
  );
};

export default Layout;