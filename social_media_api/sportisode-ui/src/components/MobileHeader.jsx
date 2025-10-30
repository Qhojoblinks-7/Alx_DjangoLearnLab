// src/components/MobileHeader.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Crown, Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import ProfilePicture from './ProfilePicture';
import { Input } from '../components/components/ui/input';

const MobileHeader = ({ onProfileClick, onSettingsClick, showSearch = false, searchPlaceholder = "Search...", searchType = "global", onSearch, onSearchChange, searchQuery: externalSearchQuery, onSearchSubmit }) => {
    const navigate = useNavigate();
    const [internalSearchQuery, setInternalSearchQuery] = useState('');
    const user = useSelector(state => state.auth.user);
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

    // Use external search query if provided, otherwise use internal state
    const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            if (onSearchSubmit) {
                onSearchSubmit(searchQuery.trim());
            } else if (searchType === "global") {
                navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                if (externalSearchQuery === undefined) setInternalSearchQuery(''); // Clear search after navigation
            } else if (onSearch) {
                onSearch(searchQuery.trim());
            }
        }
    };

    const handleSearchChange = (e) => {
        const query = e.target.value;
        if (onSearchChange) {
            // Pass the query directly to parent handler for navigation logic
            onSearchChange(query);
        } else {
            setInternalSearchQuery(query);
        }
    };

    return (
        <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-dark-bg/95 backdrop-blur-sm border-b border-gray-700 px-4 py-3">
            <div className="flex items-center justify-between gap-x-2">
                {/* Left: Profile Image */}
                <button
                    onClick={onProfileClick}
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-800/50 transition-colors flex-shrink-0"
                >
                    {isAuthenticated && user ? (
                        <ProfilePicture
                            user={user}
                            size="h-8 w-8"
                            className="ring-2 ring-sport-accent/50"
                        />
                    ) : (
                        <div className="h-8 w-8 bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">?</span>
                        </div>
                    )}
                </button>

                {/* Center: Search Bar or App Logo */}
                {showSearch ? (
                    <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xs mx-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder={searchPlaceholder}
                                className="pl-10 pr-4 py-2 bg-dark-card border-gray-600 focus:border-sport-accent rounded-full text-white placeholder-gray-400 text-sm h-9"
                            />
                        </div>
                    </form>
                ) : (
                    <div className="flex items-center space-x-2 flex-1 justify-center">
                        <Crown className="h-6 w-6 text-sport-accent" />
                        <h1 className="text-xl font-semibold text-white">Sportisode</h1>
                    </div>
                )}

                {/* Right: Settings Icon */}
                <button
                    onClick={onSettingsClick}
                    className="p-2 rounded-full hover:bg-gray-800/50 transition-colors flex-shrink-0"
                >
                    <Settings className="h-6 w-6 text-gray-400 hover:text-white" />
                </button>
            </div>
        </header>
    );
};

export default MobileHeader;