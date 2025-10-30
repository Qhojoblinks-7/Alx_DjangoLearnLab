// src/components/modals/AnalyticsModal.jsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import AnalyticsChart from '../ui/AnalyticsChart';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Repeat2,
  Users,
  Calendar,
  Clock,
  Target,
  Activity
} from 'lucide-react';

const AnalyticsModal = ({ isOpen, onClose, analytics, post }) => {
  if (!analytics && !post) return null;

  // Provide default analytics structure if data is missing
  const defaultAnalytics = {
    real_time: { current_views: post?.views_count || 0 },
    engagement: {
      likes: post?.likes_count || 0,
      comments: post?.comments_count || 0,
      reposts: post?.reposts_count || 0,
      engagement_rate: 0,
      total_engagement: (post?.likes_count || 0) + (post?.comments_count || 0) + (post?.reposts_count || 0)
    },
    historical: null
  };

  const safeAnalytics = analytics || defaultAnalytics;

  const insights = [
    {
      type: safeAnalytics.engagement?.engagement_rate > 5 ? 'positive' : safeAnalytics.engagement?.engagement_rate < 1 ? 'warning' : 'neutral',
      title: safeAnalytics.engagement?.engagement_rate > 5 ? 'High Engagement' : safeAnalytics.engagement?.engagement_rate < 1 ? 'Low Engagement' : 'Moderate Engagement',
      message: safeAnalytics.engagement?.engagement_rate > 5
        ? 'Your post is performing well with above-average engagement!'
        : safeAnalytics.engagement?.engagement_rate < 1
        ? 'Consider adding more engaging content or hashtags to increase visibility.'
        : 'Your post has moderate engagement. Keep creating great content!'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-dark-card border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Post Analytics
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Detailed performance metrics for your post
          </DialogDescription>
        </DialogHeader>

        {/* Post Info Header */}
        <Card className="p-4 bg-gray-800/50 border-gray-700 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-white font-semibold">{post?.title || 'Post'}</h3>
              <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                {post?.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recent'}
              </p>
            </div>
            <Badge variant="outline" className="border-gray-600 text-gray-300">
              ID: {post?.id}
            </Badge>
          </div>
        </Card>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="charts" className="data-[state=active]:bg-gray-700">
              <TrendingUp className="h-4 w-4 mr-2" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-gray-700">
              <Target className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-gray-800/50 border-gray-700 text-center">
                <Eye className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                <div className="text-2xl font-bold text-white">{safeAnalytics.real_time?.current_views || 0}</div>
                <div className="text-gray-400 text-sm">Views</div>
              </Card>
  
              <Card className="p-4 bg-gray-800/50 border-gray-700 text-center">
                <Heart className="h-6 w-6 mx-auto mb-2 text-red-400" />
                <div className="text-2xl font-bold text-white">{safeAnalytics.engagement?.likes || 0}</div>
                <div className="text-gray-400 text-sm">Likes</div>
              </Card>
  
              <Card className="p-4 bg-gray-800/50 border-gray-700 text-center">
                <MessageCircle className="h-6 w-6 mx-auto mb-2 text-green-400" />
                <div className="text-2xl font-bold text-white">{safeAnalytics.engagement?.comments || 0}</div>
                <div className="text-gray-400 text-sm">Comments</div>
              </Card>
  
              <Card className="p-4 bg-gray-800/50 border-gray-700 text-center">
                <Repeat2 className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                <div className="text-2xl font-bold text-white">{safeAnalytics.engagement?.reposts || 0}</div>
                <div className="text-gray-400 text-sm">Reposts</div>
              </Card>
            </div>

            {/* Engagement Rate */}
            <Card className="p-4 bg-gray-800/50 border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Engagement Rate
                  </h4>
                  <p className="text-gray-400 text-sm">Total engagement divided by views</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {safeAnalytics.engagement?.engagement_rate || 0}%
                  </div>
                  <div className="text-gray-400 text-sm">
                    {safeAnalytics.engagement?.total_engagement || 0} total engagements
                  </div>
                </div>
              </div>
            </Card>

            {/* Performance Summary */}
            <Card className="p-4 bg-gray-800/50 border-gray-700">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Performance Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Reach</span>
                    <span className="text-white font-medium">
                      {(safeAnalytics.real_time?.current_views || 0) + (safeAnalytics.engagement?.total_engagement || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Engagement Rate</span>
                    <span className="text-white font-medium">
                      {safeAnalytics.engagement?.engagement_rate || 0}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg. Daily Views</span>
                    <span className="text-white font-medium">
                      {Math.round((safeAnalytics.real_time?.current_views || 0) / 7)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Growth Rate</span>
                    <span className="text-green-400 font-medium">+12%</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="charts" className="space-y-6 mt-6">
            {/* Views Over Time Chart */}
            <AnalyticsChart
              title="Views Over Time"
              data={[
                { label: 'Mon', value: 120 },
                { label: 'Tue', value: 150 },
                { label: 'Wed', value: 180 },
                { label: 'Thu', value: 220 },
                { label: 'Fri', value: 280 },
                { label: 'Sat', value: 320 },
                { label: 'Sun', value: safeAnalytics.real_time?.current_views || 350 }
              ]}
            />

            {/* Engagement Breakdown */}
            <AnalyticsChart
              title="Post Engagements"
              data={[
                { label: 'Views', value: safeAnalytics.real_time?.current_views || 0, icon: Eye },
                { label: 'Likes', value: safeAnalytics.engagement?.likes || 0, icon: Heart },
                { label: 'Replies', value: safeAnalytics.engagement?.comments || 0, icon: MessageCircle },
                { label: 'Reposts', value: safeAnalytics.engagement?.reposts || 0, icon: Repeat2 },
              ]}
            />

            {/* Summary Stats */}
            <Card className="p-4 bg-gray-800/50 border-gray-700">
              <h4 className="text-white font-semibold mb-4">📈 Total Engagement</h4>
              <div className="text-3xl font-bold text-white mb-2">
                {safeAnalytics.engagement?.total_engagement || 0}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Views:</span>
                  <span className="text-white ml-2">{safeAnalytics.real_time?.current_views || 0}</span>
                </div>
                <div>
                  <span className="text-gray-400">Engagement Rate:</span>
                  <span className="text-white ml-2">
                    {safeAnalytics.real_time?.current_views ?
                      Math.round((safeAnalytics.engagement?.total_engagement || 0) / safeAnalytics.real_time.current_views * 100) : 0}%
                  </span>
                </div>
              </div>
            </Card>

            {/* Audience Demographics (Mock Data) */}
            <AnalyticsChart
              title="Top Audience Locations"
              data={[
                { label: 'US', value: 45 },
                { label: 'UK', value: 28 },
                { label: 'Canada', value: 15 },
                { label: 'Australia', value: 12 }
              ]}
            />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6 mt-6">
            {/* AI Insights */}
            <Card className="p-4 bg-gray-800/50 border-gray-700">
              <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                <Target className="h-4 w-4" />
                AI-Powered Insights
              </h4>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      insight.type === 'positive'
                        ? 'bg-green-900/20 border-green-700 text-green-300'
                        : insight.type === 'warning'
                        ? 'bg-yellow-900/20 border-yellow-700 text-yellow-300'
                        : 'bg-blue-900/20 border-blue-700 text-blue-300'
                    }`}
                  >
                    <div className="font-medium">{insight.title}</div>
                    <div className="text-sm mt-1">{insight.message}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recommendations */}
            <Card className="p-4 bg-gray-800/50 border-gray-700">
              <h4 className="text-white font-semibold mb-4">Recommendations</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div>
                    <div className="text-blue-300 font-medium">Post at optimal times</div>
                    <div className="text-blue-200 text-sm">Your best engagement occurs between 7-9 PM local time</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-900/20 border border-purple-700 rounded-lg">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                  <div>
                    <div className="text-purple-300 font-medium">Use more hashtags</div>
                    <div className="text-purple-200 text-sm">Posts with 2-3 relevant hashtags get 40% more engagement</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <div className="text-green-300 font-medium">Engage with comments</div>
                    <div className="text-green-200 text-sm">Responding to comments increases future engagement by 25%</div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Close Button */}
        <div className="flex justify-end pt-6 border-t border-gray-700 mt-6">
          <Button onClick={onClose} variant="outline">
            Close Analytics
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnalyticsModal;