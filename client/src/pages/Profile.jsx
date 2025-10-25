import React, { useContext, useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { AuthContext } from '../context/AuthContext';
import { authAPI, borrowAPI, messagesAPI, reportAPI, usersAPI } from '../utils/api';
import toast from 'react-hot-toast';

// Import new icons for the password fields
import { Loader, Camera, MapPin, User, Mail, Bell, Lock, BookOpen, Trash2, Eye, EyeOff, AlertTriangle, ArrowLeft, Trophy, Shield, Activity, RefreshCw, Search, CheckCircle, ChevronRight } from 'lucide-react';
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState([]);
  
  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    loginAlerts: true,
    sessionTimeout: '30',
    accountVisibility: 'public'
  });
  
  // Account activity state
  const [accountActivity, setAccountActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

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
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    
    // Check password strength for new password
    if (name === 'newPassword') {
      checkPasswordStrength(value);
    }
  };

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let strength = 0;
    const feedback = [];
    
    if (password.length >= 8) {
      strength += 1;
    } else {
      feedback.push('At least 8 characters');
    }
    
    if (/[a-z]/.test(password)) {
      strength += 1;
    } else {
      feedback.push('One lowercase letter');
    }
    
    if (/[A-Z]/.test(password)) {
      strength += 1;
    } else {
      feedback.push('One uppercase letter');
    }
    
    if (/\d/.test(password)) {
      strength += 1;
    } else {
      feedback.push('One number');
    }
    
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength += 1;
    } else {
      feedback.push('One special character');
    }
    
    setPasswordStrength(strength);
    setPasswordFeedback(feedback);
  };

  // Security settings handler
  const handleSecuritySettingChange = (setting, value) => {
    setSecuritySettings(prev => ({ ...prev, [setting]: value }));
  };

  // Save security settings
  const handleSaveSecuritySettings = async () => {
    setLoading(true);
    try {
      await authAPI.updateSecuritySettings(securitySettings);
      toast.success('Security settings updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update security settings.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch account activity
  const fetchAccountActivity = async () => {
    setLoadingActivity(true);
    try {
      const response = await authAPI.getAccountActivity();
      const activityData = response.data.activity || [];
      
      // Convert timestamp strings to Date objects if needed
      const processedActivity = activityData.map(activity => ({
        ...activity,
        timestamp: new Date(activity.timestamp)
      }));
      
      setAccountActivity(processedActivity);
    } catch (error) {
      console.error('Failed to fetch account activity:', error);
      // Don't show error toast as the API now exists
      // Just set empty array if there's an error
      setAccountActivity([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  // Load security settings from user profile
  useEffect(() => {
    if (user && user.securitySettings) {
      setSecuritySettings({
        twoFactorEnabled: user.securitySettings.twoFactorEnabled || false,
        emailNotifications: user.securitySettings.emailNotifications !== false,
        loginAlerts: user.securitySettings.loginAlerts !== false,
        sessionTimeout: user.securitySettings.sessionTimeout || '30',
        accountVisibility: user.securitySettings.accountVisibility || 'public'
      });
    }
  }, [user]);

  // Load account activity on security tab access
  useEffect(() => {
    if (activeTab === 'security') {
      fetchAccountActivity();
    }
  }, [activeTab]);

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
              <h3>Security & Privacy</h3>
              <p>Manage your account security, privacy settings, and monitor account activity.</p>
            </div>

            {/* Password Update Section */}
            <div className="security-section">
              <div className="security-section-header">
                <Lock size={20} />
                <h4>Change Password</h4>
              </div>
              <p className="security-description">
                Keep your account secure by using a strong, unique password.
              </p>
              
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
                    placeholder="Enter your current password"
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
                    placeholder="Enter a strong new password"
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="icon-btn">
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordData.newPassword && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className={`strength-fill strength-${passwordStrength}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                    <div className="strength-text">
                      <span className={`strength-label strength-${passwordStrength}`}>
                        {passwordStrength === 0 && 'Very Weak'}
                        {passwordStrength === 1 && 'Weak'}
                        {passwordStrength === 2 && 'Fair'}
                        {passwordStrength === 3 && 'Good'}
                        {passwordStrength === 4 && 'Strong'}
                        {passwordStrength === 5 && 'Very Strong'}
                      </span>
                    </div>
                    {passwordFeedback.length > 0 && (
                      <div className="password-feedback">
                        <p>Password should include:</p>
                        <ul>
                          {passwordFeedback.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="input-field with-icon">
                  <label htmlFor="confirmPassword">Confirm new password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Confirm your new password"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="icon-btn">
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {passwordData.confirmPassword && (
                  <div className={`password-match ${passwordData.newPassword === passwordData.confirmPassword ? 'match' : 'no-match'}`}>
                    {passwordData.newPassword === passwordData.confirmPassword ? (
                      <span className="match-text">✓ Passwords match</span>
                    ) : (
                      <span className="no-match-text">✗ Passwords do not match</span>
                    )}
                  </div>
                )}

                <div className="form-footer">
                  <button 
                    type="submit" 
                    className="save-btn" 
                    disabled={loading || passwordStrength < 3 || passwordData.newPassword !== passwordData.confirmPassword}
                  >
                    {loading ? <Loader className="animate-spin" size={16} /> : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

            {/* Security Settings Section */}
            <div className="security-section">
              <div className="security-section-header">
                <Shield size={20} />
                <h4>Security Settings</h4>
              </div>
              <p className="security-description">
                Configure additional security measures for your account.
              </p>

              <div className="security-options">
                <div className="security-option">
                  <div className="option-info">
                    <h5>Two-Factor Authentication</h5>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <div className="option-control">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={securitySettings.twoFactorEnabled}
                        onChange={(e) => handleSecuritySettingChange('twoFactorEnabled', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="security-option">
                  <div className="option-info">
                    <h5>Email Notifications</h5>
                    <p>Get notified about important security events</p>
                  </div>
                  <div className="option-control">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={securitySettings.emailNotifications}
                        onChange={(e) => handleSecuritySettingChange('emailNotifications', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="security-option">
                  <div className="option-info">
                    <h5>Login Alerts</h5>
                    <p>Get alerts when someone logs into your account</p>
                  </div>
                  <div className="option-control">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={securitySettings.loginAlerts}
                        onChange={(e) => handleSecuritySettingChange('loginAlerts', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="security-option">
                  <div className="option-info">
                    <h5>Session Timeout</h5>
                    <p>Automatically log out after inactivity</p>
                  </div>
                  <div className="option-control">
                    <select
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => handleSecuritySettingChange('sessionTimeout', e.target.value)}
                      className="security-select"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>

                <div className="security-option">
                  <div className="option-info">
                    <h5>Account Visibility</h5>
                    <p>Control who can see your profile</p>
                  </div>
                  <div className="option-control">
                    <select
                      value={securitySettings.accountVisibility}
                      onChange={(e) => handleSecuritySettingChange('accountVisibility', e.target.value)}
                      className="security-select"
                    >
                      <option value="public">Public</option>
                      <option value="friends">Friends Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-footer">
                <button 
                  className="save-btn"
                  onClick={handleSaveSecuritySettings}
                  disabled={loading}
                >
                  {loading ? <Loader className="animate-spin" size={16} /> : 'Save Security Settings'}
                </button>
              </div>
            </div>

            {/* Account Activity Section */}
            <div className="security-section">
              <div className="security-section-header">
                <Activity size={20} />
                <h4>Recent Account Activity</h4>
              </div>
              <p className="security-description">
                Monitor recent logins and account changes for suspicious activity.
              </p>

              {loadingActivity ? (
                <div className="activity-loading">
                  <Loader className="animate-spin" size={20} />
                  <span>Loading activity...</span>
                </div>
              ) : (
                <div className="activity-list">
                  {accountActivity.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">
                        {activity.action === 'Login' && <User size={16} />}
                        {activity.action === 'Password Changed' && <Lock size={16} />}
                        {activity.action === 'Profile Updated' && <User size={16} />}
                      </div>
                      <div className="activity-details">
                        <div className="activity-main">
                          <strong>{activity.action}</strong>
                          <span className="activity-time">
                            {activity.timestamp.toLocaleDateString()} at {activity.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="activity-meta">
                          <span>{activity.device}</span>
                          <span>•</span>
                          <span>{activity.location}</span>
                          <span>•</span>
                          <span>{activity.ip}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="activity-actions">
                <button 
                  className="secondary-btn"
                  onClick={fetchAccountActivity}
                  disabled={loadingActivity}
                >
                  <RefreshCw size={16} />
                  Refresh Activity
                </button>
                <button className="danger-btn">
                  <AlertTriangle size={16} />
                  Report Suspicious Activity
                </button>
              </div>
            </div>

            {/* Report User Section */}
            <div className="security-section">
              <div className="security-section-header">
                <AlertTriangle size={20} />
                <h4>Report & Safety</h4>
              </div>
              <p className="security-description">
                Help keep our community safe by reporting inappropriate behavior or content.
              </p>
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
              <p>Help us keep the community safe by reporting inappropriate behavior or violations.</p>
            </div>

            {/* Report Guidelines */}
            <div className="report-guidelines">
              <div className="guidelines-header">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h4>Reporting Guidelines</h4>
              </div>
              <div className="guidelines-content">
                <p>Please only report users for genuine violations of our community standards:</p>
                <ul>
                  <li>• Harassment, bullying, or threatening behavior</li>
                  <li>• Fraudulent activities or scams</li>
                  <li>• Inappropriate or offensive content</li>
                  <li>• Fake profiles or impersonation</li>
                  <li>• Spam or unwanted solicitation</li>
                </ul>
                <p className="warning-text">
                  <strong>Note:</strong> False reports may result in action against your account.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitReport}>
              {/* Step 1: User Search */}
              <div className="report-step">
                <div className="step-header">
                  <div className="step-number">1</div>
                  <h4>Find the user you want to report</h4>
                </div>
                
                <div className="search-form">
                  <div className="input-field">
                    <label>Search for user</label>
                    <div className="search-input-wrapper">
                      <Search className="search-icon" size={20} />
                      <input
                        type="text"
                        placeholder="Enter username or email address"
                        value={searchTerm}
                        onChange={handleSearchInputChange}
                        className="search-input"
                      />
                      {searchLoading && (
                        <div className="search-loading">
                          <Loader className="animate-spin" size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Selected User Display */}
                {reportData.reportedUserId && (
                  <div className="selected-user">
                    <div className="selected-user-header">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Selected User</span>
                    </div>
                    {searchResults.find(u => u._id === reportData.reportedUserId) && (
                      <div className="user-card selected">
                        <img
                          src={searchResults.find(u => u._id === reportData.reportedUserId).avatar || 
                               `https://ui-avatars.com/api/?name=${searchResults.find(u => u._id === reportData.reportedUserId).name}&background=818cf8&color=fff`}
                          alt={searchResults.find(u => u._id === reportData.reportedUserId).name}
                          className="user-avatar"
                        />
                        <div className="user-info">
                          <strong>{searchResults.find(u => u._id === reportData.reportedUserId).name}</strong>
                          <span>{searchResults.find(u => u._id === reportData.reportedUserId).email}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            setReportData(prev => ({ ...prev, reportedUserId: '' }));
                            setSearchTerm('');
                          }}
                          className="remove-selection"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && !reportData.reportedUserId && (
                  <div className="search-results">
                    <div className="results-header">
                      <span>{searchResults.length} user{searchResults.length !== 1 ? 's' : ''} found</span>
                    </div>
                    {searchResults.map(user => (
                      <div
                        key={user._id}
                        className="user-card clickable"
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
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.length === 0 && searchTerm && !searchLoading && (
                  <div className="no-results">
                    <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p>No users found matching "{searchTerm}"</p>
                    <p className="text-sm">Try searching with a different username or email</p>
                  </div>
                )}
              </div>

              {/* Step 2: Report Details */}
              {reportData.reportedUserId && (
                <div className="report-step">
                  <div className="step-header">
                    <div className="step-number">2</div>
                    <h4>Provide report details</h4>
                  </div>
                  
                  <div className="report-form">
                    <div className="input-field">
                      <label>What type of violation is this?</label>
                      <select
                        name="reason"
                        value={reportData.reason}
                        onChange={handleReportChange}
                        required
                        className="report-select"
                      >
                        <option value="">Select a violation type</option>
                        <option value="harassment">Harassment or Bullying</option>
                        <option value="inappropriate_behavior">Inappropriate Behavior</option>
                        <option value="scam">Scam or Fraudulent Activity</option>
                        <option value="fake_listing">Fake Book Listings</option>
                        <option value="spam">Spam or Unwanted Messages</option>
                        <option value="impersonation">Fake Profile or Impersonation</option>
                        <option value="threats">Threats or Violence</option>
                        <option value="other">Other Violation</option>
                      </select>
                    </div>

                    <div className="input-field">
                      <label>Detailed description</label>
                      <textarea
                        name="description"
                        placeholder="Please provide specific details about what happened, including dates, messages, or actions that violate our community guidelines..."
                        value={reportData.description}
                        onChange={handleReportChange}
                        required
                        rows={6}
                        className="report-textarea"
                      />
                      <div className="character-count">
                        {reportData.description.length}/1000 characters
                      </div>
                    </div>

                    {/* Evidence Upload (Future Enhancement) */}
                    <div className="evidence-section">
                      <label>Evidence (Optional)</label>
                      <div className="evidence-upload">
                        <div className="upload-placeholder">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p>Screenshots or other evidence</p>
                          <p className="text-sm text-gray-500">Coming soon - For now, please describe evidence in detail above</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Submit */}
              {reportData.reportedUserId && reportData.reason && reportData.description && (
                <div className="report-step">
                  <div className="step-header">
                    <div className="step-number">3</div>
                    <h4>Review and submit</h4>
                  </div>
                  
                  <div className="report-summary">
                    <div className="summary-card">
                      <h5>Report Summary</h5>
                      <div className="summary-item">
                        <strong>Reported User:</strong> 
                        <span>{searchResults.find(u => u._id === reportData.reportedUserId)?.name || 'Selected User'}</span>
                      </div>
                      <div className="summary-item">
                        <strong>Violation Type:</strong> 
                        <span>{reportData.reason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      </div>
                      <div className="summary-item">
                        <strong>Description:</strong> 
                        <span>{reportData.description.substring(0, 100)}{reportData.description.length > 100 ? '...' : ''}</span>
                      </div>
                    </div>
                    
                    <div className="submission-notice">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <div>
                        <p><strong>Before you submit:</strong></p>
                        <p>Our moderation team will review this report within 24-48 hours. You'll be notified of any actions taken.</p>
                      </div>
                    </div>
                  </div>

                  <div className="form-footer">
                    <button type="button" onClick={() => setActiveTab('security')} className="cancel-btn">
                      <ArrowLeft size={16} />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="submit-report-btn"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader className="animate-spin" size={16} />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={16} />
                          Submit Report
                        </>
                      )}
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

    /* Enhanced Security Tab Styles */
    .security-section {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .security-section-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
      
      h4 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #111827;
        margin: 0;
      }
      
      svg {
        color: #4f46e5;
      }
    }

    .security-description {
      color: #6b7280;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }

    /* Password Strength Indicator */
    .password-strength {
      margin-top: 0.75rem;
      margin-bottom: 1rem;
    }

    .strength-bar {
      width: 100%;
      height: 4px;
      background-color: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .strength-fill {
      height: 100%;
      transition: all 0.3s ease;
      border-radius: 2px;
      
      &.strength-0, &.strength-1 { background-color: #ef4444; }
      &.strength-2 { background-color: #f59e0b; }
      &.strength-3 { background-color: #eab308; }
      &.strength-4 { background-color: #22c55e; }
      &.strength-5 { background-color: #16a34a; }
    }

    .strength-text {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .strength-label {
      font-size: 0.875rem;
      font-weight: 500;
      
      &.strength-0, &.strength-1 { color: #ef4444; }
      &.strength-2 { color: #f59e0b; }
      &.strength-3 { color: #eab308; }
      &.strength-4 { color: #22c55e; }
      &.strength-5 { color: #16a34a; }
    }

    .password-feedback {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background-color: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 0.5rem;
      
      p {
        font-size: 0.875rem;
        font-weight: 500;
        color: #92400e;
        margin: 0 0 0.5rem 0;
      }
      
      ul {
        margin: 0;
        padding-left: 1.25rem;
        
        li {
          font-size: 0.875rem;
          color: #92400e;
          margin-bottom: 0.25rem;
        }
      }
    }

    /* Password Match Indicator */
    .password-match {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      
      &.match .match-text {
        color: #16a34a;
      }
      
      &.no-match .no-match-text {
        color: #ef4444;
      }
    }

    /* Security Options */
    .security-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .security-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      
      .option-info {
        flex: 1;
        
        h5 {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.25rem 0;
        }
        
        p {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }
      }
      
      .option-control {
        flex-shrink: 0;
        margin-left: 1rem;
      }
    }

    /* Toggle Switch */
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
      
      input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #d1d5db;
        transition: 0.3s;
        border-radius: 24px;
        
        &:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }
      }
      
      input:checked + .toggle-slider {
        background-color: #4f46e5;
      }
      
      input:checked + .toggle-slider:before {
        transform: translateX(20px);
      }
    }

    /* Security Select */
    .security-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background-color: white;
      font-size: 0.875rem;
      color: #374151;
      min-width: 120px;
      
      &:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
      }
    }

    /* Account Activity */
    .activity-loading {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 2rem;
      justify-content: center;
      color: #6b7280;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      
      .activity-icon {
        width: 32px;
        height: 32px;
        background-color: #e0e7ff;
        color: #4f46e5;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      
      .activity-details {
        flex: 1;
        
        .activity-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
          
          strong {
            font-weight: 600;
            color: #111827;
          }
          
          .activity-time {
            font-size: 0.875rem;
            color: #6b7280;
          }
        }
        
        .activity-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }
      }
    }

    .activity-actions {
      display: flex;
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    /* Button Styles */
    .secondary-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background-color: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover:not(:disabled) {
        background-color: #e5e7eb;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .danger-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background-color: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background-color: #fee2e2;
        border-color: #fca5a5;
      }
    }

    /* Enhanced Report User Styles */
    .report-guidelines {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #f59e0b;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
      
      .guidelines-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
        
        h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #92400e;
          margin: 0;
        }
      }
      
      .guidelines-content {
        color: #92400e;
        
        p {
          margin-bottom: 0.75rem;
          line-height: 1.5;
        }
        
        ul {
          margin: 1rem 0;
          padding-left: 1.25rem;
          
          li {
            margin-bottom: 0.5rem;
            line-height: 1.4;
          }
        }
        
        .warning-text {
          background: rgba(146, 64, 14, 0.1);
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-top: 1rem;
          font-size: 0.875rem;
        }
      }
    }

    .report-step {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      
      .step-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
        
        .step-number {
          width: 2rem;
          height: 2rem;
          background: #4f46e5;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
      }
    }

    .search-input-wrapper {
      position: relative;
      
      .search-icon {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
      }
      
      .search-input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        font-size: 1rem;
        transition: all 0.2s;
        
        &:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
        }
      }
      
      .search-loading {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: #6b7280;
      }
    }

    .selected-user {
      margin-top: 1rem;
      
      .selected-user-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #059669;
      }
    }

    .user-card {
      display: flex;
      align-items: center;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      transition: all 0.2s;
      
      &.clickable {
        cursor: pointer;
        
        &:hover {
          background-color: #f9fafb;
          border-color: #4f46e5;
        }
      }
      
      &.selected {
        background-color: #f0fdf4;
        border-color: #22c55e;
      }
      
      .user-avatar {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        object-fit: cover;
        margin-right: 1rem;
      }
      
      .user-info {
        flex: 1;
        
        strong {
          display: block;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.25rem;
        }
        
        span {
          font-size: 0.875rem;
          color: #6b7280;
        }
      }
      
      .remove-selection {
        background: none;
        border: none;
        color: #ef4444;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 0.375rem;
        transition: background-color 0.2s;
        
        &:hover {
          background-color: #fee2e2;
        }
      }
    }

    .search-results {
      margin-top: 1rem;
      
      .results-header {
        padding: 0.5rem 0;
        font-size: 0.875rem;
        color: #6b7280;
        border-bottom: 1px solid #e5e7eb;
        margin-bottom: 0.5rem;
      }
      
      .user-card + .user-card {
        margin-top: 0.5rem;
      }
    }

    .no-results {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
      
      p {
        margin: 0.5rem 0;
        
        &:first-of-type {
          font-weight: 500;
          color: #374151;
        }
      }
    }

    .report-form {
      .report-select, .report-textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        font-size: 1rem;
        transition: all 0.2s;
        
        &:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
        }
      }
      
      .character-count {
        text-align: right;
        font-size: 0.75rem;
        color: #9ca3af;
        margin-top: 0.5rem;
      }
    }

    .evidence-section {
      .evidence-upload {
        border: 2px dashed #d1d5db;
        border-radius: 0.5rem;
        padding: 2rem;
        text-align: center;
        background-color: #f9fafb;
        
        .upload-placeholder {
          color: #6b7280;
          
          p {
            margin: 0.5rem 0;
            
            &:first-of-type {
              font-weight: 500;
            }
          }
        }
      }
    }

    .report-summary {
      .summary-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        padding: 1.5rem;
        margin-bottom: 1rem;
        
        h5 {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 1rem 0;
        }
        
        .summary-item {
          display: flex;
          margin-bottom: 0.75rem;
          
          strong {
            min-width: 8rem;
            color: #475569;
            font-weight: 500;
          }
          
          span {
            color: #1e293b;
          }
        }
      }
      
      .submission-notice {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background: #fffbeb;
        border: 1px solid #fbbf24;
        border-radius: 0.5rem;
        
        div {
          p {
            margin: 0.25rem 0;
            color: #92400e;
            font-size: 0.875rem;
            
            &:first-child {
              font-weight: 600;
            }
          }
        }
      }
    }

    .submit-report-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #dc2626;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover:not(:disabled) {
        background: #b91c1c;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
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