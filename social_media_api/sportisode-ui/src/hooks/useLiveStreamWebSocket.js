// src/hooks/useLiveStreamWebSocket.js

import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

export const useLiveStreamWebSocket = (streamId) => {
    const [isConnected, setIsConnected] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);
    const [chatMessages, setChatMessages] = useState([]);
    const [streamStatus, setStreamStatus] = useState(null);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const heartbeatIntervalRef = useRef(null);

    const user = useSelector(state => state.auth.user);
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
    const token = localStorage.getItem('authToken');

    const connect = () => {
        if (!streamId || wsRef.current?.readyState === WebSocket.OPEN) return;

        const wsUrl = `ws://localhost:8000/ws/posts/stream/${streamId}/?token=${token || ''}`;
        console.log('Connecting to live stream WebSocket:', wsUrl);

        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
            console.log('Live stream WebSocket connected');
            setIsConnected(true);

            // Start heartbeat
            heartbeatIntervalRef.current = setInterval(() => {
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                        type: 'heartbeat',
                        timestamp: Date.now()
                    }));
                }
            }, 30000); // 30 seconds
        };

        wsRef.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        wsRef.current.onclose = () => {
            console.log('Live stream WebSocket disconnected');
            setIsConnected(false);
            clearInterval(heartbeatIntervalRef.current);

            // Attempt to reconnect after 5 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
                connect();
            }, 5000);
        };

        wsRef.current.onerror = (error) => {
            console.error('Live stream WebSocket error:', error);
        };
    };

    const disconnect = () => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
        }
        setIsConnected(false);
    };

    const handleMessage = (data) => {
        switch (data.type) {
            case 'stream_status':
                setStreamStatus(data);
                setViewerCount(data.viewer_count || 0);
                break;

            case 'stream_status_update':
                setStreamStatus(data);
                if (data.viewer_count !== undefined) {
                    setViewerCount(data.viewer_count);
                }
                break;

            case 'viewer_count_update':
                setViewerCount(data.viewer_count || 0);
                break;

            case 'chat_message':
                setChatMessages(prev => [...prev.slice(-49), data]); // Keep last 50 messages
                break;

            case 'heartbeat_ack':
                // Heartbeat acknowledged, connection is healthy
                break;

            default:
                console.log('Unknown message type:', data.type, data);
        }
    };

    const sendChatMessage = (content) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not connected');
            return false;
        }

        if (!isAuthenticated || !user) {
            console.error('User not authenticated');
            return false;
        }

        wsRef.current.send(JSON.stringify({
            type: 'chat_message',
            content: content.trim()
        }));

        return true;
    };

    useEffect(() => {
        if (streamId) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [streamId, token]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    return {
        isConnected,
        viewerCount,
        chatMessages,
        streamStatus,
        sendChatMessage
    };
};