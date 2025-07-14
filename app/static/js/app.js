/**
 * Task Manager Application JavaScript
 * Main application functionality and utilities
 */

// Global application object
window.TaskManager = {
    // Configuration
    config: {
        apiBaseUrl: '/api',
        refreshInterval: 30000, // 30 seconds
        animationDuration: 300,
        debounceDelay: 500,
        maxRetries: 3
    },
    
    // Utilities
    utils: {},
    
    // Components
    components: {},
    
    // API methods
    api: {},
    
    // Event handlers
    events: {},
    
    // Initialize application
    init: function() {
        this.utils.init();
        this.api.init();
        this.events.init();
        this.components.init();
        console.log('Task Manager application initialized');
    }
};

// Utility functions
TaskManager.utils = {
    init: function() {
        this.setupGlobalEventListeners();
        this.initializeTooltips();
        this.setupAnimations();
    },
    
    // Setup global event listeners
    setupGlobalEventListeners: function() {
        // Handle form submissions with loading states
        document.addEventListener('submit', function(e) {
            const form = e.target;
            if (form.tagName === 'FORM') {
                TaskManager.utils.showFormLoading(form);
            }
        });
        
        // Handle AJAX errors globally
        window.addEventListener('unhandledrejection', function(e) {
            console.error('Unhandled promise rejection:', e.reason);
            TaskManager.utils.showNotification('An error occurred. Please try again.', 'error');
        });
        
        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                TaskManager.utils.handleWindowResize();
            }, 250);
        });
    },
    
    // Initialize Bootstrap tooltips
    initializeTooltips: function() {
        if (typeof bootstrap !== 'undefined') {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function(tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    },
    
    // Setup animations
    setupAnimations: function() {
        // Intersection Observer for fade-in animations
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in-up');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            
            // Observe all cards
            document.querySelectorAll('.card').forEach(function(card) {
                observer.observe(card);
            });
        }
    },
    
    // Show loading state on forms
    showFormLoading: function(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="loading"></span> Processing...';
            submitBtn.disabled = true;
            
            // Reset button after 10 seconds as fallback
            setTimeout(function() {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 10000);
        }
    },
    
    // Show notification
    showNotification: function(message, type = 'info', duration = 5000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Auto-remove after duration
        setTimeout(function() {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    },
    
    // Debounce function
    debounce: function(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(function() {
                func.apply(this, args);
            }.bind(this), delay);
        };
    },
    
    // Format date for display
    formatDate: function(dateString) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    },
    
    // Handle window resize
    handleWindowResize: function() {
        // Adjust layout for mobile
        const isMobile = window.innerWidth < 768;
        document.body.classList.toggle('mobile-layout', isMobile);
        
        // Emit custom event
        window.dispatchEvent(new CustomEvent('taskmanager:resize', {
            detail: { isMobile: isMobile }
        }));
    },
    
    // Local storage utilities
    storage: {
        set: function(key, value) {
            try {
                localStorage.setItem(`taskmanager_${key}`, JSON.stringify(value));
            } catch (e) {
                console.warn('Failed to save to localStorage:', e);
            }
        },
        
        get: function(key) {
            try {
                const item = localStorage.getItem(`taskmanager_${key}`);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.warn('Failed to read from localStorage:', e);
                return null;
            }
        },
        
        remove: function(key) {
            try {
                localStorage.removeItem(`taskmanager_${key}`);
            } catch (e) {
                console.warn('Failed to remove from localStorage:', e);
            }
        }
    }
};

