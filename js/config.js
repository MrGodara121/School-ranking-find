/**
 * [SITE_NAME] - Configuration File
 * Version: 1.0
 * Last Updated: 2024
 */

// ============================================
// 1. SITE CONFIGURATION
// ============================================
const CONFIG = {
    // Site Information
    SITE_NAME: 'School Ratings',
    DOMAIN: 'yourdomain.com',
    BASE_URL: 'https://yourdomain.com',
    
    // API Endpoints - YOUR APPS SCRIPT URL
    API_BASE: 'https://script.google.com/macros/s/AKfycbwVX33jHU86xGqHnfbgWd6PehBmRTbMRORXph32Y7HS1t3Gjne8lTz5bcPU-l2YAGQZ/exec',
    API_TIMEOUT: 10000, // 10 seconds
    
    // Analytics
    GA4_ID: 'G-XXXXXXXXXX',
    ADSENSE_ID: 'pub-XXXXXXXXXX',
    
    // Security
    RECAPTCHA_KEY: '6LeXXXXXXXXXX',
    API_SECRET: 'your-secret-key-here', // Will be replaced from SETTINGS
    
    // Premium Pricing
    PREMIUM: {
        MONTHLY_PRICE: 9.99,
        YEARLY_PRICE: 89.99,
        MONTHLY_SAVINGS: 'Save 25%',
        YEARLY_SAVINGS: 'Save 40%',
        CURRENCY: 'USD',
        TRIAL_DAYS: 7
    },
    
    // Default Settings
    DEFAULT_STATE: 'CA',
    DEFAULT_LIMIT: 20,
    MAX_COMPARISON_FREE: 3,
    MAX_COMPARISON_PREMIUM: 10,
    
    // Validation
    BLOCKED_EMAIL_DOMAINS: [
        'tempmail.com', 'throwaway.com', 'mailinator.com',
        'guerrillamail.com', 'sharklasers.com', 'yopmail.com',
        '10minutemail.com', 'temp-mail.org', 'fakeinbox.com',
        'maildrop.cc', 'getnada.com', 'dispostable.com'
    ],
    
    // Rate Limiting (milliseconds)
    RATE_LIMIT: {
        LEADS: 3600000,      // 1 hour
        SEARCH: 1000,        // 1 second
        COMPARE: 5000,       // 5 seconds
        REVIEW: 86400000,    // 24 hours
        CONTACT: 3600000     // 1 hour
    },
    
    // Cache Duration (milliseconds)
    CACHE_DURATION: {
        SCHOOLS: 3600000,    // 1 hour
        STATES: 86400000,    // 24 hours
        DISTRICTS: 86400000, // 24 hours
        BLOG: 3600000        // 1 hour
    },
    
    // Feature Flags
    FEATURES: {
        ENABLE_REVIEWS: true,
        ENABLE_COMPARISON: true,
        ENABLE_PREMIUM: true,
        ENABLE_BLOG: true,
        ENABLE_NEWSLETTER: true
    },
    
    // Pagination
    PAGINATION: {
        SCHOOLS_PER_PAGE: 12,
        BLOG_PER_PAGE: 9,
        REVIEWS_PER_PAGE: 10
    },
    
    // Image Settings
    IMAGES: {
        DEFAULT_SCHOOL: '/assets/images/default-school.jpg',
        DEFAULT_BLOG: '/assets/images/default-blog.jpg',
        DEFAULT_AVATAR: '/assets/images/default-avatar.png',
        MAX_SIZE: 5242880, // 5MB
        ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp']
    },
    
    // Social Media
    SOCIAL: {
        FACEBOOK: 'https://facebook.com/schoolratings',
        TWITTER: 'https://twitter.com/schoolratings',
        INSTAGRAM: 'https://instagram.com/schoolratings',
        LINKEDIN: 'https://linkedin.com/company/schoolratings',
        YOUTUBE: 'https://youtube.com/schoolratings'
    },
    
    // Contact Information
    CONTACT: {
        EMAIL: 'contact@schoolratings.com',
        PHONE: '+1 (555) 123-4567',
        ADDRESS: '123 Education Lane, Suite 100, San Francisco, CA 94105',
        SUPPORT_HOURS: 'Mon-Fri, 9am-5pm EST'
    },
    
    // SEO Defaults
    SEO: {
        TITLE: 'School Ratings & Reviews | School Ratings',
        DESCRIPTION: 'Find detailed ratings, reviews, and performance data for schools across the United States.',
        KEYWORDS: 'school ratings, school reviews, education, test scores, parent reviews',
        AUTHOR: 'School Ratings',
        ROBOTS: 'index, follow'
    }
};

