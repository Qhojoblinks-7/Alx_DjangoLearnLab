// src/pages/Feed.jsx
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
// Components
import PostCard from '../PostCard';
import { ScrollArea } from '../components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
// Redux actions
import { setFeedType } from '../../store/feedSlice';
import { fetchHomeFeed, setActiveTab } from '../../store/homeFeedSlice';

const Feed = () => {
    console.log('Feed: Component mounted/updated');
    const dispatch = useDispatch();
    const feedType = useSelector((state) => state.feed.feedType);
    const { posts, hasNextPage, isLoading, isFetchingNextPage, error, offset } = useSelector((state) => state.homeFeed);

    console.log('Feed: Redux state', { posts: posts.length, hasNextPage, isLoading, isFetchingNextPage, error, offset, feedType });
    const loadMoreRef = useRef(null);

    // Load initial feed data when component mounts or feed type changes
    useEffect(() => {
        console.log('Feed: useEffect triggered', { postsLength: posts.length, feedType, condition: posts.length === 0 || feedType !== 'forYou' });
        if (posts.length === 0 || feedType !== 'forYou') {
            console.log('Feed: Dispatching fetchHomeFeed');
            dispatch(fetchHomeFeed({ tab: feedType === 'forYou' ? 'for_you' : 'following', offset: 0 }));
        } else {
            console.log('Feed: Skipping fetchHomeFeed dispatch');
        }
    }, [dispatch, feedType, posts.length]);

    // Debug: Force dispatch on mount
    useEffect(() => {
        console.log('Feed: Force dispatch useEffect');
        if (posts.length === 0) {
            console.log('Feed: Force dispatching fetchHomeFeed');
            dispatch(fetchHomeFeed({ tab: 'for_you', offset: 0 }));
        }
    }, []); // Empty dependency array - only run on mount

    // Debug: Log every render
    console.log('Feed: Render', { feedType, postsCount: posts.length });

    // Automatic pagination using Intersection Observer
    useEffect(() => {
        if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    dispatch(fetchHomeFeed({
                        tab: feedType === 'forYou' ? 'for_you' : 'following',
                        offset,
                        isLoadMore: true
                    }));
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(loadMoreRef.current);

        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current);
            }
        };
    }, [hasNextPage, isFetchingNextPage, offset, feedType, dispatch]);

    // Handle tab changes
    const handleTabChange = (newFeedType) => {
        dispatch(setFeedType(newFeedType));
        dispatch(setActiveTab(newFeedType === 'forYou' ? 'for_you' : 'following'));
    };

    // --- Loading and Error States ---
    if (isLoading && posts.length === 0) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-sport-accent" /></div>;
    }

    if (error && posts.length === 0) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertTitle>Feed Error</AlertTitle>
                    <AlertDescription>Could not load the personalized feed. {error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
       <div className="max-w-2xl mx-auto lg:max-w-[64rem] scroll-hidden min-h-screen">
  {/* Feed Type Selector Header */}
  <div className="sticky top-0 bg-dark-bg/80 backdrop-blur-md z-10 border-b border-gray-700">
    <div className="flex items-center justify-between px-4 py-2 lg:px-6">

      {/* For You Container */}
      <div
        className={`px-2 py-1 rounded-md cursor-pointer transition-colors border-b-2 ${
          feedType === 'forYou'
            ? 'border-sport-accent text-white'
            : 'border-transparent text-gray-500 hover:text-gray-300'
        }`}
        onClick={() => handleTabChange('forYou')}
        aria-selected={feedType === 'forYou'}
        role="tab"
      >
        <span className="text-sm font-semibold">For You</span>
      </div>

      {/* Following Container */}
      <div
        className={`px-2 py-1 rounded-md cursor-pointer transition-colors border-b-2 ${
          feedType === 'following'
            ? 'border-sport-accent text-white'
            : 'border-transparent text-gray-500 hover:text-gray-300'
        }`}
        onClick={() => handleTabChange('following')}
        aria-selected={feedType === 'following'}
        role="tab"
      >
        <span className="text-sm font-semibold">Following</span>
      </div>

    </div>
  </div>

  {/* Feed Content */}
  <div className="h-[calc(100vh-64px)] overflow-y-auto scroll-hidden">
    {posts.length === 0 && (
      <div className="p-8 text-center text-gray-500">
        No posts in your feed yet. Follow some users to see their content!
      </div>
    )}

    {posts.map((post, index) => {
      console.log('Feed: Mapping post', index, post);
      if (!post || !post.id) {
        console.error('Feed: Invalid post at index', index, post);
        return null;
      }
      if (!post.author || !post.author.username) {
        console.error('Feed: Post missing author data at index', index, post);
        return null;
      }
      return <PostCard key={post.id} post={post} />;
    })}

    {/* Invisible element for intersection observer */}
    {hasNextPage && (
      <div ref={loadMoreRef} className="h-4" />
    )}

    {isFetchingNextPage && (
      <div className="p-4 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-sport-accent mx-auto" />
      </div>
    )}

    {!hasNextPage && posts.length > 0 && (
      <div className="py-8 text-center text-gray-500 text-sm">
        You've reached the end of the line.
      </div>
    )}
  </div>
</div>

    );
};

export default Feed;