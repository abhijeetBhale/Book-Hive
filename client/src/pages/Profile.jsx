import React, { useContext, useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { AuthContext } from '../context/AuthContext';
import { authAPI, borrowAPI, messagesAPI, reportAPI, usersAPI } from '../utils/api';
import toast from 'react-hot-toast';

// Import new icons for the password fields
import { Loader, Camera, MapPin, User, Mail, Bell, Lock, BookOpen, Trash2, Eye, EyeOff, AlertTriangle, ArrowLeft, Trophy } from 'lucide-react';
import GamificationSection from '../components/profile/GamificationSection';

const Profile = () => {
  const { user, setUser, fetchProfile } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [activeSubTab, setActiveSubTab] = useState('overview');

  // --- STATE FOR REPORT USER ---
  const [reportData, setReportData] = useState({
    reportedUserId: '',
    reason: '',
    description: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // --- STATE FOR SECURITY TAB ---
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [notifications, setNotifications] = useState({
    pendingRequests: 0,
    approvedRequests: 0,
    messages: [],
    pendingList: [],
    approvedList: []
  });

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [receivedRequests, inquiryNotes] = await Promise.all([
          borrowAPI.getReceivedRequests(),
          (await import('../utils/api')).notificationsAPI.listBookInquiries({ limit: 20 })
        ]);

        const pendingList = receivedRequests.data.requests.filter(r => r.status === 'pending');
        const approvedList = receivedRequests.data.requests.filter(r => r.status === 'approved');
        const pendingCount = pendingList.length;
        const approvedCount = approvedList.length;

        const messages = (inquiryNotes.data.notifications || []).map(n => ({
          id: n._id,
          from: n.fromUser?.name || 'User',
          text: n.message,
          avatar: n.fromUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(n.fromUser?.name || 'User')}&background=818cf8&color=fff`
        }));

        setNotifications({
          pendingRequests: pendingCount,
          approvedRequests: approvedCount,
          messages: messages,
          pendingList,
          approvedList
        });
        // Mark relevant notifications as read and notify navbar to refresh count
        try {
          const { notificationsAPI } = await import('../utils/api');
          console.log('Profile: Marking all notifications as read');
          const response = await notificationsAPI.markRead();
          console.log('Profile: Mark read response:', response);
          window.dispatchEvent(new Event('notifications-read'));
        } catch (error) {
          console.error('Profile: Error marking notifications as read:', error);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        setNotifications({
          pendingRequests: 0,
          approvedRequests: 0,
          messages: [],
          pendingList: [],
          approvedList: []
        });
      }
    };
    fetchNotifications();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- HANDLER FOR PASSWORD FORM ---
  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    if (avatarFile) {
      data.append('avatar', avatarFile);
    }
    try {
      const response = await authAPI.updateProfile(data);
      setUser(response.data.user);
      toast.success('Profile updated successfully!');
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = async () => {
    setLoading(true);
    try {
      const { getCurrentLocation } = await import('../utils/locationHelpers');
      const location = await getCurrentLocation();
      await authAPI.updateLocation(location);
      toast.success("Location updated successfully!");
      fetchProfile();
    } catch (error) {
      toast.error(error.message || "Failed to update location.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    const originalPending = [...notifications.pendingList];
    const originalApproved = [...notifications.approvedList];
    setNotifications(prev => {
      const pendingList = prev.pendingList.filter(r => r._id !== requestId);
      const approvedList = prev.approvedList.filter(r => r._id !== requestId);
      return {
        ...prev,
        pendingList,
        approvedList,
        pendingRequests: pendingList.length,
        approvedRequests: approvedList.length,
      };
    });
    try {
      await borrowAPI.deleteRequest(requestId);
      toast.success('Request removed.');
    } catch (error) {
      toast.error('Could not remove request. Please try again.');
      setNotifications(prev => ({
        ...prev,
        pendingList: originalPending,
        approvedList: originalApproved,
        pendingRequests: originalPending.length,
        approvedRequests: originalApproved.length,
      }));
    }
  };

  const handleDeleteMessage = async (messageId) => {
    const originalMessages = [...notifications.messages];
    setNotifications(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.id !== messageId)
    }));
    try {
      const { notificationsAPI } = await import('../utils/api');
      await notificationsAPI.delete(messageId);
      toast.success("Notification removed.");
    } catch (error) {
      toast.error("Could not remove notification. Please try again.");
      setNotifications(prev => ({
        ...prev,
        messages: originalMessages
      }));
    }
  };

  // --- HANDLERS FOR REPORT USER ---
  const handleSearchUsers = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await usersAPI.searchUsers({ keyword: searchQuery });
      setSearchResults(response.data.filter(u => u._id !== user._id)); // Filter out current user
    } catch (error) {
      console.error('Search users error:', error);
      toast.error("Failed to search users. Please try again.");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle search input with debouncing
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const newTimeout = setTimeout(() => {
      handleSearchUsers(value);
    }, 300); // 300ms delay

    setSearchTimeout(newTimeout);
  };

  const handleSelectUser = (selectedUser) => {
    setReportData(prev => ({
      ...prev,
      reportedUserId: selectedUser._id
    }));
    setSearchResults([]);
    setSearchTerm(selectedUser.name);
  };

  const handleReportChange = (e) => {
    setReportData({ ...reportData, [e.target.name]: e.target.value });
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await reportAPI.createReport(reportData);
      toast.success("Report submitted successfully. Our team will review it shortly.");
      setReportData({ reportedUserId: '', reason: '', description: '' });
      setSearchTerm('');
      setActiveTab('security');
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER FOR PASSWORD SUBMIT ---
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match.");
    }
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters long.");
    }

    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success("Password changed successfully!");
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  const totalNotifications = notifications.pendingRequests + notifications.messages.length;

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <form onSubmit={handleSubmit}>
            <div className="section-header">
              <h3>Profile</h3>
              <p>This information will be displayed publicly so be careful what you share.</p>
            </div>
            <div className="avatar-section">
              <div className="avatar-uploader" onClick={() => fileInputRef.current.click()}>
                <img
                  key={user.avatar}
                  src={avatarPreview || user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=4F46E5&color=fff&size=128`}
                  alt="avatar"
                  className="avatar-image"
                />
                <div className="camera-overlay"><Camera size={24} /></div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <div>
                <h2 className="user-name">{user.name}</h2>
                <p className="user-email">{user.email}</p>
              </div>
            </div>
            <div className="input-field">
              <label htmlFor="name">Name</label>
              <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div className="input-field">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="form-footer">
              <button type="button" className="cancel-btn">Cancel</button>
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? <Loader className="animate-spin" size={16} /> : 'Save changes'}
              </button>
            </div>
          </form>
        );
      case 'location':
        return (
          <div>
            <div className="section-header">
              <h3>Location</h3>
              <p>Manage your location settings for the community map.</p>
            </div>
            <div className="location-content">
              <p>Your location is used to connect you with nearby readers. We never share your exact address.</p>
              <button className="location-btn" onClick={handleUpdateLocation} disabled={loading}>
                <MapPin size={18} />
                {loading ? 'Updating...' : 'Update My Location'}
              </button>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div>
            <div className="section-header">
              <h3>Notifications</h3>
              <p>All your recent activity in one place.</p>
            </div>
            <div className="notification-list">
              <h4>Book Requests</h4>
              <div className="notification-item">
                <div className="item-icon pending"><BookOpen size={20} /></div>
                <div className="item-content">
                  <strong>{notifications.pendingRequests} Pending Request{notifications.pendingRequests !== 1 && 's'}</strong>
                  <p>You have new requests from readers wanting to borrow your books.</p>
                </div>
              </div>
              {notifications.pendingList.map(req => (
                <div className="notification-item" key={req._id}>
                  <img src={req.borrower?.avatar || `https://ui-avatars.com/api/?name=${req.borrower?.name || 'User'}&background=818cf8&color=fff`} alt={req.borrower?.name || 'User'} className="item-avatar" />
                  <div className="item-content">
                    <strong>{req.borrower?.name || 'User'} requested "{req.book?.title || 'Book'}"</strong>
                    <p>Requested on {new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleDeleteRequest(req._id)} className="delete-notification-btn" aria-label="Delete pending request">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <div className="notification-item">
                <div className="item-icon approved"><BookOpen size={20} /></div>
                <div className="item-content">
                  <strong>{notifications.approvedRequests} Approved Request{notifications.approvedRequests !== 1 && 's'}</strong>
                  <p>You have approved these requests. Don't forget to arrange the exchange!</p>
                </div>
              </div>
              {notifications.approvedList.map(req => (
                <div className="notification-item" key={req._id}>
                  <img src={req.borrower?.avatar || `https://ui-avatars.com/api/?name=${req.borrower?.name || 'User'}&background=818cf8&color=fff`} alt={req.borrower?.name || 'User'} className="item-avatar" />
                  <div className="item-content">
                    <strong>Approved: "{req.book?.title || 'Book'}" for {req.borrower?.name || 'User'}</strong>
                    <p>Approved on {new Date(req.updatedAt || req.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleDeleteRequest(req._id)} className="delete-notification-btn" aria-label="Delete approved request">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <h4 className="mt-8">Book Inquiries</h4>
              <div className="messages-scroll">
              {notifications.messages.length > 0 ? notifications.messages.map(msg => (
                <div className="notification-item" key={msg.id}>
                  <img src={msg.avatar} alt={msg.from} className="item-avatar" />
                  <div className="item-content">
                    <strong>Book inquiry from {msg.from}</strong>
                    <p>"{msg.text}"</p>
                  </div>
                  <button onClick={() => handleDeleteMessage(msg.id)} className="delete-notification-btn" aria-label={`Delete inquiry from ${msg.from}`}>
                    <Trash2 size={18} />
                  </button>
                </div>
              )) : <p className="text-gray-500">No book inquiries yet.</p>}
              </div>
            </div>
          </div>
        );
      // --- JSX FOR NEW SECURITY TAB ---
      case 'security':
        return (
          <div>
            <div className="section-header">
              <h3>Security</h3>
              <p>Update your password and manage your account security.</p>
            </div>

            {/* Password Update Section */}
            <div className="security-section">
              <h4>Change Password</h4>
              <form onSubmit={handlePasswordSubmit}>
                <div className="input-field with-icon">
                  <label htmlFor="currentPassword">Current password</label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="icon-btn">
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="input-field with-icon">
                  <label htmlFor="newPassword">New password</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="icon-btn">
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="input-field">
                  <label htmlFor="confirmPassword">Confirm new password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="form-footer">
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? <Loader className="animate-spin" size={16} /> : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

            {/* Report User Section */}
            <div className="security-section">
              <h4>Report a User</h4>
              <p>If you've encountered inappropriate behavior, please report it to help keep our community safe.</p>
              <button
                className="report-btn"
                onClick={() => setActiveTab('report-user')}
              >
                <AlertTriangle size={16} /> Report a User
              </button>
            </div>
          </div>
        );
      case 'report-user':
        return (
          <div>
            <div className="section-header">
              <button onClick={() => setActiveTab('security')} className="back-btn">
                <ArrowLeft size={20} /> Back to Security
              </button>
              <h3>Report a User</h3>
              <p>Help us keep the community safe by reporting inappropriate behavior.</p>
            </div>

            <form onSubmit={handleSubmitReport}>
              <div className="search-section">
                <h4>Step 1: Find the user you want to report</h4>
                <div className="search-form">
                  <div className="input-field">
                    <input
                      type="text"
                      placeholder="Search by username"
                      value={searchTerm}
                      onChange={handleSearchInputChange}
                    />
                    {searchLoading && (
                      <div className="search-loading">Searching...</div>
                    )}
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map(user => (
                      <div
                        key={user._id}
                        className="search-result-item"
                        onClick={() => handleSelectUser(user)}
                      >
                        <img
                          src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=818cf8&color=fff`}
                          alt={user.name}
                          className="user-avatar"
                        />
                        <div className="user-info">
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.length === 0 && searchTerm && !searchLoading && (
                  <p className="no-results">No users found. Try a different search term.</p>
                )}
              </div>

              {reportData.reportedUserId && (
                <div className="report-details">
                  <h4>Step 2: Provide report details</h4>
                  <div className="input-field">
                    <label>Reason for report:</label>
                    <select
                      name="reason"
                      value={reportData.reason}
                      onChange={handleReportChange}
                      required
                    >
                      <option value="">Select a reason</option>
                      <option value="inappropriate_behavior">Inappropriate Behavior</option>
                      <option value="scam">Scam or Fraud</option>
                      <option value="fake_listing">Fake Book Listing</option>
                      <option value="harassment">Harassment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="input-field">
                    <label>Description:</label>
                    <textarea
                      name="description"
                      placeholder="Please provide details about the issue"
                      value={reportData.description}
                      onChange={handleReportChange}
                      required
                      rows={5}
                    />
                  </div>

                  <div className="form-footer">
                    <button type="button" onClick={() => setActiveTab('security')} className="cancel-btn">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="save-btn"
                      disabled={loading || !reportData.reason || !reportData.description}
                    >
                      {loading ? <Loader className="animate-spin" size={16} /> : 'Submit Report'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        );
      case 'gamification':
        return (
          <div>
            <div className="section-header">
              <h3>Reading Journey</h3>
              <p>Track your achievements, join clubs, and compete with fellow readers.</p>
            </div>
            <GamificationSection 
              activeSubTab={activeSubTab} 
              setActiveSubTab={setActiveSubTab} 
            />
          </div>
        );
      default:
        return (
          <div>
            <div className="section-header">
              <h3>Coming Soon</h3>
              <p>This feature is currently under development.</p>
            </div>
          </div>
        );
    }
  }

  return (
    <StyledWrapper>
      <div className="sidebar">
        <nav>
          <a href="#profile" onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'active' : ''}>
            <User size={20} /> My Profile
          </a>
          <a href="#location" onClick={() => setActiveTab('location')} className={activeTab === 'location' ? 'active' : ''}>
            <MapPin size={20} /> Location
          </a>
          <a href="#notifications" onClick={() => setActiveTab('notifications')} className={`notification-link ${activeTab === 'notifications' ? 'active' : ''}`}>
            <div className="bell-wrapper">
              <Bell size={20} />
              {totalNotifications > 0 && <span className="notification-badge"></span>}
            </div>
            <span>Notifications</span>
            {totalNotifications > 0 && <span className="notification-count">{totalNotifications}</span>}
          </a>
          <a href="#gamification" onClick={() => setActiveTab('gamification')} className={activeTab === 'gamification' ? 'active' : ''}>
            <Trophy size={20} /> Reading Journey
          </a>
          <a href="#security" onClick={() => setActiveTab('security')} className={activeTab === 'security' ? 'active' : ''}>
            <Lock size={20} /> Security
          </a>
          <a href="#report-user" onClick={() => setActiveTab('report-user')} className={activeTab === 'report-user' ? 'active' : ''}>
            <AlertTriangle size={20} /> Report User
          </a>
        </nav>
      </div>
      <div className="main-content">
        {renderContent()}
      </div>
    </StyledWrapper>
  );
};

// --- STYLES ---
const StyledWrapper = styled.div`
  display: flex;
  max-width: 1200px;
  margin: 2rem auto;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
  
  .sidebar {
    width: 280px;
    flex-shrink: 0;
    background: #ffffff;
    padding: 2rem;
    border-right: 1px solid #e5e7eb;

    nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      a {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        text-decoration: none;
        font-weight: 600;
        color: #374151;
        transition: background-color 0.2s, color 0.2s;

        &:hover { background-color: #f3f4f6; }
        &.active { background-color: #f3f4f6; color: #111827; }
      }
    }
  }

  .notification-link {
    position: relative;
    justify-content: flex-start;
    .bell-wrapper { position: relative; }
    .notification-badge {
        position: absolute; top: -2px; right: -2px; width: 8px; height: 8px;
        border-radius: 50%; background-color: #ef4444; border: 1px solid white;
    }
    .notification-count {
        margin-left: auto; font-size: 0.8rem; font-weight: 700;
        background-color: #e0e7ff; color: #4f46e5;
        padding: 0.1rem 0.5rem; border-radius: 9999px;
    }
  }

  .main-content {
    flex: 1;
    padding: 3rem;
    background-color: #f9fafb;
    
    /* Report User Styles */
    .security-password-section {
      margin-bottom: 2rem;
    }
    
    .security-report-section {
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }
    
    .report-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      color: #dc3545;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
      margin-top: 1rem;
      
      &:hover {
        background-color: #f1f3f5;
        border-color: #dc3545;
      }
    }

    .section-header {
      padding-bottom: 1.5rem; border-bottom: 1px solid #e5e7eb; margin-bottom: 2rem;
      h3 { font-size: 1.5rem; font-weight: 700; color: #111827; }
      p { color: #6b7280; margin-top: 0.25rem; }
    }
    
    .avatar-section {
        display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2.5rem;
    }
    .avatar-uploader {
        position: relative; cursor: pointer; border-radius: 50%;
        .avatar-image {
            height: 96px; width: 96px; border-radius: 50%; object-fit: cover;
            border: 4px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            transition: filter 0.2s ease-in-out;
        }
        .camera-overlay {
            position: absolute; inset: 0; background-color: rgba(17, 24, 39, 0.6);
            color: white; display: flex; align-items: center; justify-content: center;
            border-radius: 50%; opacity: 0; transition: opacity 0.2s ease-in-out;
        }
        &:hover .avatar-image { filter: brightness(0.9); }
        &:hover .camera-overlay { opacity: 1; }
    }
    .user-name { font-size: 1.75rem; font-weight: 700; color: #111827; }
    .user-email { font-size: 1rem; color: #6b7280; }
    
    .input-field {
        margin-bottom: 1.5rem;
        position: relative; /* Added for icon positioning */
        label { display: block; font-weight: 600; margin-bottom: 0.5rem; color: #374151; }
        input {
            width: 100%; padding: 0.75rem 1rem; border: 1px solid #d1d5db;
            border-radius: 0.5rem; font-size: 1rem; transition: border-color 0.2s, box-shadow 0.2s;
            &:focus {
                outline: none; border-color: #4f46e5;
                box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
            }
        }
        /* Style for inputs with an icon */
        &.with-icon input {
            padding-right: 3rem; /* Make space for the icon button */
        }
        .icon-btn {
            position: absolute;
            top: 50%;
            right: 0.5rem;
            transform: translateY(25%); /* Adjust vertical alignment */
            background: none;
            border: none;
            cursor: pointer;
            color: #9ca3af;
            padding: 0.25rem;
            &:hover {
                color: #374151;
            }
        }
    }

    .form-footer {
        display: flex; justify-content: flex-end; gap: 1rem;
        padding-top: 1.5rem; border-top: 1px solid #e5e7eb; margin-top: 2rem;
        .cancel-btn, .save-btn {
            padding: 0.6rem 1.25rem; border-radius: 0.5rem; font-weight: 600;
            cursor: pointer; border: 1px solid transparent; transition: all 0.2s;
        }
        .cancel-btn {
            background: white; border-color: #d1d5db; color: #111827;
            &:hover { background-color: #f9fafb; }
        }
        .save-btn, .search-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
            background: #111827; color: white; display: flex; align-items: center; gap: 0.5rem;
            &:hover { background-color: #374151; }
            &:disabled { background-color: #9ca3af; cursor: not-allowed; }
        }
    }
    .location-content {
        p { margin-bottom: 1.5rem; color: #374151; line-height: 1.6; }
        .location-btn {
            display: inline-flex; align-items: center; gap: 0.5rem; background-color: white;
            color: #374151; border: 1px solid #d1d5db; font-size: 1rem; font-weight: 600;
            padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.2s;
            &:hover:not(:disabled) { background-color: #f9fafb; }
            &:disabled { color: #9ca3af; cursor: not-allowed; }
        }
    }
    /* Report User Form Styles */
    .back-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      color: #6b7280;
      padding: 0.5rem 0;
      cursor: pointer;
      font-weight: 600;
      margin-bottom: 1rem;
      
      &:hover {
        color: #111827;
      }
    }
    
    .search-form {
      position: relative;
      margin-bottom: 1rem;
      
      .input-field {
        position: relative;
        
        input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 1rem;
          
          &:focus {
            outline: none;
            border-color: #4F46E5;
            box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
          }
        }
        
        .search-loading {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          font-size: 0.875rem;
        }
      }
    }
    
    .search-results {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
      
      .search-result-item {
        display: flex;
        align-items: center;
        padding: 0.75rem 1rem;
        cursor: pointer;
        border-bottom: 1px solid #e5e7eb;
        
        &:last-child {
          border-bottom: none;
        }
        
        &:hover {
          background-color: #f3f4f6;
        }
        
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin-right: 1rem;
          object-fit: cover;
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
          
          strong {
            font-weight: 600;
            color: #111827;
          }
          
          span {
            font-size: 0.875rem;
            color: #6b7280;
          }
        }
      }
    }
    
    .no-results {
      padding: 1rem;
      text-align: center;
      color: #6b7280;
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
    }
    
    .notification-list {
        display: flex; flex-direction: column; gap: 1.5rem;
        .messages-scroll { max-height: 260px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0 0.25rem; }
        h4 {
            font-size: 1rem; font-weight: 700; color: #111827;
            padding-bottom: 0.5rem; border-bottom: 1px solid #e5e7eb;
            margin-bottom: 0;
            &.mt-8 { margin-top: 2rem; }
        }
        .notification-item {
            display: flex; 
        align-items: center;
        gap: 1rem; 
        padding: 1rem 0;
            .item-icon {
                width: 40px; height: 40px; border-radius: 50%; display: flex;
                align-items: center; justify-content: center; flex-shrink: 0;
                &.pending { background-color: #fef3c7; color: #92400e; }
                &.approved { background-color: #dbeafe; color: #1e40af; }
            }
            .item-avatar {
                width: 40px; height: 40px; border-radius: 50%; object-fit: cover;
            }
            .item-content {
            flex-grow: 1;
                strong { font-weight: 600; color: #1f2937; }
                p { color: #6b7280; margin-top: 0.25rem; line-height: 1.5; }
            }
        }
      
      .delete-notification-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #9ca3af;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.2s ease-in-out;
        margin-left: auto;
        flex-shrink: 0;
      }
      .delete-notification-btn:hover {
        color: #ef4444;
        background-color: #fee2e2;
      }
    }
  }
`;

export default Profile;