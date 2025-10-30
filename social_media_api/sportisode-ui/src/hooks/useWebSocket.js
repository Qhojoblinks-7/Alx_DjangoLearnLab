// src/hooks/useWebSocket.js
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

const WS_BASE_URL = 'ws://127.0.0.1:8000/ws';

/**
 * Custom hook to connect to a WebSocket endpoint and handle real-time messages.
 * @param {string} endpoint - The specific WebSocket route (e.g., '/post/123/' or '/notifications/').
 * @param {function} onMessageReceived - Callback function to execute when a message arrives.
 */
export const useWebSocket = (endpoint, onMessageReceived) => {
    const wsRef = useRef(null);
    const callbackRef = useRef(onMessageReceived);
    const { token, isAuthenticated } = useSelector((state) => state.auth);
    const [isConnected, setIsConnected] = useState(false);

    // Update the callback ref when onMessageReceived changes
    callbackRef.current = onMessageReceived;

    useEffect(() => {
        if (!endpoint) return;

        // Use token from Redux state
        const authToken = token;

        // Build URL with token as query parameter for authentication
        let url = `${WS_BASE_URL}${endpoint}`;
        if (authToken) {
            const separator = endpoint.includes('?') ? '&' : '?';
            url += `${separator}token=${authToken}`;
        }

        // 1. Establish Connection
        wsRef.current = new WebSocket(url);

        wsRef.current.onopen = () => {
            console.log(`WebSocket connected: ${url}`);
            setIsConnected(true);
        };

        wsRef.current.onmessage = (event) => {
            console.log(`WebSocket message received: ${event.data}`);
            const data = JSON.parse(event.data);
            callbackRef.current(data);
        };

        wsRef.current.onclose = (event) => {
            console.log(`WebSocket disconnected: ${url}, code: ${event.code}, reason: ${event.reason}`);
            setIsConnected(false);
        };

        wsRef.current.onerror = (error) => {
            console.error(`WebSocket error: ${url}`, error);
            console.error('WebSocket error event:', error);
        };

        // 2. Cleanup function
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [endpoint, isAuthenticated, token]);

    return { isConnected };
};