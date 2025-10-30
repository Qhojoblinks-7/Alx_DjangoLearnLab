// src/components/Page/mobile/MobileExplorePage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search, TrendingUp, Users, Trophy, MapPin, X, RefreshCw, ChevronLeft, ChevronRight, Home, Flame, Award, UserCheck, Activity, Newspaper, Heart, MessageCircle, BarChart3, Zap, Target, Star } from 'lucide-react';

// Component Imports
import MobileHeader from '../../MobileHeader';
import ProfileDrawer from '../../ProfileDrawer';
import BottomNavBar from '../../BottomNavBar';
import MobileFloatingMenu from '../../MobileFloatingMenu';

import {
  fetchExploreTrends,
  fetchExploreLeagues,
  fetchExploreTeams,
  fetchExploreAthletes,
  fetchExploreHeadlines,
  fetchExploreSuggestedUsers,
  selectExploreTrends,
  selectExploreLeagues,
  selectExploreTeams,
  selectExploreAthletes,
  selectExploreHeadlines,
  selectExploreSuggestedUsers,
  selectDefaultExplorePage,
  selectSearchQuery,
  setDefaultExplorePage,
  navigateBasedOnSearch,
} from '../../../store/exploreSlice';



// Component Imports
import ForYouTabContent from './ForYouTabContent';
import TrendingTabContent from './TrendingTabContent';
import LeaguesTabContent from './LeaguesTabContent';
import TeamsTabContent from './TeamsTabContent';
import AthletesTabContent from './AthletesTabContent';

