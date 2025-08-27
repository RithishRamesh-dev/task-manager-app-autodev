// Task Manager App JavaScript

// Global variables
let currentUser = null;
let authToken = localStorage.getItem('access_token');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupTokenRefresh();
    setupGlobalEventListeners();
});

function initializeApp() {
    // Check if user is authenticated
    if (authToken && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        validateToken();
    } else if (!authToken && !['/login', '/register', '/'].includes(window.location.pathname)) {
        // Redirect to login if no token
        window.location.href = '/login';
    }
}

function validateToken() {
    fetch('/api/v1/auth/profile', {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Token invalid');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            currentUser = data.data;
        } else {
            throw new Error('Token invalid');
        }
    })
    .catch(error => {
        console.log('Token validation failed:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (!['/login', '/register', '/'].includes(window.location.pathname)) {
            window.location.href = '/login';
        }
    });
}

function setupTokenRefresh() {
    // Auto-refresh token every 14 minutes (tokens expire in 15 minutes)
    setInterval(() => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
            fetch('/api/v1/auth/refresh', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${refreshToken}`
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    localStorage.setItem('access_token', data.data.access_token);
                    authToken = data.data.access_token;
                }
            })
            .catch(error => {
                console.log('Token refresh failed:', error);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
            });
        }
    }, 14 * 60 * 1000); // 14 minutes
}

function setupGlobalEventListeners() {
    // Handle logout
    const logoutLinks = document.querySelectorAll('a[href*="logout"]');
    logoutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });
    
    // Setup CSRF protection for all AJAX requests
    const token = document.querySelector('meta[name="csrf-token"]');
    if (token) {
        window.csrfToken = token.getAttribute('content');
    }
}

function logout() {
    const token = localStorage.getItem('access_token');
    
    fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
    })
    .catch(error => {
        console.error('Logout error:', error);
        // Even if logout API fails, clear tokens and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
    });
}

// Utility functions
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at the top of the main content area
    const main = document.querySelector('main');
    if (main) {
        main.insertBefore(alertDiv, main.firstChild);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv && alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

function getPriorityColor(priority) {
    const colors = {
        'low': 'success',
        'medium': 'warning',
        'high': 'danger',
        'critical': 'dark'
    };
    return colors[priority] || 'secondary';
}

function getStatusColor(status) {
    const colors = {
        'pending': 'warning',
        'in_progress': 'info',
        'completed': 'success',
        'cancelled': 'secondary'
    };
    return colors[status] || 'secondary';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// API Helper functions
function makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('access_token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {})
        }
    };
    
    return fetch(url, { ...defaultOptions, ...options })
        .then(response => {
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return;
            }
            return response.json();
        });
}

// File upload helper
function handleFileUpload(file, taskId) {
    const formData = new FormData();
    formData.append('file', file);
    
    return makeAuthenticatedRequest(`/api/v1/tasks/${taskId}/attachments`, {
        method: 'POST',
        body: formData,
        headers: {} // Remove Content-Type to let browser set it with boundary
    });
}

// Search functionality
function initializeSearch(searchInputId, searchCallback) {
    const searchInput = document.getElementById(searchInputId);
    if (searchInput) {
        const debouncedSearch = debounce(searchCallback, 300);
        searchInput.addEventListener('input', function(e) {
            debouncedSearch(e.target.value);
        });
    }
}

// Modal helpers
function openModal(modalId) {
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
    return modal;
}

function closeModal(modalId) {
    const modalElement = document.getElementById(modalId);
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
        modal.hide();
    }
}

// Loading state helpers
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
}

// Form validation helpers
function validateForm(formId, validationRules) {
    const form = document.getElementById(formId);
    let isValid = true;
    
    // Clear previous validation states
    form.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
    
    Object.keys(validationRules).forEach(fieldName => {
        const field = form.querySelector(`[name="${fieldName}"]`);
        const rules = validationRules[fieldName];
        
        if (field && rules) {
            const value = field.value.trim();
            
            // Required validation
            if (rules.required && !value) {
                showFieldError(field, 'This field is required');
                isValid = false;
                return;
            }
            
            // Length validation
            if (rules.minLength && value.length < rules.minLength) {
                showFieldError(field, `Minimum ${rules.minLength} characters required`);
                isValid = false;
                return;
            }
            
            if (rules.maxLength && value.length > rules.maxLength) {
                showFieldError(field, `Maximum ${rules.maxLength} characters allowed`);
                isValid = false;
                return;
            }
            
            // Email validation
            if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                showFieldError(field, 'Please enter a valid email address');
                isValid = false;
                return;
            }
            
            // Custom validation
            if (rules.custom && typeof rules.custom === 'function') {
                const customResult = rules.custom(value);
                if (customResult !== true) {
                    showFieldError(field, customResult);
                    isValid = false;
                    return;
                }
            }
        }
    });
    
    return isValid;
}

function showFieldError(field, message) {
    field.classList.add('is-invalid');
    const feedback = field.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.textContent = message;
    }
}

// Export functions for global use
window.TaskManager = {
    showAlert,
    formatDate,
    formatDateTime,
    getPriorityColor,
    getStatusColor,
    makeAuthenticatedRequest,
    handleFileUpload,
    openModal,
    closeModal,
    showLoading,
    hideLoading,
    validateForm,
    debounce,
    initializeSearch
};