// src/components/RightSidebar.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, Send, Loader2 } from 'lucide-react';

import TrendsSection from '../components/sidebar/TrendsSection';
import WhoToFollowSection from '../components/profile/WhoToFollowSection';
import { Card } from '../components/components/ui/card'; // For the 'Live on X' and footer sections
import { fetchLiveStreamsAsync, selectLiveStreams, selectLiveStreamsLoading, selectLiveStreamsError } from '../store/liveStreamSlice';

// --- Sub-component: Live on X ---
const LiveOnXSection = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const liveStreams = useSelector(selectLiveStreams);
    const isLoading = useSelector(selectLiveStreamsLoading);
    const isError = useSelector(selectLiveStreamsError);

    // Fetch live streams on component mount
    useEffect(() => {
        dispatch(fetchLiveStreamsAsync());
    }, [dispatch]);

    return (
        <Card className="bg-dark-card border-none rounded-xl p-0 mb-4 overflow-hidden">
            <h2 className="text-xl font-semibold p-3 text-white">Live on Sportisode</h2>

            {isLoading && (
                <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-sport-accent" />
                </div>
            )}

            {isError && (
                <p className="text-red-400 p-3 text-sm">Could not load live events.</p>
            )}

            {!isLoading && liveStreams?.filter(stream => stream.is_live).map((stream, index) => (
                <div
                    key={stream.id}
                    className={`p-3 hover:bg-gray-800/50 cursor-pointer transition-colors ${index > 0 ? 'border-t border-gray-800' : ''}`}
                    onClick={() => {
                        // Navigate to the stream page
                        navigate(`/stream/${stream.id}`);
                    }}
                >
                    <div className="flex items-center text-xs text-red-500 font-bold mb-1">
                        <span className="h-2 w-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                        LIVE
                    </div>
                    <p className="font-bold text-white">{stream.host?.username || 'Unknown'} is streaming...</p>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-500 text-sm">LIVE : {stream.title}</span>
                        <button className="bg-sport-accent text-black text-xs font-bold py-1 px-3 rounded-full flex items-center">
                            <span className="mr-1">👁️</span>
                            {stream.viewer_count || 0}
                        </button>
                    </div>
                </div>
            ))}

            {/* Fallback content if no live streams */}
            {!isLoading && (!liveStreams || liveStreams.filter(s => s.is_live).length === 0) && (
                <div className="p-3 border-t border-gray-800">
                    <p className="text-sm font-bold text-white">What's happening</p>
                    <div className="text-xs text-gray-500">No live events currently</div>
                </div>
            )}
        </Card>
    );
};

// --- Main Right Sidebar ---
const RightSidebar = ({ isMobile = false }) => {
    return (
        <div className={`${isMobile ? 'w-full' : 'hidden lg:block w-[26rem] pl-8 border-l border-gray-700'}`}>
            <div className="sticky top-4 overflow-y-auto h-[calc(100vh-1rem)]">
                {/* 1. Search Bar (Often styled outside the sidebar box, but included here for completeness) */}
                {/* You'd typically use a dedicated SearchBar component here */}
                
                {/* 2. Live on X / What's Happening */}
                <LiveOnXSection />

                {/* 3. Trends/What's Happening */}
                <TrendsSection />

                {/* 4. Who to Follow */}
                <WhoToFollowSection />

                {/* 5. Footer Links (RSB-06) */}
                <div className="text-xs text-gray-500 p-4 space-y-1">
                    <p className="space-x-4">
                        <a href="#" className="hover:underline">Terms of Service</a>
                        <a href="#" className="hover:underline">Privacy Policy</a>
                        <a href="#" className="hover:underline">Cookie Policy</a>
                    </p>
                    <p className="space-x-4">
                        <a href="#" className="hover:underline">Accessibility</a>
                        <a href="#" className="hover:underline">Ads info</a>
                        <a href="#" className="hover:underline">More...</a>
                    </p>
                    <p>© 2025 X Corp.</p>
                </div>
            </div>
        </div>
    );
};

export default RightSidebar;