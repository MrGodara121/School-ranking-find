/**
 * [SITE_NAME] - School Comparison
 * Version: 1.0
 */

class ComparisonManager {
    constructor() {
        this.selectedSchools = [];
        this.schoolsData = [];
        this.maxSchools = CONFIG.MAX_COMPARISON_FREE || 3;
        this.container = document.getElementById('comparison-container');
        this.selectedContainer = document.getElementById('selected-schools');
        this.resultsContainer = document.getElementById('comparison-results');
        
        this.init();
    }
    
    /**
     * Initialize comparison
     */
    async init() {
        await this.loadSchools();
        this.loadFromStorage();
        this.bindEvents();
        this.renderSelected();
        
        // Check URL for pre-selected schools
        this.checkUrlParams();
    }
    
    /**
     * Load schools data
     */
    async loadSchools() {
        try {
            const response = await fetch('/data/schools.json');
            const schools = await response.json();
            this.schoolsData = schools.filter(s => s.Is_Active === "TRUE");
        } catch (error) {
            console.error('Error loading schools:', error);
        }
    }
    
    /**
     * Load from localStorage
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('compare_schools');
            if (saved) {
                const schools = JSON.parse(saved);
                // Verify schools still exist
                this.selectedSchools = schools.filter(id => 
                    this.schoolsData.some(s => s.School_ID === id)
                );
            }
        } catch (e) {
            console.warn('Failed to load comparison data');
        }
    }
    
    /**
     * Save to localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('compare_schools', JSON.stringify(this.selectedSchools));
        } catch (e) {
            // Ignore
        }
    }
    
    /**
     * Check URL parameters for schools
     */
    checkUrlParams() {
        const params = Utils.getUrlParams();
        const schoolIds = [];
        
        // Check for school1, school2, school3 parameters
        for (let i = 1; i <= 3; i++) {
            if (params[`school${i}`]) {
                schoolIds.push(params[`school${i}`]);
            }
        }
        
        if (schoolIds.length > 0) {
            this.selectedSchools = schoolIds;
            this.saveToStorage();
            this.renderSelected();
            this.compare();
        }
    }
    
