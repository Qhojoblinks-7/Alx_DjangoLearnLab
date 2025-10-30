// src/components/hooks/useViewTracking.js
import { useEffect, useRef, useCallback } from 'react';
import { authenticatedFetch } from '../lib/api';

/**
 * Custom hook for tracking post visibility and triggering view events
 * Implements Intersection Observer with configurable thresholds
 *
 * @param {string|number} postId - The post ID to track
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Visibility threshold (0-1, default: 0.5)
 * @param {number} options.timeThreshold - Time threshold in ms (default: 500)
 * @param {string} options.viewType - Type of view ('feed', 'detail', 'impression')
 * @param {boolean} options.enabled - Whether tracking is enabled
 */
const useViewTracking = (postId, options = {}) => {
  const {
    threshold = 0.5,        // 50% of post must be visible
    timeThreshold = 500,    // Must be visible for 500ms
    viewType = 'feed',
    enabled = true
  } = options;

  const elementRef = useRef(null);
  const visibilityTimerRef = useRef(null);
  const hasBeenViewedRef = useRef(false);

  const recordView = useCallback(async () => {
    if (!postId || hasBeenViewedRef.current) return;

    try {
      const response = await authenticatedFetch(`/posts/${postId}/view/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          view_type: viewType,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        hasBeenViewedRef.current = true;
        console.log(`View recorded for post ${postId}`);
      } else {
        console.warn(`Failed to record view for post ${postId}`);
      }
    } catch (error) {
      console.warn(`Error recording view for post ${postId}:`, error);
    }
  }, [postId, viewType]);

  const handleIntersection = useCallback((entries) => {
    const [entry] = entries;

    if (entry.isIntersecting && enabled) {
      // Start timer when element becomes visible
      if (visibilityTimerRef.current) {
        clearTimeout(visibilityTimerRef.current);
      }

      visibilityTimerRef.current = setTimeout(() => {
        recordView();
      }, timeThreshold);
    } else {
      // Clear timer when element becomes invisible
      if (visibilityTimerRef.current) {
        clearTimeout(visibilityTimerRef.current);
        visibilityTimerRef.current = null;
      }
    }
  }, [recordView, timeThreshold, enabled]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin: '0px',
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      if (visibilityTimerRef.current) {
        clearTimeout(visibilityTimerRef.current);
      }
    };
  }, [handleIntersection, threshold, enabled]);

  // Reset view tracking when postId changes
  useEffect(() => {
    hasBeenViewedRef.current = false;
    if (visibilityTimerRef.current) {
      clearTimeout(visibilityTimerRef.current);
      visibilityTimerRef.current = null;
    }
  }, [postId]);

  return elementRef;
};

export default useViewTracking;