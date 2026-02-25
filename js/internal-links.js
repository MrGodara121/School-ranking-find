/**
 * [SITE_NAME] - Internal Linking
 * Version: 1.0
 */

class InternalLinkManager {
    constructor() {
        this.links = [];
        this.content = null;
        this.init();
    }
    
    /**
     * Initialize internal linking
     */
    async init() {
        await this.loadLinks();
        this.processContent();
        this.bindEvents();
    }
    
    /**
     * Load link definitions
     */
    async loadLinks() {
        try {
            const response = await fetch('/data/internal-links.json');
            this.links = await response.json();
        } catch (error) {
            console.error('Error loading internal links:', error);
            this.loadDefaultLinks();
        }
    }
    
    /**
     * Load default links
     */
    loadDefaultLinks() {
        this.links = [
            {
                pageType: 'school',
                sourceSlug: null,
                targetSlug: null,
                anchorText: 'Find more schools in {city}',
                priority: 1
            },
            {
                pageType: 'school',
                sourceSlug: null,
                targetSlug: null,
                anchorText: 'Compare {school} with similar schools',
                priority: 2
            },
            {
                pageType: 'district',
                sourceSlug: null,
                targetSlug: null,
                anchorText: 'View all schools in {district}',
                priority: 1
            }
        ];
    }
    
    /**
     * Process content for internal links
     */
    processContent() {
        // Get main content area
        this.content = document.querySelector('main, article, .content');
        if (!this.content) return;
        
        // Get page type from URL
        const pageType = this.getPageType();
        
        // Get page data
        const pageData = this.getPageData();
        
        // Add contextual links
        this.addContextualLinks(pageType, pageData);
        
        // Add related content links
        this.addRelatedLinks(pageType, pageData);
        
        // Add "nearby" links for schools
        if (pageType === 'school') {
            this.addNearbySchools(pageData);
        }
    }
    
    /**
     * Get page type from URL
     * @returns {string} Page type
     */
    getPageType() {
        const path = window.location.pathname;
        
        if (path.includes('/school/')) return 'school';
        if (path.includes('/district/')) return 'district';
        if (path.includes('/state/')) return 'state';
        if (path.includes('/blog/')) return 'blog';
        if (path.includes('/compare')) return 'compare';
        
        return 'default';
    }
    
    /**
     * Get page data from DOM
     * @returns {Object} Page data
     */
    getPageData() {
        const data = {};
        
        // Get school name
        const schoolName = document.querySelector('h1')?.textContent;
        if (schoolName) data.name = schoolName;
        
        // Get city
        const city = document.querySelector('.school-location, .location')?.textContent;
        if (city) data.city = city;
        
        // Get district
        const district = document.querySelector('.district-name')?.textContent;
        if (district) data.district = district;
        
        // Get state from URL or meta
        const slug = window.location.pathname.split('/').pop();
        data.slug = slug;
        
        return data;
    }
    
    /**
     * Add contextual links
     * @param {string} pageType - Page type
     * @param {Object} pageData - Page data
     */
    addContextualLinks(pageType, pageData) {
        const relevantLinks = this.links.filter(link => 
            link.pageType === pageType || link.pageType === 'all'
        );
        
        if (relevantLinks.length === 0) return;
        
        // Find best places to insert links
        const paragraphs = this.content.querySelectorAll('p');
        if (paragraphs.length < 3) return;
        
        // Insert after second paragraph
        const insertPoint = paragraphs[1];
        if (!insertPoint) return;
        
        const linkHtml = this.generateLinkHtml(relevantLinks[0], pageData);
        const wrapper = document.createElement('div');
        wrapper.className = 'contextual-links';
        wrapper.innerHTML = linkHtml;
        
        insertPoint.parentNode.insertBefore(wrapper, insertPoint.nextSibling);
    }
    
    /**
     * Generate link HTML
     * @param {Object} link - Link definition
     * @param {Object} data - Page data
     * @returns {string} HTML
     */
    generateLinkHtml(link, data) {
        let text = link.anchorText;
        
        // Replace placeholders
        text = text.replace('{city}', data.city || 'your area');
        text = text.replace('{school}', data.name || 'this school');
        text = text.replace('{district}', data.district || 'this district');
        text = text.replace('{state}', data.state || 'this state');
        
        // Generate URL
        let url = link.targetSlug || '#';
        if (link.pageType === 'school' && data.city) {
            url = `/search.html?city=${encodeURIComponent(data.city)}`;
        } else if (link.pageType === 'compare' && data.slug) {
            url = `/compare.html?school=${data.slug}`;
        }
        
        return `
            <div class="internal-link-box">
                <p>👉 <a href="${url}" class="internal-link">${text}</a></p>
            </div>
        `;
    }
    
    /**
     * Add related links
     * @param {string} pageType - Page type
     * @param {Object} pageData - Page data
     */
    addRelatedLinks(pageType, pageData) {
        if (pageType !== 'blog') return;
        
        const sidebar = document.querySelector('.sidebar, .blog-sidebar');
        if (!sidebar) return;
        
        // Get related posts from data
        fetch('/data/blog.json')
            .then(response => response.json())
            .then(posts => {
                const currentSlug = pageData.slug;
                const related = posts
                    .filter(p => p.Slug !== currentSlug && p.Status === 'published')
                    .slice(0, 5);
                
                if (related.length === 0) return;
                
                let html = `
                    <div class="sidebar-widget related-posts">
                        <h3>Related Articles</h3>
                        <ul class="related-list">
                `;
                
                related.forEach(post => {
                    html += `
                        <li>
                            <a href="/blog/${post.Slug}">${post.Title}</a>
                        </li>
                    `;
                });
                
                html += '</ul></div>';
                
                sidebar.insertAdjacentHTML('afterbegin', html);
            });
    }
    
    /**
     * Add nearby schools
     * @param {Object} pageData - Page data
     */
    addNearbySchools(pageData) {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        
        // Get school ID from URL
        const schoolSlug = pageData.slug;
        
        fetch('/data/schools.json')
            .then(response => response.json())
            .then(schools => {
                const current = schools.find(s => s.Slug === schoolSlug);
                if (!current) return;
                
                // Find nearby schools (same city or nearby cities)
                const nearby = schools
                    .filter(s => 
                        s.School_ID !== current.School_ID &&
                        s.City === current.City &&
                        s.Is_Active === "TRUE"
                    )
                    .slice(0, 5);
                
                if (nearby.length === 0) return;
                
                let html = `
                    <div class="sidebar-widget nearby-schools">
                        <h3>Schools Nearby</h3>
                        <ul class="nearby-list">
                `;
                
                nearby.forEach(school => {
                    html += `
                        <li>
                            <a href="/school/${school.Slug}">${school.School_Name}</a>
                            <span class="distance">⭐ ${school.Rating}</span>
                        </li>
                    `;
                });
                
                html += '</ul></div>';
                
                sidebar.insertAdjacentHTML('beforeend', html);
            });
    }
    
    /**
     * Bind events for internal links
     */
    bindEvents() {
        // Track internal link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('.internal-link, .internal-link-box a');
            if (!link) return;
            
            Analytics.event('internal_link_click', {
                'link_url': link.href,
                'link_text': link.textContent,
                'page_url': window.location.href
            });
        });
    }
}

// Initialize internal link manager
document.addEventListener('DOMContentLoaded', () => {
    window.internalLinkManager = new InternalLinkManager();
});
