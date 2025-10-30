// src/lib/api.js
const API_BASE_URL = 'http://localhost:8000';

/**
 * Custom fetch wrapper that injects the Authorization header.
 * Note: We avoid importing the store directly to prevent circular dependencies.
 * Instead, we rely on localStorage for token management.
 */
export async function authenticatedFetch(endpoint, options = {}) {
    console.log(`authenticatedFetch called for ${endpoint}`);

    // Get token from localStorage (Redux state is managed elsewhere)
    const token = localStorage.getItem('authToken');
    console.log(`Token: ${token ? token.substring(0, 10) : 'null'}...`);

    const headers = {
        // Only set Content-Type to application/json if body is not FormData
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Token ${token}`;
        console.log(`Final: Sending request to ${endpoint} with token: ${token.substring(0, 10)}...`);
    } else {
        console.log(`Final: Sending request to ${endpoint} without token`);
    }

    console.log(`authenticatedFetch: Making request to ${API_BASE_URL}${endpoint} with method:`, options.method || 'GET');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    console.log(`authenticatedFetch: Response status for ${endpoint}: ${response.status}`);

    // Handle 401 Unauthorized globally (token expired or invalid)
    if (response.status === 401) {
        console.log(`authenticatedFetch: 401 Unauthorized for ${endpoint}, clearing token`);
        // Clear token from localStorage
        console.warn('Unauthorized! Clearing token...');
        localStorage.removeItem('authToken');
        // Dispatch logout action if Redux store is available
        if (window.store) {
            window.store.dispatch({ type: 'auth/logout' });
        }
        // Components should handle logout through their own Redux dispatches
    }

    console.log(`authenticatedFetch: Request completed for ${endpoint}`);
    return response;
}

// -----------------------------------------------------------------
// --- API Fetchers for Components (Integration with React Query) ---
// -----------------------------------------------------------------

/**
 * Fetches the list of trending topics/hashtags.
 * Used by: TrendingTabContent.jsx
 * Contract: B-EXP-TRN-01
 */
export const fetchTrends = async () => {
    const response = await authenticatedFetch('/posts/trends/sidebar/', { method: 'GET' });
    if (!response.ok) {
        throw new Error('Failed to fetch trending topics.');
    }
    return response.json();
};

/**
 * Fetches the list of major leagues and tournaments.
 * Used by: LeaguesPage.jsx
 * Contract: B-LEAGUE-01
 * Enhanced with fallback to TheSportsDB direct API
 */
export const fetchLeagues = async () => {
    console.log('🔍 fetchLeagues: Starting API call to /leagues/');
    try {
        const response = await fetch(`${API_BASE_URL}/leagues/`, { method: 'GET' });
        console.log('🔍 fetchLeagues: Response status:', response.status);
        if (!response.ok) {
            console.error('❌ fetchLeagues: Failed with status:', response.status);
            throw new Error('Failed to fetch leagues.');
        }
        const data = await response.json();
        console.log('✅ fetchLeagues: Success, received data:', data);
        return data;
    } catch {
        console.warn('⚠️ fetchLeagues: Backend failed, trying TheSportsDB direct API as fallback');
        try {
            // Fallback to direct TheSportsDB API call
            const response = await fetch('https://www.thesportsdb.com/api/v1/json/3/search_all_leagues.php?s=Soccer');
            if (!response.ok) {
                throw new Error('Fallback API also failed');
            }
            const data = await response.json();
            console.log('✅ fetchLeagues: Fallback success, received data:', data);
            return data.countrys || []; // TheSportsDB returns 'countrys' array
        } catch {
            console.error('❌ fetchLeagues: Both backend and fallback failed');
            throw new Error('Failed to fetch leagues from both sources.');
        }
    }
};

/**
 * Fetches the infinite feed (paginated) for a specific league.
 * Used by: LeaguesPage.jsx (LeagueFeed component)
 * Contract: B-LEAGUE-03
 */
export const fetchLeagueFeed = async ({ pageParam = 0, leagueSlug }) => {
    // API contract: /posts/league/<slug>/?limit=10&offset=<pageParam>
    // pageParam is the offset (starts at 0)
    const limit = 10;
    const response = await authenticatedFetch(`/posts/league/${leagueSlug}/?limit=${limit}&offset=${pageParam}`, { method: 'GET' });

    if (!response.ok) {
        // Throw a specific error that React Query can handle
        throw new Error(`Failed to fetch feed for league: ${leagueSlug}`);
    }
    return response.json();
};

/**
 * Fetches the infinite feed (paginated) for a specific team.
 * Contract: B-TEAM-03
 */
export const fetchTeamFeed = async ({ pageParam = 1, teamSlug }) => { // <-- MUST BE EXPORTED
    // API contract: /posts/team/<slug>/?page=<pageParam>
    const response = await authenticatedFetch(`/posts/team/${teamSlug}/?page=${pageParam}`, { method: 'GET' });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch feed for team: ${teamSlug}`);
    }
    return response.json();
};

