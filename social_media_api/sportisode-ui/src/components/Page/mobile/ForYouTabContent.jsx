// src/components/Page/mobile/ForYouTabContent.jsx
import React from 'react';
import { Newspaper, UserCheck, MessageCircle, Heart, BarChart3, Star } from 'lucide-react';

// Component Imports
import ProfilePicture from '../../ProfilePicture';
import FollowButton from '../../FollowButton';

// Shadcn/ui Imports
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const ForYouTabContent = ({ headlines, suggestedUsers, loadingHeadlines, loadingSuggestedUsers }) => (
    <div className="space-y-6 sm:space-y-8">
        {/* Today's Headlines - Enhanced Mobile Layout */}
        <div className="bg-gradient-to-br from-sport-accent/10 to-sport-accent/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-sport-accent/20 mx-1 sm:mx-0">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-sport-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <Newspaper className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="text-white font-medium text-lg sm:text-xl truncate">Today's Headlines</h2>
                    <p className="text-gray-400 text-xs sm:text-sm">Hot topics in sports</p>
                </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
                {loadingHeadlines ? (
                    <div className="flex flex-col items-center justify-center py-6 sm:py-8">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-4 border-sport-accent border-t-transparent"></div>
                        <p className="text-gray-400 text-xs sm:text-sm mt-3 sm:mt-4">Loading headlines...</p>
                    </div>
                ) : headlines && headlines.length > 0 ? (
                    headlines.map((post, index) => (
                        <div
                            key={post.id}
                            className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700/50 active:scale-95 transition-all duration-200 cursor-pointer hover:bg-white/10"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex justify-between items-start mb-2 sm:mb-3">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-sport-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-sport-accent text-xs font-bold">#{index + 1}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-gray-400 text-xs truncate">@{post.author?.username}</p>
                                        <p className="text-gray-500 text-xs">
                                            {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recent'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                                    <div className="flex items-center space-x-1 bg-sport-accent/20 px-2 py-1 rounded-full">
                                        <Heart className="h-3 w-3 text-sport-accent" />
                                        <span className="text-sport-accent text-xs font-bold">{post.likes_count || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <h3 className="font-bold text-white leading-tight text-sm sm:text-base mb-2 line-clamp-2">
                                {post.title || post.content?.slice(0, 100) || 'Untitled Post'}
                            </h3>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 sm:space-x-4 text-gray-400 text-xs">
                                    <div className="flex items-center space-x-1">
                                        <MessageCircle className="h-3 w-3" />
                                        <span>{post.comments_count || 0}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <BarChart3 className="h-3 w-3" />
                                        <span>{post.likes_count || 0}</span>
                                    </div>
                                </div>
                                <div className="text-sport-accent text-xs font-medium whitespace-nowrap ml-2">Read more →</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-6 sm:py-8">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600" />
                        </div>
                        <p className="text-gray-400 text-xs sm:text-sm">No headlines available right now</p>
                    </div>
                )}
            </div>
        </div>

        {/* Who to Follow - Enhanced Mobile Cards */}
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-500/20 mx-1 sm:mx-0">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="text-white font-medium text-lg sm:text-xl truncate">Discover People</h2>
                    <p className="text-gray-400 text-xs sm:text-sm">Follow sports enthusiasts</p>
                </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
                {loadingSuggestedUsers ? (
                    <div className="flex flex-col items-center justify-center py-6 sm:py-8">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-4 border-blue-500 border-t-transparent"></div>
                        <p className="text-gray-400 text-xs sm:text-sm mt-3 sm:mt-4">Finding people...</p>
                    </div>
                ) : suggestedUsers && suggestedUsers.length > 0 ? (
                    <>
                        {suggestedUsers.slice(0, 3).map((user, index) => (
                            <div
                                key={user.id}
                                className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700/50 active:scale-95 transition-all duration-200"
                                style={{ animationDelay: `${index * 150}ms` }}
                            >
                                <div className="flex items-center justify-between min-w-0">
                                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                                        <ProfilePicture user={user} size="h-10 w-10 sm:h-12 sm:w-12" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white text-sm sm:text-base truncate">@{user.username}</p>
                                            <p className="text-gray-400 text-xs sm:text-sm line-clamp-1">{user.bio || 'Sports enthusiast'}</p>
                                            <div className="flex items-center space-x-2 mt-1 sm:mt-2">
                                                <div className="flex items-center space-x-1">
                                                    <UserCheck className="h-3 w-3 text-gray-500" />
                                                    <span className="text-gray-400 text-xs">{user.followers_count || 0} followers</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-2 sm:ml-3 flex-shrink-0">
                                        <FollowButton userId={user.id} initialFollowing={user.is_following || false} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="text-center pt-3 sm:pt-4">
                            <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium py-2.5 px-4 sm:py-3 sm:px-6 rounded-full text-sm sm:text-base hover:from-blue-600 hover:to-purple-600 active:scale-95 transition-all duration-200 shadow-lg w-full sm:w-auto">
                                <div className="flex items-center justify-center space-x-2">
                                    <span>Discover More People</span>
                                    <Star className="h-4 w-4" />
                                </div>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-6 sm:py-8">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600" />
                        </div>
                        <p className="text-gray-400 text-xs sm:text-sm">No suggestions available</p>
                    </div>
                )}
            </div>
        </div>
    </div>
);

export default ForYouTabContent;