// --- Main Mobile Explore Page Component ---
const MobileExplorePage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
    // const [isRefreshing, setIsRefreshing] = useState(false); // eslint-disable-line no-unused-vars
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const searchRef = useRef(null);
    const contentRef = useRef(null);

    console.log('📱 MobileExplorePage: Component rendered');

    // Redux selectors
    const trends = useSelector(selectExploreTrends);
    const leagues = useSelector(selectExploreLeagues);
    const teams = useSelector(selectExploreTeams);
    const athletes = useSelector(selectExploreAthletes);
    const headlines = useSelector(selectExploreHeadlines);
    const suggestedUsers = useSelector(selectExploreSuggestedUsers);
    const defaultPage = useSelector(selectDefaultExplorePage);
    const searchQuery = useSelector(selectSearchQuery);

    // Use Redux state for active tab
    const activeTab = defaultPage;

    // Tab configuration for swipe navigation
    const tabs = [
        { id: 'for-you', label: 'For You', icon: Home },
        { id: 'trending', label: 'Trending', icon: Flame },
        { id: 'leagues', label: 'Leagues', icon: Trophy },
        { id: 'teams', label: 'Teams', icon: Users },
        { id: 'athletes', label: 'Athletes', icon: Activity }
    ];

    // Fetch data on component mount
    useEffect(() => {
        dispatch(fetchExploreTrends());
        dispatch(fetchExploreLeagues());
        dispatch(fetchExploreTeams());
        dispatch(fetchExploreAthletes());
        dispatch(fetchExploreHeadlines());
        dispatch(fetchExploreSuggestedUsers());
    }, [dispatch]);

    console.log('📱 MobileExplorePage: Data loaded - trends:', trends?.length, 'leagues:', leagues?.length, 'teams:', teams?.length, 'athletes:', athletes?.length);

    // Pull-to-refresh functionality
    // const handleRefresh = useCallback(async () => { // eslint-disable-line no-unused-vars
    //     setIsRefreshing(true);
    //     try {
    //         await Promise.all([
    //             dispatch(fetchExploreTrends()),
    //             dispatch(fetchExploreLeagues()),
    //             dispatch(fetchExploreTeams()),
    //             dispatch(fetchExploreAthletes()),
    //             dispatch(fetchExploreHeadlines()),
    //             dispatch(fetchExploreSuggestedUsers())
    //         ]);
    //     } catch (error) {
    //         console.error('Refresh failed:', error);
    //     } finally {
    //         setTimeout(() => setIsRefreshing(false), 1000);
    //     }
    // }, [dispatch]);

    // Swipe gesture handlers
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);

        if (isLeftSwipe && currentIndex < tabs.length - 1) {
            dispatch(setDefaultExplorePage(tabs[currentIndex + 1].id));
        }
        if (isRightSwipe && currentIndex > 0) {
            dispatch(setDefaultExplorePage(tabs[currentIndex - 1].id));
        }
    };

    const handleProfileClick = () => {
        setIsProfileDrawerOpen(true);
    };

    const handleSettingsClick = () => {
        console.log('Settings clicked');
    };

    // Search functionality - update Redux state and handle navigation
    const handleSearchChange = (query) => {
        // Update Redux state and handle navigation
        dispatch(navigateBasedOnSearch({ query, navigate }));
    };

    const handleSearchSubmit = () => {
        const trimmedQuery = searchQuery.trim();
        if (trimmedQuery.length > 0) {
            // Always allow search submission, even with single character
            dispatch(navigateBasedOnSearch({ query: trimmedQuery, navigate }));
        }
    };


    return (
        <div className="min-h-screen bg-dark-bg">
            {/* Mobile Header */}
            <div ref={searchRef}>
                <MobileHeader
                    onProfileClick={handleProfileClick}
                    onSettingsClick={handleSettingsClick}
                    showSearch={true}
                    searchPlaceholder="Search sports, teams, athletes..."
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    onSearchSubmit={handleSearchSubmit}
                />
            </div>

            {/* Profile Drawer */}
            <ProfileDrawer
                isOpen={isProfileDrawerOpen}
                onClose={() => setIsProfileDrawerOpen(false)}
            />

            {/* Main Content with Swipe Support */}
            <div
                ref={contentRef}
                className="pt-16 min-h-screen"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Enhanced Tab Navigation */}
                <div className="sticky top-16 bg-dark-card border-b border-gray-700 z-10 px-3 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-1">
                            <div className="text-sport-accent flex-shrink-0">
                                {activeTab && tabs.find(tab => tab.id === activeTab)?.icon && React.createElement(tabs.find(tab => tab.id === activeTab).icon, { className: "h-4 w-4 sm:h-5 sm:w-5" })}
                            </div>
                            <h1 className="text-white font-semibold text-base sm:text-lg truncate">
                                {tabs.find(tab => tab.id === activeTab)?.label}
                            </h1>
                        </div>
                        <div className="flex items-center space-x-0.5 sm:space-x-1 ml-2">
                            <button
                                onClick={() => {
                                    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                                    if (currentIndex > 0) dispatch(setDefaultExplorePage(tabs[currentIndex - 1].id));
                                }}
                                className={`p-1.5 sm:p-2 rounded-full transition-colors touch-manipulation ${
                                    tabs.findIndex(tab => tab.id === activeTab) === 0
                                        ? 'text-gray-600 cursor-not-allowed'
                                        : 'text-sport-accent hover:bg-sport-accent/10 active:bg-sport-accent/20'
                                }`}
                                disabled={tabs.findIndex(tab => tab.id === activeTab) === 0}
                            >
                                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                            <button
                                onClick={() => {
                                    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                                    if (currentIndex < tabs.length - 1) dispatch(setDefaultExplorePage(tabs[currentIndex + 1].id));
                                }}
                                className={`p-1.5 sm:p-2 rounded-full transition-colors touch-manipulation ${
                                    tabs.findIndex(tab => tab.id === activeTab) === tabs.length - 1
                                        ? 'text-gray-600 cursor-not-allowed'
                                        : 'text-sport-accent hover:bg-sport-accent/10 active:bg-sport-accent/20'
                                }`}
                                disabled={tabs.findIndex(tab => tab.id === activeTab) === tabs.length - 1}
                            >
                                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Tab Indicators */}
                    <div className="flex space-x-1 sm:space-x-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => dispatch(setDefaultExplorePage(tab.id))}
                                className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-md sm:rounded-lg text-xs font-medium transition-all duration-200 touch-manipulation ${
                                    activeTab === tab.id
                                        ? 'bg-sport-accent text-black shadow-lg transform scale-105'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 active:bg-gray-600'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Pull to Refresh Indicator */}
                    {/* {isRefreshing && (
                        <div className="flex items-center justify-center mt-2 text-sport-accent">
                            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" />
                            <span className="text-xs">Refreshing...</span>
                        </div>
                    )} */}
                </div>

                {/* Tab Content with Enhanced Mobile Layout */}
                <div className="px-3 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-24">
                    {/* For You Tab */}
                    {activeTab === 'for-you' && (
                        <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
                            <ForYouTabContent
                                headlines={headlines}
                                suggestedUsers={suggestedUsers}
                            />
                        </div>
                    )}

                    {/* Trending Tab */}
                    {activeTab === 'trending' && (
                        <div className="animate-in slide-in-from-right-5 duration-300">
                            <TrendingTabContent trends={trends} />
                        </div>
                    )}

                    {/* Leagues Tab */}
                    {activeTab === 'leagues' && (
                        <div className="animate-in slide-in-from-right-5 duration-300">
                            <LeaguesTabContent leagues={leagues} />
                        </div>
                    )}

                    {/* Teams Tab */}
                    {activeTab === 'teams' && (
                        <div className="animate-in slide-in-from-right-5 duration-300">
                            <TeamsTabContent teams={teams} />
                        </div>
                    )}

                    {/* Athletes Tab */}
                    {activeTab === 'athletes' && (
                        <div className="animate-in slide-in-from-right-5 duration-300">
                            <AthletesTabContent athletes={athletes} />
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Floating Menu */}
            <MobileFloatingMenu />

            {/* Enhanced Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-50">
                <BottomNavBar />
            </div>
        </div>
    );
};

export default MobileExplorePage;