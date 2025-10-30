// src/components/lib/NotificationService.js

/**
 * Dynamic Notification Messaging Component
 * Purpose: Deliver personalized, sport-themed notification messages based on interaction type, user gender, and post media type.
 */

/**
 * Get personalized notification message parts
 * @param {Object} params
 * @param {string} params.type - Interaction type ('like', 'repost', 'comment', 'share')
 * @param {string} params.username - Username of the actor
 * @param {string} params.gender - Gender of the actor ('male', 'female', or other)
 * @param {number} params.userCount - Number of users (for bulk notifications)
 * @param {Object} params.post - Post object with hasVideo property
 * @returns {Object} Object with username and message parts
 */
export function getNotificationMessage({ type, gender, userCount, post }) {
  const mediaType = post?.hasVideo ? 'video' : 'post';

  switch (type) {
    case 'like':
      if (userCount > 1) {
        return { prefix: 'Applause from ', suffix: '—they loved your post!' };
      }
      if (gender === 'male') return { prefix: 'Applause from ', suffix: '—he loved your post!' };
      if (gender === 'female') return { prefix: 'Applause from ', suffix: '—she loved your post!' };
      return { prefix: 'Applause from ', suffix: '—they loved your post!' };

    case 'repost':
      if (gender === 'male') return { prefix: '', suffix: ' reposted your post!' };
      if (gender === 'female') return { prefix: '', suffix: ' reposted your post!' };
      return { prefix: '', suffix: ' reposted your post!' };

    case 'comment':
      if (gender === 'male') return { prefix: '', suffix: ` dropped his take on your ${mediaType}.` };
      if (gender === 'female') return { prefix: '', suffix: ` dropped her take on your ${mediaType}.` };
      return { prefix: '', suffix: ` dropped their take on your ${mediaType}.` };

    case 'repost_interaction':
      if (gender === 'male') return { prefix: '', suffix: ` engaged with your repost—he ${mediaType === 'video' ? 'watched' : 'liked'} the original!` };
      if (gender === 'female') return { prefix: '', suffix: ` engaged with your repost—she ${mediaType === 'video' ? 'watched' : 'liked'} the original!` };
      return { prefix: '', suffix: ` engaged with your repost—they ${mediaType === 'video' ? 'watched' : 'liked'} the original!` };

    case 'share':
      return { prefix: 'Your content\'s making waves—', suffix: ' shared it!' };

    default:
      return { prefix: '', suffix: ' interacted with your post.' };
  }
}