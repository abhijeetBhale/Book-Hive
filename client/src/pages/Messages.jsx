import React, { useEffect, useState, useContext, useRef, Fragment } from 'react';
import styled from 'styled-components';
import { messagesAPI, usersAPI } from '../utils/api';
import { importPrivateKeyFromIndexedDB, encryptMessage, decryptMessage } from '../utils/crypto';
import { useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { Search, Phone, Video, MoreHorizontal, Send, Paperclip, Smile, Check, CheckCheck, Trash2, Palette, X, Image, File, ArrowLeft } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

// Modern Messages Page Design
const Wrapper = styled.div`
  display: flex;
  height: calc(100vh - 80px);
  background: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  padding: 0;
  overflow: hidden;

  /* Mobile responsive layout */
  @media (max-width: 768px) {
    height: calc(100vh - 60px);
  }
`;

const Sidebar = styled.div`
  width: 320px;
  background: white;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  /* Mobile responsive sidebar */
  @media (max-width: 768px) {
    width: 100%;
    position: ${props => props.$showOnMobile ? 'relative' : 'absolute'};
    left: ${props => props.$showOnMobile ? '0' : '-100%'};
    z-index: 10;
    transition: left 0.3s ease;
    height: 100%;
  }
`;

const SidebarHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .user-name {
    font-size: 18px;
    font-weight: 600;
    color: #1a202c;
  }
  
  .search-container {
    position: relative;
  }
  
  .search-input {
    width: 100%;
    padding: 10px 12px 10px 40px;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    background: #f7fafc;
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
    
    &:focus {
      border-color: #4299e1;
      background: white;
    }
    
    &::placeholder {
      color: #a0aec0;
    }
  }
  
  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #a0aec0;
  }
`;

const ChatTabs = styled.div`
  display: flex;
  padding: 0 20px;
  border-bottom: 1px solid #e2e8f0;
  
  .tab {
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 500;
    color: #718096;
    background: none;
    border: none;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    
    &.active {
      color: #4299e1;
      border-bottom-color: #4299e1;
    }
    
    &:hover {
      color: #4299e1;
    }
  }
`;

const ConversationsList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ConversationItem = styled.button`
  width: 100%;
  padding: 16px 20px;
  border: none;
  background: ${props => props.$active ? '#edf2f7' : 'transparent'};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  transition: background 0.2s;
  
  &:hover {
    background: #f7fafc;
  }
  
  .avatar-container {
    position: relative;
    flex-shrink: 0;
  }
  
  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .online-indicator {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    background: #48bb78;
    border: 2px solid white;
    border-radius: 50%;
  }
  
  .conversation-info {
    flex: 1;
    min-width: 0;
  }
  
  .conversation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  
  .name {
    font-size: 15px;
    font-weight: 600;
    color: #2d3748;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .time {
    font-size: 12px;
    color: #a0aec0;
    flex-shrink: 0;
  }
  
  .last-message {
    font-size: 14px;
    color: #718096;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .unread-badge {
    background: #e53e3e;
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
  }
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;

  /* Mobile responsive chat area */
  @media (max-width: 768px) {
    width: 100%;
    position: ${props => props.$showOnMobile ? 'relative' : 'absolute'};
    right: ${props => props.$showOnMobile ? '0' : '-100%'};
    z-index: 5;
    transition: right 0.3s ease;
    height: 100%;
  }
`;

const ChatHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  
  .chat-user-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .mobile-back-btn {
    background: none;
    border: none;
    color: #4299e1;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
    margin-right: 8px;

    &:hover {
      background-color: #f7fafc;
    }

    @media (min-width: 769px) {
      display: none;
    }
  }
  
  .chat-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .chat-user-details {
    .name {
      font-size: 16px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 2px;
    }
    
    .status {
      font-size: 13px;
      color: #718096;
    }
  }
  
  .chat-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .action-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: #f7fafc;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #718096;
    transition: all 0.2s;
    
    &:hover {
      background: #edf2f7;
      color: #4299e1;
    }
  }
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DateSeparator = styled.div`
  text-align: center;
  margin: 20px 0;
  
  .date-text {
    display: inline-block;
    padding: 6px 12px;
    background: rgba(0, 0, 0, 0.1);
    color: #718096;
    font-size: 12px;
    font-weight: 500;
    border-radius: 12px;
    backdrop-filter: blur(10px);
  }
`;

const MessageGroup = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 16px;
  flex-direction: ${props => props.$isMe ? 'row-reverse' : 'row'};
  
  .message-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    margin-top: 4px;
  }
  
  .messages-container {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-width: 60%;
    align-items: ${props => props.$isMe ? 'flex-end' : 'flex-start'};
  }
`;