/**
 * Fetches the list of all teams.
 * Used by: TeamsPage.jsx
 * Contract: B-TEAM-01
 */
export const fetchTeams = async () => {
    console.log('🔍 fetchTeams: Starting API call to /teams/');
    const response = await fetch(`${API_BASE_URL}/teams/`, { method: 'GET' });
    console.log('🔍 fetchTeams: Response status:', response.status);
    if (!response.ok) {
        console.error('❌ fetchTeams: Failed with status:', response.status);
        throw new Error('Failed to fetch teams.');
    }
    const data = await response.json();
    console.log('✅ fetchTeams: Success, received data:', data);
    return data;
}

/**
 * Fetches the list of all athletes.
 * Used by: AthletesTabContent.jsx
 * Contract: B-ATHLETE-01
 */
export const fetchAthletes = async () => {
    console.log('🔍 fetchAthletes: Starting API call to /athletes/');
    const response = await fetch(`${API_BASE_URL}/athletes/`, { method: 'GET' });
    console.log('🔍 fetchAthletes: Response status:', response.status);
    if (!response.ok) {
        console.error('❌ fetchAthletes: Failed with status:', response.status);
        throw new Error('Failed to fetch athletes.');
    }
    const data = await response.json();
    console.log('✅ fetchAthletes: Success, received data:', data);
    return data;
}

/**
 * Fetches explore page data with trending leagues, popular teams, and upcoming fixtures.
 * Used by: ExplorePage.jsx
 * Contract: B-EXPLORE-01
 */
export const fetchExploreData = async () => {
    console.log('🔍 fetchExploreData: Starting API call to /sports/explore/');
    const response = await authenticatedFetch('/sports/explore/', { method: 'GET' });
    console.log('🔍 fetchExploreData: Response status:', response.status);
    if (!response.ok) {
        console.error('❌ fetchExploreData: Failed with status:', response.status);
        throw new Error('Failed to fetch explore data.');
    }
    const data = await response.json();
    console.log('✅ fetchExploreData: Success, received data:', data);
    return data;
};

/**
 * Fetches detailed information for a specific league.
 * Used by: LeaguesPage.jsx
 * Contract: B-SPORTS-01
 * Enhanced with fallback to TheSportsDB direct API
 */
export const fetchLeagueDetail = async (slug) => {
    try {
        const response = await authenticatedFetch(`/leagues/`, { method: 'GET' });
        if (!response.ok) {
            throw new Error(`Failed to fetch league details for: ${slug}`);
        }
        const data = await response.json();
        // Find the league by slug
        const league = data.find(l => l.slug === slug);
        return league || null;
    } catch {
        console.warn(`⚠️ fetchLeagueDetail: Backend failed for ${slug}, trying TheSportsDB direct API as fallback`);
        try {
            // Fallback to direct TheSportsDB API call
            const response = await fetch(`https://www.thesportsdb.com/api/v1/json/3/search_all_leagues.php?s=${encodeURIComponent(slug)}`);
            if (!response.ok) {
                throw new Error('Fallback API also failed');
            }
            const data = await response.json();
            console.log(`✅ fetchLeagueDetail: Fallback success for ${slug}, received data:`, data);
            return data.countrys?.[0] || null; // Return first league match
        } catch {
            console.error(`❌ fetchLeagueDetail: Both backend and fallback failed for ${slug}`);
            throw new Error(`Failed to fetch league details for: ${slug} from both sources.`);
        }
    }
};

/**
 * Fetches detailed information for a specific team.
 * Used by: TeamsPage.jsx
 * Contract: B-SPORTS-02
 * Enhanced with fallback to TheSportsDB direct API
 */