// API utilities
TaskManager.api = {
    init: function() {
        this.setupRetryLogic();
    },
    
    // Setup retry logic for failed requests
    setupRetryLogic: function() {
        // This would be implemented with a proper HTTP client
        // For now, we'll use fetch with retry logic
    },
    
    // Make API request with retry logic
    request: function(method, endpoint, data = null, retries = 0) {
        const url = `${TaskManager.config.apiBaseUrl}${endpoint}`;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        // Add authentication header if available
        const token = TaskManager.utils.storage.get('auth_token');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Add data for POST/PUT requests
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }
        
        return fetch(url, options)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .catch(function(error) {
                if (retries < TaskManager.config.maxRetries) {
                    console.warn(`Request failed, retrying... (${retries + 1}/${TaskManager.config.maxRetries})`);
                    return TaskManager.api.request(method, endpoint, data, retries + 1);
                }
                throw error;
            });
    },
    
    // Specific API methods
    tasks: {
        getAll: function(filters = {}) {
            const params = new URLSearchParams(filters);
            return TaskManager.api.request('GET', `/tasks?${params}`);
        },
        
        getById: function(id) {
            return TaskManager.api.request('GET', `/tasks/${id}`);
        },
        
        create: function(data) {
            return TaskManager.api.request('POST', '/tasks', data);
        },
        
        update: function(id, data) {
            return TaskManager.api.request('PUT', `/tasks/${id}`, data);
        },
        
        delete: function(id) {
            return TaskManager.api.request('DELETE', `/tasks/${id}`);
        },
        
        updateStatus: function(id, status) {
            return TaskManager.api.request('PATCH', `/tasks/${id}/status`, { status });
        }
    },
    
    projects: {
        getAll: function() {
            return TaskManager.api.request('GET', '/projects');
        },
        
        getById: function(id) {
            return TaskManager.api.request('GET', `/projects/${id}`);
        },
        
        create: function(data) {
            return TaskManager.api.request('POST', '/projects', data);
        },
        
        update: function(id, data) {
            return TaskManager.api.request('PUT', `/projects/${id}`, data);
        },
        
        delete: function(id) {
            return TaskManager.api.request('DELETE', `/projects/${id}`);
        }
    },
    
    comments: {
        create: function(data) {
            return TaskManager.api.request('POST', '/comments', data);
        },
        
        update: function(id, data) {
            return TaskManager.api.request('PUT', `/comments/${id}`, data);
        },
        
        delete: function(id) {
            return TaskManager.api.request('DELETE', `/comments/${id}`);
        }
    }
};

// Component system
TaskManager.components = {
    init: function() {
        this.initializeAll();
    },
    
    // Initialize all components
    initializeAll: function() {
        this.taskFilters();
        this.quickActions();
        this.autoSave();
        this.realTimeUpdates();
        this.dragAndDrop();
    },
    
    // Task filters component
    taskFilters: function() {
        const filterForm = document.querySelector('#task-filters');
        if (!filterForm) return;
        
        const inputs = filterForm.querySelectorAll('select, input');
        const debouncedSubmit = TaskManager.utils.debounce(function() {
            filterForm.submit();
        }, TaskManager.config.debounceDelay);
        
        inputs.forEach(function(input) {
            input.addEventListener('change', debouncedSubmit);
        });
    },
    
    // Quick actions component
    quickActions: function() {
        // Quick task status updates
        document.addEventListener('click', function(e) {
            if (e.target.matches('[data-quick-action]')) {
                e.preventDefault();
                const action = e.target.dataset.quickAction;
                const taskId = e.target.dataset.taskId;
                
                switch (action) {
                    case 'complete':
                        TaskManager.components.quickCompleteTask(taskId);
                        break;
                    case 'start':
                        TaskManager.components.quickStartTask(taskId);
                        break;
                    case 'archive':
                        TaskManager.components.quickArchiveTask(taskId);
                        break;
                }
            }
        });
    },
    
    // Quick complete task
    quickCompleteTask: function(taskId) {
        TaskManager.api.tasks.updateStatus(taskId, 'completed')
            .then(function() {
                TaskManager.utils.showNotification('Task marked as completed!', 'success');
                // Update UI
                const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
                if (taskElement) {
                    taskElement.classList.add('completed');
                }
            })
            .catch(function(error) {
                TaskManager.utils.showNotification('Failed to update task status', 'error');
                console.error('Error updating task:', error);
            });
    },
    
    // Quick start task
    quickStartTask: function(taskId) {
        TaskManager.api.tasks.updateStatus(taskId, 'in_progress')
            .then(function() {
                TaskManager.utils.showNotification('Task started!', 'info');
            })
            .catch(function(error) {
                TaskManager.utils.showNotification('Failed to start task', 'error');
                console.error('Error starting task:', error);
            });
    },
    
    // Auto-save functionality
    autoSave: function() {
        const forms = document.querySelectorAll('[data-auto-save]');
        
        forms.forEach(function(form) {
            const inputs = form.querySelectorAll('input, textarea, select');
            const debouncedSave = TaskManager.utils.debounce(function() {
                TaskManager.components.saveFormDraft(form);
            }, 2000);
            
            inputs.forEach(function(input) {
                input.addEventListener('input', debouncedSave);
            });
        });
    },
    
    // Save form draft
    saveFormDraft: function(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        const formId = form.id || form.action.split('/').pop();
        TaskManager.utils.storage.set(`draft_${formId}`, {
            data: data,
            timestamp: new Date().toISOString()
        });
        
        // Show subtle indicator
        const indicator = form.querySelector('.auto-save-indicator') || 
                         document.createElement('small');
        indicator.className = 'auto-save-indicator text-muted';
        indicator.textContent = 'Draft saved';
        
        if (!form.querySelector('.auto-save-indicator')) {
            form.appendChild(indicator);
        }
        
        // Hide indicator after 2 seconds
        setTimeout(function() {
            indicator.style.opacity = '0';
        }, 2000);
    },
    
    // Real-time updates
    realTimeUpdates: function() {
        // Simulate real-time updates (in a real app, use WebSockets)
        setInterval(function() {
            TaskManager.components.checkForUpdates();
        }, TaskManager.config.refreshInterval);
    },
    
    // Check for updates
    checkForUpdates: function() {
        // This would check for new data and update the UI
        // For now, we'll just refresh certain counters
        const badges = document.querySelectorAll('[data-live-count]');
        badges.forEach(function(badge) {
            const type = badge.dataset.liveCount;
            // In a real app, fetch updated counts from API
        });
    },
    
    // Drag and drop functionality
    dragAndDrop: function() {
        if (!('draggable' in document.createElement('div'))) return;
        
        const draggables = document.querySelectorAll('[draggable="true"]');
        const dropZones = document.querySelectorAll('[data-drop-zone]');
        
        draggables.forEach(function(draggable) {
            draggable.addEventListener('dragstart', function(e) {
                e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
                e.target.classList.add('dragging');
            });
            
            draggable.addEventListener('dragend', function(e) {
                e.target.classList.remove('dragging');
            });
        });
        
        dropZones.forEach(function(zone) {
            zone.addEventListener('dragover', function(e) {
                e.preventDefault();
                zone.classList.add('drag-over');
            });
            
            zone.addEventListener('dragleave', function(e) {
                zone.classList.remove('drag-over');
            });
            
            zone.addEventListener('drop', function(e) {
                e.preventDefault();
                zone.classList.remove('drag-over');
                
                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = zone.dataset.dropZone;
                
                TaskManager.api.tasks.updateStatus(taskId, newStatus)
                    .then(function() {
                        TaskManager.utils.showNotification('Task status updated!', 'success');
                        // Move element to new zone
                        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
                        if (taskElement) {
                            zone.appendChild(taskElement);
                        }
                    })
                    .catch(function(error) {
                        TaskManager.utils.showNotification('Failed to update task', 'error');
                        console.error('Error updating task:', error);
                    });
            });
        });
    }
};

