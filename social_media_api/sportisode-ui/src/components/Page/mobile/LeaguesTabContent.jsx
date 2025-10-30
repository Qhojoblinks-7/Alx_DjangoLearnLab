// src/components/Page/mobile/LeaguesTabContent.jsx
import React from 'react';
import { Trophy } from 'lucide-react';

const LeaguesTabContent = ({ leagues }) => {
    console.log('🏆 Mobile LeaguesTabContent: Rendering with leagues:', leagues?.length);
    return (
        <div className="space-y-4">
            {leagues?.length > 0 ? (
                leagues.map((league, index) => (
                    <div
                        key={league.id}
                        className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-2xl p-5 border border-yellow-500/20 active:scale-95 transition-all duration-200 cursor-pointer hover:from-yellow-500/15 hover:to-amber-500/15"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <Trophy className="h-8 w-8 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="font-medium text-white text-lg">{league.name}</h3>
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed mb-3">{league.description}</p>
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-1 bg-yellow-500/20 px-3 py-1 rounded-full">
                                        <span className="text-yellow-400 text-xs">🏆</span>
                                        <span className="text-yellow-400 text-xs font-medium">Professional</span>
                                    </div>
                                    <div className="flex items-center space-x-1 bg-gray-700/50 px-3 py-1 rounded-full">
                                        <span className="text-gray-400 text-xs">⚽</span>
                                        <span className="text-gray-400 text-xs">Sports</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Trophy className="h-10 w-10 text-gray-600" />
                    </div>
                    <h3 className="text-white font-medium text-lg mb-2">No leagues available</h3>
                    <p className="text-gray-400 text-sm">Check back later for league information</p>
                </div>
            )}
        </div>
    );
};

export default LeaguesTabContent;