export const fetchTeamDetail = async (slug) => {
    try {
        const response = await authenticatedFetch(`/teams/`, { method: 'GET' });
        if (!response.ok) {
            throw new Error(`Failed to fetch team details for: ${slug}`);
        }
        const data = await response.json();
        // Find the team by slug
        const team = data.find(t => t.slug === slug);
        return team || null;
    } catch {
        console.warn(`⚠️ fetchTeamDetail: Backend failed for ${slug}, trying TheSportsDB direct API as fallback`);
        try {
            // Try to find team by name in TheSportsDB
            const response = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(slug)}`);
            if (!response.ok) {
                throw new Error('Fallback API also failed');
            }
            const data = await response.json();
            console.log(`✅ fetchTeamDetail: Fallback success for ${slug}, received data:`, data);
            return data.teams?.[0] || null; // Return first team match
        } catch {
            console.error(`❌ fetchTeamDetail: Both backend and fallback failed for ${slug}`);
            throw new Error(`Failed to fetch team details for: ${slug} from both sources.`);
        }
    }
};

/**
 * Fetches detailed information for a specific athlete.
 * Used by: AthletesPage.jsx (if exists)
 * Contract: Similar to B-SPORTS-01/02
 */
export const fetchAthleteDetail = async (slug) => {
    const response = await authenticatedFetch(`/athletes/`, { method: 'GET' });
    if (!response.ok) {
        throw new Error(`Failed to fetch athlete details for: ${slug}`);
    }
    const data = await response.json();
    // Find the athlete by slug
    const athlete = data.find(a => a.slug === slug);
    return athlete || null;
};

/**
 * Fetches a curated feed of posts related to a specific sports entity.
 * Used by: LeaguesPage, TeamsPage, AthletesPage
 * Contract: B-SPORTS-03
 */
export const fetchSportsFeed = async ({ pageParam = 1, feedId }) => {
    const response = await authenticatedFetch(`/posts/league/${feedId}/?page=${pageParam}`, { method: 'GET' });
    if (!response.ok) {
        throw new Error(`Failed to fetch sports feed for: ${feedId}`);
    }
    return response.json();
};

/**
 * Fetches the infinite feed (paginated) for a specific athlete.
 * Contract: B-ATHLETE-03
 */
export const fetchAthleteFeed = async ({ pageParam = 1, athleteSlug }) => { // <-- MUST BE EXPORTED
    // API contract: /posts/athlete/<slug>/?page=<pageParam>
    const response = await authenticatedFetch(`/posts/athlete/${athleteSlug}/?page=${pageParam}`, { method: 'GET' });

    if (!response.ok) {
        throw new Error(`Failed to fetch feed for athlete: ${athleteSlug}`);
    }
    return response.json();
}


/**
 * Fetches the list of notifications for the authenticated user, filtered by type.
 * Used by: NotificationsPage.jsx
 * Contract: B-NOTIFY-01/02
 */
export const fetchNotifications = async (filter = 'all') => {
    // API contract: /notifications/notifications/?filter=<filter>
    const response = await authenticatedFetch(`/notifications/?filter=${filter}`, { method: 'GET' });
    if (!response.ok) {
        throw new Error(`Failed to fetch notifications for filter: ${filter}`);
    }
    return response.json();
};

/**
 * Marks a specific notification as read.
 * Used by: NotificationsPage.jsx
 * Contract: B-NOTIFY-03
 */
export const markNotificationAsRead = async (notificationId) => {
    const response = await authenticatedFetch(`/notifications/${notificationId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true }),
    });
    if (!response.ok) {
        throw new Error(`Failed to mark notification ${notificationId} as read`);
    }
    return response.json();
};

/**
 * Marks all notifications as unread.
 * Used by: NotificationsPage.jsx
 */
export const markNotificationsAsUnread = async () => {
    const response = await authenticatedFetch('/notifications/mark_unread/', {
        method: 'POST',
        body: JSON.stringify({ all: true }),
    });
    if (!response.ok) {
        throw new Error('Failed to mark notifications as unread');
    }
    return response.json();
};


// -----------------------------------------------------------------
// --- MESSAGING FETCHERS ---
// -----------------------------------------------------------------

/**
 * Fetches the user's list of conversations.
 * Contract: B-MSG-01
 */
export const fetchConversations = async () => {
    console.log('fetchConversations: Making API call...');
    const response = await authenticatedFetch('/messages/conversations/', { method: 'GET' });
    console.log('fetchConversations: Response status:', response.status);
    if (!response.ok) {
        const errorText = await response.text();
        console.log('fetchConversations: Error response:', errorText);
        throw new Error(`Failed to fetch conversations: ${response.status} ${errorText}`);
    }
    const data = await response.json();
    console.log('fetchConversations: Success, data:', data);
    return data;
};

