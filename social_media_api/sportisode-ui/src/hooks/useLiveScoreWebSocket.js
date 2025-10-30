// src/hooks/useLiveScoreWebSocket.js
import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for real-time live score updates using WebSocket
 * Falls back to polling if WebSocket is not available
 */
export const useLiveScoreWebSocket = (enabled = true) => {
    const [liveScores, setLiveScores] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [error, setError] = useState(null);

    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const pollIntervalRef = useRef(null);

    // WebSocket URL - would be configured based on your backend
    const WS_URL = 'ws://localhost:8000/ws/live-scores/'; // Simplified for development

    // Fallback polling function
    const pollLiveScores = useCallback(async () => {
        try {
            const response = await fetch('https://www.thesportsdb.com/api/v1/json/3/latestsoccer.php');
            if (!response.ok) {
                throw new Error('Failed to fetch live scores');
            }
            const data = await response.json();
            const scores = data.results || [];

            setLiveScores(scores);
            setLastUpdate(new Date());
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Polling error:', err);
        }
    }, []);

    // WebSocket connection
    const connectWebSocket = useCallback(() => {
        if (!enabled) return;

        try {
            wsRef.current = new WebSocket(WS_URL);

            wsRef.current.onopen = () => {
                console.log('Live scores WebSocket connected');
                setIsConnected(true);
                setError(null);

                // Clear polling if WebSocket is connected
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                }
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'live_scores_update') {
                        setLiveScores(data.scores || []);
                        setLastUpdate(new Date());
                    }
                } catch (err) {
                    console.error('Failed to parse WebSocket message:', err);
                }
            };

            wsRef.current.onclose = (event) => {
                console.log('Live scores WebSocket disconnected:', event.code, event.reason);
                setIsConnected(false);

                // Start polling as fallback
                if (!pollIntervalRef.current) {
                    pollIntervalRef.current = setInterval(pollLiveScores, 30000); // 30 seconds
                }

                // Attempt to reconnect after 5 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    connectWebSocket();
                }, 5000);
            };

            wsRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError('WebSocket connection error');
            };

        } catch (err) {
            console.error('Failed to create WebSocket connection:', err);
            setError('Failed to establish WebSocket connection');

            // Start polling immediately as fallback
            if (!pollIntervalRef.current) {
                pollLiveScores(); // Initial poll
                pollIntervalRef.current = setInterval(pollLiveScores, 30000);
            }
        }
    }, [enabled, WS_URL, pollLiveScores]);

    // Disconnect WebSocket
    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }

        setIsConnected(false);
    }, []);

    // Send message to WebSocket (if needed for subscriptions)
    const sendMessage = useCallback((message) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    // Subscribe to specific leagues/teams
    const subscribeToLeague = useCallback((leagueId) => {
        sendMessage({
            type: 'subscribe',
            target: 'league',
            id: leagueId
        });
    }, [sendMessage]);

    const unsubscribeFromLeague = useCallback((leagueId) => {
        sendMessage({
            type: 'unsubscribe',
            target: 'league',
            id: leagueId
        });
    }, [sendMessage]);

    // Initialize connection
    useEffect(() => {
        if (enabled) {
            connectWebSocket();
        }

        return () => {
            disconnect();
        };
    }, [enabled, connectWebSocket, disconnect]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        liveScores,
        isConnected,
        lastUpdate,
        error,
        subscribeToLeague,
        unsubscribeFromLeague,
        reconnect: connectWebSocket,
        disconnect
    };
};

/**
 * Hook for live score updates with automatic refresh
 * Uses WebSocket when available, falls back to polling
 */
export const useLiveScoreUpdates = (enabled = true, refreshInterval = 30000) => {
    const [scores, setScores] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const {
        liveScores: wsScores,
        isConnected,
        lastUpdate,
        error: wsError,
        subscribeToLeague,
        unsubscribeFromLeague
    } = useLiveScoreWebSocket(enabled);

    // Update scores when WebSocket data arrives
    useEffect(() => {
        if (wsScores.length > 0) {
            setScores(wsScores);
            setError(null);
        }
    }, [wsScores]);

    // Update error state
    useEffect(() => {
        if (wsError) {
            setError(wsError);
        }
    }, [wsError]);

    // Fallback polling when WebSocket is not connected
    useEffect(() => {
        if (!isConnected && enabled) {
            const pollScores = async () => {
                setIsLoading(true);
                try {
                    const response = await fetch('https://www.thesportsdb.com/api/v1/json/3/latestsoccer.php');
                    if (!response.ok) {
                        throw new Error('Failed to fetch live scores');
                    }
                    const data = await response.json();
                    setScores(data.results || []);
                    setError(null);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };

            // Initial poll
            pollScores();

            // Set up interval polling
            const interval = setInterval(pollScores, refreshInterval);

            return () => clearInterval(interval);
        }
    }, [isConnected, enabled, refreshInterval]);

    return {
        scores,
        isLoading,
        error,
        isConnected,
        lastUpdate,
        subscribeToLeague,
        unsubscribeFromLeague
    };
};