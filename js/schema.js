/**
 * [SITE_NAME] - JSON-LD Schema Generator
 * Version: 1.0
 */

class SchemaManager {
    constructor() {
        this.schemas = [];
        this.init();
    }
    
    /**
     * Initialize schema generation
     */
    init() {
        this.generateSchemas();
    }
    
    /**
     * Generate all schemas based on page type
     */
    generateSchemas() {
        const pageType = this.getPageType();
        
        // Always generate organization schema
        this.addOrganizationSchema();
        
        // Generate page-specific schemas
        switch (pageType) {
            case 'school':
                this.addSchoolSchema();
                this.addBreadcrumbSchema();
                break;
                
            case 'district':
                this.addDistrictSchema();
                this.addBreadcrumbSchema();
                break;
                
            case 'state':
                this.addStateSchema();
                this.addBreadcrumbSchema();
                break;
                
            case 'blog':
                this.addBlogPostSchema();
                break;
                
            case 'blog-list':
                this.addBlogListSchema();
                break;
                
            case 'compare':
                this.addComparePageSchema();
                break;
                
            case 'home':
                this.addHomepageSchema();
                break;
                
            case 'search':
                this.addSearchSchema();
                break;
        }
        
        // Add FAQ schema if FAQs exist
        if (document.querySelector('.faq-block')) {
            this.addFAQSchema();
        }
        
        // Add review schema if reviews exist
        if (document.querySelector('.reviews-section')) {
            this.addReviewSchema();
        }
        
        // Render all schemas
        this.renderSchemas();
    }
    
    /**
     * Get page type
     * @returns {string} Page type
     */
    getPageType() {
        const path = window.location.pathname;
        
        if (path === '/' || path === '/index.html') return 'home';
        if (path.includes('/school/')) return 'school';
        if (path.includes('/district/')) return 'district';
        if (path.includes('/state/')) return 'state';
        if (path.includes('/blog/') && path.split('/').length > 2) return 'blog';
        if (path.includes('/blog.html')) return 'blog-list';
        if (path.includes('/compare')) return 'compare';
        if (path.includes('/search')) return 'search';
        
        return 'page';
    }
    
