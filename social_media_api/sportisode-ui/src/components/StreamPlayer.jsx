// src/components/StreamPlayer.jsx

import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { Button } from './components/ui/button';

const StreamPlayer = ({ stream, className = "" }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !stream?.playback_url) return;

        // Set up HLS stream
        const setupStream = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // For modern browsers, we can use native HLS support
                // In production, you might want to use hls.js for broader compatibility
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = stream.playback_url;
                } else {
                    // Fallback for browsers without native HLS support
                    // You would load hls.js here and use it as a fallback
                    console.warn('Native HLS not supported, stream may not work');
                    video.src = stream.playback_url;
                }

                video.load();
            } catch (err) {
                console.error('Error setting up stream:', err);
                setError('Failed to load stream');
                setIsLoading(false);
            }
        };

        setupStream();

        // Cleanup
        return () => {
            if (video) {
                video.pause();
                video.src = '';
            }
        };
    }, [stream?.playback_url]);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            video.play().catch(err => {
                console.error('Error playing video:', err);
                setError('Failed to play stream');
            });
        }
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;

        video.muted = !video.muted;
        setIsMuted(video.muted);
    };

    const toggleFullscreen = () => {
        const container = videoRef.current?.parentElement;
        if (!container) return;

        if (!isFullscreen) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const handleVideoEvent = (event) => {
        switch (event.type) {
            case 'play':
                setIsPlaying(true);
                setIsLoading(false);
                break;
            case 'pause':
                setIsPlaying(false);
                break;
            case 'waiting':
                setIsLoading(true);
                break;
            case 'canplay':
                setIsLoading(false);
                break;
            case 'error':
                setError('Stream error occurred');
                setIsLoading(false);
                break;
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    if (error) {
        return (
            <div className={`bg-black rounded-lg flex items-center justify-center ${className}`}>
                <div className="text-center text-white">
                    <div className="text-red-400 text-lg mb-2">⚠️</div>
                    <p className="text-sm">{error}</p>
                    <p className="text-xs text-gray-400 mt-1">Stream may be offline or unavailable</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
            {/* Video Element */}
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                playsInline
                onPlay={handleVideoEvent}
                onPause={handleVideoEvent}
                onWaiting={handleVideoEvent}
                onCanPlay={handleVideoEvent}
                onError={handleVideoEvent}
                poster={stream?.thumbnail_url}
            />

            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <p className="text-sm">Loading stream...</p>
                    </div>
                </div>
            )}

            {/* Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={togglePlay}
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-white/20"
                        >
                            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </Button>

                        <Button
                            onClick={toggleMute}
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-white/20"
                        >
                            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className="text-white text-sm">
                            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                            LIVE
                        </div>

                        <Button
                            onClick={toggleFullscreen}
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-white/20"
                        >
                            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stream Info Overlay */}
            <div className="absolute top-4 left-4 right-4">
                <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
                    <h3 className="text-white font-semibold text-lg">{stream?.title || 'Live Stream'}</h3>
                    <p className="text-gray-300 text-sm">{stream?.host?.username || 'Unknown'} is live</p>
                    {stream?.description && (
                        <p className="text-gray-400 text-xs mt-1 line-clamp-2">{stream.description}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StreamPlayer;