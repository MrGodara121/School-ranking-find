/**
 * [SITE_NAME] - Lead Form Submission
 * Version: 1.0
 */

class LeadFormManager {
    constructor() {
        this.form = document.getElementById('lead-form');
        this.miniForm = document.getElementById('mini-lead-form');
        this.submitBtn = document.getElementById('lead-submit');
        this.successDiv = document.getElementById('lead-success');
        this.honeypot = document.getElementById('honeypot');
        
        this.init();
    }
    
    /**
     * Initialize lead forms
     */
    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            this.setupValidation();
        }
        
        if (this.miniForm) {
            this.miniForm.addEventListener('submit', (e) => this.handleMiniSubmit(e));
        }
        
        this.setupPhoneMask();
        this.loadSavedData();
    }
    
    /**
     * Handle main form submit
     * @param {Event} e - Submit event
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        // Clear previous errors
        this.clearErrors();
        
        // Honeypot check
        if (this.honeypot && this.honeypot.value) {
            console.log('Bot detected');
            this.showSuccess(); // Silent success for bots
            return;
        }
        
        // Rate limiting
        if (!Utils.checkRateLimit('leads')) {
            this.showError('form', 'Please wait a moment before submitting another form.');
            return;
        }
        
        // Validate form
        if (!this.validateForm()) {
            return;
        }
        
        // Show loading
        this.setLoading(true);
        
        // Collect data
        const data = this.collectFormData();
        
        // Submit
        await this.submitLead(data);
    }
    
    /**
     * Handle mini form submit
     * @param {Event} e - Submit event
     */
    async handleMiniSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const email = form.querySelector('input[type="email"]').value;
        const schoolId = form.querySelector('.mini-school-id')?.value;
        
        if (!Utils.isValidEmail(email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        const data = {
            lead_id: Utils.generateId(),
            school_id: schoolId || null,
            email: email,
            source: 'mini_form',
            page_url: window.location.href,
            submission_time: new Date().toISOString()
        };
        
        const btn = form.querySelector('button');
        const originalText = btn.textContent;
        btn.textContent = 'Sending...';
        btn.disabled = true;
        
        try {
            await this.submitLead(data);
            form.innerHTML = '<p class="success">Thank you for subscribing!</p>';
        } catch (error) {
            btn.textContent = originalText;
            btn.disabled = false;
            alert('An error occurred. Please try again.');
        }
    }
    
    /**
     * Setup form validation
     */
    setupValidation() {
        if (!this.form) return;
        
        // Real-time email validation
        const emailInput = document.getElementById('lead-email');
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                this.validateField('email');
            });
        }
        
        // Real-time phone validation
        const phoneInput = document.getElementById('lead-phone');
        if (phoneInput) {
            phoneInput.addEventListener('blur', () => {
                this.validateField('phone');
            });
        }
    }
    
    /**
     * Validate single field
     * @param {string} field - Field name
     * @returns {boolean} Is valid
     */
    validateField(field) {
        const input = document.getElementById(`lead-${field}`);
        if (!input) return true;
        
        let isValid = true;
        let error = '';
        
        switch (field) {
            case 'email':
                if (!Utils.isValidEmail(input.value)) {
                    isValid = false;
                    error = 'Please enter a valid email address';
                } else if (Utils.isBlockedDomain(input.value)) {
                    isValid = false;
                    error = 'Please use a permanent email address';
                }
                break;
                
            case 'phone':
                if (input.value && !Utils.isValidPhone(input.value)) {
                    isValid = false;
                    error = 'Please enter a valid phone number';
                }
                break;
                
            case 'name':
                if (!input.value || input.value.length < 2) {
                    isValid = false;
                    error = 'Please enter your full name';
                }
                break;
        }
        
        if (!isValid) {
            this.showFieldError(field, error);
        } else {
            this.clearFieldError(field);
        }
        
        return isValid;
    }
    
    /**
     * Validate entire form
     * @returns {boolean} Is valid
     */
    validateForm() {
        let isValid = true;
        
        // Required fields
        const requiredFields = ['name', 'email'];
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        // Phone (if provided)
        const phone = document.getElementById('lead-phone')?.value;
        if (phone && !this.validateField('phone')) {
            isValid = false;
        }
        
        // Consents
        const consentEmail = document.getElementById('consent-email');
        const consentPrivacy = document.getElementById('consent-privacy');
        
        if (consentEmail && !consentEmail.checked) {
            alert('Please agree to receive email communications');
            isValid = false;
        }
        
        if (consentPrivacy && !consentPrivacy.checked) {
            alert('Please agree to the Privacy Policy and Terms of Service');
            isValid = false;
        }
        
        // reCAPTCHA
        if (typeof grecaptcha !== 'undefined') {
            const recaptchaResponse = grecaptcha.getResponse();
            if (!recaptchaResponse) {
                this.showError('recaptcha', 'Please complete the reCAPTCHA verification');
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    /**
     * Collect form data
     * @returns {Object} Form data
     */
    collectFormData() {
        const formData = new FormData(this.form);
        
        return {
            lead_id: Utils.generateId(),
            school_id: formData.get('school_id') || null,
            parent_name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone') || null,
            grade_level: formData.get('grade_level') || null,
            preferences: formData.get('preferences') || null,
            source: formData.get('source') || 'website',
            consent_email: formData.get('consent_email') === 'on',
            consent_sms: formData.get('consent_sms') === 'on',
            consent_privacy: formData.get('consent_privacy') === 'on',
            user_agent: navigator.userAgent,
            page_url: window.location.href,
            referrer: document.referrer || 'direct',
            submission_time: new Date().toISOString(),
            intent_level: this.calculateIntent(formData)
        };
    }
    
    /**
     * Calculate intent score
     * @param {FormData} formData - Form data
     * @returns {number} Intent score
     */
    calculateIntent(formData) {
        let score = 0;
        
        if (formData.get('name')) score += 10;
        if (formData.get('email')) score += 20;
        if (formData.get('phone')) score += 15;
        if (formData.get('grade_level')) score += 15;
        if (formData.get('preferences')?.length > 20) score += 25;
        if (formData.get('source')) score += 15;
        
        return score;
    }
    
    /**
     * Submit lead to API
     * @param {Object} data - Lead data
     */
    async submitLead(data) {
        try {
            const response = await fetch(`${CONFIG.API_BASE}?action=submitLead`, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            this.saveLeadData(data);
            this.showSuccess();
            
            if (this.form) {
                this.form.reset();
            }
            
            if (typeof grecaptcha !== 'undefined') {
                grecaptcha.reset();
            }
            
            Utils.updateRateLimit('leads');
            
            // Track conversion
            Analytics.event('lead_submit', {
                'school_id': data.school_id,
                'source': data.source,
                'intent_score': data.intent_level
            });
            
        } catch (error) {
            console.error('Error submitting lead:', error);
            this.showError('form', 'An error occurred. Please try again or email us directly.');
            
            ErrorTracker.log(error, { action: 'submitLead', data });
            
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Save lead data for prefill
     * @param {Object} data - Lead data
     */
    saveLeadData(data) {
        try {
            localStorage.setItem('lead_data', JSON.stringify({
                name: data.parent_name,
                email: data.email,
                phone: data.phone,
                timestamp: Date.now()
            }));
        } catch (e) {
            // Ignore
        }
    }
    
    /**
     * Load saved data for prefill
     */
    loadSavedData() {
        try {
            const saved = localStorage.getItem('lead_data');
            if (!saved) return;
            
            const data = JSON.parse(saved);
            const oneDay = 24 * 60 * 60 * 1000;
            
            if (Date.now() - data.timestamp > oneDay) {
                localStorage.removeItem('lead_data');
                return;
            }
            
            if (this.form && !this.form.querySelector('[name="name"]').value) {
                this.form.querySelector('[name="name"]').value = data.name || '';
                this.form.querySelector('[name="email"]').value = data.email || '';
                this.form.querySelector('[name="phone"]').value = data.phone || '';
            }
        } catch (e) {
            // Ignore
        }
    }
    
    /**
     * Show success message
     */
    showSuccess() {
        if (this.successDiv) {
            this.form.style.display = 'none';
            this.successDiv.style.display = 'block';
        } else {
            const success = document.createElement('div');
            success.className = 'alert alert-success';
            success.innerHTML = `
                <strong>Thank you!</strong> We'll send recommendations to your email within 24 hours.
            `;
            this.form.parentNode.insertBefore(success, this.form);
            this.form.style.display = 'none';
            
            setTimeout(() => {
                success.remove();
                this.form.style.display = 'block';
                this.form.reset();
            }, 5000);
        }
    }
    
    /**
     * Show field error
     * @param {string} field - Field name
     * @param {string} message - Error message
     */
    showFieldError(field, message) {
        const errorDiv = document.getElementById(`lead-${field}-error`);
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        
        const input = document.getElementById(`lead-${field}`);
        if (input) {
            input.classList.add('error');
        }
    }
    
    /**
     * Clear field error
     * @param {string} field - Field name
     */
    clearFieldError(field) {
        const errorDiv = document.getElementById(`lead-${field}-error`);
        if (errorDiv) {
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
        }
        
        const input = document.getElementById(`lead-${field}`);
        if (input) {
            input.classList.remove('error');
        }
    }
    
    /**
     * Show general error
     * @param {string} field - Field name
     * @param {string} message - Error message
     */
    showError(field, message) {
        if (field === 'form') {
            const alert = document.createElement('div');
            alert.className = 'alert alert-danger';
            alert.textContent = message;
            this.form.parentNode.insertBefore(alert, this.form);
            
            setTimeout(() => alert.remove(), 5000);
        } else {
            this.showFieldError(field, message);
        }
    }
    
    /**
     * Clear all errors
     */
    clearErrors() {
        document.querySelectorAll('.form-error').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
        
        document.querySelectorAll('.form-control').forEach(el => {
            el.classList.remove('error');
        });
    }
    
    /**
     * Set loading state
     * @param {boolean} isLoading - Loading state
     */
    setLoading(isLoading) {
        if (!this.submitBtn) return;
        
        const btnText = this.submitBtn.querySelector('.btn-text');
        const btnLoader = this.submitBtn.querySelector('.btn-loader');
        
        this.submitBtn.disabled = isLoading;
        
        if (isLoading) {
            btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'inline-flex';
        } else {
            btnText.style.display = 'inline';
            if (btnLoader) btnLoader.style.display = 'none';
        }
    }
    
    /**
     * Setup phone number mask
     */
    setupPhoneMask() {
        const phoneInput = document.getElementById('lead-phone');
        if (!phoneInput) return;
        
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 10) {
                value = value.slice(0, 10);
            }
            
            if (value.length > 6) {
                value = `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6)}`;
            } else if (value.length > 3) {
                value = `(${value.slice(0,3)}) ${value.slice(3)}`;
            } else if (value.length > 0) {
                value = `(${value}`;
            }
            
            e.target.value = value;
        });
    }
}

// Initialize lead form
document.addEventListener('DOMContentLoaded', () => {
    window.leadFormManager = new LeadFormManager();
});
