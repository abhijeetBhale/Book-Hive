import React, { useState, useContext, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
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
    `transition-colors duration-300 text-lg ${isActive ? 'text-primary font-semibold' : 'text-gray-600 hover:text-primary'}`;

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
              <div className="flex items-center space-x-4">
                {user && (
                  <>
                    <NavLink to="/users" className={navLinkClass}>Community</NavLink>
                    <NavLink to="/map" className={navLinkClass}>Map</NavLink>
                    <NavLink to="/my-books" className={navLinkClass}>My Books</NavLink>
                    <NavLink to="/borrow-requests" className={navLinkClass}>Requests</NavLink>
                    <NavLink to="/messages" className={navLinkClass}>Messages</NavLink>
                    <NavLink to="/friends" className={navLinkClass}>Friends</NavLink>
                  </>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              {user ? (
                <div className="flex items-center gap-4">
                  {/* ✨ The Link is now the relative container for the dot */}
                  <Link to="/profile" className="relative">
                    <img
                      key={user.avatar}
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=4F46E5&color=fff`}
                      alt="avatar"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    {/* ✨ Dot is now styled with clean Tailwind CSS classes */}
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </Link>
                  <Button onClick={logout} variant="secondary" className='cursor-pointer'>Logout</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login"> <LoginButton /></Link>
                  <Link to="/register"> <SignButton /></Link>
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
        {/* Mobile menu remains unchanged */}
        {isOpen && (
          <div className="md:hidden glass absolute w-full border-b border-gray-200/50">
            <div className="px-2 pt-2 pb-3 sm:px-3">
              {user && (
                <div className="flex flex-col items-center gap-4 py-2">
                  <NavLink to="/users" className={navLinkClass} onClick={() => setIsOpen(false)}>Community</NavLink>
                  <NavLink to="/map" className={navLinkClass} onClick={() => setIsOpen(false)}>Map</NavLink>
                  <NavLink to="/my-books" className={navLinkClass} onClick={() => setIsOpen(false)}>My Books</NavLink>
                  <NavLink to="/borrow-requests" className={navLinkClass} onClick={() => setIsOpen(false)}>Requests</NavLink>
                  <NavLink to="/messages" className={navLinkClass} onClick={() => setIsOpen(false)}>Messages</NavLink>
                  <NavLink to="/friends" className={navLinkClass} onClick={() => setIsOpen(false)}>Friends</NavLink>
                  {/* Avatar with notification dot on mobile too */}
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
                  <Button onClick={() => { logout(); setIsOpen(false); }} variant="secondary" className="w-full">Logout</Button>
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