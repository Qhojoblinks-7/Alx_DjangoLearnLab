// src/components/TrendingTabContent.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from './lib/api';
import { Loader2, MoreHorizontal } from 'lucide-react';

// Shadcn/ui Imports
import { Card } from '../components/components/ui/card';
import { Button } from '../components/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../components/components/ui/alert';

// --- API Fetcher ---
const fetchTrends = async () => {
    const response = await authenticatedFetch('/trends/', { method: 'GET' });
    if (!response.ok) {
        throw new Error('Failed to fetch trending topics.');
    }
    return response.json();
};

const TrendingTabContent = () => {
    const { data: trends, isLoading, isError, error } = useQuery({
        queryKey: ['trends'],
        queryFn: fetchTrends,
        staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
        refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-sport-accent" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4">
                <Alert variant="destructive">
                    <AlertTitle>Trending Error</AlertTitle>
                    <AlertDescription>Could not load trending topics. {error.message}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <Card className="bg-dark-card border-none rounded-none mt-3">
            {/* The image shows a full-width header for the trending section */}
            <h2 className="text-xl font-extrabold p-3 text-primary-text border-b border-border-divider">Trending for you</h2>
            
            {trends.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No trending topics right now.</div>
            ) : (
                trends.map((item, index) => (
                    <div key={item.id || index} className="p-3 hover:bg-gray-800/50 cursor-pointer border-t border-gray-700">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-secondary-text text-xs">
                                    {item.rank ? `${item.rank} · ` : ''}
                                    {item.category}
                                </p>
                                <p className="font-bold text-primary-text leading-tight mt-1">{item.topic}</p>
                                <p className="text-secondary-text text-sm mt-1">{item.post_count?.toLocaleString()} posts</p>
                            </div>
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-sport-accent/10 hover:text-sport-accent">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                ))
            )}
            <div className="p-3 text-sport-accent hover:bg-secondary-bg cursor-pointer border-t border-border-divider">Show more</div>
        </Card>
    );
};

export default TrendingTabContent;