const MessageBubble = styled.div`
  padding: 12px 16px;
  border-radius: 18px;
  word-wrap: break-word;
  position: relative;
  max-width: 100%;
  
  ${props => props.$isMe ? `
    background: #4299e1;
    color: white;
    border-bottom-right-radius: 6px;
  ` : `
    background: white;
    color: #2d3748;
    border: 1px solid #e2e8f0;
    border-bottom-left-radius: 6px;
  `}
  
  .message-text {
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: 4px;
  }
  
  .message-time {
    font-size: 11px;
    opacity: 0.7;
    display: flex;
    align-items: center;
    gap: 4px;
    justify-content: flex-end;
    margin-top: 4px;
  }
`;

const SystemMessage = styled.div`
  text-align: center;
  margin: 12px 0;
  
  .system-text {
    display: inline-block;
    padding: 8px 12px;
    background: #e2e8f0;
    color: #4a5568;
    font-size: 13px;
    border-radius: 16px;
    max-width: 80%;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  
  .typing-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .typing-text {
    font-size: 13px;
    color: #718096;
    font-style: italic;
  }
`;

const MessageInput = styled.div`
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
  background: white;
  
  .input-container {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #f7fafc;
    border-radius: 24px;
    border: 1px solid #e2e8f0;
    transition: all 0.2s;
    
    &:focus-within {
      border-color: #4299e1;
      background: white;
    }
  }
  
  .input-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .input-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #718096;
    transition: all 0.2s;
    
    &:hover {
      background: #edf2f7;
      color: #4299e1;
    }
  }
  
  .message-input {
    flex: 1;
    border: none;
    background: none;
    outline: none;
    font-size: 14px;
    color: #2d3748;
    
    &::placeholder {
      color: #a0aec0;
    }
  }
  
  .send-btn {
    background: #4299e1;
    color: white;
    
    &:hover {
      background: #3182ce;
    }
    
    &:disabled {
      background: #cbd5e0;
      cursor: not-allowed;
    }
  }
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #718096;
  
  .empty-icon {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  .empty-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #4a5568;
  }
  
  .empty-subtitle {
    font-size: 14px;
    margin-bottom: 20px;
  }

  .mobile-show-conversations {
    background: #4299e1;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background: #3182ce;
    }

    @media (min-width: 769px) {
      display: none;
    }
  }
`;

// Dropdown Menu for More Options
const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 180px;
  overflow: hidden;
  
  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    font-size: 14px;
    color: #2d3748;
    background: none;
    border: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    transition: background 0.2s;
    
    &:hover {
      background: #f7fafc;
    }
    
    &.danger {
      color: #e53e3e;
      
      &:hover {
        background: #fed7d7;
      }
    }
  }
`;

// Modal Overlay
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

// Modal Content
const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    
    .modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
    }
    
    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #718096;
      padding: 4px;
      
      &:hover {
        color: #2d3748;
      }
    }
  }
  
  .modal-body {
    margin-bottom: 20px;
    
    .modal-text {
      color: #4a5568;
      line-height: 1.5;
      margin-bottom: 16px;
    }
  }
  
  .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    
    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      
      &.btn-secondary {
        background: #f7fafc;
        color: #4a5568;
        border: 1px solid #e2e8f0;
        
        &:hover {
          background: #edf2f7;
        }
      }
      
      &.btn-danger {
        background: #e53e3e;
        color: white;
        border: 1px solid #e53e3e;
        
        &:hover {
          background: #c53030;
        }
      }
    }
  }
`;

// Theme Selector
const ThemeSelector = styled.div`
  .theme-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 16px;
  }
  
  .theme-option {
    aspect-ratio: 16/9;
    border-radius: 8px;
    cursor: pointer;
    border: 2px solid transparent;
    overflow: hidden;
    transition: all 0.2s;
    
    &:hover {
      transform: scale(1.05);
    }
    
    &.active {
      border-color: #4299e1;
    }
    
    &.default {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
    }
    
    &.blue {
      background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%);
    }
    
    &.green {
      background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
    }
    
    &.purple {
      background: linear-gradient(135deg, #faf5ff 0%, #e9d8fd 100%);
    }
    
    &.pink {
      background: linear-gradient(135deg, #fff5f5 0%, #fed7e2 100%);
    }
    
    &.dark {
      background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
    }
  }
`;

// Coming Soon Toast
const ComingSoonToast = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: #4299e1;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 3000;
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

// Emoji Picker Container
const EmojiPickerContainer = styled.div`
  position: absolute;
  bottom: 100%;
  right: 0;
  z-index: 1000;
  
  .EmojiPickerReact {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }
`;

