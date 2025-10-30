// src/components/Page/mobile/TeamsTabContent.jsx
import React from 'react';
import { Users } from 'lucide-react';

const TeamsTabContent = ({ teams }) => {
    console.log('🏀 Mobile TeamsTabContent: Rendering with teams:', teams?.length);
    return (
        <div className="space-y-4">
            {teams?.length > 0 ? (
                teams.map((team, index) => (
                    <div
                        key={team.id}
                        className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-5 border border-green-500/20 active:scale-95 transition-all duration-200 cursor-pointer hover:from-green-500/15 hover:to-emerald-500/15"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <Users className="h-8 w-8 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="font-medium text-white text-lg">{team.name}</h3>
                                    <div className="px-2 py-1 bg-green-500/20 rounded-full">
                                        <span className="text-green-400 text-xs font-bold">{team.abbreviation}</span>
                                    </div>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed mb-3">{team.sport}</p>
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-1 bg-green-500/20 px-3 py-1 rounded-full">
                                        <span className="text-green-400 text-xs">⚽</span>
                                        <span className="text-green-400 text-xs font-medium">{team.sport}</span>
                                    </div>
                                    <div className="flex items-center space-x-1 bg-gray-700/50 px-3 py-1 rounded-full">
                                        <span className="text-gray-400 text-xs">🏟️</span>
                                        <span className="text-gray-400 text-xs">Professional</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="h-10 w-10 text-gray-600" />
                    </div>
                    <h3 className="text-white font-medium text-lg mb-2">No teams available</h3>
                    <p className="text-gray-400 text-sm">Check back later for team information</p>
                </div>
            )}
        </div>
    );
};

export default TeamsTabContent;