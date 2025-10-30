// src/components/Page/StreamPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Heart, MessageCircle, Share, Users, Eye, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import StreamPlayer from '../StreamPlayer';
import ProfilePicture from '../ProfilePicture';
import { fetchSinglePost } from '../lib/api';
import { useDispatch, useSelector } from 'react-redux';
import { selectViewerCount, selectChatMessages, selectWsConnection, addChatMessage } from '../../store/liveStreamSlice';

const StreamPage = () => {
    const { streamId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [chatInput, setChatInput] = useState('');
    const chatMessagesEndRef = useRef(null);

    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
    const user = useSelector(state => state.auth.user);

    // Get real-time data from Redux
    const viewerCount = useSelector(selectViewerCount(streamId));
    const chatMessages = useSelector(selectChatMessages(streamId));
    const wsConnection = useSelector(selectWsConnection(streamId));
    const isConnected = wsConnection?.isConnected || false;

    // Fetch stream details (using the posts endpoint since streams are integrated)
    const { data: stream, isLoading, error } = useQuery({
        queryKey: ['stream', streamId],
        queryFn: () => fetchSinglePost(streamId),
        enabled: !!streamId,
    });

    // Auto-scroll chat to bottom when new messages arrive
    useEffect(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSendChatMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !isAuthenticated || !isConnected) return;

        // For now, simulate sending chat message via Redux action
        // In a real implementation, this would send via WebSocket
        const message = {
            id: Date.now(),
            username: user?.username || 'Anonymous',
            content: chatInput.trim(),
            timestamp: new Date().toISOString(),
        };

        dispatch(addChatMessage({ streamId, message }));
        setChatInput('');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sport-accent mx-auto mb-4"></div>
                    <p>Loading stream...</p>
                </div>
            </div>
        );
    }

    if (error || !stream) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="text-red-400 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold mb-2">Stream Not Found</h2>
                    <p className="text-gray-400 mb-4">The stream you're looking for doesn't exist or has ended.</p>
                    <Button onClick={() => navigate('/')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Home
                    </Button>
                </div>
            </div>
        );
    }

    // Check if this is a live stream (you might need to adjust this based on your model)
    const isLiveStream = stream.is_live || stream.status === 'live';

    return (
        <div className="min-h-screen bg-dark-bg">
            {/* Header */}
            <div className="bg-dark-card border-b border-gray-800 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Button
                            onClick={() => navigate('/')}
                            variant="ghost"
                            className="text-white hover:bg-gray-800"
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            Back
                        </Button>

                        <div className="flex items-center space-x-4">
                            {isLiveStream && (
                                <div className="flex items-center text-red-500 font-semibold">
                                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                                    LIVE
                                </div>
                            )}

                            <div className="flex items-center text-gray-400 text-sm">
                                <Eye className="h-4 w-4 mr-1" />
                                {viewerCount} viewers
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Stream Area */}
                    <div className="lg:col-span-3">
                        {/* Stream Player */}
                        <div className="aspect-video mb-4">
                            <StreamPlayer
                                stream={stream}
                                className="w-full h-full"
                            />
                        </div>

                        {/* Stream Info */}
                        <div className="bg-dark-card rounded-lg p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold text-white mb-2">{stream.title}</h1>
                                    <div className="flex items-center space-x-3">
                                        <ProfilePicture user={stream.author} size="h-10 w-10" />
                                        <div>
                                            <p className="text-white font-semibold">{stream.author?.username}</p>
                                            <p className="text-gray-400 text-sm">
                                                {stream.created_at ? new Date(stream.created_at).toLocaleDateString() : 'Live now'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm">
                                        <Heart className="h-4 w-4 mr-2" />
                                        Like
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <Share className="h-4 w-4 mr-2" />
                                        Share
                                    </Button>
                                </div>
                            </div>

                            {/* Description */}
                            {stream.content && (
                                <div className="text-gray-300 mb-4">
                                    <p className="whitespace-pre-wrap">{stream.content}</p>
                                </div>
                            )}

                            {/* Stream Stats */}
                            <div className="flex items-center space-x-6 text-sm text-gray-400 border-t border-gray-800 pt-4">
                                <div className="flex items-center">
                                    <Eye className="h-4 w-4 mr-1" />
                                    {stream.views_count || 0} views
                                </div>
                                <div className="flex items-center">
                                    <Heart className="h-4 w-4 mr-1" />
                                    {stream.likes_count || 0} likes
                                </div>
                                <div className="flex items-center">
                                    <MessageCircle className="h-4 w-4 mr-1" />
                                    {stream.comments_count || 0} comments
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        {/* Chat/Comments Section */}
                        <div className="bg-dark-card rounded-lg p-4">
                            <h3 className="text-white font-semibold mb-4 flex items-center">
                                <MessageCircle className="h-5 w-5 mr-2" />
                                Live Chat
                                {isConnected && <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>}
                            </h3>

                            {/* Chat messages */}
                            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                                {chatMessages.length > 0 ? (
                                    chatMessages.map((msg, index) => (
                                        <div key={index} className="flex items-start space-x-2">
                                            <div className="w-6 h-6 bg-sport-accent rounded-full flex items-center justify-center text-xs font-bold text-black">
                                                {msg.username?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-white font-semibold text-sm">{msg.username}</span>
                                                    <span className="text-gray-500 text-xs">
                                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <p className="text-gray-300 text-sm">{msg.content}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-500 text-sm py-8">
                                        {isLiveStream ? 'No messages yet. Be the first to chat!' : 'Chat is disabled for ended streams'}
                                    </div>
                                )}
                                <div ref={chatMessagesEndRef} />
                            </div>

                            {/* Chat input */}
                            {isLiveStream && isAuthenticated && (
                                <div className="border-t border-gray-800 pt-4">
                                    <form onSubmit={handleSendChatMessage} className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sport-accent"
                                            maxLength={200}
                                        />
                                        <Button
                                            type="submit"
                                            size="sm"
                                            disabled={!chatInput.trim() || !isConnected}
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </form>
                                    {!isConnected && (
                                        <p className="text-yellow-500 text-xs mt-2">Reconnecting to chat...</p>
                                    )}
                                </div>
                            )}

                            {isLiveStream && !isAuthenticated && (
                                <div className="border-t border-gray-800 pt-4 text-center">
                                    <p className="text-gray-400 text-sm mb-2">Login to participate in chat</p>
                                    <Button size="sm" onClick={() => navigate('/login')}>
                                        Login
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Stream Info */}
                        <div className="bg-dark-card rounded-lg p-4 mt-4">
                            <h3 className="text-white font-semibold mb-4">Stream Info</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-gray-400">Status:</span>
                                    <span className={`ml-2 ${isLiveStream ? 'text-green-400' : 'text-gray-400'}`}>
                                        {isLiveStream ? '🔴 Live' : '⏹️ Ended'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Started:</span>
                                    <span className="ml-2 text-white">
                                        {stream.created_at ? new Date(stream.created_at).toLocaleString() : 'N/A'}
                                    </span>
                                </div>
                                {stream.tags && stream.tags.length > 0 && (
                                    <div>
                                        <span className="text-gray-400">Tags:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {stream.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="bg-sport-accent/20 text-sport-accent px-2 py-1 rounded text-xs"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StreamPage;