// Event handling system
TaskManager.events = {
    init: function() {
        this.setupEventListeners();
    },
    
    setupEventListeners: function() {
        // Custom event listeners
        window.addEventListener('taskmanager:task:created', this.onTaskCreated);
        window.addEventListener('taskmanager:task:updated', this.onTaskUpdated);
        window.addEventListener('taskmanager:task:deleted', this.onTaskDeleted);
        window.addEventListener('taskmanager:project:created', this.onProjectCreated);
        window.addEventListener('taskmanager:project:updated', this.onProjectUpdated);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts);
    },
    
    // Event handlers
    onTaskCreated: function(event) {
        TaskManager.utils.showNotification('Task created successfully!', 'success');
        // Refresh relevant UI components
        TaskManager.components.checkForUpdates();
    },
    
    onTaskUpdated: function(event) {
        TaskManager.utils.showNotification('Task updated successfully!', 'success');
    },
    
    onTaskDeleted: function(event) {
        TaskManager.utils.showNotification('Task deleted successfully!', 'info');
    },
    
    onProjectCreated: function(event) {
        TaskManager.utils.showNotification('Project created successfully!', 'success');
    },
    
    onProjectUpdated: function(event) {
        TaskManager.utils.showNotification('Project updated successfully!', 'success');
    },
    
    // Keyboard shortcuts
    handleKeyboardShortcuts: function(event) {
        // Ctrl/Cmd + N: New task
        if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
            event.preventDefault();
            const newTaskBtn = document.querySelector('[href*="tasks/create"]');
            if (newTaskBtn) newTaskBtn.click();
        }
        
        // Ctrl/Cmd + P: New project
        if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
            event.preventDefault();
            const newProjectBtn = document.querySelector('[href*="projects/create"]');
            if (newProjectBtn) newProjectBtn.click();
        }
        
        // Escape: Close modals
        if (event.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal && typeof bootstrap !== 'undefined') {
                bootstrap.Modal.getInstance(openModal)?.hide();
            }
        }
    }
};

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        TaskManager.init();
    });
} else {
    TaskManager.init();
}

// Export for use in other scripts
window.TaskManager = TaskManager;