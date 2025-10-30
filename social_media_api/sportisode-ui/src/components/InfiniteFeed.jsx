// src/components/InfiniteFeed.jsx
import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';

// Shadcn/ui Imports
import { Alert, AlertTitle, AlertDescription } from '../components/components/ui/alert';

const InfiniteFeed = ({
    queryKey,
    queryFn,
    headerTitle,
    PostComponent,
    className = ""
}) => {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error
    } = useInfiniteQuery({
        queryKey,
        queryFn,
        getNextPageParam: (lastPage) => {
            // Django REST Framework pagination: check if there's a next page
            if (lastPage.next) {
                try {
                    const url = new URL(lastPage.next);
                    const offset = url.searchParams.get('offset');
                    return offset ? parseInt(offset) : undefined;
                } catch (error) {
                    console.error('Error parsing next page URL:', error);
                    return undefined;
                }
            }
            return undefined;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
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
                    <AlertTitle>Feed Error</AlertTitle>
                    <AlertDescription>
                        Could not load {headerTitle?.toLowerCase() || 'feed'}. {error?.message}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const allPosts = data?.pages?.flatMap(page => page.results || page || []) || [];

    console.log('InfiniteFeed - Query key:', queryKey, 'Data:', data, 'All posts length:', allPosts.length);

    return (
        <div className={`min-h-screen ${className}`}>
            {/* Header */}
            {headerTitle && (
                <div className="sticky top-0 bg-dark-bg/80 backdrop-blur-sm z-10 border-b border-gray-700 p-4">
                    <h1 className="text-xl font-semibold text-white">{headerTitle}</h1>
                </div>
            )}

            {/* Posts Feed */}
            <div className="divide-y divide-gray-700">
                {allPosts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No posts available for {headerTitle?.toLowerCase() || 'this feed'}.
                    </div>
                ) : (
                    allPosts.map((post, index) => (
                        <PostComponent
                            key={post.id || `post-${index}`}
                            post={post}
                            // Pass any additional props if needed
                        />
                    ))
                )}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
                <div className="p-4 text-center">
                    <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="px-4 py-2 bg-sport-accent text-white rounded-full hover:bg-sport-accent/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                    >
                        {isFetchingNextPage ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            'Load More'
                        )}
                    </button>
                </div>
            )}

            {/* Loading indicator at bottom */}
            {isFetchingNextPage && (
                <div className="p-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-sport-accent mx-auto" />
                </div>
            )}
        </div>
    );
};

export default InfiniteFeed;