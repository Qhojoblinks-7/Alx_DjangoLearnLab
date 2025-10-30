// src/components/sidebar/TrendsSection.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MoreHorizontal } from 'lucide-react';

import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { fetchSidebarTrends } from '../lib/api';

const TrendsSection = () => {
    // Uses the existing fetchTrends API function
    const { data: trends, isLoading, isError } = useQuery({
        queryKey: ['sidebarTrends'],
        queryFn: fetchSidebarTrends,
        staleTime: 5 * 60 * 1000,
    });

    return (
        <Card className="bg-dark-card border-none rounded-xl p-0 mb-4 overflow-hidden">
            <h2 className="text-xl font-extrabold p-3 text-white">What's happening</h2>
            
            {isLoading && (
                <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-sport-accent" />
                </div>
            )}

            {isError && (
                <p className="text-red-400 p-3 text-sm">Could not load trends.</p>
            )}

            {!isLoading && trends?.slice(0, 5).map((trend, index) => (
                <div 
                    key={index} 
                    className="p-3 hover:bg-gray-800/50 cursor-pointer transition-colors border-t border-gray-800"
                >
                    <div className="flex justify-between items-start">
                        <p className="text-xs text-gray-500">{trend.category || 'Trending in Ghana'}</p>
                        <MoreHorizontal className="h-4 w-4 text-gray-500 hover:text-white"/>
                    </div>
                    <p className="font-bold text-white mt-0.5">{trend.topic}</p>
                    <p className="text-xs text-gray-500">{trend.post_count?.toLocaleString() || 0} posts</p>
                </div>
            ))}

            <Button variant="link" className="w-full justify-start text-sport-accent p-3 hover:bg-gray-800/50">
                Show more
            </Button>
        </Card>
    );
};

export default TrendsSection;