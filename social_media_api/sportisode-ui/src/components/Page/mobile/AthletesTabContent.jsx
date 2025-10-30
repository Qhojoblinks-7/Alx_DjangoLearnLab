// src/components/Page/mobile/AthletesTabContent.jsx
import React from 'react';

const AthletesTabContent = ({ athletes }) => {
    console.log('🏃 Mobile AthletesTabContent: Rendering with athletes:', athletes?.length);
    return (
        <div className="space-y-4">
            {athletes?.length > 0 ? (
                athletes.map((athlete, index) => (
                    <div
                        key={athlete.id}
                        className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-5 border border-purple-500/20 active:scale-95 transition-all duration-200 cursor-pointer hover:from-purple-500/15 hover:to-pink-500/15"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <span className="text-white text-xl font-bold">
                                    {athlete.first_name?.charAt(0)}{athlete.last_name?.charAt(0)}
                                </span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="font-medium text-white text-lg">
                                        {athlete.first_name} {athlete.last_name}
                                    </h3>
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed mb-2">
                                    {athlete.position} • {athlete.team}
                                </p>
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-1 bg-purple-500/20 px-3 py-1 rounded-full">
                                        <span className="text-purple-400 text-xs">🏃</span>
                                        <span className="text-purple-400 text-xs font-medium">{athlete.sport}</span>
                                    </div>
                                    <div className="flex items-center space-x-1 bg-gray-700/50 px-3 py-1 rounded-full">
                                        <span className="text-gray-400 text-xs">⭐</span>
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
                        <span className="text-gray-600 text-3xl">🏃</span>
                    </div>
                    <h3 className="text-white font-medium text-lg mb-2">No athletes available</h3>
                    <p className="text-gray-400 text-sm">Check back later for athlete profiles</p>
                </div>
            )}
        </div>
    );
};

export default AthletesTabContent;