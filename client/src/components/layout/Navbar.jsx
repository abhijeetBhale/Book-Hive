import React, { useState, useContext, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Menu,
  X,
  Users,
  Map,
  BookMarked,
  ArrowLeftRight,
  MessageSquare,
  Heart,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import Button from '../ui/Button';
import beeIcon from '../../assets/icons8-bee-100.png';
import LoginButton from '../LoginButton';
import SignButton from '../SignButton';
import { notificationsAPI } from '../../utils/api';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      if (user) {
        try {
          const result = await notificationsAPI.getUnreadCount();
          setUnreadCount(result.count || 0);
        } catch {
          setUnreadCount(0);
        }
      } else {
        setUnreadCount(0);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    const onRead = () => fetchUnread();
    window.addEventListener('notifications-read', onRead);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-read', onRead);
    };
  }, [user]);

  const navLinkClass = ({ isActive }) =>
    `transition-colors duration-300 text-lg ${
      isActive ? 'text-primary' : 'text-gray-600 hover:text-primary'
    }`;

  const navLinks = [
    { to: '/users', text: 'Community', icon: <Users size={24} /> },
    { to: '/map', text: 'Map', icon: <Map size={24} /> },
    { to: '/my-books', text: 'My Books', icon: <BookMarked size={24} /> },
    { to: '/borrow-requests', text: 'Requests', icon: <ArrowLeftRight size={24} /> },
    { to: '/messages', text: 'Messages', icon: <MessageSquare size={24} /> },
    { to: '/friends', text: 'Friends', icon: <Heart size={24} /> },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="relative glass border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                <img src={beeIcon} alt="BookHive logo" className="h-8 w-8" />
                <span className="text-2xl font-bold text-gray-800">BookHive</span>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-20">
                {user &&
                  navLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `transition-colors duration-300 ${
                          isActive ? 'text-primary' : 'text-gray-600 hover:text-primary'
                        }`
                      }
                      title={link.text} // Tooltip for desktop
                    >
                      {({ isActive }) => (
                        <div className="relative flex flex-col items-center pt-4 pb-4">
                          {link.icon}
                          <span
                            className={`absolute bottom-1 h-1.5 w-3.5 right-0.9 rounded-full bg-green-500 transition-opacity duration-300 ${
                              isActive ? 'opacity-100' : 'opacity-0'
                            }`}
                          ></span>
                        </div>
                      )}
                    </NavLink>
                  ))}
              </div>
            </div>
            <div className="hidden md:block">
              {user ? (
                <div className="flex items-center gap-4">
                  <Link to="/profile" className="relative">
                    <img
                      key={user.avatar}
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=4F46E5&color=fff`}
                      alt="avatar"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </Link>
                  <Button onClick={logout} variant="secondary" className="cursor-pointer">
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <LoginButton />
                  </Link>
                  <Link to="/register">
                    <SignButton />
                  </Link>
                </div>
              )}
            </div>
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-primary focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden glass absolute w-full border-b border-gray-200/50">
            <div className="px-2 pt-2 pb-3 sm:px-3">
              {user && (
                <div className="flex flex-col items-center gap-4 py-2">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={navLinkClass}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.text}
                    </NavLink>
                  ))}
                  <Link to="/profile" className="relative" onClick={() => setIsOpen(false)}>
                    <img
                      key={user.avatar}
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=4F46E5&color=fff`}
                      alt="avatar"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </Link>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-200/50">
                {user ? (
                  <Button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    variant="secondary"
                    className="w-full"
                  >
                    Logout
                  </Button>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <LoginButton />
                    </Link>
                    <Link to="/register" onClick={() => setIsOpen(false)}>
                      <SignButton />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;