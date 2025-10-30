// src/components/lib/imageUtils.js

/**
 * Image optimization and CDN utilities for TheSportsDB integration
 */

// CDN configuration for image optimization
const IMAGE_CDN_CONFIG = {
    baseUrl: 'https://images.weserv.nl',
    defaultParams: {
        w: 300,        // Default width
        h: 200,        // Default height
        fit: 'cover',  // Cover to maintain aspect ratio
        q: 85,         // Quality 85%
        output: 'webp' // WebP format for better compression
    }
};

/**
 * Generate optimized image URL using CDN
 * @param {string} originalUrl - Original image URL from TheSportsDB
 * @param {object} options - Image transformation options
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (originalUrl, options = {}) => {
    if (!originalUrl) return null;

    // Skip optimization for already optimized URLs or data URLs
    if (originalUrl.includes('weserv.nl') || originalUrl.startsWith('data:')) {
        return originalUrl;
    }

    const params = {
        ...IMAGE_CDN_CONFIG.defaultParams,
        ...options
    };

    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append('url', encodeURIComponent(originalUrl));

    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            queryParams.append(key, value.toString());
        }
    });

    return `${IMAGE_CDN_CONFIG.baseUrl}?${queryParams.toString()}`;
};

/**
 * Generate responsive image URLs for different screen sizes
 * @param {string} originalUrl - Original image URL
 * @returns {object} Object with different size variants
 */
export const getResponsiveImageUrls = (originalUrl) => {
    if (!originalUrl) return null;

    return {
        small: getOptimizedImageUrl(originalUrl, { w: 150, h: 100 }),
        medium: getOptimizedImageUrl(originalUrl, { w: 300, h: 200 }),
        large: getOptimizedImageUrl(originalUrl, { w: 600, h: 400 }),
        xlarge: getOptimizedImageUrl(originalUrl, { w: 1200, h: 800 }),
        original: originalUrl
    };
};

/**
 * Preload critical images for better performance
 * @param {string[]} imageUrls - Array of image URLs to preload
 */
export const preloadImages = (imageUrls) => {
    if (typeof window === 'undefined') return;

    imageUrls.forEach(url => {
        if (url) {
            const img = new Image();
            img.src = url;
        }
    });
};

/**
 * Generate placeholder image while loading
 * @param {number} width - Placeholder width
 * @param {number} height - Placeholder height
 * @param {string} text - Placeholder text
 * @returns {string} Data URL for placeholder image
 */
export const generatePlaceholderImage = (width = 300, height = 200, text = 'Loading...') => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#374151'; // Gray-700
    ctx.fillRect(0, 0, width, height);

    // Text
    ctx.fillStyle = '#9CA3AF'; // Gray-400
    ctx.font = `${Math.min(width, height) / 10}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);

    return canvas.toDataURL('image/png');
};

/**
 * Image lazy loading with intersection observer
 * @param {HTMLElement} imgElement - Image element to lazy load
 * @param {string} src - Image source URL
 * @param {string} placeholder - Placeholder image data URL
 */
export const lazyLoadImage = (imgElement, src, placeholder = null) => {
    if (!imgElement || !src) return;

    // Set placeholder initially
    if (placeholder) {
        imgElement.src = placeholder;
    }

    // Create intersection observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;

                // Create new image to preload
                const newImg = new Image();
                newImg.onload = () => {
                    img.src = src;
                    img.classList.add('loaded');
                };
                newImg.src = src;

                // Stop observing
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px' // Start loading 50px before image enters viewport
    });

    observer.observe(imgElement);
};

/**
 * Get team badge with optimization
 * @param {string} badgeUrl - Original badge URL from TheSportsDB
 * @param {number} size - Badge size in pixels
 * @returns {string} Optimized badge URL
 */
export const getTeamBadge = (badgeUrl, size = 64) => {
    return getOptimizedImageUrl(badgeUrl, {
        w: size,
        h: size,
        fit: 'contain', // Contain to show full badge
        q: 90
    });
};

/**
 * Get player image with optimization
 * @param {string} imageUrl - Original player image URL
 * @param {string} size - Size variant ('small', 'medium', 'large')
 * @returns {string} Optimized player image URL
 */
export const getPlayerImage = (imageUrl, size = 'medium') => {
    const sizes = {
        small: { w: 80, h: 80 },
        medium: { w: 150, h: 150 },
        large: { w: 300, h: 300 }
    };

    return getOptimizedImageUrl(imageUrl, {
        ...sizes[size],
        fit: 'cover',
        q: 85
    });
};

/**
 * Get venue/stadium image with optimization
 * @param {string} imageUrl - Original venue image URL
 * @returns {string} Optimized venue image URL
 */
export const getVenueImage = (imageUrl) => {
    return getOptimizedImageUrl(imageUrl, {
        w: 400,
        h: 250,
        fit: 'cover',
        q: 80
    });
};

/**
 * Image error handling - fallback to placeholder
 * @param {Event} event - Image error event
 * @param {string} fallbackText - Text for placeholder
 */
export const handleImageError = (event, fallbackText = 'Image unavailable') => {
    const img = event.target;
    const width = img.offsetWidth || 300;
    const height = img.offsetHeight || 200;

    img.src = generatePlaceholderImage(width, height, fallbackText);
    img.onerror = null; // Prevent infinite loop
};

/**
 * Batch optimize images for a collection
 * @param {Array} items - Array of items with image URLs
 * @param {string} imageKey - Key for image URL in each item
 * @param {object} options - Optimization options
 * @returns {Array} Items with optimized image URLs
 */
export const optimizeImageCollection = (items, imageKey = 'strBadge', options = {}) => {
    return items.map(item => ({
        ...item,
        [`${imageKey}_optimized`]: getOptimizedImageUrl(item[imageKey], options)
    }));
};