// File Upload Modal
const FileUploadModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  
  .upload-content {
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .upload-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    
    .upload-title {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
    }
    
    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #718096;
      padding: 4px;
      
      &:hover {
        color: #2d3748;
      }
    }
  }
  
  .file-drop-zone {
    border: 2px dashed #cbd5e0;
    border-radius: 8px;
    padding: 40px 20px;
    text-align: center;
    margin-bottom: 20px;
    transition: all 0.2s;
    cursor: pointer;
    
    &:hover, &.drag-over {
      border-color: #4299e1;
      background: #f7fafc;
    }
    
    .drop-icon {
      color: #a0aec0;
      margin-bottom: 12px;
    }
    
    .drop-text {
      color: #4a5568;
      font-size: 16px;
      margin-bottom: 8px;
    }
    
    .drop-subtext {
      color: #718096;
      font-size: 14px;
    }
  }
  
  .file-preview {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f7fafc;
    border-radius: 8px;
    margin-bottom: 20px;
    
    .file-icon {
      color: #4299e1;
    }
    
    .file-info {
      flex: 1;
      
      .file-name {
        font-weight: 500;
        color: #2d3748;
        margin-bottom: 4px;
      }
      
      .file-size {
        font-size: 12px;
        color: #718096;
      }
    }
    
    .remove-file {
      background: none;
      border: none;
      cursor: pointer;
      color: #e53e3e;
      padding: 4px;
      
      &:hover {
        color: #c53030;
      }
    }
  }
  
  .upload-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    
    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      
      &.btn-secondary {
        background: #f7fafc;
        color: #4a5568;
        border: 1px solid #e2e8f0;
        
        &:hover {
          background: #edf2f7;
        }
      }
      
      &.btn-primary {
        background: #4299e1;
        color: white;
        border: 1px solid #4299e1;
        
        &:hover {
          background: #3182ce;
        }
        
        &:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
        }
      }
    }
  }
`;

// File Message Bubble
const FileMessageBubble = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${props => props.$isMe ? 'rgba(255, 255, 255, 0.2)' : '#f7fafc'};
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$isMe ? 'rgba(255, 255, 255, 0.3)' : '#edf2f7'};
  }
  
  .file-icon {
    color: ${props => props.$isMe ? 'white' : '#4299e1'};
  }
  
  .file-info {
    flex: 1;
    
    .file-name {
      font-weight: 500;
      color: ${props => props.$isMe ? 'white' : '#2d3748'};
      margin-bottom: 4px;
      font-size: 14px;
    }
    
    .file-size {
      font-size: 12px;
      color: ${props => props.$isMe ? 'rgba(255, 255, 255, 0.8)' : '#718096'};
    }
  }
`;

const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const formatDateSeparator = (timestamp) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'sent': return <Check size={14} />;
    case 'delivered': return <CheckCheck size={14} />;
    case 'read': return <CheckCheck size={14} />;
    default: return <Check size={14} />;
  }
};

const shouldShowDateSeparator = (currentMessage, previousMessage) => {
  if (!previousMessage) return true;

  const currentDate = new Date(currentMessage.createdAt).toDateString();
  const previousDate = new Date(previousMessage.createdAt).toDateString();

  return currentDate !== previousDate;
};

