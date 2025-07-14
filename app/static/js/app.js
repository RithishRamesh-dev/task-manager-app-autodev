/**
 * Task Manager Application JavaScript with WebSocket Integration
 * Main application functionality and utilities
 */

// Global application object with WebSocket support
window.TaskManager = {
    // Configuration
    config: {
        apiBaseUrl: '/api',
        refreshInterval: 30000, // 30 seconds
        animationDuration: 300,
        debounceDelay: 500,
        maxRetries: 3,
        websocketEnabled: true
    },
    
    // Utilities
    utils: {},
    
    // Components
    components: {},
    
    // API methods
    api: {},
    
    // Event handlers
    events: {},
    
    // WebSocket integration
    websocket: null,
    
    // Initialize application
    init: function() {
        this.utils.init();
        this.api.init();
        this.events.init();
        this.components.init();
        
        // Initialize WebSocket if enabled and available
        if (this.config.websocketEnabled && typeof TaskManagerWebSocket !== 'undefined') {
            this.initWebSocket();
        }
        
        console.log('Task Manager application initialized with WebSocket support');
    },
    
    // Initialize WebSocket integration
    initWebSocket: function() {
        this.websocket = TaskManagerWebSocket;
        
        // Register WebSocket event handlers
        this.websocket.on('taskCreated', this.onTaskCreated.bind(this));
        this.websocket.on('taskUpdated', this.onTaskUpdated.bind(this));
        this.websocket.on('taskDeleted', this.onTaskDeleted.bind(this));
        this.websocket.on('taskStatusChanged', this.onTaskStatusChanged.bind(this));
        this.websocket.on('commentAdded', this.onCommentAdded.bind(this));
        this.websocket.on('projectUpdated', this.onProjectUpdated.bind(this));
        this.websocket.on('notification', this.onWebSocketNotification.bind(this));
        this.websocket.on('userConnected', this.onUserConnected.bind(this));
        this.websocket.on('userDisconnected', this.onUserDisconnected.bind(this));
        
        console.log('WebSocket event handlers registered');
    },
    
    // WebSocket event handlers
    onTaskCreated: function(data) {
        // Refresh task-related UI components
        this.components.refreshTaskList();
        this.components.updateDashboardStats();
        
        // Emit custom event for other components
        this.events.emit('taskCreated', data);
    },
    
    onTaskUpdated: function(data) {
        // Update task in UI
        this.components.updateTaskInUI(data.task);
        this.components.updateDashboardStats();
        
        // Emit custom event
        this.events.emit('taskUpdated', data);
    },
    
    onTaskDeleted: function(data) {
        // Remove task from UI
        this.components.removeTaskFromUI(data.task_id);
        this.components.updateDashboardStats();
        
        // Emit custom event
        this.events.emit('taskDeleted', data);
    },
    
    onTaskStatusChanged: function(data) {
        // Update task status in UI
        this.components.updateTaskStatus(data.task_id, data.new_status);
        this.components.updateDashboardStats();
        
        // Emit custom event
        this.events.emit('taskStatusChanged', data);
    },
    
    onCommentAdded: function(data) {
        // Add comment to UI if viewing the task
        this.components.addCommentToTask(data.comment);
        
        // Emit custom event
        this.events.emit('commentAdded', data);
    },
    
    onProjectUpdated: function(data) {
        // Update project in UI
        this.components.updateProjectInUI(data.project);
        
        // Emit custom event
        this.events.emit('projectUpdated', data);
    },
    
    onWebSocketNotification: function(data) {
        // Show notification
        this.utils.showNotification(data.message, data.type);
    },
    
    onUserConnected: function(data) {
        console.log(`User ${data.full_name} connected`);
    },
    
    onUserDisconnected: function(data) {
        console.log(`User ${data.full_name} disconnected`);
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
                
                // Emit WebSocket events for real-time updates
                TaskManager.utils.handleFormSubmissionWebSocket(form);
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
        
        // Handle page visibility changes for WebSocket optimization
        document.addEventListener('visibilitychange', function() {
            if (TaskManager.websocket) {
                if (document.hidden) {
                    // Page is hidden, reduce WebSocket activity
                    console.log('Page hidden, reducing WebSocket activity');
                } else {
                    // Page is visible, resume normal WebSocket activity
                    console.log('Page visible, resuming WebSocket activity');
                    TaskManager.websocket.emit('get_online_users', { 
                        project_id: TaskManager.websocket.currentProjectId 
                    });
                }
            }
        });
    },
    
    // Handle form submission WebSocket events
    handleFormSubmissionWebSocket: function(form) {
        if (!TaskManager.websocket || !TaskManager.websocket.isConnected) {
            return;
        }
        
        const action = form.action;
        const method = form.method.toLowerCase();
        
        // Task creation form
        if (action.includes('/tasks') && method === 'post' && !action.includes('/comments')) {
            form.addEventListener('submit', function() {
                setTimeout(function() {
                    const titleInput = form.querySelector('[name="title"]');
                    const projectInput = form.querySelector('[name="project_id"]');
                    
                    if (titleInput && projectInput && titleInput.value && projectInput.value) {
                        // This will be triggered after successful form submission
                        // The actual WebSocket event will be emitted from the server
                    }
                }, 100);
            });
        }
        
        // Comment form
        if (action.includes('/comments') && method === 'post') {
            form.addEventListener('submit', function() {
                setTimeout(function() {
                    const commentInput = form.querySelector('[name="comment_text"]');
                    const taskId = window.location.pathname.match(/\/tasks\/(\d+)/)?.[1];
                    
                    if (commentInput && taskId && commentInput.value.trim()) {
                        // WebSocket event will be emitted from server after successful comment creation
                    }
                }, 100);
            });
        }
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
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed notification-toast`;
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
        
        // Hide/show online users widget on mobile
        const onlineUsersWidget = document.querySelector('#online-users-widget');
        if (onlineUsersWidget) {
            onlineUsersWidget.style.display = isMobile ? 'none' : 'block';
        }
        
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

// Enhanced Component system with WebSocket integration
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
        this.typingIndicators();
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
    
    // Quick complete task with WebSocket notification
    quickCompleteTask: function(taskId) {
        const oldStatus = this.getTaskStatus(taskId);
        
        TaskManager.api.tasks.updateStatus(taskId, 'completed')
            .then(function(response) {
                TaskManager.utils.showNotification('Task marked as completed!', 'success');
                
                // Emit WebSocket event
                if (TaskManager.websocket && TaskManager.websocket.isConnected) {
                    TaskManager.websocket.emit('task_status_changed', {
                        task_id: taskId,
                        old_status: oldStatus,
                        new_status: 'completed'
                    });
                }
                
                // Update UI
                TaskManager.components.updateTaskStatus(taskId, 'completed');
            })
            .catch(function(error) {
                TaskManager.utils.showNotification('Failed to update task status', 'error');
                console.error('Error updating task:', error);
            });
    },
    
    // Get current task status
    getTaskStatus: function(taskId) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        const statusElement = taskElement?.querySelector('.task-status');
        return statusElement?.dataset.status || 'pending';
    },
    
    // Typing indicators for comment forms
    typingIndicators: function() {
        const commentForms = document.querySelectorAll('form[action*="comments"]');
        
        commentForms.forEach(function(form) {
            const textarea = form.querySelector('textarea[name="comment_text"]');
            const taskId = window.location.pathname.match(/\/tasks\/(\d+)/)?.[1];
            
            if (!textarea || !taskId) return;
            
            let typingTimeout;
            
            textarea.addEventListener('input', function() {
                if (TaskManager.websocket && TaskManager.websocket.isConnected) {
                    TaskManager.websocket.sendTypingIndicator(taskId, true);
                }
                
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(function() {
                    if (TaskManager.websocket && TaskManager.websocket.isConnected) {
                        TaskManager.websocket.sendTypingIndicator(taskId, false);
                    }
                }, 3000);
            });
            
            textarea.addEventListener('blur', function() {
                clearTimeout(typingTimeout);
                if (TaskManager.websocket && TaskManager.websocket.isConnected) {
                    TaskManager.websocket.sendTypingIndicator(taskId, false);
                }
            });
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
    
    // Real-time updates enhanced with WebSocket
    realTimeUpdates: function() {
        // Traditional polling as fallback when WebSocket is not available
        if (!TaskManager.websocket || !TaskManager.websocket.isConnected) {
            setInterval(function() {
                TaskManager.components.checkForUpdates();
            }, TaskManager.config.refreshInterval);
        }
    },
    
    // Check for updates (fallback method)
    checkForUpdates: function() {
        const badges = document.querySelectorAll('[data-live-count]');
        badges.forEach(function(badge) {
            const type = badge.dataset.liveCount;
            // In a real app, fetch updated counts from API
        });
    },
    
    // Update task status in UI
    updateTaskStatus: function(taskId, status) {
        const taskElements = document.querySelectorAll(`[data-task-id="${taskId}"]`);
        taskElements.forEach(function(element) {
            const statusElement = element.querySelector('.task-status');
            if (statusElement) {
                statusElement.className = `task-status badge bg-${TaskManager.components.getStatusClass(status)}`;
                statusElement.textContent = status.replace('_', ' ').toUpperCase();
                statusElement.dataset.status = status;
            }
        });
    },
    
    // Refresh dashboard statistics
    updateDashboardStats: function() {
        // Update dashboard statistics if on dashboard page
        if (window.location.pathname.includes('/dashboard')) {
            // This would typically fetch updated stats from API
            console.log('Updating dashboard statistics');
        }
    },
    
    // Utility methods for WebSocket integration
    refreshTaskList: function() {
        if (window.location.pathname.includes('/tasks')) {
            // Refresh task list without full page reload
            console.log('Refreshing task list');
        }
    },
    
    updateTaskInUI: function(task) {
        console.log('Updating task in UI:', task);
        // Implementation would update task information in the UI
    },
    
    removeTaskFromUI: function(taskId) {
        const taskElements = document.querySelectorAll(`[data-task-id="${taskId}"]`);
        taskElements.forEach(function(element) {
            element.remove();
        });
    },
    
    addCommentToTask: function(comment) {
        console.log('Adding comment to task:', comment);
        // Implementation would add comment to task detail view
    },
    
    updateProjectInUI: function(project) {
        console.log('Updating project in UI:', project);
        // Implementation would update project information in the UI
    },
    
    getStatusClass: function(status) {
        const statusClasses = {
            'pending': 'light',
            'in_progress': 'info',
            'completed': 'success',
            'cancelled': 'dark'
        };
        return statusClasses[status] || 'secondary';
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
                const oldStatus = TaskManager.components.getTaskStatus(taskId);
                
                TaskManager.api.tasks.updateStatus(taskId, newStatus)
                    .then(function() {
                        TaskManager.utils.showNotification('Task status updated!', 'success');
                        
                        // Emit WebSocket event
                        if (TaskManager.websocket && TaskManager.websocket.isConnected) {
                            TaskManager.websocket.emit('task_status_changed', {
                                task_id: taskId,
                                old_status: oldStatus,
                                new_status: newStatus
                            });
                        }
                        
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

// Enhanced Event handling system
TaskManager.events = {
    handlers: {},
    
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
    
    // Custom event system
    on: function(event, handler) {
        if (!this.handlers[event]) {
            this.handlers[event] = [];
        }
        this.handlers[event].push(handler);
    },
    
    off: function(event, handler) {
        if (this.handlers[event]) {
            const index = this.handlers[event].indexOf(handler);
            if (index > -1) {
                this.handlers[event].splice(index, 1);
            }
        }
    },
    
    emit: function(event, data) {
        if (this.handlers[event]) {
            this.handlers[event].forEach(function(handler) {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in ${event} handler:`, error);
                }
            });
        }
    },
    
    // Event handlers
    onTaskCreated: function(event) {
        TaskManager.utils.showNotification('Task created successfully!', 'success');
        TaskManager.components.updateDashboardStats();
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

// Basic API utilities (placeholder for full implementation)
TaskManager.api = {
    init: function() {
        // API initialization
    },
    
    tasks: {
        updateStatus: function(id, status) {
            return fetch(`/api/tasks/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: status })
            }).then(response => response.json());
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