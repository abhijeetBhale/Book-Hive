import React, { useEffect, useState, useContext, useRef, Fragment } from 'react';
import styled from 'styled-components';
import { messagesAPI, usersAPI } from '../utils/api';
import { importPrivateKeyFromIndexedDB, encryptMessage, decryptMessage } from '../utils/crypto';
import { useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { Paintbrush, Trash2, Check, CheckCheck } from 'lucide-react';

const CHAT_BACKGROUNDS = [
  { label: 'Default', value: 'plain', src: '' },
  { label: 'Landscape 1', value: 'bee', src: '/src/assets/chat-background-bookhive1.avif' },
  { label: 'Landscape 2', value: 'books', src: '/src/assets/chat-background-bookhive5.avif' },
  { label: 'Landscape 3', value: 'honey', src: '/src/assets/chat-background-bookhive3.avif' },
  { label: 'Landscape 4', value: 'map', src: '/src/assets/chat-background-bookhive4.avif' },
];

const Wrapper = styled.div`
  padding: 1rem 1.5rem;
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 1rem;
  height: calc(100vh - 140px);
`;

const Sidebar = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 0.9rem 1rem; font-weight: 800; border-bottom: 1px solid #f1f5f9; font-size: 1.125rem; color: #111827;
`;

const SidebarList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ConversationItem = styled.button`
  padding: 0.75rem 1rem; text-align: left; border: none; background: transparent; cursor: pointer; width: 100%;
  border-bottom: 1px solid #f8fafc;
  display: grid; grid-template-columns: 44px 1fr auto; align-items: center; gap: 0.75rem;
  &:hover { background: #f8fafc; }
  .avatar { width: 44px; height: 44px; border-radius: 9999px; object-fit: cover; }
  
  /* --- [THE FIX IS HERE] --- */
  .info-container {
    overflow: hidden; /* This prevents the container from expanding */
  }

  .name { 
    font-weight: 700; color: #111827;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .preview { 
      color: #6b7280; font-size: 0.875rem; 
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; 
      }
      .time { color: #9ca3af; font-size: 0.75rem; margin-top: -22px; }
`;

const Chat = styled.div`
  background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; display: flex; flex-direction: column;
`;

const ChatHeader = styled.div`
  position: relative;
  padding: 0.9rem 1rem; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between;
  .left { display: flex; align-items: center; gap: 0.75rem; position: relative; }
  .avatar { width: 40px; height: 40px; border-radius: 9999px; object-fit: cover; }
  .online-dot { position: absolute; left: 28px; top: 28px; width: 10px; height: 10px; border-radius: 50%; background: #22c55e; border: 2px solid white; }
  .title { font-weight: 800; color: #111827; }
  .subtitle { font-size: 0.8rem; color: #9ca3af; }
  a { font-size: 0.875rem; color: #6366f1; }
  .right { display: flex; align-items: center; gap: 0.5rem; }
`;

const MessagesList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background: ${({ $bg }) =>
    $bg === 'plain' ? '#fff'
      : $bg && CHAT_BACKGROUNDS.find(bg => bg.value === $bg)?.src
        ? `url(${CHAT_BACKGROUNDS.find(bg => bg.value === $bg).src})`
        : '#fff'};
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  max-height: calc(100vh - 260px);
  transition: background-image 0.3s;
`;

const TypingIndicator = styled.div`
  align-self: flex-start;
  color: #6b7280;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
`;

const MessageContainer = styled.div`
  align-self: ${props => props.$me ? 'flex-end' : 'flex-start'};
  display: flex;
  flex-direction: column;
  max-width: 70%;
  margin-bottom: 0.5rem;
`;

const Bubble = styled.div`
  background: ${props => props.$me ? '#4F46E5' : '#f3f4f6'};
  color: ${props => props.$me ? '#fff' : '#111827'};
  padding: 0.5rem 0.75rem; 
  border-radius: 12px;
  word-wrap: break-word;
  position: relative;
`;

const MessageText = styled.div`
  margin-bottom: ${props => props.$hasInfo ? '0.5rem' : '0'};
  line-height: 1.4;
`;

const MessageInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: ${props => props.$me ? 'rgba(255, 255, 255, 0.8)' : '#6b7280'};
  margin-top: 0.25rem;
`;

const StatusIndicator = styled.span`
  display: flex;
  align-items: center;
  margin-left: 0.25rem;
  
  svg {
    color: ${props => {
    if (props.$me) {
      switch (props.$status) {
        case 'sent': return 'rgba(255, 255, 255, 0.7)';
        case 'delivered': return 'rgba(255, 255, 255, 0.9)';
        case 'read': return '#00d4aa'; // WhatsApp blue-green for read
        default: return 'rgba(255, 255, 255, 0.7)';
      }
    } else {
      switch (props.$status) {
        case 'sent': return '#9ca3af';
        case 'delivered': return '#60a5fa';
        case 'read': return '#00d4aa';
        default: return '#9ca3af';
      }
    }
  }};
  }
`;

const TimeStamp = styled.span`
  font-size: 0.65rem;
  color: ${props => props.$me ? 'rgba(255, 255, 255, 0.8)' : '#9ca3af'};
`;

const SystemMessage = styled.div`
  align-self: center;
  background: #e5e7eb;
  color: #4b5563;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  margin: 0.5rem 0;
`;

const DateSeparator = styled.div`
  align-self: center;
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;
  padding: 0.375rem 0.875rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  margin: 1rem 0;
  backdrop-filter: blur(10px);
`;

const Composer = styled.form`
  padding: 0.75rem; border-top: 1px solid #f1f5f9; display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; align-items: center;
  input { flex: 1; border: 1px solid #e5e7eb; border-radius: 9999px; padding: 0.75rem 1rem; }
  button { background: #4F46E5; color: #fff; border: none; border-radius: 9999px; padding: 0.6rem 1rem; font-weight: 700; }
`;

const BgSelectorButton = styled.button`
  background: #f3f4f6;
  border: none;
  border-radius: 9999px;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: #4F46E5;
  &:hover { background: #e0e7ff; }
`;

const BgOptionsModal = styled.div`
  position: absolute;
  top: 56px;
  right: 18px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  padding: 1rem;
  z-index: 20;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const BgOption = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.4rem 0.2rem;
  border-radius: 0.5rem;
  &:hover { background: #f3f4f6; }
  .preview {
    width: 40px; height: 32px; border-radius: 0.5rem; object-fit: cover; background: #f3f4f6;
    border: 1px solid #e5e7eb;
    display: flex; align-items: center; justify-content: center;
  }
  .label {
    font-size: 1rem; color: #374151; font-weight: 600;
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

  const [chatBg, setChatBg] = useState(() => localStorage.getItem('chatBg') || 'plain');
  const [showBgModal, setShowBgModal] = useState(false);

  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    localStorage.setItem('chatBg', chatBg);
  }, [chatBg]);

  useEffect(() => {
    (async () => {
      try { setPrivateKey(await importPrivateKeyFromIndexedDB()); } catch { }
      const { data } = await messagesAPI.getConversations();
      setConversations(data);
      const preselectId = searchParams.get('userId');
      const storedId = localStorage.getItem('lastActiveUserId');
      const targetId = preselectId || storedId;
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
    })();
  }, [searchParams, currentUser?._id]);

  const other = active?.participants?.find(p => p._id !== currentUser?._id) || active?.participants?.[0];

  useEffect(() => {
    if (!currentUser?._id) return;
    const token = localStorage.getItem('token');
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/?api$/i, '');
    const socket = io(base, {
      auth: { token },
      transports: ['websocket', 'polling'] // Ensure fallback transport
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
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

    if (window.confirm('Are you sure you want to permanently delete this conversation history? This cannot be undone.')) {
      try {
        await messagesAPI.clearConversation(active._id);
        // The websocket event 'conversation:cleared' will handle updating the UI for all participants
      } catch (error) {
        console.error("Failed to clear conversation", error);
        alert('An error occurred while clearing the conversation.');
      }
    }
  };


  return (
    <Wrapper>
      <Sidebar>
        <SidebarHeader>Messages</SidebarHeader>
        <SidebarList>
          {[...conversations]
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
              return (
                <ConversationItem key={c._id} onClick={async () => {
                  if (!peer?._id) return;
                  localStorage.setItem('lastActiveUserId', peer._id);
                  const { data } = await messagesAPI.getConversationWith(peer._id);
                  setActive(data || c);
                  try {
                    const list = await messagesAPI.getConversations();
                    setConversations(list.data);
                  } catch { }
                }}>
                  <div style={{ position: 'relative' }}>
                    <img className="avatar" src={peer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(peer?.name || 'User')}&background=EEF2FF&color=111827`} alt={peer?.name} />
                    {onlineUsers.has(peer?._id) && <span style={{ position: 'absolute', left: 28, top: 28, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid white' }} />}
                  </div>
                  {/* --- [THE FIX IS HERE] --- */}
                  <div className="info-container">
                    <div className="name">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{peer?.name || 'User'}</span>
                        {c.unreadCount > 0 && (
                          <span style={{ background: '#ef4444', color: 'white', borderRadius: 9999, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="preview">{last ? (decryptedTexts[last._id] ?? last.message ?? 'New message') : 'Start a conversation'}</div>
                  </div>
                  <div className="time">{last ? new Date(last.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                </ConversationItem>
              );
            })}
        </SidebarList>
      </Sidebar>
      <Chat>
        <ChatHeader>
          <div className="left">
            {other && (
              <>
                <img className="avatar" src={other?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || 'User')}&background=EEF2FF&color=111827`} alt={other?.name} />
                {onlineUsers.has(other?._id) && <span className="online-dot" />}
              </>
            )}
            <div>
              <div className="title">{other?.name || 'Select a conversation'}</div>
              {other?.email && (
                <div className="subtitle">
                  {other.email}
                  {isOtherTyping ? ' • typing…' : onlineUsers.has(other?._id) ? ' • online' : ' • offline'}
                  {!socketConnected && ' • connection lost'}
                </div>
              )}
            </div>
          </div>
          <div className="right">
            {other?._id && (
              <BgSelectorButton type="button" onClick={handleClearConversation} title="Clear conversation history">
                <Trash2 size={18} color="#ef4444" />
              </BgSelectorButton>
            )}
            <BgSelectorButton type="button" onClick={() => setShowBgModal(v => !v)} title="Change background">
              <Paintbrush size={18} />
            </BgSelectorButton>
          </div>
          {showBgModal && (
            <BgOptionsModal>
              {CHAT_BACKGROUNDS.map(bg => (
                <BgOption key={bg.value} onClick={() => { setChatBg(bg.value); setShowBgModal(false); }}>
                  <div className="preview">
                    {bg.src
                      ? <img src={bg.src} alt={bg.label} style={{ width: '100%', height: '100%', borderRadius: '0.5rem', objectFit: 'cover' }} />
                      : <span style={{ width: '100%', height: '100%', display: 'block', background: '#fff', borderRadius: '0.5rem' }} />
                    }
                  </div>
                  <span className="label">{bg.label}</span>
                </BgOption>
              ))}
            </BgOptionsModal>
          )}
        </ChatHeader>
        <MessagesList ref={messagesListRef} $bg={chatBg}>
          {(active?.messages || []).map((m, index) => {
            const isMe = m.senderId?._id === (currentUser?._id || '');
            const messageStatus = messageStatuses[m._id] || { status: m.status || 'sent' };
            const messageText = decryptedTexts[m._id] ?? (m.message || '');
            const previousMessage = index > 0 ? active.messages[index - 1] : null;
            const showDateSeparator = shouldShowDateSeparator(m, previousMessage);

            return (
              <Fragment key={m._id}>
                {showDateSeparator && (
                  <DateSeparator>
                    {formatDateSeparator(m.createdAt)}
                  </DateSeparator>
                )}
                {m.messageType === 'system' ? (
                  <SystemMessage>{m.message}</SystemMessage>
                ) : (
                  <MessageContainer $me={isMe}>
                    <Bubble $me={isMe}>
                      <MessageText $hasInfo={true}>
                        {messageText}
                      </MessageText>
                      <MessageInfo $me={isMe}>
                        <TimeStamp $me={isMe}>
                          {formatMessageTime(m.createdAt)}
                        </TimeStamp>
                        {isMe && (
                          <StatusIndicator $status={messageStatus.status} $me={isMe}>
                            {getStatusIcon(messageStatus.status)}
                          </StatusIndicator>
                        )}
                      </MessageInfo>
                    </Bubble>
                  </MessageContainer>
                )}
              </Fragment>
            );
          })}
          {isOtherTyping && <TypingIndicator>typing…</TypingIndicator>}
        </MessagesList>
        {other?._id && (
          <Composer onSubmit={handleSend}>
            <input value={text} onChange={handleInputChange} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }} placeholder="Type a message" />
            <button type="submit">Send</button>
          </Composer>
        )}
      </Chat>
    </Wrapper>
  );
  
};

export default MessagesPage;