const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [text, setText] = useState('');
  const [privateKey, setPrivateKey] = useState(null);
  const [decryptedTexts, setDecryptedTexts] = useState({});
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useContext(AuthContext);

  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [socketConnected, setSocketConnected] = useState(false);
  const [messageStatuses, setMessageStatuses] = useState({});
  const messagesListRef = useRef(null);

  // New state for interactive features
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('chatTheme') || 'default');

  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showSidebar, setShowSidebar] = useState(!isMobile);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setShowSidebar(!mobile || !active); // Show sidebar on mobile only when no chat is active
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [active]);

  // File sharing state
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const dropdownRef = useRef(null);
  const emojiRef = useRef(null);
  const fileInputRef = useRef(null);



  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Handle search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(c => {
        const peer = c.participants?.find(p => p._id !== currentUser?._id);
        const peerName = peer?.name?.toLowerCase() || '';
        const lastMessage = c.messages?.[0]?.message?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return peerName.includes(query) || lastMessage.includes(query);
      });
      setFilteredConversations(filtered);
    }
  }, [conversations, searchQuery, currentUser?._id]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('chatTheme', currentTheme);
  }, [currentTheme]);

  // Auto-hide coming soon toast
  useEffect(() => {
    if (showComingSoon) {
      const timer = setTimeout(() => setShowComingSoon(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showComingSoon]);



  useEffect(() => {
    (async () => {
      try { setPrivateKey(await importPrivateKeyFromIndexedDB()); } catch { }
      const { data } = await messagesAPI.getConversations();
      setConversations(data);
      const preselectId = searchParams.get('userId');
      const storedId = localStorage.getItem('lastActiveUserId');
      const targetId = preselectId || storedId;
      
      // On mobile, don't auto-select conversations - let user choose
      if (isMobile) {
        if (preselectId) {
          // Only auto-select if specifically requested via URL
          const { data: conv } = await messagesAPI.getConversationWith(preselectId);
          if (conv) {
            setActive(conv);
            setShowSidebar(false);
          } else {
            try {
              const { data: userRes } = await usersAPI.getUserProfile(preselectId);
              const otherUser = userRes.user;
              setActive({
                _id: `new-${preselectId}`, participants: [
                  { _id: currentUser?._id, name: currentUser?.name, email: currentUser?.email, avatar: currentUser?.avatar },
                  otherUser
                ], messages: []
              });
              setShowSidebar(false);
            } catch { setActive(null); }
          }
        } else {
          setActive(null); // Don't auto-select on mobile
          setShowSidebar(true); // Show conversation list
        }
      } else {
        // Desktop behavior - auto-select conversations
        if (targetId) {
          const { data: conv } = await messagesAPI.getConversationWith(targetId);
          if (conv) setActive(conv); else if (preselectId) {
            try {
              const { data: userRes } = await usersAPI.getUserProfile(preselectId);
              const otherUser = userRes.user;
              setActive({
                _id: `new-${preselectId}`, participants: [
                  { _id: currentUser?._id, name: currentUser?.name, email: currentUser?.email, avatar: currentUser?.avatar },
                  otherUser
                ], messages: []
              });
            } catch { setActive(null); }
          } else if (data?.length) setActive(data[0]);
        } else if (data?.length) setActive(data[0]);
      }
    })();
  }, [searchParams, currentUser?._id, isMobile]);

  const other = active?.participants?.find(p => p._id !== currentUser?._id) || active?.participants?.[0];

  useEffect(() => {
    if (!currentUser?._id) return;
    const token = localStorage.getItem('token');
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/?api$/i, '');
    const socket = io(base, {
      auth: { token },
      transports: ['websocket', 'polling'], // Ensure fallback transport
      // Performance optimizations
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
      autoConnect: true,
      forceNew: false, // Reuse existing connection
      upgrade: true, // Allow transport upgrade
      rememberUpgrade: true // Remember the transport upgrade
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setSocketConnected(false);
    });

    socket.on('presence:update', (ids) => setOnlineUsers(new Set(ids)));

    socket.on('typing', ({ from }) => {
      const currentActive = activeRef.current;
      const currentOther = currentActive?.participants?.find(p => p._id !== currentUser?._id);
      if (from && from === currentOther?._id) {
        setIsOtherTyping(true);
      }
    });

    socket.on('typing:stop', ({ from }) => {
      const currentActive = activeRef.current;
      const currentOther = currentActive?.participants?.find(p => p._id !== currentUser?._id);
      if (from && from === currentOther?._id) {
        setIsOtherTyping(false);
      }
    });

    socket.on('message:new', async (newMessage) => {
      const currentActive = activeRef.current;
      const currentOther = currentActive?.participants?.find(p => p._id !== currentUser?._id);

      const isForActiveChat = currentOther && newMessage.senderId?._id === currentOther._id;

      if (isForActiveChat) {
        setIsOtherTyping(false);
        setActive(prev => {
          if (!prev) return prev;
          // Check if message already exists to avoid duplicates
          const messageExists = prev.messages.find(m => m._id === newMessage._id);
          if (messageExists) return prev;

          const updatedMessages = [...prev.messages, newMessage];
          return { ...prev, messages: updatedMessages };
        });

        // Auto-scroll to bottom when new message arrives
        setTimeout(() => {
          if (messagesListRef.current) {
            messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
          }
        }, 100);

        try {
          await messagesAPI.getConversationWith(currentOther._id);
        } catch (error) {
          console.error("Failed to mark conversation as read", error);
        }
      }

      // Always refresh conversations list to update unread counts and last messages
      try {
        const { data } = await messagesAPI.getConversations();
        setConversations(data);
      } catch (error) {
        console.error("Failed to refresh conversations", error);
      }
    });

    socket.on('message:delivered', ({ messageId, deliveredAt }) => {
      setMessageStatuses(prev => ({
        ...prev,
        [messageId]: { status: 'delivered', deliveredAt }
      }));
    });

    socket.on('messages:read', (readReceipts) => {
      const updates = {};
      readReceipts.forEach(({ messageId, readAt }) => {
        updates[messageId] = { status: 'read', readAt };
      });
      setMessageStatuses(prev => ({ ...prev, ...updates }));
    });

    socket.on('conversation:cleared', async ({ conversationId }) => {
      const currentActive = activeRef.current;
      if (currentActive?._id === conversationId) {
        // Clear the active conversation for this user only
        setActive(prev => prev ? { ...prev, messages: [] } : null);
      }
      // Refresh conversations list to reflect the cleared state
      try {
        const { data } = await messagesAPI.getConversations();
        setConversations(data);
      } catch (error) {
        console.error('Failed to refresh conversations after clear:', error);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser?._id]);

  useEffect(() => {
    setIsOtherTyping(false);
  }, [other?._id]);

  useEffect(() => {
    if (other?._id) {
      localStorage.setItem('lastActiveUserId', other._id);
    }
  }, [other?._id]);

  useEffect(() => {
    (async () => {
      try {
        if (!active || !privateKey) { setDecryptedTexts({}); return; }
        const results = {};
        for (const m of (active.messages || [])) {
          try {
            if (m.ciphertext && m.iv && m.salt) {
              if (!other?.publicKeyJwk) { results[m._id] = m.message || ''; continue; }
              const pt = await decryptMessage(m.ciphertext, m.iv, m.salt, privateKey, other.publicKeyJwk);
              results[m._id] = pt;
            } else {
              results[m._id] = m.message || '';
            }
          } catch {
            results[m._id] = m.message || '';
          }
        }
        setDecryptedTexts(results);

        // Initialize message statuses
        const statuses = {};
        (active.messages || []).forEach(m => {
          statuses[m._id] = {
            status: m.status || 'sent',
            deliveredAt: m.deliveredAt,
            readAt: m.readAt
          };
        });
        setMessageStatuses(statuses);

        setTimeout(() => {
          if (messagesListRef.current) messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
        }, 50);
      } catch {
        setDecryptedTexts({});
      }
    })();
  }, [active?._id, active?.messages?.length, privateKey, other?.publicKeyJwk]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !other?._id) return;

    const plain = text.trim();
    setText('');

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (socketRef.current) socketRef.current.emit('typing:stop', { recipientId: other._id });

    const optimistic = {
      _id: `tmp-${Date.now()}`,
      senderId: { _id: currentUser?._id },
      recipientId: { _id: other._id },
      subject: 'Chat',
      message: plain,
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    // Add optimistic message immediately
    setActive((prev) => prev ? { ...prev, messages: [...(prev.messages || []), optimistic] } : prev);

    // Auto-scroll to bottom for sent message
    setTimeout(() => {
      if (messagesListRef.current) {
        messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
      }
    }, 50);

    try {
      let enc = null;
      try {
        const peer = (await usersAPI.getUserProfile(other._id)).data.user;
        if (privateKey && peer?.publicKeyJwk) {
          enc = await encryptMessage(plain, privateKey, peer.publicKeyJwk);
        }
      } catch { }

      const res = await messagesAPI.sendMessage(other._id, { subject: 'Chat', message: plain, ...(enc || {}) });
      const savedMessage = res.data;

      // Replace optimistic message with real message
      setActive(prev => {
        if (!prev) return null;
        const newMessages = prev.messages.map(m => m._id === optimistic._id ? savedMessage : m);
        return { ...prev, messages: newMessages };
      });

      // Initialize status for the new message
      setMessageStatuses(prev => ({
        ...prev,
        [savedMessage._id]: { status: savedMessage.status || 'sent' }
      }));

      // Refresh conversations list
      try {
        const { data } = await messagesAPI.getConversations();
        setConversations(data);
      } catch { }

    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setActive(prev => {
        if (!prev) return null;
        const newMessages = prev.messages.filter(m => m._id !== optimistic._id);
        return { ...prev, messages: newMessages };
      });
      // Show error to user
      alert('Failed to send message. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setText(val);
    const socket = socketRef.current;
    if (!socket || !other?._id) return;
    socket.emit('typing', { recipientId: other._id });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('typing:stop', { recipientId: other._id });
    }, 1500);
  };

  const handleClearConversation = async () => {
    if (!active || !active._id || active._id.startsWith('new-')) return;
    setShowDeleteModal(false);
    setShowDropdown(false);

    try {
      await messagesAPI.clearConversation(active._id);
      // The websocket event 'conversation:cleared' will handle updating the UI for all participants
    } catch (error) {
      console.error("Failed to clear conversation", error);
      alert('An error occurred while clearing the conversation.');
    }
  };

  const handleComingSoon = (feature) => {
    setShowComingSoon(true);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // For now, all tabs show the same conversations
    // In the future, you can filter by conversation type
  };

  const handleEmojiSelect = (emoji) => {
    setText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    setShowThemeModal(false);
  };

  const handleFileAttach = () => {
    setShowFileModal(true);
  };

  const handleFileSelect = (file) => {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('File type not supported. Please select an image, PDF, or document file.');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFile = async () => {
    if (!selectedFile || !other?._id) return;

    setUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('recipientId', other._id);

      // Upload file to server
      const response = await messagesAPI.sendFile(other._id, formData);

      // Add file message to chat
      const fileMessage = {
        _id: `file-${Date.now()}`,
        senderId: { _id: currentUser?._id },
        recipientId: { _id: other._id },
        messageType: 'file',
        fileUrl: response.data.fileUrl,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        createdAt: new Date().toISOString(),
      };

      setActive(prev => prev ? { ...prev, messages: [...(prev.messages || []), fileMessage] } : prev);

      // Close modal and reset state
      setShowFileModal(false);
      setSelectedFile(null);
      setUploading(false);

      // Auto-scroll to bottom
      setTimeout(() => {
        if (messagesListRef.current) {
          messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
        }
      }, 50);

    } catch (error) {
      console.error('File upload error:', error);
      alert('Failed to upload file. Please try again.');
      setUploading(false);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setText(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };


  // Group messages by sender and time
  const groupMessages = (messages) => {
    const groups = [];
    let currentGroup = null;

    messages.forEach((message, index) => {
      const isMe = message.senderId?._id === currentUser?._id;
      const previousMessage = index > 0 ? messages[index - 1] : null;
      const showDateSeparator = shouldShowDateSeparator(message, previousMessage);

      if (showDateSeparator && groups.length > 0) {
        groups.push({ type: 'date', date: message.createdAt });
      }

      if (message.messageType === 'system') {
        groups.push({ type: 'system', message });
        currentGroup = null;
      } else {
        const shouldStartNewGroup = !currentGroup ||
          currentGroup.senderId !== message.senderId?._id ||
          (new Date(message.createdAt) - new Date(currentGroup.lastMessageTime)) > 300000; // 5 minutes

        if (shouldStartNewGroup) {
          currentGroup = {
            type: 'message',
            senderId: message.senderId?._id,
            senderName: message.senderId?.name,
            senderAvatar: isMe ? currentUser?.avatar : other?.avatar,
            isMe,
            messages: [message],
            lastMessageTime: message.createdAt
          };
          groups.push(currentGroup);
        } else {
          currentGroup.messages.push(message);
          currentGroup.lastMessageTime = message.createdAt;
        }
      }
    });

    return groups;
  };

  // Helper function to get theme background
  const getThemeBackground = (theme) => {
    switch (theme) {
      case 'blue': return 'linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%)';
      case 'green': return 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)';
      case 'purple': return 'linear-gradient(135deg, #faf5ff 0%, #e9d8fd 100%)';
      case 'pink': return 'linear-gradient(135deg, #fff5f5 0%, #fed7e2 100%)';
      case 'dark': return 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)';
      default: return '#f8fafc';
    }
  };

  return (
    <Wrapper>
      <Sidebar $showOnMobile={showSidebar}>
        <SidebarHeader>
          <div className="user-info">
            <img
              className="user-avatar"
              src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=4299e1&color=fff`}
              alt={currentUser?.name}
            />
            <div className="user-name">{currentUser?.name || 'User'}</div>
          </div>
          <div className="search-container">
            <Search className="search-icon" size={16} />
            <input
              className="search-input"
              placeholder="Search conversations..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </SidebarHeader>

        <ChatTabs>
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            All Chats
          </button>
          <button
            className={`tab ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => handleTabChange('groups')}
          >
            Groups
          </button>
          <button
            className={`tab ${activeTab === 'calls' ? 'active' : ''}`}
            onClick={() => handleTabChange('calls')}
          >
            Last Calls
          </button>
        </ChatTabs>

        <ConversationsList>
          {[...filteredConversations]
            .sort((a, b) => {
              if ((b.unreadCount || 0) !== (a.unreadCount || 0)) {
                return (b.unreadCount || 0) - (a.unreadCount || 0);
              }
              const aTime = a.messages?.[0]?.createdAt ? new Date(a.messages[0].createdAt).getTime() : 0;
              const bTime = b.messages?.[0]?.createdAt ? new Date(b.messages[0].createdAt).getTime() : 0;
              return bTime - aTime;
            }).map(c => {
              const peer = (c.participants || []).find(p => p && p._id && p._id !== (currentUser?._id || ''));
              const last = (c.messages && c.messages[0]) || null;
              const isActive = active?._id === c._id || (active?.participants?.some(p => p._id === peer?._id));

              return (
                <ConversationItem
                  key={c._id}
                  $active={isActive}
                  onClick={async () => {
                    if (!peer?._id) return;
                    localStorage.setItem('lastActiveUserId', peer._id);
                    const { data } = await messagesAPI.getConversationWith(peer._id);
                    setActive(data || c);
                    
                    // On mobile, hide sidebar when chat is selected
                    if (isMobile) {
                      setShowSidebar(false);
                    }
                    
                    try {
                      const list = await messagesAPI.getConversations();
                      setConversations(list.data);
                    } catch { }
                  }}
                >
                  <div className="avatar-container">
                    <img
                      className="avatar"
                      src={peer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(peer?.name || 'User')}&background=EEF2FF&color=111827`}
                      alt={peer?.name}
                    />
                    {onlineUsers.has(peer?._id) && <div className="online-indicator" />}
                  </div>

                  <div className="conversation-info">
                    <div className="conversation-header">
                      <div className="name">{peer?.name || 'User'}</div>
                      <div className="time">
                        {last ? new Date(last.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                    <div className="last-message">
                      <span>{last ? (decryptedTexts[last._id] ?? last.message ?? 'New message') : 'Start a conversation'}</span>
                      {c.unreadCount > 0 && (
                        <span className="unread-badge">{c.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </ConversationItem>
              );
            })}
        </ConversationsList>
      </Sidebar>

      <ChatArea $showOnMobile={!showSidebar || !isMobile}>
        {other ? (
          <>
            <ChatHeader>
              <div className="chat-user-info">
                {isMobile && (
                  <button 
                    className="mobile-back-btn"
                    onClick={() => setShowSidebar(true)}
                    title="Back to conversations"
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <img
                  className="chat-avatar"
                  src={other?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || 'User')}&background=EEF2FF&color=111827`}
                  alt={other?.name}
                />
                <div className="chat-user-details">
                  <div className="name">{other?.name || 'User'}</div>
                  <div className="status">
                    {isOtherTyping ? 'typing...' : onlineUsers.has(other?._id) ? 'online' : 'offline'}
                    {!socketConnected && ' • connection lost'}
                  </div>
                </div>
              </div>

              <div className="chat-actions">
                <button
                  className="action-btn"
                  title="Voice call"
                  onClick={() => handleComingSoon('Voice Call')}
                >
                  <Phone size={18} />
                </button>
                <button
                  className="action-btn"
                  title="Video call"
                  onClick={() => handleComingSoon('Video Call')}
                >
                  <Video size={18} />
                </button>
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  <button
                    className="action-btn"
                    title="More options"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {showDropdown && (
                    <DropdownMenu>
                      <button
                        className="dropdown-item"
                        onClick={() => setShowThemeModal(true)}
                      >
                        <Palette size={16} />
                        Change Theme
                      </button>
                      <button
                        className="dropdown-item danger"
                        onClick={() => setShowDeleteModal(true)}
                      >
                        <Trash2 size={16} />
                        Delete Chat
                      </button>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </ChatHeader>

            <MessagesArea ref={messagesListRef} style={{ background: getThemeBackground(currentTheme) }}>
              {groupMessages(active?.messages || []).map((group, groupIndex) => {
                if (group.type === 'date') {
                  return (
                    <DateSeparator key={`date-${groupIndex}`}>
                      <span className="date-text">{formatDateSeparator(group.date)}</span>
                    </DateSeparator>
                  );
                }

                if (group.type === 'system') {
                  return (
                    <SystemMessage key={`system-${groupIndex}`}>
                      <span className="system-text">{group.message.message}</span>
                    </SystemMessage>
                  );
                }

                return (
                  <MessageGroup key={`group-${groupIndex}`} $isMe={group.isMe}>
                    {!group.isMe && (
                      <img
                        className="message-avatar"
                        src={group.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.senderName || 'User')}&background=EEF2FF&color=111827`}
                        alt={group.senderName}
                      />
                    )}
                    <div className="messages-container">
                      {group.messages.map((message) => {
                        const messageStatus = messageStatuses[message._id] || { status: message.status || 'sent' };
                        const messageText = decryptedTexts[message._id] ?? (message.message || '');

                        return (
                          <MessageBubble key={message._id} $isMe={group.isMe}>
                            {message.messageType === 'file' ? (
                              <FileMessageBubble
                                $isMe={group.isMe}
                                onClick={() => window.open(message.fileUrl, '_blank')}
                              >
                                <div className="file-icon">
                                  {message.fileType?.startsWith('image/') ? (
                                    <Image size={24} />
                                  ) : (
                                    <File size={24} />
                                  )}
                                </div>
                                <div className="file-info">
                                  <div className="file-name">{message.fileName}</div>
                                  <div className="file-size">{formatFileSize(message.fileSize)}</div>
                                </div>
                              </FileMessageBubble>
                            ) : (
                              <div className="message-text">{messageText}</div>
                            )}
                            <div className="message-time">
                              {formatMessageTime(message.createdAt)}
                              {group.isMe && (
                                <span style={{ marginLeft: '4px' }}>
                                  {getStatusIcon(messageStatus.status)}
                                </span>
                              )}
                            </div>
                          </MessageBubble>
                        );
                      })}
                    </div>
                  </MessageGroup>
                );
              })}

              {isOtherTyping && (
                <TypingIndicator>
                  <img
                    className="typing-avatar"
                    src={other?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || 'User')}&background=EEF2FF&color=111827`}
                    alt={other?.name}
                  />
                  <span className="typing-text">{other?.name} is typing...</span>
                </TypingIndicator>
              )}
            </MessagesArea>

            <MessageInput>
              <form onSubmit={handleSend}>
                <div className="input-container">
                  <div className="input-actions">
                    <button
                      type="button"
                      className="input-btn"
                      title="Attach file"
                      onClick={handleFileAttach}
                    >
                      <Paperclip size={18} />
                    </button>
                  </div>

                  <input
                    className="message-input"
                    value={text}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    placeholder="Type something..."
                  />

                  <div className="input-actions" style={{ position: 'relative' }}>
                    <div ref={emojiRef}>
                      <button
                        type="button"
                        className="input-btn"
                        title="Emoji"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      >
                        <Smile size={18} />
                      </button>
                      {showEmojiPicker && (
                        <EmojiPickerContainer>
                          <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            width={300}
                            height={400}
                            searchDisabled={false}
                            skinTonesDisabled={false}
                            previewConfig={{
                              showPreview: false
                            }}
                          />
                        </EmojiPickerContainer>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="input-btn send-btn"
                      disabled={!text.trim()}
                      title="Send message"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </form>
            </MessageInput>
          </>
        ) : (
          <EmptyState>
            <div className="empty-icon">💬</div>
            <div className="empty-title">
              {isMobile ? 'Welcome to Messages' : 'Select a conversation'}
            </div>
            <div className="empty-subtitle">
              {isMobile 
                ? 'Tap the menu to see your conversations and start chatting' 
                : 'Choose from your existing conversations or start a new one'
              }
            </div>
            {isMobile && (
              <button 
                className="mobile-show-conversations"
                onClick={() => setShowSidebar(true)}
              >
                View Conversations
              </button>
            )}
          </EmptyState>
        )}
      </ChatArea>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ModalOverlay onClick={() => setShowDeleteModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Delete Conversation</div>
              <button className="close-btn" onClick={() => setShowDeleteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-text">
                Are you sure you want to permanently delete this conversation history?
                This action cannot be undone and will remove all messages for both participants.
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleClearConversation}
              >
                Delete
              </button>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Theme Selection Modal */}
      {showThemeModal && (
        <ModalOverlay onClick={() => setShowThemeModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Choose Theme</div>
              <button className="close-btn" onClick={() => setShowThemeModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <ThemeSelector>
                <div className="theme-grid">
                  <div
                    className={`theme-option default ${currentTheme === 'default' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('default')}
                    title="Default"
                  />
                  <div
                    className={`theme-option blue ${currentTheme === 'blue' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('blue')}
                    title="Blue"
                  />
                  <div
                    className={`theme-option green ${currentTheme === 'green' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('green')}
                    title="Green"
                  />
                  <div
                    className={`theme-option purple ${currentTheme === 'purple' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('purple')}
                    title="Purple"
                  />
                  <div
                    className={`theme-option pink ${currentTheme === 'pink' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('pink')}
                    title="Pink"
                  />
                  <div
                    className={`theme-option dark ${currentTheme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                    title="Dark"
                  />
                </div>
              </ThemeSelector>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* File Upload Modal */}
      {showFileModal && (
        <FileUploadModal onClick={() => setShowFileModal(false)}>
          <div className="upload-content" onClick={(e) => e.stopPropagation()}>
            <div className="upload-header">
              <div className="upload-title">Share File</div>
              <button className="close-btn" onClick={() => setShowFileModal(false)}>
                <X size={20} />
              </button>
            </div>

            {!selectedFile ? (
              <div
                className={`file-drop-zone ${dragOver ? 'drag-over' : ''}`}
                onDrop={handleFileDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="drop-icon">
                  <Paperclip size={48} />
                </div>
                <div className="drop-text">Drop files here or click to browse</div>
                <div className="drop-subtext">
                  Supports images, PDFs, and documents (max 10MB)
                </div>
              </div>
            ) : (
              <div className="file-preview">
                <div className="file-icon">
                  {selectedFile.type.startsWith('image/') ? (
                    <Image size={24} />
                  ) : (
                    <File size={24} />
                  )}
                </div>
                <div className="file-info">
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-size">{formatFileSize(selectedFile.size)}</div>
                </div>
                <button
                  className="remove-file"
                  onClick={() => setSelectedFile(null)}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleFileSelect(file);
              }}
            />

            <div className="upload-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowFileModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={uploadFile}
                disabled={!selectedFile || uploading}
              >
                {uploading ? 'Uploading...' : 'Send File'}
              </button>
            </div>
          </div>
        </FileUploadModal>
      )}

      {/* Coming Soon Toast */}
      {showComingSoon && (
        <ComingSoonToast>
          🚀 Coming Soon! This feature is under development.
        </ComingSoonToast>
      )}
    </Wrapper>
  );

};

export default MessagesPage;
