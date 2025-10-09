import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

const OnlineStatusContext = createContext();

export const useOnlineStatus = () => {
    const context = useContext(OnlineStatusContext);
    if (!context) {
        throw new Error('useOnlineStatus must be used within an OnlineStatusProvider');
    }
    return context;
};

export const OnlineStatusProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const socketRef = useRef(null);

    useEffect(() => {
        if (!user?._id) {
            setOnlineUsers(new Set());
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No token available for online status WebSocket connection');
            return;
        }

        const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
        console.log('Connecting to online status WebSocket at:', base);

        const socket = io(base, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 20000
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Online status socket connected');
        });

        socket.on('connect_error', (error) => {
            console.error('Online status socket connection error:', error);
        });

        socket.on('presence:update', (userIds) => {
            console.log('Online users updated:', userIds);
            setOnlineUsers(new Set(userIds));
        });

        socket.on('disconnect', (reason) => {
            console.log('Online status socket disconnected:', reason);
        });

        socket.on('reconnect', (attemptNumber) => {
            console.log('Online status socket reconnected after', attemptNumber, 'attempts');
        });

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [user?._id]);

    const isUserOnline = (userId) => {
        return onlineUsers.has(userId);
    };

    const value = {
        onlineUsers: Array.from(onlineUsers),
        isUserOnline,
        onlineCount: onlineUsers.size
    };

    return (
        <OnlineStatusContext.Provider value={value}>
            {children}
        </OnlineStatusContext.Provider>
    );
};