    /**
     * Add organization schema
     */
    addOrganizationSchema() {
        const schema = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": CONFIG.SITE_NAME,
            "url": CONFIG.BASE_URL,
            "logo": `${CONFIG.BASE_URL}/assets/images/logo.svg`,
            "sameAs": [
                CONFIG.SOCIAL.FACEBOOK,
                CONFIG.SOCIAL.TWITTER,
                CONFIG.SOCIAL.INSTAGRAM,
                CONFIG.SOCIAL.LINKEDIN
            ],
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": CONFIG.CONTACT.PHONE,
                "contactType": "customer service",
                "email": CONFIG.CONTACT.EMAIL,
                "availableLanguage": "English"
            },
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "123 Education Lane",
                "addressLocality": "[CITY]",
                "addressRegion": "[STATE]",
                "postalCode": "[ZIP]",
                "addressCountry": "US"
            }
        };
        
        this.schemas.push(schema);
    }
    
    /**
     * Add school schema
     */
    addSchoolSchema() {
        // Get school data from page
        const schoolName = document.querySelector('h1')?.textContent || '';
        const rating = document.querySelector('.rating-value, .rating-number')?.textContent || '';
        const address = document.querySelector('.school-location')?.textContent || '';
        const grades = document.querySelector('.school-type')?.textContent || '';
        
        // Get meta description
        const description = document.querySelector('meta[name="description"]')?.content || '';
        
        const schema = {
            "@context": "https://schema.org",
            "@type": "School",
            "name": schoolName,
            "description": description,
            "url": window.location.href,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": address.split(',')[0]?.trim() || '',
                "addressLocality": address.split(',')[1]?.trim() || '',
                "addressRegion": address.split(',')[2]?.trim() || '',
                "addressCountry": "US"
            },
            "aggregateRating": rating ? {
                "@type": "AggregateRating",
                "ratingValue": rating,
                "bestRating": "5",
                "worstRating": "0",
                "ratingCount": document.querySelector('.review-count')?.textContent || '0'
            } : undefined,
            "gradeLevel": grades.replace('Grades', '').trim()
        };
        
        this.schemas.push(schema);
    }
    
    /**
     * Add district schema
     */
    addDistrictSchema() {
        const districtName = document.querySelector('h1')?.textContent || '';
        const schoolCount = document.querySelector('.district-stats .stat-value')?.textContent || '';
        
        const schema = {
            "@context": "https://schema.org",
            "@type": "SchoolDistrict",
            "name": districtName,
            "url": window.location.href,
            "numberOfSchools": schoolCount
        };
        
        this.schemas.push(schema);
    }
    
    /**
     * Add state schema
     */
    addStateSchema() {
        const stateName = document.querySelector('h1')?.textContent || '';
        
        const schema = {
            "@context": "https://schema.org",
            "@type": "State",
            "name": stateName,
            "url": window.location.href
        };
        
        this.schemas.push(schema);
    }
    
    /**
     * Add blog post schema
     */
    addBlogPostSchema() {
        const title = document.querySelector('h1')?.textContent || '';
        const description = document.querySelector('meta[name="description"]')?.content || '';
        const date = document.querySelector('.post-date')?.textContent || new Date().toISOString();
        const image = document.querySelector('.post-featured-image img')?.src || '';
        
        const schema = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": title,
            "description": description,
            "image": image,
            "datePublished": date,
            "dateModified": date,
            "author": {
                "@type": "Organization",
                "name": CONFIG.SITE_NAME,
                "url": CONFIG.BASE_URL
            },
            "publisher": {
                "@type": "Organization",
                "name": CONFIG.SITE_NAME,
                "logo": {
                    "@type": "ImageObject",
                    "url": `${CONFIG.BASE_URL}/assets/images/logo.svg`
                }
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": window.location.href
            }
        };
        
        this.schemas.push(schema);
    }
    
    /**
     * Add blog list schema
     */
    addBlogListSchema() {
        const schema = {
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": `${CONFIG.SITE_NAME} Blog`,
            "description": "Education insights, school ratings, and parent resources",
            "url": `${CONFIG.BASE_URL}/blog.html`
        };
        
        this.schemas.push(schema);
    }
    
    /**
     * Add compare page schema
     */
    addComparePageSchema() {
        const schema = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "School Comparison",
            "description": "Compare schools side by side",
            "url": window.location.href
        };
        
        this.schemas.push(schema);
    }
    
    /**
     * Add homepage schema
     */
    addHomepageSchema() {
        const schema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": CONFIG.SITE_NAME,
            "url": CONFIG.BASE_URL,
            "potentialAction": {
                "@type": "SearchAction",
                "target": `${CONFIG.BASE_URL}/search.html?q={search_term_string}`,
                "query-input": "required name=search_term_string"
            }
        };
        
        this.schemas.push(schema);
    }
    
    /**
     * Add search page schema
     */
    addSearchSchema() {
        const schema = {
            "@context": "https://schema.org",
            "@type": "SearchResultsPage",
            "url": window.location.href
        };
        
        this.schemas.push(schema);
    }
    
    /**
     * Add breadcrumb schema
     */
    addBreadcrumbSchema() {
        const breadcrumbs = [];
        const items = document.querySelectorAll('.breadcrumb-item, .breadcrumb a, .breadcrumb span');
        
        items.forEach((item, index) => {
            const link = item.tagName === 'A' ? item : null;
            const name = item.textContent.trim();
            
            if (name && name !== '›' && name !== '>') {
                breadcrumbs.push({
                    "@type": "ListItem",
                    "position": index + 1,
                    "name": name,
                    "item": link ? link.href : undefined
                });
            }
        });
        
        if (breadcrumbs.length > 0) {
            const schema = {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": breadcrumbs
            };
            
            this.schemas.push(schema);
        }
    }
    
    /**
     * Add FAQ schema
     */
    addFAQSchema() {
        const faqItems = [];
        
        document.querySelectorAll('.faq-item').forEach(item => {
            const question = item.querySelector('.faq-question')?.textContent.trim();
            const answer = item.querySelector('.faq-answer')?.textContent.trim();
            
            if (question && answer) {
                faqItems.push({
                    "@type": "Question",
                    "name": question,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": answer
                    }
                });
            }
        });
        
        if (faqItems.length > 0) {
            const schema = {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": faqItems
            };
            
            this.schemas.push(schema);
        }
    }
    
    /**
     * Add review schema
     */
    addReviewSchema() {
        const reviews = [];
        
        document.querySelectorAll('.review-item').forEach(item => {
            const author = item.querySelector('.review-author')?.textContent || 'Parent';
            const rating = item.querySelector('.review-rating')?.textContent || '5';
            const content = item.querySelector('.review-content')?.textContent || '';
            
            reviews.push({
                "@type": "Review",
                "author": {
                    "@type": "Person",
                    "name": author
                },
                "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": rating,
                    "bestRating": "5"
                },
                "reviewBody": content
            });
        });
        
        if (reviews.length > 0) {
            // Get the school name from the page
            const schoolName = document.querySelector('h1')?.textContent || 'School';
            
            const schema = {
                "@context": "https://schema.org",
                "@type": "School",
                "name": schoolName,
                "review": reviews
            };
            
            this.schemas.push(schema);
        }
    }
    
    /**
     * Render all schemas
     */
    renderSchemas() {
        // Remove existing schemas
        document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
            script.remove();
        });
        
        // Add new schemas
        this.schemas.forEach((schema, index) => {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.id = `schema-${index}`;
            script.textContent = JSON.stringify(schema, null, 2);
            document.head.appendChild(script);
        });
        
        console.log(`Generated ${this.schemas.length} schemas`);
    }
}

// Initialize schema manager
document.addEventListener('DOMContentLoaded', () => {
    window.schemaManager = new SchemaManager();
});
