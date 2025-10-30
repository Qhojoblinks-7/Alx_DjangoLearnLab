// src/components/PostActionsMenu.jsx
import React, { useState } from 'react';
import {
  MoreHorizontal,
  Trash2,
  Pin,
  Star,
  List,
  MessageSquare,
  BarChart3,
  Code,
  TrendingUp,
  FileText,
  Edit,
  Eye,
  Heart,
  MessageCircle,
  Repeat2,
  Activity
} from 'lucide-react';

// Shadcn/ui Imports
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../components/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/components/ui/dialog';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../components/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis } from 'recharts';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerTrigger,
} from '../components/components/ui/drawer';
import { Button } from '../components/components/ui/button';
import { Textarea } from '../components/components/ui/textarea';
import { useSelector } from 'react-redux';
import { authenticatedFetch } from '../components/lib/api';

// Modal Imports
import ListsModal from './modals/ListsModal';
import ReplySettingsModal from './modals/ReplySettingsModal';
import AnalyticsModal from './modals/AnalyticsModal';
import PostCreator from './PostCreator';

const PostActionsMenu = ({ post, currentUser, onPostDelete }) => {
  // onPostDelete: callback function to remove post from parent component's state
  // Should accept postId as parameter and remove the post from the UI
  const [isLoading, setIsLoading] = useState(false);
  const [isListsModalOpen, setIsListsModalOpen] = useState(false);
  const [isReplySettingsModalOpen, setIsReplySettingsModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  const [engagementsData, setEngagementsData] = useState(null);
  const [engagementsModalOpen, setEngagementsModalOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const { token } = useSelector((state) => state.auth);

  // Check if we're on mobile
  const isMobile = window.innerWidth < 768;


  const handleDelete = () => {
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    console.log('🗑️ Starting post deletion process...');
    console.log('📝 Post ID to delete:', post.id);
    console.log('👤 Current user:', currentUser?.id);

    setIsConfirmDeleteOpen(false);
    setIsLoading(true);

    try {
      console.log('🌐 Making DELETE request to:', `/posts/${post.id}/`);
      console.log('🔑 Using authenticated fetch with token available:', !!token);

      // Call DELETE /api/posts/{post_id}/ (B-ACT-01)
      const response = await authenticatedFetch(`/posts/${post.id}/`, {
        method: 'DELETE'
      });

      console.log('✅ DELETE request successful');
      console.log('📊 Response status:', response?.status);
      console.log('📄 Response data:', response);

      // On success, remove the post from the UI without refreshing
      console.log('🗑️ Removing post from UI...');
      if (onPostDelete) {
        console.log('📞 Calling onPostDelete callback with post ID:', post.id);
        onPostDelete(post.id);
      } else {
        console.log('⚠️ No onPostDelete callback provided, showing success message instead of reload');
        console.log('✅ Post deleted successfully! (Page not refreshed to preserve logs)');
        alert('Post deleted successfully! Check console logs for details.');
        // Note: In production, this would either use a callback or refresh the page
        // For debugging purposes, we're not refreshing to preserve logs
      }

    } catch (error) {
      console.error('❌ Error deleting post:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });

      const errorMessage = error.response?.data?.detail ||
                          error.response?.data?.error ||
                          error.message ||
                          'Unknown error';

      console.log('💬 Showing error alert:', errorMessage);
      alert(`Failed to delete post: ${errorMessage}`);
    } finally {
      console.log('🏁 Delete operation completed, setting loading to false');
      setIsLoading(false);
    }
  };

  const handlePin = async (postId) => {
    setIsLoading(true);
    try {
      // Call POST /api/posts/{post_id}/pin/ (B-ACT-02)
      const response = await authenticatedFetch(`/posts/${postId}/pin/`, {
        method: 'POST'
      });
      const data = await response.json();
      alert(`Post ${data.is_pinned ? 'pinned' : 'unpinned'} successfully!`);
      // The label will toggle on next menu open based on updated post state
    } catch (error) {
      console.error('Error pinning post:', error);
      alert(`Failed to pin/unpin post: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHighlight = async (postId) => {
    setIsLoading(true);
    try {
      // Call POST /api/posts/{post_id}/highlight/ (B-ACT-03)
      const response = await authenticatedFetch(`/posts/${postId}/highlight/`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.detail || 'Failed to highlight/unhighlight post');
      }

      const data = await response.json();
      alert(`Post ${data.is_highlighted ? 'highlighted' : 'unhighlighted'} successfully!`);
      // The label will toggle on next menu open based on updated post state
    } catch (error) {
      console.error('Error highlighting post:', error);
      alert(`Failed to highlight/unhighlight post: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLists = () => {
    console.log('Lists clicked for post:', post.id);
    console.log('Opening lists modal');
    setIsListsModalOpen(true);
  };

  const handleAddToList = async (listId, listName) => {
    console.log('Adding/removing post to/from list:', { postId: post.id, listId, listName });

    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`/api/lists/${listId}/toggle_post/`, {
        method: 'POST',
        body: JSON.stringify({ post_id: post.id })
      });

      console.log('Toggle list post response:', response);
      const action = response.data.action || 'toggled';
      alert(`Post ${action === 'added' ? 'added to' : 'removed from'} "${listName}" successfully!`);
    } catch (error) {
      console.error('Error toggling post in list:', error);
      alert(`Failed to update list: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplySettings = () => {
    console.log('Reply settings clicked for post:', post.id);
    console.log('Opening reply settings modal');
    setIsReplySettingsModalOpen(true);
  };

  const handleSaveReplySettings = async (newSetting) => {
    console.log('Saving reply settings for post:', post.id, 'New setting:', newSetting);
    console.log('Current user:', currentUser);
    console.log('Token available:', !!token);
    console.log('Making reply settings API call...');

    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`/posts/${post.id}/reply_settings/`, {
        method: 'PUT',
        body: JSON.stringify({ permission_level: newSetting })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.detail || 'Failed to update reply settings');
      }

      const data = await response.json();
      console.log('Reply settings API response:', response);
      console.log('Response data:', data);
      console.log('Updated permission level:', data.permission_level);

      // Show success message using a proper UI notification instead of alert
      // For now, we'll use a simple console log and close the modal
      console.log(`✅ Reply settings updated to: ${newSetting === 'everyone' ? 'Everyone' : newSetting === 'following' ? 'People you follow' : 'Mentioned only'}`);
      setIsReplySettingsModalOpen(false);
    } catch (error) {
      console.error('Error updating reply settings:', error);
      console.error('Error details:', error.response?.data);
      alert(`Failed to update reply settings: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewEngagements = async (postId) => {
    console.log('View engagements clicked for post:', postId);

    try {
      // Call GET /api/posts/{post_id}/engagements/ (B-ACT-07)
      const response = await fetch(`/api/posts/${postId}/engagements/`);
      const engagements = await response.json();

      console.log('Engagements API response:', engagements);

      if (response.ok) {
        setEngagementsData(engagements);
        setEngagementsModalOpen(true);
      } else {
        throw new Error('Failed to fetch engagements');
      }

    } catch (error) {
      console.error('Error fetching engagements:', error);
      // Fallback to basic post data
      const fallbackData = {
        views: post.views_count || 0,
        likes: post.likes_count || 0,
        replies: post.comments_count || 0,
        reposts: post.reposts_count || 0
      };
      setEngagementsData(fallbackData);
      setEngagementsModalOpen(true);
    }
  };

  const handleEmbed = async (postId) => {
    console.log('Embed clicked for post:', postId);

    try {
      // Call GET /api/posts/{post_id}/embed/ (B-ACT-09)
      const response = await fetch(`/api/posts/${postId}/embed/`);
      const data = await response.json();

      if (response.ok) {
        setEmbedCode(data.html);
        setEmbedModalOpen(true);
      } else {
        console.error('Failed to get embed code:', data);
        alert('Failed to generate embed code. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching embed code:', error);
      // Fallback to basic iframe embed
      const fallbackCode = `<iframe src="${window.location.origin}/embed/post/${postId}" width="500" height="300" frameborder="0"></iframe>`;
      setEmbedCode(fallbackCode);
      setEmbedModalOpen(true);
    }
  };

  const handleCopyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      alert('Embed code copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy embed code:', error);
      alert(`Copy this code:\n\n${embedCode}`);
    }
  };

  const handleAnalytics = async (postId) => {
    console.log('Analytics clicked for post:', postId);
    console.log('Current user:', currentUser);
    console.log('Token available:', !!token);
    console.log('Making analytics API call...');

    try {
      const response = await authenticatedFetch(`/posts/${postId}/analytics/`, {
        method: 'GET'
      });

      console.log('Analytics API response:', response);
      console.log('Analytics data:', response.data);

      setAnalyticsData(response.data);
      setIsAnalyticsModalOpen(true);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to load analytics. Please try again.');
    }
  };

  const handleEdit = () => {
    console.log('Edit clicked for post:', post.id);
    console.log('Post content:', post.content);
    console.log('Post media:', post.media_file || post.image || post.video);
    console.log('Post author:', post.author);
    console.log('Current user:', currentUser);
    setIsEditModalOpen(true);
  };


  const handleCommunityNote = async () => {
    console.log('Community note clicked for post:', post.id);

    const reason = window.prompt('Request Community Note\n\nWhy should this post have a community note?\n\nExamples:\n- Contains misleading information\n- Needs context/clarification\n- Fact-check required\n\nEnter your reason:');

    console.log('Community note reason entered:', reason);

    if (reason && reason.trim()) {
      console.log('Submitting community note request to backend');

      setIsLoading(true);
      try {
        // Call POST /api/community_notes/request/ (B-ACT-06)
        await authenticatedFetch('/api/community_notes/request/', {
          method: 'POST',
          body: JSON.stringify({
            post_id: post.id,
            reason: reason.trim()
          })
        });

        console.log('Community note request submitted successfully');
        // Show brief toast notification on success
        alert('Request submitted.'); // Simple toast-like notification
      } catch (error) {
        console.error('Error submitting community note request:', error);
        alert(`Failed to submit request: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    } else if (reason !== null) {
      console.log('Community note request cancelled - no reason provided');
      alert('Please provide a reason for the community note request.');
    } else {
      console.log('Community note request cancelled by user');
    }
  };

  // Define menu items organized by groups with proper visibility rules
  const isPostAuthor = post.author?.id === currentUser?.id;


  const menuGroups = [
    // Destructive Actions - Post Author Only
    {
      group: "destructive",
      items: [
        {
          label: "Edit",
          icon: Edit,
          action: () => handleEdit(),
          show: isPostAuthor, // Post Author Only
        },
        {
          label: "Delete",
          icon: Trash2,
          action: () => handleDelete(),
          show: isPostAuthor, // Post Author Only
          destructive: true
        }
      ]
    },
    // Profile Actions - Post Author Only
    {
      group: "profile",
      items: [
        {
          label: "Pin to your profile",
          icon: Pin,
          action: () => handlePin(post.id),
          show: isPostAuthor // Post Author Only
        },
        {
          label: "Highlight on your profile",
          icon: Star,
          action: () => handleHighlight(post.id),
          show: isPostAuthor // Post Author Only
        }
      ]
    },
    // Organization Actions - All Users
    {
      group: "organization",
      items: [
        {
          label: "Add/remove from Lists",
          icon: List,
          action: () => handleLists(post.id),
          show: true // All Users
        }
      ]
    },
    // Settings Actions - Post Author Only
    {
      group: "settings",
      items: [
        {
          label: "Change who can reply",
          icon: MessageSquare,
          action: () => handleReplySettings(post.id),
          show: isPostAuthor // Post Author Only
        }
      ]
    },
    // Analytics Actions - Mixed visibility
    {
      group: "analytics",
      items: [
        {
          label: "View post engagements",
          icon: BarChart3,
          action: () => handleViewEngagements(post.id),
          show: true // All Users
        },
        {
          label: "Embed post",
          icon: Code,
          action: () => handleEmbed(post.id),
          show: true // All Users
        },
        {
          label: "View post analytics",
          icon: TrendingUp,
          action: () => handleAnalytics(post.id),
          show: isPostAuthor // Post Author Only
        },
        {
          label: "Request Community Note",
          icon: FileText,
          action: () => handleCommunityNote(post.id),
          show: true // All Users
        }
      ]
    }
  ];

  return (
    <>
      {isMobile ? (
        <Drawer open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-white hover:bg-gray-800/50 h-8 w-8"
              disabled={isLoading}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="bg-gray-900 border-gray-700 text-gray-100">
            <DrawerHeader className="text-center">
              <DrawerTitle className="text-white">Post Options</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4">
              {menuGroups.map((group, groupIndex) => {
                // Filter items that should be shown
                const visibleItems = group.items.filter(item => item.show !== false);

                // Skip empty groups
                if (visibleItems.length === 0) return null;

                return (
                  <React.Fragment key={group.group}>
                    {visibleItems.map((item, itemIndex) => (
                      <Button
                        key={`${group.group}-${itemIndex}`}
                        variant="ghost"
                        onClick={() => {
                          item.action();
                          setIsMobileDrawerOpen(false);
                        }}
                        className={`w-full justify-start mb-2 ${
                          item.destructive
                            ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                        }`}
                      >
                        <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                      </Button>
                    ))}
                    {/* Add separator between groups (except for the last group) */}
                    {groupIndex < menuGroups.length - 1 && (
                      <div key={`separator-${group.group}`} className="border-t border-gray-700 my-3" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-white hover:bg-gray-800/50 h-8 w-8"
              disabled={isLoading}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-700 text-gray-100">
            {menuGroups.map((group, groupIndex) => {
              // Filter items that should be shown
              const visibleItems = group.items.filter(item => item.show !== false);

              // Skip empty groups
              if (visibleItems.length === 0) return null;

              return (
                <React.Fragment key={group.group}>
                  {visibleItems.map((item, itemIndex) => (
                    <DropdownMenuItem
                      key={`${group.group}-${itemIndex}`}
                      onClick={item.action}
                      className={`cursor-pointer hover:bg-gray-800 focus:bg-gray-800 px-3 py-2 ${
                        item.destructive
                          ? 'text-red-400 hover:text-red-300 focus:text-red-300'
                          : 'text-gray-300 hover:text-white focus:text-white'
                      }`}
                    >
                      <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                    </DropdownMenuItem>
                  ))}
                  {/* Add separator between groups (except for the last group) */}
                  {groupIndex < menuGroups.length - 1 && (
                    <DropdownMenuSeparator key={`separator-${group.group}`} className="bg-gray-700 my-1" />
                  )}
                </React.Fragment>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Modals */}
      <ListsModal
        isOpen={isListsModalOpen}
        onClose={() => setIsListsModalOpen(false)}
        onAddToList={handleAddToList}
        postId={post.id}
      />

      <ReplySettingsModal
        isOpen={isReplySettingsModalOpen}
        onClose={() => setIsReplySettingsModalOpen(false)}
        currentSetting={post.reply_settings || "everyone"}
        onSave={handleSaveReplySettings}
      />

      <AnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        analytics={analyticsData}
        post={post}
      />

      {/* Embed Modal */}
      <Dialog open={embedModalOpen} onOpenChange={setEmbedModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Embed Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Copy the code below to embed this post on your website:
            </p>
            <Textarea
              value={embedCode}
              readOnly
              className="min-h-[100px] font-mono text-xs"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCopyEmbedCode}>
              Copy Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Engagements Modal - With Chart */}
      <Dialog open={engagementsModalOpen} onOpenChange={setEngagementsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Post Engagements
            </DialogTitle>
          </DialogHeader>
          {engagementsData && (
            <div className="space-y-6">
              {/* Chart Section */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <ChartContainer config={{
                  views: { label: 'Views', color: 'hsl(var(--chart-1))' },
                  likes: { label: 'Likes', color: 'hsl(var(--chart-2))' },
                  replies: { label: 'Replies', color: 'hsl(var(--chart-3))' },
                  reposts: { label: 'Reposts', color: 'hsl(var(--chart-4))' }
                }} className="h-[200px] w-full">
                  <BarChart data={[
                    { name: 'Views', value: engagementsData.views || 0 },
                    { name: 'Likes', value: engagementsData.likes || 0 },
                    { name: 'Replies', value: engagementsData.replies || 0 },
                    { name: 'Reposts', value: engagementsData.reposts || 0 }
                  ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    />
                    <Bar
                      dataKey="value"
                      fill="hsl(var(--chart-1))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">Total Views</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                    {engagementsData.views || 0}
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm font-medium">Total Engagement</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                    {(engagementsData.likes || 0) + (engagementsData.replies || 0) + (engagementsData.reposts || 0)}
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Engagement Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Views</span>
                    </div>
                    <span className="font-semibold">{engagementsData.views || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Likes</span>
                    </div>
                    <span className="font-semibold">{engagementsData.likes || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Replies</span>
                    </div>
                    <span className="font-semibold">{engagementsData.replies || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center gap-2">
                      <Repeat2 className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Reposts</span>
                    </div>
                    <span className="font-semibold">{engagementsData.reposts || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Post Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <p className="text-sm text-gray-600 mt-2">Edit the content of your post</p>
          </DialogHeader>
          <div className="space-y-4">
            <PostCreator
              onClose={() => setIsEditModalOpen(false)}
              editMode={true}
              postToEdit={post}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PostActionsMenu;