// ============================================
// 2. UTILITY FUNCTIONS
// ============================================
const Utils = {
    /**
     * Format date to readable string
     * @param {string|Date} date - Date to format
     * @param {string} format - Format style (short, long, full)
     * @returns {string} Formatted date
     */
    formatDate: (date, format = 'long') => {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const options = {
            short: { year: 'numeric', month: 'numeric', day: 'numeric' },
            long: { year: 'numeric', month: 'long', day: 'numeric' },
            full: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        };
        
        return d.toLocaleDateString('en-US', options[format] || options.long);
    },
    
    /**
     * Sanitize user input to prevent XSS
     * @param {string} str - Input string
     * @returns {string} Sanitized string
     */
    sanitize: (str) => {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
    
    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid email
     */
    isValidEmail: (email) => {
        if (!email) return false;
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    /**
     * Check if email domain is blocked
     * @param {string} email - Email to check
     * @returns {boolean} Is blocked domain
     */
    isBlockedDomain: (email) => {
        if (!email) return false;
        const domain = email.split('@')[1]?.toLowerCase();
        return CONFIG.BLOCKED_EMAIL_DOMAINS.includes(domain);
    },
    
    /**
     * Validate phone number
     * @param {string} phone - Phone to validate
     * @returns {boolean} Is valid phone
     */
    isValidPhone: (phone) => {
        if (!phone) return true; // Optional
        const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        return re.test(phone);
    },
    
    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },
    
    /**
     * Get cookie value
     * @param {string} name - Cookie name
     * @returns {string|null} Cookie value
     */
    getCookie: (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    },
    
    /**
     * Set cookie
     * @param {string} name - Cookie name
     * @param {string} value - Cookie value
     * @param {number} days - Days until expiration
     */
    setCookie: (name, value, days = 30) => {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/;Secure;SameSite=Lax`;
    },
    
    /**
     * Delete cookie
     * @param {string} name - Cookie name
     */
    deleteCookie: (name) => {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    },
    
    /**
     * Check rate limit
     * @param {string} action - Action to check
     * @returns {boolean} Can perform action
     */
    checkRateLimit: (action) => {
        const lastTime = Utils.getCookie(`last_${action}`);
        if (!lastTime) return true;
        
        const timeDiff = Date.now() - parseInt(lastTime);
        const limit = CONFIG.RATE_LIMIT[action.toUpperCase()];
        
        return timeDiff > limit;
    },
    
    /**
     * Update rate limit
     * @param {string} action - Action performed
     */
    updateRateLimit: (action) => {
        Utils.setCookie(`last_${action}`, Date.now().toString(), 1);
    },
    
    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce: (func, wait = 300) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit in ms
     * @returns {Function} Throttled function
     */
    throttle: (func, limit = 300) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * Format number with commas
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    formatNumber: (num) => {
        if (num === null || num === undefined) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    /**
     * Truncate text
     * @param {string} text - Text to truncate
     * @param {number} length - Max length
     * @returns {string} Truncated text
     */
    truncate: (text, length = 100) => {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.substr(0, length).trim() + '...';
    },
    
    /**
     * Get URL parameters
     * @returns {Object} URL parameters
     */
    getUrlParams: () => {
        const params = new URLSearchParams(window.location.search);
        const obj = {};
        for (const [key, value] of params) {
            obj[key] = value;
        }
        return obj;
    },
    
    /**
     * Build URL with parameters
     * @param {string} base - Base URL
     * @param {Object} params - Parameters
     * @returns {string} Full URL
     */
    buildUrl: (base, params = {}) => {
        const url = new URL(base, CONFIG.BASE_URL);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });
        return url.toString();
    },
    
    /**
     * Detect device type
     * @returns {string} Device type
     */
    getDeviceType: () => {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'mobile';
        }
        return 'desktop';
    },
    
    /**
     * Detect browser language
     * @returns {string} Language code
     */
    getLanguage: () => {
        return navigator.language || navigator.userLanguage || 'en-US';
    },
    
    /**
     * Check if user is online
     * @returns {boolean} Online status
     */
    isOnline: () => {
        return navigator.onLine;
    },
    
    /**
     * Copy to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise} Copy result
     */
    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy:', err);
            return false;
        }
    },
    
    /**
     * Download data as file
     * @param {*} data - Data to download
     * @param {string} filename - File name
     * @param {string} type - File type
     */
    downloadFile: (data, filename, type = 'application/json') => {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    /**
     * Scroll to element
     * @param {string|Element} element - Element or selector
     * @param {Object} options - Scroll options
     */
    scrollTo: (element, options = {}) => {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return;
        
        const defaultOptions = {
            behavior: 'smooth',
            block: 'start',
            ...options
        };
        
        el.scrollIntoView(defaultOptions);
    },
    
    /**
     * Format rating stars
     * @param {number} rating - Rating (0-5)
     * @returns {string} HTML stars
     */
    formatStars: (rating) => {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5;
        const empty = 5 - full - (half ? 1 : 0);
        
        let stars = '';
        for (let i = 0; i < full; i++) stars += '<span class="star full">★</span>';
        if (half) stars += '<span class="star half">★</span>';
        for (let i = 0; i < empty; i++) stars += '<span class="star empty">☆</span>';
        
        return stars;
    }
};

// ============================================
// 3. ERROR TRACKING
// ============================================
const ErrorTracker = {
    /**
     * Log error
     * @param {Error} error - Error object
     * @param {Object} context - Error context
     */
    log: (error, context = {}) => {
        console.error('Error:', error.message, 'Context:', context);
        
        // Send to analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'error', {
                'error_message': error.message,
                'error_stack': error.stack,
                'error_context': JSON.stringify(context),
                'page_url': window.location.href,
                'user_agent': navigator.userAgent
            });
        }
        
        // Store for debugging
        try {
            const errors = JSON.parse(localStorage.getItem('error_log') || '[]');
            errors.push({
                timestamp: new Date().toISOString(),
                message: error.message,
                stack: error.stack,
                context,
                url: window.location.href
            });
            // Keep only last 50 errors
            if (errors.length > 50) errors.shift();
            localStorage.setItem('error_log', JSON.stringify(errors));
        } catch (e) {
            // Ignore storage errors
        }
    },
    
    /**
     * Handle uncaught errors
     */
    init: () => {
        window.addEventListener('error', (event) => {
            ErrorTracker.log(event.error, {
                type: 'uncaught',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            ErrorTracker.log(event.reason, {
                type: 'unhandled_promise'
            });
        });
    }
};

// ============================================
// 4. CACHE MANAGER
// ============================================
const CacheManager = {
    /**
     * Set cache item
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {number} duration - Cache duration
     */
    set: (key, value, duration = 3600000) => {
        const item = {
            value,
            timestamp: Date.now(),
            expires: Date.now() + duration
        };
        try {
            localStorage.setItem(`cache_${key}`, JSON.stringify(item));
        } catch (e) {
            // If storage is full, clear old items
            this.clearOld();
            try {
                localStorage.setItem(`cache_${key}`, JSON.stringify(item));
            } catch (e) {
                console.warn('Failed to cache item:', key);
            }
        }
    },
    
    /**
     * Get cache item
     * @param {string} key - Cache key
     * @returns {*} Cached value or null
     */
    get: (key) => {
        try {
            const item = JSON.parse(localStorage.getItem(`cache_${key}`));
            if (!item) return null;
            
            if (Date.now() > item.expires) {
                localStorage.removeItem(`cache_${key}`);
                return null;
            }
            
            return item.value;
        } catch (e) {
            return null;
        }
    },
    
    /**
     * Remove cache item
     * @param {string} key - Cache key
     */
    remove: (key) => {
        localStorage.removeItem(`cache_${key}`);
    },
    
    /**
     * Clear all cache
     */
    clear: () => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('cache_')) {
                localStorage.removeItem(key);
            }
        });
    },
    
    /**
     * Clear old cache items
     */
    clearOld: () => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('cache_')) {
                try {
                    const item = JSON.parse(localStorage.getItem(key));
                    if (Date.now() > item.expires) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    localStorage.removeItem(key);
                }
            }
        });
    }
};

// ============================================
// 5. ANALYTICS TRACKER
// ============================================
const Analytics = {
    /**
     * Initialize analytics
     */
    init: () => {
        if (!CONFIG.GA4_ID) return;
        
        // Google Analytics 4
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.GA4_ID}`;
        document.head.appendChild(script);
        
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() { dataLayer.push(arguments); };
        gtag('js', new Date());
        gtag('config', CONFIG.GA4_ID, {
            'send_page_view': true,
            'cookie_flags': 'SameSite=None;Secure'
        });
    },
    
    /**
     * Track page view
     * @param {string} path - Page path
     * @param {string} title - Page title
     */
    pageView: (path, title) => {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                'page_path': path || window.location.pathname,
                'page_title': title || document.title
            });
        }
    },
    
    /**
     * Track event
     * @param {string} action - Event action
     * @param {Object} params - Event parameters
     */
    event: (action, params = {}) => {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, params);
        }
        
        // Also store for custom analytics
        try {
            const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
            events.push({
                action,
                params,
                timestamp: new Date().toISOString(),
                url: window.location.href
            });
            if (events.length > 100) events.shift();
            localStorage.setItem('analytics_events', JSON.stringify(events));
        } catch (e) {
            // Ignore
        }
    },
    
    /**
     * Track user engagement
     * @param {string} action - Engagement action
     * @param {*} value - Engagement value
     */
    engage: (action, value) => {
        Analytics.event('user_engagement', {
            'engagement_action': action,
            'engagement_value': value
        });
    }
};

// ============================================
// 6. INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Set last visit cookie
    Utils.setCookie('last_visit', Date.now().toString(), 30);
    
    // Initialize error tracking
    ErrorTracker.init();
    
    // Initialize analytics
    Analytics.init();
    
    // Track page view
    Analytics.pageView();
    
    // Check online status
    window.addEventListener('online', () => {
        document.body.classList.remove('offline');
    });
    
    window.addEventListener('offline', () => {
        document.body.classList.add('offline');
    });
    
    // Add base URL to all forms
    document.querySelectorAll('form[data-api]').forEach(form => {
        form.action = CONFIG.API_BASE + (form.dataset.api || '');
    });
});

// ============================================
// 7. EXPORTS
// ============================================
window.CONFIG = CONFIG;
window.Utils = Utils;
window.ErrorTracker = ErrorTracker;
window.CacheManager = CacheManager;
window.Analytics = Analytics;