    /**
     * Bind events
     */
    bindEvents() {
        // Search input
        const searchInput = document.getElementById('comparison-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchSchools(e.target.value);
            }, 300));
        }
        
        // Compare button
        const compareBtn = document.getElementById('btn-compare-now');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => this.compare());
        }
        
        // Clear button
        const clearBtn = document.getElementById('btn-clear-all');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAll());
        }
    }
    
    /**
     * Search schools
     * @param {string} query - Search query
     */
    searchSchools(query) {
        const resultsContainer = document.getElementById('comparison-results');
        if (!resultsContainer) return;
        
        if (query.length < 2) {
            resultsContainer.style.display = 'none';
            return;
        }
        
        const q = query.toLowerCase();
        const results = this.schoolsData
            .filter(school => 
                !this.selectedSchools.includes(school.School_ID) &&
                (school.School_Name.toLowerCase().includes(q) ||
                 school.City.toLowerCase().includes(q))
            )
            .slice(0, 5);
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No schools found</div>';
            resultsContainer.style.display = 'block';
            return;
        }
        
        let html = '';
        results.forEach(school => {
            html += `
                <div class="search-result-item" onclick="comparisonManager.addSchool('${school.School_ID}')">
                    <div class="result-info">
                        <div class="result-name">${school.School_Name}</div>
                        <div class="result-meta">${school.City}, ${school.State_Code} • ⭐ ${school.Rating}</div>
                    </div>
                    <button class="btn-add">Add</button>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = html;
        resultsContainer.style.display = 'block';
    }
    
    /**
     * Add school to comparison
     * @param {string} schoolId - School ID
     */
    addSchool(schoolId) {
        const school = this.schoolsData.find(s => s.School_ID === schoolId);
        if (!school) return;
        
        // Check premium status for max schools
        const isPremium = window.premiumManager?.status.isActive || false;
        const maxSchools = isPremium ? CONFIG.MAX_COMPARISON_PREMIUM : CONFIG.MAX_COMPARISON_FREE;
        
        if (this.selectedSchools.length >= maxSchools) {
            if (!isPremium) {
                this.showPremiumTeaser();
            } else {
                alert(`You can compare up to ${maxSchools} schools`);
            }
            return;
        }
        
        if (this.selectedSchools.includes(schoolId)) return;
        
        this.selectedSchools.push(schoolId);
        this.saveToStorage();
        this.renderSelected();
        
        // Hide search results
        document.getElementById('comparison-results').style.display = 'none';
        document.getElementById('comparison-search').value = '';
        
        // Track
        Analytics.event('comparison_add', {
            'school_id': schoolId,
            'total': this.selectedSchools.length
        });
    }
    
    /**
     * Remove school from comparison
     * @param {string} schoolId - School ID
     */
    removeSchool(schoolId) {
        this.selectedSchools = this.selectedSchools.filter(id => id !== schoolId);
        this.saveToStorage();
        this.renderSelected();
        
        // Hide premium teaser if under limit
        const teaser = document.getElementById('premium-teaser');
        if (teaser) {
            teaser.style.display = 'none';
        }
        
        // Track
        Analytics.event('comparison_remove', {
            'school_id': schoolId,
            'total': this.selectedSchools.length
        });
    }
    
    /**
     * Clear all schools
     */
    clearAll() {
        this.selectedSchools = [];
        this.saveToStorage();
        this.renderSelected();
        
        if (this.resultsContainer) {
            this.resultsContainer.style.display = 'none';
        }
        
        // Track
        Analytics.event('comparison_clear');
    }
    
    /**
     * Render selected schools
     */
    renderSelected() {
        if (!this.selectedContainer) return;
        
        if (this.selectedSchools.length === 0) {
            this.selectedContainer.innerHTML = '<div class="empty-state">No schools selected</div>';
            this.updateButtons();
            return;
        }
        
        let html = '';
        this.selectedSchools.forEach(schoolId => {
            const school = this.schoolsData.find(s => s.School_ID === schoolId);
            if (!school) return;
            
            html += `
                <div class="selected-school-item">
                    <div class="school-info">
                        <div class="school-name">${school.School_Name}</div>
                        <div class="school-meta">${school.City}, ${school.State_Code}</div>
                    </div>
                    <div class="school-rating">⭐ ${school.Rating}</div>
                    <button class="btn-remove" onclick="comparisonManager.removeSchool('${schoolId}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `;
        });
        
        this.selectedContainer.innerHTML = html;
        this.updateButtons();
    }
    
    /**
     * Update button states
     */
    updateButtons() {
        const compareBtn = document.getElementById('btn-compare-now');
        const clearBtn = document.getElementById('btn-clear-all');
        const countSpan = document.getElementById('selected-count');
        
        if (compareBtn) {
            compareBtn.disabled = this.selectedSchools.length < 2;
        }
        
        if (clearBtn) {
            clearBtn.style.display = this.selectedSchools.length > 0 ? 'block' : 'none';
        }
        
        if (countSpan) {
            const isPremium = window.premiumManager?.status.isActive || false;
            const max = isPremium ? CONFIG.MAX_COMPARISON_PREMIUM : CONFIG.MAX_COMPARISON_FREE;
            countSpan.textContent = `${this.selectedSchools.length}/${max}`;
        }
    }
    
    /**
     * Compare selected schools
     */
    compare() {
        if (this.selectedSchools.length < 2) return;
        
        const schools = this.selectedSchools
            .map(id => this.schoolsData.find(s => s.School_ID === id))
            .filter(s => s);
        
        if (schools.length < 2) return;
        
        // Check if we're on compare page
        if (window.location.pathname.includes('compare.html')) {
            this.renderComparison(schools);
        } else {
            // Redirect to compare page
            const params = new URLSearchParams();
            schools.forEach((school, index) => {
                params.append(`school${index + 1}`, school.School_ID);
            });
            window.location.href = `/compare.html?${params.toString()}`;
        }
        
        // Track
        Analytics.event('comparison_perform', {
            'schools': schools.map(s => s.School_ID).join(','),
            'count': schools.length
        });
    }
    
    /**
     * Render comparison table
     * @param {Array} schools - Schools to compare
     */
    renderComparison(schools) {
        if (!this.resultsContainer) return;
        
        // Build metrics
        const metrics = [
            { label: 'Location', getValue: (s) => `${s.City}, ${s.State_Code} ${s.Zip}` },
            { label: 'School Type', getValue: (s) => s.School_Type },
            { label: 'Grades', getValue: (s) => s.Grade_Level },
            { label: 'Students', getValue: (s) => Utils.formatNumber(s.Student_Count) },
            { label: 'Student-Teacher Ratio', getValue: (s) => `${s.Student_Teacher_Ratio}:1` },
            { label: 'Math Score', getValue: (s) => `${s.Math_Score}%` },
            { label: 'Reading Score', getValue: (s) => `${s.Reading_Score}%` },
            { label: 'Graduation Rate', getValue: (s) => `${s.Graduation_Rate}%` },
            { label: 'National Rank', getValue: (s) => `#${s.National_Rank}` },
            { label: 'Performance Index', getValue: (s) => s.Performance_Index }
        ];
        
        let html = `
            <h2 class="comparison-title">School Comparison</h2>
            <div class="comparison-table-wrapper">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>Metrics</th>
        `;
        
        // Headers
        schools.forEach(school => {
            html += `<th class="school-header">
                <a href="/school/${school.Slug}">${school.School_Name}</a>
                <div class="school-rating">⭐ ${school.Rating}</div>
            </th>`;
        });
        
        html += '</tr></thead><tbody>';
        
        // Metrics rows
        metrics.forEach(metric => {
            html += '<tr>';
            html += `<td class="metric-label">${metric.label}</td>`;
            
            const values = schools.map(s => metric.getValue(s));
            const winnerIndex = this.findWinner(metric.label, values, schools);
            
            schools.forEach((school, index) => {
                const value = values[index];
                const isWinner = index === winnerIndex && winnerIndex !== -1;
                html += `<td class="${isWinner ? 'winner' : ''}">${value}</td>`;
            });
            
            html += '</tr>';
        });
        
        // Summary row
        html += '<tr class="summary-row">';
        html += '<td class="metric-label">Summary</td>';
        
        schools.forEach(school => {
            html += `<td>${this.generateSummary(school, schools)}</td>`;
        });
        
        html += '</tr>';
        
        html += '</tbody></table></div>';
        
        // Add compare more button
        html += `
            <div class="comparison-actions">
                <button class="btn btn-outline" onclick="comparisonManager.clearAll()">
                    Clear All
                </button>
                <a href="/compare.html" class="btn btn-primary">
                    Compare More Schools
                </a>
            </div>
        `;
        
        this.resultsContainer.innerHTML = html;
        this.resultsContainer.style.display = 'block';
        
        // Highlight winners
        this.highlightWinners(schools);
    }
    
    /**
     * Find winner index for a metric
     * @param {string} metric - Metric name
     * @param {Array} values - Values to compare
     * @param {Array} schools - Schools data
     * @returns {number} Winner index
     */
    findWinner(metric, values, schools) {
        if (values.length < 2) return -1;
        
        // Convert values to numbers where possible
        const numericValues = values.map(v => {
            if (typeof v === 'string') {
                // Extract number from string (e.g., "85%" -> 85)
                const match = v.match(/\d+/);
                return match ? parseFloat(match[0]) : null;
            }
            return v;
        });
        
        // Check if all values are numeric
        if (numericValues.some(v => v === null)) return -1;
        
        // Determine if higher or lower is better
        const higherBetter = ['Rating', 'Score', 'Rate', 'Index'];
        const lowerBetter = ['Ratio', 'Rank'];
        
        let isHigherBetter = true;
        if (lowerBetter.some(term => metric.includes(term))) {
            isHigherBetter = false;
        } else if (higherBetter.some(term => metric.includes(term))) {
            isHigherBetter = true;
        }
        
        if (isHigherBetter) {
            return numericValues.indexOf(Math.max(...numericValues));
        } else {
            return numericValues.indexOf(Math.min(...numericValues));
        }
    }
    
    /**
     * Generate school summary
     * @param {Object} school - School data
     * @param {Array} allSchools - All schools in comparison
     * @returns {string} Summary text
     */
    generateSummary(school, allSchools) {
        const others = allSchools.filter(s => s.School_ID !== school.School_ID);
        if (others.length === 0) return '';
        
        let points = [];
        
        // Rating comparison
        const avgRating = others.reduce((sum, s) => sum + parseFloat(s.Rating), 0) / others.length;
        if (school.Rating > avgRating) {
            points.push(`Higher rating than average`);
        }
        
        // Math score
        const avgMath = others.reduce((sum, s) => sum + parseFloat(s.Math_Score), 0) / others.length;
        if (school.Math_Score > avgMath) {
            points.push(`Above average math scores`);
        }
        
        // Reading score
        const avgReading = others.reduce((sum, s) => sum + parseFloat(s.Reading_Score), 0) / others.length;
        if (school.Reading_Score > avgReading) {
            points.push(`Above average reading scores`);
        }
        
        // Student-teacher ratio
        const avgRatio = others.reduce((sum, s) => sum + parseFloat(s.Student_Teacher_Ratio), 0) / others.length;
        if (school.Student_Teacher_Ratio < avgRatio) {
            points.push(`Better student-teacher ratio`);
        }
        
        if (points.length === 0) {
            return 'Average performance compared to others';
        }
        
        return points.join(' • ');
    }
    
    /**
     * Highlight winners in table
     * @param {Array} schools - Schools data
     */
    highlightWinners(schools) {
        // Get all metric rows
        const rows = document.querySelectorAll('.comparison-table tbody tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 2) return;
            
            const metricLabel = cells[0].textContent;
            const values = Array.from(cells).slice(1).map(cell => cell.textContent);
            
            const winnerIndex = this.findWinner(metricLabel, values, schools);
            
            if (winnerIndex !== -1) {
                cells[winnerIndex + 1].classList.add('winner');
            }
        });
    }
    
    /**
     * Show premium teaser
     */
    showPremiumTeaser() {
        const teaser = document.getElementById('premium-teaser');
        if (teaser) {
            teaser.style.display = 'block';
        }
    }
}

// Initialize comparison manager
document.addEventListener('DOMContentLoaded', () => {
    window.comparisonManager = new ComparisonManager();
});
