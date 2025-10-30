// src/components/Page/mobile/TrendingTabContent.jsx
import React from 'react';
import { TrendingUp, Flame } from 'lucide-react';

const TrendingTabContent = ({ trends }) => (
    <div className="space-y-4">
        {trends?.length > 0 ? (
            trends.map((trend, index) => (
                <div
                    key={trend.id}
                    className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl p-5 border border-orange-500/20 active:scale-95 transition-all duration-200 cursor-pointer hover:from-orange-500/15 hover:to-red-500/15"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">{index + 1}</span>
                                </div>
                                <div>
                                    <p className="text-orange-400 text-xs font-medium uppercase tracking-wide">{trend.category}</p>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-white text-xs">🔥</span>
                                        <span className="text-gray-400 text-xs">Trending</span>
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2 leading-tight">#{trend.topic}</h3>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-1">
                                    <span className="text-gray-400 text-sm">📊</span>
                                    <span className="text-gray-300 text-sm">{trend.post_count ? trend.post_count.toLocaleString() : '0'} posts</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <TrendingUp className="h-4 w-4 text-orange-500" />
                                    <span className="text-orange-400 text-sm font-medium">Hot</span>
                                </div>
                            </div>
                        </div>
                        <div className="ml-4">
                            <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-orange-500" />
                            </div>
                        </div>
                    </div>
                </div>
            ))
        ) : (
            <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Flame className="h-10 w-10 text-gray-600" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">No trending topics</h3>
                <p className="text-gray-400 text-sm">Check back later for trending sports discussions</p>
            </div>
        )}
    </div>
);

export default TrendingTabContent;