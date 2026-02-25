/**
 * [SITE_NAME] - Premium Access Management
 * Version: 1.0
 */

class PremiumManager {
    constructor() {
        this.user = null;
        this.status = {
            isActive: false,
            plan: null,
            expiryDate: null,
            features: []
        };
        
        this.init();
    }
    
    /**
     * Initialize premium manager
     */
    async init() {
        await this.checkStatus();
        this.bindEvents();
        this.updateUI();
    }
    
    /**
     * Check premium status
     */
    async checkStatus() {
        // Check localStorage first
        const cached = this.getCachedStatus();
        if (cached) {
            this.status = cached;
            this.user = cached.user;
        }
        
        // Verify with server
        try {
            const response = await this.verifyWithServer();
            if (response) {
                this.status = response;
                this.cacheStatus(response);
            }
        } catch (error) {
            console.error('Error verifying premium status:', error);
        }
    }
    
    /**
     * Get cached status
     * @returns {Object|null} Cached status
     */
    getCachedStatus() {
        try {
            const cached = localStorage.getItem('premium_status');
            if (!cached) return null;
            
            const data = JSON.parse(cached);
            
            // Check if expired
            if (data.expiryDate && new Date(data.expiryDate) < new Date()) {
                localStorage.removeItem('premium_status');
                return null;
            }
            
            return data;
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Verify with server
     * @returns {Object|null} Verified status
     */
    async verifyWithServer() {
        const token = this.getToken();
        if (!token) return null;
        
        try {
            const response = await fetch(`${CONFIG.API_BASE}?action=verifyPremium`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    timestamp: Date.now()
                })
            });
            
            if (!response.ok) return null;
            
            return await response.json();
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Cache status
     * @param {Object} status - Status to cache
     */
    cacheStatus(status) {
        try {
            localStorage.setItem('premium_status', JSON.stringify(status));
        } catch (e) {
            // Ignore
        }
    }
    
    /**
     * Get auth token
     * @returns {string|null} Auth token
     */
    getToken() {
        return localStorage.getItem('auth_token') || Utils.getCookie('auth_token');
    }
    
    /**
     * Bind events
     */
    bindEvents() {
        // Premium buttons
        document.querySelectorAll('.btn-premium, [data-premium]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.status.isActive) {
                    e.preventDefault();
                    this.showUpgradeModal(btn.dataset.plan || 'monthly');
                }
            });
        });
        
        // Premium content protection
        this.protectPremiumContent();
    }
    
    /**
     * Protect premium content
     */
    protectPremiumContent() {
        if (this.status.isActive) return;
        
        document.querySelectorAll('.premium-content, .premium-only').forEach(element => {
            this.addProtectionOverlay(element);
        });
    }
    
    /**
     * Add protection overlay to element
     * @param {HTMLElement} element - Element to protect
     */
    addProtectionOverlay(element) {
        // Don't add if already protected
        if (element.querySelector('.premium-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.className = 'premium-overlay';
        overlay.innerHTML = `
            <div class="premium-overlay-content">
                <div class="premium-icon">⭐</div>
                <h3>Premium Feature</h3>
                <p>Upgrade to Premium to access this content</p>
                <button class="btn btn-premium" onclick="premiumManager.showUpgradeModal()">
                    Upgrade Now
                </button>
            </div>
        `;
        
        element.style.position = 'relative';
        element.appendChild(overlay);
    }
    
    /**
     * Update UI based on premium status
     */
    updateUI() {
        if (this.status.isActive) {
            document.body.classList.add('premium-user');
            
            // Hide upgrade prompts
            document.querySelectorAll('.premium-teaser, .premium-overlay').forEach(el => {
                el.style.display = 'none';
            });
            
            // Show premium content
            document.querySelectorAll('.premium-content').forEach(el => {
                el.style.display = 'block';
            });
            
            // Update premium badge
            this.updatePremiumBadge();
        } else {
            document.body.classList.remove('premium-user');
        }
    }
    
    /**
     * Update premium badge
     */
    updatePremiumBadge() {
        const badge = document.querySelector('.premium-badge-user');
        if (badge) {
            if (this.status.isActive) {
                badge.innerHTML = `
                    <span class="badge premium">⭐ Premium</span>
                    <span class="expiry">Expires: ${Utils.formatDate(this.status.expiryDate)}</span>
                `;
            } else {
                badge.innerHTML = `
                    <a href="/premium.html" class="btn btn-premium-small">Upgrade to Premium</a>
                `;
            }
        }
    }
    
    /**
     * Show upgrade modal
     * @param {string} plan - Selected plan
     */
    showUpgradeModal(plan = 'monthly') {
        const modal = document.createElement('div');
        modal.className = 'modal premium-modal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">Upgrade to Premium</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="premium-features">
                            <h4>Premium Features:</h4>
                            <ul>
                                <li>✓ Detailed parent reviews</li>
                                <li>✓ Compare up to 10 schools</li>
                                <li>✓ Ad-free experience</li>
                                <li>✓ Downloadable reports</li>
                                <li>✓ College readiness data</li>
                                <li>✓ Priority support</li>
                            </ul>
                        </div>
                        
                        <div class="pricing-options">
                            <div class="pricing-option ${plan === 'monthly' ? 'selected' : ''}">
                                <input type="radio" name="plan" id="plan-monthly" value="monthly" 
                                       ${plan === 'monthly' ? 'checked' : ''}>
                                <label for="plan-monthly">
                                    <span class="plan-name">Monthly</span>
                                    <span class="plan-price">$${CONFIG.PREMIUM.MONTHLY_PRICE}<small>/mo</small></span>
                                </label>
                            </div>
                            
                            <div class="pricing-option ${plan === 'yearly' ? 'selected' : ''}">
                                <input type="radio" name="plan" id="plan-yearly" value="yearly"
                                       ${plan === 'yearly' ? 'checked' : ''}>
                                <label for="plan-yearly">
                                    <span class="plan-name">Yearly <span class="save-badge">Save 20%</span></span>
                                    <span class="plan-price">$${CONFIG.PREMIUM.YEARLY_PRICE}<small>/yr</small></span>
                                </label>
                            </div>
                        </div>
                        
                        <button class="btn btn-primary btn-block" onclick="premiumManager.processUpgrade()">
                            Continue to Checkout
                        </button>
                        
                        <p class="guarantee">🛡️ 30-day money-back guarantee</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    }
    
    /**
     * Process upgrade
     */
    processUpgrade() {
        const plan = document.querySelector('input[name="plan"]:checked')?.value || 'monthly';
        
        // Check if user is logged in
        const isLoggedIn = this.getToken();
        
        if (!isLoggedIn) {
            // Store intended plan and redirect to signup
            localStorage.setItem('intended_plan', plan);
            window.location.href = '/signup.html?redirect=premium';
            return;
        }
        
        // Redirect to checkout
        window.location.href = `/checkout.html?plan=${plan}`;
    }
    
    /**
     * Check if user can access feature
     * @param {string} feature - Feature name
     * @returns {boolean} Can access
     */
    canAccess(feature) {
        if (!this.status.isActive) return false;
        return this.status.features.includes(feature) || this.status.plan === 'enterprise';
    }
    
    /**
     * Get remaining days
     * @returns {number} Remaining days
     */
    getRemainingDays() {
        if (!this.status.expiryDate) return 0;
        
        const expiry = new Date(this.status.expiryDate);
        const now = new Date();
        const diff = expiry - now;
        
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    
    /**
     * Logout (clear premium status)
     */
    logout() {
        localStorage.removeItem('premium_status');
        localStorage.removeItem('auth_token');
        Utils.deleteCookie('auth_token');
        
        this.status = {
            isActive: false,
            plan: null,
            expiryDate: null,
            features: []
        };
        
        this.updateUI();
        window.location.reload();
    }
}

// Initialize premium manager
document.addEventListener('DOMContentLoaded', () => {
    window.premiumManager = new PremiumManager();
});