/**
 * Fetches the user's list of message requests.
 * Contract: B-MSG-02
 */
export const fetchMessageRequests = async () => {
    const response = await authenticatedFetch('/messages/requests/', { method: 'GET' });
    if (!response.ok) throw new Error('Failed to fetch message requests.');
    return response.json();
};

/**
 * Fetches message history for a specific chat (paginated).
 * Contract: B-MSG-03
 */
export const fetchMessageHistory = async ({ pageParam = 1, username }) => {
    // Note: In a real implementation, this would likely use infinite query.
    // We simplify to use standard query for the initial build.
    const response = await authenticatedFetch(`/messages/chat/${username}/?page=${pageParam}`, { method: 'GET' });
    if (!response.ok) throw new Error(`Failed to fetch chat history for ${username}.`);
    return response.json();
};

/**
 * Fetches messages for a specific conversation (thread).
 * Contract: B-MSG-08
 */
export const fetchConversationMessages = async ({ conversationId, before }) => {
    const params = new URLSearchParams();
    if (before) params.append('before', before);

    const response = await authenticatedFetch(`/messages/conversations/${conversationId}/messages/?${params.toString()}`, {
        method: 'GET'
    });
    if (!response.ok) throw new Error(`Failed to fetch messages for conversation ${conversationId}.`);
    return response.json();
};

/**
 * Sends a message using conversation_id or recipient_id.
 * Contract: B-MSG-12
 */
export const sendMessage = async ({ conversationId, recipientId, content }) => {
    const body = { content };
    if (conversationId) {
        body.conversation_id = conversationId;
    } else if (recipientId) {
        body.recipient_id = recipientId;
    } else {
        throw new Error('Either conversationId or recipientId is required');
    }

    const response = await authenticatedFetch('/messages/send/', {
        method: 'POST',
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('Failed to send message.');
    return response.json();
};



// -----------------------------------------------------------------
// --- POSTS & THREADS FETCHERS ---
// -----------------------------------------------------------------

/**
 * Fetches a single post object by its ID.
 * Used by: CommunityPostDetail.jsx
 * Contract: B-POST-01
 */
export const fetchSinglePost = async (postId) => {
    const response = await authenticatedFetch(`/posts/${postId}/`, { method: 'GET' });
    if (!response.ok) {
        throw new Error(`Failed to fetch post ID: ${postId}`);
    }
    return response.json();
};

/**
 * Fetches the infinite feed (paginated) of replies for a parent post.
 * Used by: CommunityPostDetail.jsx (RepliesFeed component)
 * Contract: B-POST-02
 */
export const fetchPostReplies = async ({ pageParam = 1, parentPostId }) => {
    // API contract: /posts/<id>/replies/?page=<pageParam>
    const response = await authenticatedFetch(`/posts/${parentPostId}/replies/?page=${pageParam}`, { method: 'GET' });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch replies for post: ${parentPostId}`);
    }
    return response.json();
};

/**
 * Sends a reply to a parent post.
 * Contract: B-POST-03
 */
export const postReply = async ({ parentPostId, content }) => {
    const response = await authenticatedFetch(`/posts/${parentPostId}/reply/`, {
        method: 'POST',
        body: JSON.stringify({ content }),
    });
    if (!response.ok) {
        throw new Error('Failed to post reply.');
    }
    return response.json();
};


// -----------------------------------------------------------------
// --- COMMUNITY FETCHERS (NEWLY ADDED) ---
// -----------------------------------------------------------------

/**
 * Fetches the list of suggested communities.
 * Used by: CommunityPage.jsx
 * Contract: B-COMM-01
 */
export const fetchCommunities = async () => {
    const response = await authenticatedFetch('/communities/', { method: 'GET' });
    if (!response.ok) {
        throw new Error('Failed to fetch communities list.');
    }
    return response.json();
};

/**
 * Fetches the infinite feed (paginated) for a specific community.
 * Used by: CommunityPage.jsx (CommunityFeed component)
 * Contract: B-COMM-03
 */
export const fetchCommunityFeed = async ({ pageParam = 1, communitySlug }) => {
    // API contract: /posts/community/<slug>/?page=<pageParam>
    const response = await authenticatedFetch(`/posts/community/${communitySlug}/?page=${pageParam}`, { method: 'GET' });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch feed for community: ${communitySlug}`);
    }
    return response.json();
};

