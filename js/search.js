/**
 * [SITE_NAME] - Search Functionality
 * Version: 1.0
 */

class SearchManager {
    constructor() {
        this.searchInput = document.getElementById('search-input');
        this.searchForm = document.getElementById('main-search');
        this.suggestionsContainer = document.getElementById('search-suggestions');
        this.searchButton = document.querySelector('.search-submit');
        this.clearButton = document.getElementById('search-clear');
        
        this.schoolsData = [];
        this.searchTimeout = null;
        this.minChars = 2;
        this.maxSuggestions = 8;
        
        this.init();
    }
    
    /**
     * Initialize search
     */
    async init() {
        if (!this.searchInput) return;
        
        await this.loadSchoolsData();
        this.bindEvents();
        this.setupFilters();
    }
    
    /**
     * Load schools data
     */
    async loadSchoolsData() {
        try {
            // Try cache first
            const cached = CacheManager.get('schools_search');
            if (cached) {
                this.schoolsData = cached;
                return;
            }
            
            const response = await fetch('/data/schools.json');
            if (!response.ok) throw new Error('Failed to load schools');
            
            const schools = await response.json();
            this.schoolsData = schools.filter(s => s.Is_Active === "TRUE");
            
            // Cache for 1 hour
            CacheManager.set('schools_search', this.schoolsData, 3600000);
            
        } catch (error) {
            console.error('Error loading schools:', error);
            ErrorTracker.log(error, { component: 'search' });
        }
    }
    
