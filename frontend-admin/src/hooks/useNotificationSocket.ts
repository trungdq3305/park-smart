// src/hooks/useNotificationSocket.ts

import React, { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { message } from 'antd';

// Giả định các hằng số (Giữ nguyên)
const NotificationSocketEvents = {
    NEW_NOTIFICATION: 'newNotification', // Giá trị: 'newNotification'
    IDENTITY: 'identity',
    AUTH_ERROR: 'authError',
} as const;

interface NotificationPayload {
    _id: string;
    title: string;
    body: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

interface UseNotificationSocketProps {
    onNewNotification: (notification: NotificationPayload) => void;
    connectTrigger?: boolean;
}

const useNotificationSocket = ({ onNewNotification, connectTrigger = true }: UseNotificationSocketProps) => {
    const socketRef = useRef<Socket | null>(null);
    // Sử dụng biến môi trường đã định nghĩa (Giả định 'http://localhost:5000')
    const socketEndpoint = import.meta.env.VITE_WEBSOCKET_ENDPOINT || 'http://localhost:5000';

    useEffect(() => {
        if (!connectTrigger) return;
        
        const token = Cookies.get('userToken');
        if (!token) {
            console.warn('[WS] Bỏ qua kết nối: Không tìm thấy user token.');
            return;
        }

        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        const newSocket = io(socketEndpoint, {
            query: { token }, 
            withCredentials: true, 
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
            console.log(`[WS] Đã kết nối Socket ID: ${newSocket.id}`);
            newSocket.emit(NotificationSocketEvents.IDENTITY, {}); 
        });

        newSocket.on(NotificationSocketEvents.AUTH_ERROR, (error: string) => {
            console.error(`[WS] Lỗi xác thực: ${error}`);
            message.error(`Lỗi WS: ${error}`);
            newSocket.disconnect();
        });

        // 💡 ĐÃ SỬA: Sử dụng chuỗi event trực tiếp theo yêu cầu
        newSocket.on('newNotification', (notification: NotificationPayload) => {
            console.log('[WS] Nhận được thông báo mới:', notification);
            message.info(`🔔 ${notification.title}: ${notification.body}`); 
            onNewNotification(notification); 
        });

        newSocket.on('disconnect', (reason) => {
            console.log(`[WS] Đã ngắt kết nối: ${reason}`);
        });

        return () => {
            console.log('[WS] Cleanup - Ngắt kết nối socket');
            newSocket.disconnect();
        };

    }, [onNewNotification, connectTrigger, socketEndpoint]);

    return socketRef.current;
};

export default useNotificationSocket;