/**
 * Toggles the membership status of a community.
 * Contract: B-COMM-04
 */
export const toggleCommunityMembership = async ({ communitySlug }) => {
    // Assuming a simple POST request to the join/leave endpoint handles the toggle
    const response = await authenticatedFetch(`/communities/${communitySlug}/join/`, { 
        method: 'POST',
    });
    
    if (!response.ok) {
        throw new Error('Failed to toggle community membership.');
    }
    
    return response.json(); 
};



// -----------------------------------------------------------------
// --- PROFILE FETCHERS ---
// -----------------------------------------------------------------

/**
 * Fetches the detailed profile object for a given username.
 * Contract: B-PROF-01
 */
export const fetchUserProfile = async (username) => {
    const response = await authenticatedFetch(`/accounts/profile/${username}/`, { method: 'GET' });
    if (!response.ok) {
        throw new Error(`Failed to fetch profile for user: ${username}`);
    }
    return response.json();
};

/**
 * Toggles the authenticated user's follow status for the target user.
 * Contract: B-PROF-02
 */
export const toggleFollow = async (username) => {
    const response = await authenticatedFetch(`/accounts/profile/${username}/follow/`, {
        method: 'POST',
    });
    if (!response.ok) {
        throw new Error('Failed to toggle follow status.');
    }
    return response.json();
};

/**
 * Fetches the paginated feed of posts/replies/likes for a user.
 * Contract: B-PROF-03, B-PROF-04, B-PROF-05
 */
export const fetchUserFeed = async ({ pageParam = 1, username, feedType }) => {
    // feedType is 'posts', 'replies', or 'likes'
    const endpoint = `/posts/user/${username}/${feedType}/?page=${pageParam}`;
    const response = await authenticatedFetch(endpoint, { method: 'GET' });

    if (!response.ok) {
        throw new Error(`Failed to fetch ${feedType} feed for ${username}.`);
    }
    return response.json();
};


// -----------------------------------------------------------------
// --- PROFILE UPDATE API ---
// -----------------------------------------------------------------

/**
 * Updates the authenticated user's profile information.
 * Supports both text fields and file uploads (profile_image, banner_image).
 * Contract: B-EDIT-01
 */
export const updateProfile = async (formData) => {
    // formData is already a FormData object from the component
    const response = await authenticatedFetch('/accounts/profile/update/', {
        method: 'PUT',
        body: formData, // Don't set Content-Type header - let browser set it with boundary
    });

    if (!response.ok) {
        throw new Error('Failed to update profile.');
    }
    return response.json();
};

// -----------------------------------------------------------------
// --- RIGHT SIDEBAR FETCHERS (NEWLY ADDED) ---
// -----------------------------------------------------------------

/**
 * Fetches live events for the right sidebar.
 * Used by: RightSidebar.jsx (LiveOnXSection)
 * Contract: B-RSB-01
 */
export const fetchLiveStreams = async () => {
    console.log('fetchLiveStreams: Making API call...');
    const response = await authenticatedFetch('/posts/live/stream/', { method: 'GET' });
    console.log('fetchLiveStreams: Response status:', response.status);
    if (!response.ok) {
        const errorText = await response.text();
        console.log('fetchLiveStreams: Error response:', errorText);
        throw new Error('Failed to fetch live streams.');
    }
    const data = await response.json();
    console.log('fetchLiveStreams: Success, data:', data);
    return data;
};

/**
 * Fetches trending topics for the right sidebar.
 * Used by: TrendsSection.jsx
 * Contract: B-RSB-02
 */
export const fetchSidebarTrends = async () => {
    const response = await authenticatedFetch('/posts/trends/sidebar/', { method: 'GET' });
    if (!response.ok) {
        throw new Error('Failed to fetch sidebar trends.');
    }
    return response.json();
};

/**
 * Fetches suggested users for the right sidebar.
 * Used by: WhoToFollowSection.jsx
 * Contract: B-RSB-03
 */
export const fetchSuggestedUsers = async () => {
    const response = await authenticatedFetch('/posts/users/suggested/', { method: 'GET' });
    if (!response.ok) {
        const errorText = await response.text();
        console.log('fetchSuggestedUsers: Error response:', errorText);
        throw new Error(`Failed to fetch suggested users: ${response.status} ${errorText}`);
    }
    return response.json();
};


