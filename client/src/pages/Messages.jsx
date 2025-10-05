import React, { useEffect, useState, useContext, useRef } from 'react';
import styled from 'styled-components';
import { messagesAPI, usersAPI } from '../utils/api';
import { importPrivateKeyFromIndexedDB, encryptMessage, decryptMessage } from '../utils/crypto';
import { useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { Paintbrush, Trash2 } from 'lucide-react';

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
  gap: 0.5rem;
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

const Bubble = styled.div`
  align-self: ${props => props.$me ? 'flex-end' : 'flex-start'};
  background: ${props => props.$me ? '#4F46E5' : '#f3f4f6'};
  color: ${props => props.$me ? '#fff' : '#111827'};
  padding: 0.5rem 0.75rem; border-radius: 12px; max-width: 70%;
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
    const socket = io(base, { auth: { token } });
    socketRef.current = socket;

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
          if (!prev || prev.messages.find(m => m._id === newMessage._id)) return prev;
          return { ...prev, messages: [...prev.messages, newMessage] };
        });

        try {
          await messagesAPI.getConversationWith(currentOther._id);
        } catch (error) {
          console.error("Failed to mark conversation as read", error);
        }
      }

      try {
        const { data } = await messagesAPI.getConversations();
        setConversations(data);
      } catch (error) {
        console.error("Failed to refresh conversations", error);
      }
    });

    socket.on('conversation:cleared', async ({ conversationId }) => {
      const currentActive = activeRef.current;
      if (currentActive?._id === conversationId) {
        const { data: updatedConv } = await messagesAPI.getConversationWith(other._id);
        setActive(updatedConv);
      }
      const { data } = await messagesAPI.getConversations();
      setConversations(data);
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
      createdAt: new Date().toISOString(),
    };
    setActive((prev) => prev ? { ...prev, messages: [...(prev.messages || []), optimistic] } : prev);
    
    let enc = null;
    try {
      const peer = (await usersAPI.getUserProfile(other._id)).data.user;
      if (privateKey && peer?.publicKeyJwk) {
        enc = await encryptMessage(plain, privateKey, peer.publicKeyJwk);
      }
    } catch { }

    const res = await messagesAPI.sendMessage(other._id, { subject: 'Chat', message: plain, ...(enc || {}) });
    const savedMessage = res.data;

    setActive(prev => {
        if (!prev) return null;
        const newMessages = prev.messages.map(m => m._id === optimistic._id ? savedMessage : m);
        return {...prev, messages: newMessages};
    });

    try {
      const { data } = await messagesAPI.getConversations();
      setConversations(data);
    } catch { }
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
          {(active?.messages || []).map((m) =>
            m.messageType === 'system' ? (
              <SystemMessage key={m._id}>{m.message}</SystemMessage>
            ) : (
              <Bubble key={m._id} $me={m.senderId?._id === (currentUser?._id || '')}>
                {decryptedTexts[m._id] ?? (m.message || '')}
              </Bubble>
            )
          )}
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
