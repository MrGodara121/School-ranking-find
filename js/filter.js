/**
 * [SITE_NAME] - Filter Functionality
 * Version: 1.0
 */

class FilterManager {
    constructor(options = {}) {
        this.container = options.container || document.querySelector('.filter-container');
        this.resultsContainer = options.resultsContainer || document.querySelector('.results-container');
        this.filterForm = options.filterForm || document.getElementById('filter-form');
        
        this.filters = {};
        this.results = [];
        this.currentPage = 1;
        this.itemsPerPage = CONFIG.PAGINATION.SCHOOLS_PER_PAGE || 12;
        this.totalItems = 0;
        
        this.init();
    }
    
    /**
     * Initialize filter
     */
    init() {
        this.bindEvents();
        this.loadFilters();
        this.applyStoredFilters();
    }
    
    /**
     * Bind events
     */
    bindEvents() {
        if (!this.filterForm) return;
        
        // Filter change events
        this.filterForm.querySelectorAll('select, input[type="checkbox"], input[type="radio"]').forEach(element => {
            element.addEventListener('change', () => {
                this.handleFilterChange();
            });
        });
        
        // Range inputs
        this.filterForm.querySelectorAll('input[type="range"]').forEach(element => {
            element.addEventListener('input', (e) => {
                this.updateRangeValue(e.target);
            });
            element.addEventListener('change', () => {
                this.handleFilterChange();
            });
        });
        
        // Search input
        const searchInput = this.filterForm.querySelector('input[type="search"]');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.handleFilterChange();
            }, 500));
        }
        
        // Reset button
        const resetBtn = this.filterForm.querySelector('.filter-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }
        
        // Apply button
        const applyBtn = this.filterForm.querySelector('.filter-apply');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.handleFilterChange();
            });
        }
    }
    
    /**
     * Handle filter change
     */
    handleFilterChange() {
        this.collectFilters();
        this.saveFilters();
        this.currentPage = 1;
        this.applyFilters();
        
        // Track filter use
        Analytics.event('filter_apply', {
            'filters': JSON.stringify(this.filters)
        });
    }
    
    /**
     * Collect filters from form
     */
    collectFilters() {
        if (!this.filterForm) return;
        
        this.filters = {};
        
        // Text inputs
        this.filterForm.querySelectorAll('input[type="text"], input[type="search"]').forEach(input => {
            if (input.value.trim()) {
                this.filters[input.name] = input.value.trim();
            }
        });
        
        // Selects
        this.filterForm.querySelectorAll('select').forEach(select => {
            if (select.value) {
                this.filters[select.name] = select.value;
            }
        });
        
        // Checkboxes
        this.filterForm.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            if (!this.filters[checkbox.name]) {
                this.filters[checkbox.name] = [];
            }
            this.filters[checkbox.name].push(checkbox.value);
        });
        
        // Radios
        this.filterForm.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            this.filters[radio.name] = radio.value;
        });
        
        // Range inputs
        this.filterForm.querySelectorAll('input[type="range"]').forEach(range => {
            this.filters[range.name] = range.value;
        });
    }
    
    /**
     * Apply filters to data
     */
    applyFilters() {
        if (!this.results.length) return;
        
        let filtered = [...this.results];
        
        // Apply each filter
        Object.keys(this.filters).forEach(key => {
            filtered = this.applyFilter(key, this.filters[key], filtered);
        });
        
        this.totalItems = filtered.length;
        this.renderResults(filtered);
        this.updatePagination(filtered.length);
        
        // Update result count
        this.updateResultCount(filtered.length);
    }
    
    /**
     * Apply single filter
     * @param {string} key - Filter key
     * @param {*} value - Filter value
     * @param {Array} data - Data to filter
     * @returns {Array} Filtered data
     */
    applyFilter(key, value, data) {
        if (!value || (Array.isArray(value) && value.length === 0)) return data;
        
        switch (key) {
            case 'search':
                return this.filterBySearch(value, data);
                
            case 'state':
                return data.filter(item => item.State_Code === value);
                
            case 'district':
                return data.filter(item => item.District_ID === value);
                
            case 'grade':
                return this.filterByGrade(value, data);
                
            case 'type':
                return data.filter(item => item.School_Type === value);
                
            case 'rating':
                return data.filter(item => item.Rating >= parseFloat(value));
                
            case 'student_count':
                return this.filterByRange(item.Student_Count, value);
                
            case 'student_ratio':
                return this.filterByRange(item.Student_Teacher_Ratio, value);
                
            case 'math_score':
                return this.filterByRange(item.Math_Score, value);
                
            case 'reading_score':
                return this.filterByRange(item.Reading_Score, value);
                
            default:
                return data;
        }
    }
    
    /**
     * Filter by search query
     * @param {string} query - Search query
     * @param {Array} data - Data to filter
     * @returns {Array} Filtered data
     */
    filterBySearch(query, data) {
        const q = query.toLowerCase();
        return data.filter(item =>
            item.School_Name?.toLowerCase().includes(q) ||
            item.City?.toLowerCase().includes(q) ||
            item.Zip?.includes(q) ||
            item.Address?.toLowerCase().includes(q)
        );
    }
    
    /**
     * Filter by grade level
     * @param {string} grade - Grade filter
     * @param {Array} data - Data to filter
     * @returns {Array} Filtered data
     */
    filterByGrade(grade, data) {
        return data.filter(item => {
            const grades = item.Grade_Level?.toLowerCase() || '';
            return grades.includes(grade.toLowerCase());
        });
    }
    
    /**
     * Filter by range
     * @param {number} value - Item value
     * @param {string} range - Range string (min-max)
     * @returns {boolean} Within range
     */
    filterByRange(value, range) {
        if (!range || !value) return true;
        
        const [min, max] = range.split('-').map(Number);
        if (isNaN(min) && isNaN(max)) return true;
        
        if (!isNaN(min) && value < min) return false;
        if (!isNaN(max) && value > max) return false;
        
        return true;
    }
    
    /**
     * Render results
     * @param {Array} data - Filtered data
     */
    renderResults(data) {
        if (!this.resultsContainer) return;
        
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageData = data.slice(start, end);
        
        if (pageData.length === 0) {
            this.resultsContainer.innerHTML = this.getNoResultsTemplate();
            return;
        }
        
        let html = '';
        pageData.forEach(item => {
            html += this.getItemTemplate(item);
        });
        
        this.resultsContainer.innerHTML = html;
        
        // Initialize any interactive elements
        this.initializeItems();
    }
    
    /**
     * Get item template
     * @param {Object} item - Data item
     * @returns {string} HTML template
     */
    getItemTemplate(item) {
        // Override this in specific filter instances
        return `
            <div class="result-item" data-id="${item.School_ID}">
                <h3><a href="/school/${item.Slug}">${item.School_Name}</a></h3>
                <p>${item.City}, ${item.State_Code}</p>
                <div class="rating">⭐ ${item.Rating}</div>
            </div>
        `;
    }
    
    /**
     * Get no results template
     * @returns {string} HTML template
     */
    getNoResultsTemplate() {
        return `
            <div class="no-results">
                <h3>No results found</h3>
                <p>Try adjusting your filters or search criteria</p>
                <button class="btn btn-outline filter-reset">Clear Filters</button>
            </div>
        `;
    }
    
    /**
     * Initialize items after render
     */
    initializeItems() {
        // Override for specific initialization
    }
    
    /**
     * Update result count
     * @param {number} count - Result count
     */
    updateResultCount(count) {
        const counter = document.querySelector('.result-count');
        if (counter) {
            counter.textContent = `${count} ${count === 1 ? 'result' : 'results'} found`;
        }
    }
    
    /**
     * Update pagination
     * @param {number} total - Total items
     */
    updatePagination(total) {
        const totalPages = Math.ceil(total / this.itemsPerPage);
        const pagination = document.querySelector('.pagination');
        
        if (!pagination) return;
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // Previous button
        html += `
            <button class="page-item ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="filterManager.goToPage(${this.currentPage - 1})">
                Previous
            </button>
        `;
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= this.currentPage - 2 && i <= this.currentPage + 2)
            ) {
                html += `
                    <button class="page-item ${i === this.currentPage ? 'active' : ''}" 
                            onclick="filterManager.goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += '<span class="page-ellipsis">...</span>';
            }
        }
        
        // Next button
        html += `
            <button class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="filterManager.goToPage(${this.currentPage + 1})">
                Next
            </button>
        `;
        
        pagination.innerHTML = html;
    }
    
    /**
     * Go to page
     * @param {number} page - Page number
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        
        if (page < 1 || page > totalPages || page === this.currentPage) return;
        
        this.currentPage = page;
        this.applyFilters();
        
        // Scroll to top of results
        Utils.scrollTo(this.resultsContainer, { block: 'start', behavior: 'smooth' });
        
        // Track pagination
        Analytics.event('pagination', {
            'page': page,
            'total_pages': totalPages
        });
    }
    
    /**
     * Update range input value
     * @param {HTMLElement} input - Range input
     */
    updateRangeValue(input) {
        const display = document.getElementById(`${input.id}_value`);
        if (display) {
            display.textContent = input.value;
        }
    }
    
    /**
     * Save filters to localStorage
     */
    saveFilters() {
        try {
            localStorage.setItem('active_filters', JSON.stringify(this.filters));
        } catch (e) {
            console.warn('Failed to save filters');
        }
    }
    
    /**
     * Load filters from localStorage
     */
    loadFilters() {
        try {
            const saved = localStorage.getItem('active_filters');
            if (!saved) return;
            
            const filters = JSON.parse(saved);
            this.filters = filters;
        } catch (e) {
            console.warn('Failed to load filters');
        }
    }
    
    /**
     * Apply stored filters to form
     */
    applyStoredFilters() {
        if (!this.filterForm || !this.filters) return;
        
        Object.keys(this.filters).forEach(key => {
            const value = this.filters[key];
            
            // Text inputs
            const input = this.filterForm.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    if (Array.isArray(value) && value.includes(input.value)) {
                        input.checked = true;
                    }
                } else if (input.type === 'radio') {
                    if (input.value === value) {
                        input.checked = true;
                    }
                } else {
                    input.value = value;
                }
            }
        });
    }
    
    /**
     * Reset all filters
     */
    resetFilters() {
        if (!this.filterForm) return;
        
        this.filterForm.reset();
        this.filters = {};
        localStorage.removeItem('active_filters');
        
        this.handleFilterChange();
        
        // Track reset
        Analytics.event('filter_reset');
    }
    
    /**
     * Set results data
     * @param {Array} data - Results data
     */
    setResults(data) {
        this.results = data;
        this.applyFilters();
    }
    
    /**
     * Sort results
     * @param {string} sortBy - Sort field
     * @param {string} order - Sort order (asc/desc)
     */
    sortResults(sortBy, order = 'desc') {
        this.results.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (order === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
        
        this.currentPage = 1;
        this.applyFilters();
    }
}

// Initialize filter
document.addEventListener('DOMContentLoaded', () => {
    window.filterManager = new FilterManager();
});