/**
 * Creates a new post. Supports text content and multiple image files.
 * Contract: B-POST-01, B-POST-02
 *
 * @param {FormData} formData - A FormData object containing 'content' and 'media[]'.
 */
export const createPost = async (formData) => {
    // We use a custom options object for authenticatedFetch to ensure
    // it sends 'multipart/form-data' correctly by omitting the Content-Type header.
    const options = {
        method: 'POST',
        body: formData,
        headers: {},
    };

    const response = await authenticatedFetch('/posts/create/', options);

    if (!response.ok) {
        // Try to get error as JSON first, then as text if that fails
        let errorMessage = 'Failed to create post.';
        try {
            const errorData = await response.json();
            errorMessage = errorData.content?.[0] || errorData.detail || errorData.error || 'Failed to create post.';
        } catch {
            // If JSON parsing fails, try to get response as text
            try {
                const errorText = await response.text();
                errorMessage = errorText || 'Failed to create post.';
            } catch (textError) {
                console.error('Failed to parse error response:', textError);
            }
        }
        throw new Error(errorMessage);
    }
    return response.json();
};
/**
 * Gets a pre-signed S3 upload URL for direct file uploads.
 * Contract: B-UPLOAD-01
 *
 * @param {string} fileName - Name of the file to upload
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<Object>} - Object with upload_url and key
 */
export const getUploadURL = async (fileName, contentType) => {
    // Try S3 upload URL first
    try {
        const response = await authenticatedFetch('/posts/upload-url/', {
            method: 'POST',
            body: JSON.stringify({
                file_name: fileName,
                content_type: contentType
            }),
        });

        if (response.ok) {
            return response.json();
        }

        // If S3 fails, try development upload endpoint
        console.warn('S3 upload URL failed, trying development endpoint');
    } catch (error) {
        console.warn('S3 upload URL failed, trying development endpoint:', error);
    }

    // Fallback to development upload endpoint
    const devResponse = await authenticatedFetch('/posts/dev-upload/', {
        method: 'POST',
        body: JSON.stringify({
            file_name: fileName,
            content_type: contentType
        }),
    });

    if (!devResponse.ok) {
        const errorData = await devResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
    }

    return devResponse.json();
};

/**
 * Uploads a file directly to S3 using a pre-signed URL.
 * Contract: B-UPLOAD-02
 *
 * @param {File} file - The file to upload
 * @param {string} uploadURL - Pre-signed S3 upload URL
 * @returns {Promise<string>} - The S3 key of the uploaded file
 */
export const uploadToS3 = async (file, uploadURL) => {
    // Check if this is a development mock URL
    if (uploadURL.includes('mock-s3.example.com')) {
        // For development, simulate successful upload
        console.log('Development mode: Simulating successful S3 upload for', file.name);
        return { ok: true, status: 200 };
    }

    const response = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': file.type,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to upload file to S3: ${response.status}`);
    }

    return response;
};

/**
 * Creates a new live stream.
 * Contract: B-LIVE-01
 *
 * @param {Object} streamData - Object containing stream details
 */
export const createLiveStream = async (streamData) => {
    console.log('createLiveStream: Sending data:', streamData);
    const response = await authenticatedFetch('/posts/live/stream/', {
        method: 'POST',
        body: JSON.stringify(streamData),
    });

    console.log('createLiveStream: Response status:', response.status);
    if (!response.ok) {
        const errorText = await response.text();
        console.log('createLiveStream: Error response:', errorText);
        const errorData = JSON.parse(errorText || '{}');
        const errorMessage = errorData.detail || errorData.non_field_errors?.[0] || 'Failed to create live stream.';
        throw new Error(errorMessage);
    }
    return response.json();
};

export const startLiveStream = async (streamId, startData = {}) => {
    console.log('startLiveStream: Starting stream:', streamId, startData);
    const response = await authenticatedFetch(`/posts/live/stream/${streamId}/start/`, {
        method: 'POST',
        body: JSON.stringify(startData),
    });

    console.log('startLiveStream: Response status:', response.status);
    if (!response.ok) {
        const errorText = await response.text();
        console.log('startLiveStream: Error response:', errorText);
        const errorData = JSON.parse(errorText || '{}');
        const errorMessage = errorData.detail || errorData.non_field_errors?.[0] || 'Failed to start live stream.';
        throw new Error(errorMessage);
    }
    return response.json();
};