    /**
     * Bind events
     */
    bindEvents() {
        // Search input
        this.searchInput.addEventListener('input', (e) => {
            this.handleInput(e.target.value);
        });
        
        // Focus
        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value.length >= this.minChars) {
                this.showSuggestions();
            }
        });
        
        // Click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-wrapper')) {
                this.hideSuggestions();
            }
        });
        
        // Clear button
        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => {
                this.clearSearch();
            });
        }
        
        // Form submit
        if (this.searchForm) {
            this.searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.performSearch();
            });
        }
        
        // Keyboard navigation
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
    }
    
    /**
     * Handle input
     * @param {string} query - Search query
     */
    handleInput(query) {
        query = query.trim();
        
        // Show/hide clear button
        if (this.clearButton) {
            this.clearButton.style.display = query.length > 0 ? 'flex' : 'none';
        }
        
        // Clear timeout
        clearTimeout(this.searchTimeout);
        
        if (query.length < this.minChars) {
            this.hideSuggestions();
            return;
        }
        
        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.getSuggestions(query);
        }, 300);
    }
    
    /**
     * Get search suggestions
     * @param {string} query - Search query
     */
    getSuggestions(query) {
        if (!this.schoolsData.length) return;
        
        const q = query.toLowerCase();
        
        const results = this.schoolsData
            .filter(school => 
                school.School_Name.toLowerCase().includes(q) ||
                school.City.toLowerCase().includes(q) ||
                school.Zip.includes(q) ||
                school.Address?.toLowerCase().includes(q)
            )
            .slice(0, this.maxSuggestions);
        
        this.renderSuggestions(results, query);
    }
    
    /**
     * Render suggestions
     * @param {Array} results - Search results
     * @param {string} query - Search query
     */
    renderSuggestions(results, query) {
        if (!this.suggestionsContainer) return;
        
        if (results.length === 0) {
            this.suggestionsContainer.innerHTML = `
                <div class="suggestion-item no-results">
                    <div class="suggestion-name">No schools found</div>
                    <div class="suggestion-meta">Try different keywords</div>
                </div>
            `;
            this.showSuggestions();
            return;
        }
        
        let html = '';
        results.forEach(school => {
            const matchIndex = school.School_Name.toLowerCase().indexOf(query.toLowerCase());
            const name = school.School_Name;
            
            html += `
                <a href="/school/${school.Slug}" class="suggestion-item">
                    <div class="suggestion-name">${this.highlightMatch(name, query)}</div>
                    <div class="suggestion-meta">
                        <span>${school.City}, ${school.State_Code}</span>
                        <span class="rating">⭐ ${school.Rating}</span>
                    </div>
                    <div class="suggestion-type">${school.School_Type}</div>
                </a>
            `;
        });
        
        html += `
            <a href="/search.html?q=${encodeURIComponent(query)}" class="suggestion-item view-all">
                <div class="suggestion-name">View all results for "${Utils.truncate(query, 30)}"</div>
                <div class="suggestion-meta">Press Enter to search</div>
            </a>
        `;
        
        this.suggestionsContainer.innerHTML = html;
        this.showSuggestions();
        
        // Track search
        Analytics.event('search_suggestions', {
            'search_term': query,
            'result_count': results.length
        });
    }
    
    /**
     * Highlight matching text
     * @param {string} text - Original text
     * @param {string} query - Search query
     * @returns {string} HTML with highlights
     */
    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    /**
     * Show suggestions
     */
    showSuggestions() {
        if (this.suggestionsContainer) {
            this.suggestionsContainer.style.display = 'block';
        }
    }
    
    /**
     * Hide suggestions
     */
    hideSuggestions() {
        if (this.suggestionsContainer) {
            this.suggestionsContainer.style.display = 'none';
        }
    }
    
    /**
     * Clear search
     */
    clearSearch() {
        this.searchInput.value = '';
        this.searchInput.focus();
        this.hideSuggestions();
        
        if (this.clearButton) {
            this.clearButton.style.display = 'none';
        }
    }
    
    /**
     * Perform search
     */
    performSearch() {
        const query = this.searchInput.value.trim();
        if (!query) return;
        
        // Get filters
        const filters = this.getFilters();
        
        // Build URL
        const params = new URLSearchParams({
            q: query,
            ...filters
        });
        
        // Track search
        Analytics.event('search_perform', {
            'search_term': query,
            'filters': JSON.stringify(filters)
        });
        
        // Redirect
        window.location.href = `/search.html?${params.toString()}`;
    }
    
    /**
     * Handle keyboard navigation
     * @param {Event} e - Keyboard event
     */
    handleKeyboard(e) {
        const suggestions = this.suggestionsContainer?.querySelectorAll('.suggestion-item');
        if (!suggestions?.length) return;
        
        const active = document.activeElement;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (active === this.searchInput) {
                    suggestions[0].focus();
                } else {
                    const next = Array.from(suggestions).indexOf(active) + 1;
                    if (next < suggestions.length) {
                        suggestions[next].focus();
                    }
                }
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                const prev = Array.from(suggestions).indexOf(active) - 1;
                if (prev >= 0) {
                    suggestions[prev].focus();
                } else {
                    this.searchInput.focus();
                }
                break;
                
            case 'Escape':
                this.hideSuggestions();
                this.searchInput.focus();
                break;
        }
    }
    
    /**
     * Setup filters
     */
    setupFilters() {
        const stateFilter = document.getElementById('filter-state');
        const gradeFilter = document.getElementById('filter-grade');
        const typeFilter = document.getElementById('filter-type');
        
        // Load states
        if (stateFilter) {
            this.loadStates(stateFilter);
        }
        
        // Save filter preferences
        [stateFilter, gradeFilter, typeFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => {
                    this.saveFilters();
                });
            }
        });
        
        // Load saved filters
        this.loadFilters();
    }
    
    /**
     * Load states into filter
     * @param {HTMLElement} select - Select element
     */
    async loadStates(select) {
        try {
            const response = await fetch('/data/states.json');
            const states = await response.json();
            
            states.filter(s => s.Is_Active === "TRUE")
                .sort((a, b) => a.State_Name.localeCompare(b.State_Name))
                .forEach(state => {
                    select.innerHTML += `<option value="${state.State_Code}">${state.State_Name}</option>`;
                });
        } catch (error) {
            console.error('Error loading states:', error);
        }
    }
    
    /**
     * Get current filters
     * @returns {Object} Filter object
     */
    getFilters() {
        const filters = {};
        
        const state = document.getElementById('filter-state')?.value;
        const grade = document.getElementById('filter-grade')?.value;
        const type = document.getElementById('filter-type')?.value;
        
        if (state) filters.state = state;
        if (grade) filters.grade = grade;
        if (type) filters.type = type;
        
        return filters;
    }
    
    /**
     * Save filters to localStorage
     */
    saveFilters() {
        const filters = this.getFilters();
        localStorage.setItem('search_filters', JSON.stringify(filters));
    }
    
    /**
     * Load filters from localStorage
     */
    loadFilters() {
        try {
            const saved = localStorage.getItem('search_filters');
            if (!saved) return;
            
            const filters = JSON.parse(saved);
            
            Object.keys(filters).forEach(key => {
                const element = document.getElementById(`filter-${key}`);
                if (element) {
                    element.value = filters[key];
                }
            });
        } catch (e) {
            console.warn('Failed to load filters');
        }
    }
}

// Initialize search
document.addEventListener('DOMContentLoaded', () => {
    window.searchManager = new SearchManager();
});
