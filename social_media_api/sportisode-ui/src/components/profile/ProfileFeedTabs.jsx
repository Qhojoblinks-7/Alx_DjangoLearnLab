// src/components/profile/ProfileFeedTabs.jsx
import React from 'react';
import { FileText, MessageCircle, Star, Newspaper, Image, Heart } from 'lucide-react';

const ProfileFeedTabs = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'posts', label: 'Posts', icon: FileText },
        { id: 'replies', label: 'Replies', icon: MessageCircle },
        { id: 'highlights', label: 'Highlights', icon: Star },
        { id: 'articles', label: 'Articles', icon: Newspaper },
        { id: 'media', label: 'Media', icon: Image },
        { id: 'likes', label: 'Likes', icon: Heart },
    ];

    return (
        <div className="border-b border-gray-700">
            <div className="flex justify-around">
                {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center justify-center py-3 px-2 text-xs font-medium transition-all duration-200 flex-1
                                ${activeTab === tab.id
                                    ? 'border-b-2 border-sport-accent text-sport-accent'
                                    : 'text-gray-500 hover:text-white hover:bg-gray-800/50'
                                }`}
                        >
                            <IconComponent className="h-5 w-5 mb-1" />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ProfileFeedTabs;