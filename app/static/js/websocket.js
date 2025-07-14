/**
 * WebSocket Client for Real-time Task Management
 * Handles Socket.IO connection and real-time events
 */

// WebSocket connection manager
window.TaskManagerWebSocket = {
    socket: null,
    isConnected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    currentProjectId: null,
    onlineUsers: new Map(),
    typingUsers: new Map(),
    
    // Configuration
    config: {
        autoReconnect: true,
        heartbeatInterval: 30000, // 30 seconds
        typingTimeout: 3000, // 3 seconds
        notificationTimeout: 5000 // 5 seconds
    },
    
    // Event handlers
    handlers: {
        taskCreated: [],
        taskUpdated: [],
        taskDeleted: [],
        taskStatusChanged: [],
        commentAdded: [],
        projectUpdated: [],
        userConnected: [],
        userDisconnected: [],
        notification: [],
        userTyping: []
    },
    
    // Initialize WebSocket connection
    init: function(options = {}) {
        console.log('Initializing WebSocket connection...');
        
        // Merge options with defaults
        Object.assign(this.config, options);
        
        // Get authentication token
        const token = this.getAuthToken();
        
        // Create Socket.IO connection
        this.socket = io({
            query: {
                token: token
            },
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: true
        });
        
        this.setupEventListeners();
        this.startHeartbeat();
        
        return this;
    },
    
    // Get authentication token
    getAuthToken: function() {
        // Try to get from localStorage first
        let token = localStorage.getItem('taskmanager_auth_token');
        
        // If not found, try to get from session/cookie
        if (!token) {
            // For session-based auth, we'll rely on cookies
            // The server will handle authentication via session
            token = null;
        }
        
        return token;
    },
    
    // Setup Socket.IO event listeners
    setupEventListeners: function() {
        const self = this;
        
        // Connection events
        this.socket.on('connect', function() {
            console.log('WebSocket connected');
            self.isConnected = true;
            self.reconnectAttempts = 0;
            self.onConnected();
        });
        
        this.socket.on('disconnect', function(reason) {
            console.log('WebSocket disconnected:', reason);
            self.isConnected = false;
            self.onDisconnected(reason);
            
            if (self.config.autoReconnect && reason !== 'io client disconnect') {
                self.attemptReconnect();
            }
        });
        
        this.socket.on('connect_error', function(error) {
            console.error('WebSocket connection error:', error);
            self.onConnectionError(error);
        });
        
        // Authentication events
        this.socket.on('connected', function(data) {
            console.log('Authentication successful:', data);
            self.showNotification('Connected to real-time updates', 'success');
        });
        
        this.socket.on('error', function(data) {
            console.error('WebSocket error:', data);
            self.showNotification(data.message || 'WebSocket error occurred', 'error');
        });
        
        // Task events
        this.socket.on('task_created', function(data) {
            console.log('Task created:', data);
            self.triggerHandlers('taskCreated', data);
            self.handleTaskCreated(data);
        });
        
        this.socket.on('task_updated', function(data) {
            console.log('Task updated:', data);
            self.triggerHandlers('taskUpdated', data);
            self.handleTaskUpdated(data);
        });
        
        this.socket.on('task_deleted', function(data) {
            console.log('Task deleted:', data);
            self.triggerHandlers('taskDeleted', data);
            self.handleTaskDeleted(data);
        });
        
        this.socket.on('task_status_changed', function(data) {
            console.log('Task status changed:', data);
            self.triggerHandlers('taskStatusChanged', data);
            self.handleTaskStatusChanged(data);
        });
        
        // Comment events
        this.socket.on('comment_added', function(data) {
            console.log('Comment added:', data);
            self.triggerHandlers('commentAdded', data);
            self.handleCommentAdded(data);
        });
        
        // Project events
        this.socket.on('project_updated', function(data) {
            console.log('Project updated:', data);
            self.triggerHandlers('projectUpdated', data);
            self.handleProjectUpdated(data);
        });
        
        // User presence events
        this.socket.on('user_connected', function(data) {
            console.log('User connected:', data);
            self.onlineUsers.set(data.user_id, data);
            self.triggerHandlers('userConnected', data);
            self.updateOnlineUsersDisplay();
        });
        
        this.socket.on('user_disconnected', function(data) {
            console.log('User disconnected:', data);
            self.onlineUsers.delete(data.user_id);
            self.triggerHandlers('userDisconnected', data);
            self.updateOnlineUsersDisplay();
        });
        
        this.socket.on('online_users', function(data) {
            console.log('Online users:', data);
            self.onlineUsers.clear();
            data.users.forEach(function(user) {
                self.onlineUsers.set(user.user_id, user);
            });
            self.updateOnlineUsersDisplay();
        });
        
        // Typing indicators
        this.socket.on('user_typing', function(data) {
            console.log('User typing:', data);
            self.handleUserTyping(data);
            self.triggerHandlers('userTyping', data);
        });
        
        // Notifications
        this.socket.on('notification', function(data) {
            console.log('Notification:', data);
            self.triggerHandlers('notification', data);
            self.handleNotification(data);
        });
        
        // Heartbeat
        this.socket.on('pong', function(data) {
            // Server responded to ping
        });
    },
    
    // Connection established
    onConnected: function() {
        this.emit('get_online_users', { project_id: this.currentProjectId });
    },
    
    // Connection lost
    onDisconnected: function(reason) {
        this.onlineUsers.clear();
        this.updateOnlineUsersDisplay();
    },
    
    // Connection error
    onConnectionError: function(error) {
        this.showNotification('Connection error. Retrying...', 'warning');
    },
    
    // Attempt to reconnect
    attemptReconnect: function() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnection attempts reached');
            this.showNotification('Unable to connect. Please refresh the page.', 'error');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.socket.connect();
            }
        }, delay);
    },
    
    // Start heartbeat to keep connection alive
    startHeartbeat: function() {
        setInterval(() => {
            if (this.isConnected) {
                this.socket.emit('ping');
            }
        }, this.config.heartbeatInterval);
    },
    
    // Join a project room
    joinProject: function(projectId) {
        if (!this.isConnected) {
            console.warn('Cannot join project: not connected');
            return;
        }
        
        this.currentProjectId = projectId;
        this.socket.emit('join_project', { project_id: projectId });
        console.log(`Joining project ${projectId}`);
    },
    
    // Leave a project room
    leaveProject: function(projectId) {
        if (!this.isConnected) {
            return;
        }
        
        this.socket.emit('leave_project', { project_id: projectId });
        
        if (this.currentProjectId === projectId) {
            this.currentProjectId = null;
        }
    },
    
    // Emit event to server
    emit: function(event, data) {
        if (!this.isConnected) {
            console.warn(`Cannot emit ${event}: not connected`);
            return;
        }
        
        this.socket.emit(event, data);
    },
    
    // Register event handler
    on: function(event, handler) {
        if (this.handlers[event]) {
            this.handlers[event].push(handler);
        }
    },
    
    // Remove event handler
    off: function(event, handler) {
        if (this.handlers[event]) {
            const index = this.handlers[event].indexOf(handler);
            if (index > -1) {
                this.handlers[event].splice(index, 1);
            }
        }
    },
    
    // Trigger event handlers
    triggerHandlers: function(event, data) {
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
    
    // Handle task created
    handleTaskCreated: function(data) {
        // Update UI if on tasks list page
        if (window.location.pathname.includes('/tasks')) {
            this.addTaskToList(data.task);
        }
        
        // Show notification if not created by current user
        const currentUserId = this.getCurrentUserId();
        if (data.created_by.id !== currentUserId) {
            this.showNotification(
                `New task "${data.task.title}" created by ${data.created_by.full_name}`,
                'info'
            );
        }
    },
    
    // Handle task updated
    handleTaskUpdated: function(data) {
        // Update task in lists and detail views
        this.updateTaskInUI(data.task);
        
        // Show notification if not updated by current user
        const currentUserId = this.getCurrentUserId();
        if (data.updated_by.id !== currentUserId) {
            this.showNotification(
                `Task "${data.task.title}" updated by ${data.updated_by.full_name}`,
                'info'
            );
        }
    },
    
    // Handle task deleted
    handleTaskDeleted: function(data) {
        // Remove task from UI
        this.removeTaskFromUI(data.task_id);
        
        // Show notification if not deleted by current user
        const currentUserId = this.getCurrentUserId();
        if (data.deleted_by.id !== currentUserId) {
            this.showNotification(
                `Task "${data.task_title}" deleted by ${data.deleted_by.full_name}`,
                'warning'
            );
        }
    },
    
    // Handle task status changed
    handleTaskStatusChanged: function(data) {
        // Update task status in UI
        this.updateTaskStatus(data.task_id, data.new_status);
        
        // Show notification if not changed by current user
        const currentUserId = this.getCurrentUserId();
        if (data.changed_by.id !== currentUserId) {
            this.showNotification(
                `${data.changed_by.full_name} changed "${data.task_title}" status to ${data.new_status}`,
                'info'
            );
        }
    },
    
    // Handle comment added
    handleCommentAdded: function(data) {
        // Add comment to task detail view if viewing the task
        if (window.location.pathname.includes(`/tasks/${data.comment.task_id}`)) {
            this.addCommentToTask(data.comment);
        }
        
        // Show notification
        const currentUserId = this.getCurrentUserId();
        if (data.comment.user_id !== currentUserId) {
            this.showNotification(
                `${data.comment.author_name} commented on "${data.task.title}"`,
                'info'
            );
        }
    },
    
    // Handle project updated
    handleProjectUpdated: function(data) {
        // Update project in UI
        this.updateProjectInUI(data.project);
        
        // Show notification if not updated by current user
        const currentUserId = this.getCurrentUserId();
        if (data.updated_by.id !== currentUserId) {
            this.showNotification(
                `Project "${data.project.name}" updated by ${data.updated_by.full_name}`,
                'info'
            );
        }
    },
    
    // Handle user typing
    handleUserTyping: function(data) {
        const taskId = data.task_id;
        
        if (data.is_typing) {
            this.typingUsers.set(data.user_id, {
                ...data,
                timeout: setTimeout(() => {
                    this.typingUsers.delete(data.user_id);
                    this.updateTypingIndicator(taskId);
                }, this.config.typingTimeout)
            });
        } else {
            const typingUser = this.typingUsers.get(data.user_id);
            if (typingUser) {
                clearTimeout(typingUser.timeout);
                this.typingUsers.delete(data.user_id);
            }
        }
        
        this.updateTypingIndicator(taskId);
    },
    
    // Handle notification
    handleNotification: function(data) {
        this.showNotification(data.message, data.type, this.config.notificationTimeout);
    },
    
    // Update typing indicator
    updateTypingIndicator: function(taskId) {
        const typingIndicator = document.querySelector(`#typing-indicator-${taskId}`);
        if (!typingIndicator) return;
        
        const typingUsers = Array.from(this.typingUsers.values())
            .filter(user => user.task_id == taskId);
        
        if (typingUsers.length === 0) {
            typingIndicator.style.display = 'none';
        } else {
            const names = typingUsers.map(user => user.full_name);
            let text;
            
            if (names.length === 1) {
                text = `${names[0]} is typing...`;
            } else if (names.length === 2) {
                text = `${names[0]} and ${names[1]} are typing...`;
            } else {
                text = `${names[0]} and ${names.length - 1} others are typing...`;
            }
            
            typingIndicator.textContent = text;
            typingIndicator.style.display = 'block';
        }
    },
    
    // Update online users display
    updateOnlineUsersDisplay: function() {
        const onlineUsersContainer = document.querySelector('#online-users');
        if (!onlineUsersContainer) return;
        
        const users = Array.from(this.onlineUsers.values());
        
        // Update count
        const countElement = document.querySelector('#online-users-count');
        if (countElement) {
            countElement.textContent = users.length;
        }
        
        // Update list
        onlineUsersContainer.innerHTML = users.map(user => `
            <div class="online-user" data-user-id="${user.user_id}">
                <div class="user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="user-info">
                    <strong>${user.full_name}</strong>
                    <small class="text-muted">@${user.username}</small>
                </div>
                <div class="online-indicator"></div>
            </div>
        `).join('');
    },
    
    // UI update methods
    addTaskToList: function(task) {
        // Implementation depends on your task list structure
        // This is a placeholder for the actual implementation
        console.log('Adding task to list:', task);
    },
    
    updateTaskInUI: function(task) {
        // Update task cards/rows in lists and detail views
        const taskElements = document.querySelectorAll(`[data-task-id="${task.id}"]`);
        taskElements.forEach(element => {
            // Update task information
            const titleElement = element.querySelector('.task-title');
            if (titleElement) {
                titleElement.textContent = task.title;
            }
            
            const statusElement = element.querySelector('.task-status');
            if (statusElement) {
                statusElement.className = `task-status badge bg-${this.getStatusClass(task.status)}`;
                statusElement.textContent = task.status.replace('_', ' ').toUpperCase();
            }
            
            const priorityElement = element.querySelector('.task-priority');
            if (priorityElement) {
                priorityElement.className = `task-priority badge bg-${this.getPriorityClass(task.priority)}`;
                priorityElement.textContent = task.priority.toUpperCase();
            }
        });
    },
    
    removeTaskFromUI: function(taskId) {
        const taskElements = document.querySelectorAll(`[data-task-id="${taskId}"]`);
        taskElements.forEach(element => {
            element.remove();
        });
    },
    
    updateTaskStatus: function(taskId, status) {
        const statusElements = document.querySelectorAll(`[data-task-id="${taskId}"] .task-status`);
        statusElements.forEach(element => {
            element.className = `task-status badge bg-${this.getStatusClass(status)}`;
            element.textContent = status.replace('_', ' ').toUpperCase();
        });
    },
    
    addCommentToTask: function(comment) {
        const commentsContainer = document.querySelector('#comments-list');
        if (!commentsContainer) return;
        
        const commentHtml = `
            <div class="comment" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <strong>${comment.author_name}</strong>
                    <small class="text-muted">${new Date(comment.created_at).toLocaleString()}</small>
                </div>
                <div class="comment-body">
                    ${comment.comment_text}
                </div>
            </div>
        `;
        
        commentsContainer.insertAdjacentHTML('beforeend', commentHtml);
    },
    
    updateProjectInUI: function(project) {
        // Update project information in UI
        const projectElements = document.querySelectorAll(`[data-project-id="${project.id}"]`);
        projectElements.forEach(element => {
            const nameElement = element.querySelector('.project-name');
            if (nameElement) {
                nameElement.textContent = project.name;
            }
            
            const descriptionElement = element.querySelector('.project-description');
            if (descriptionElement) {
                descriptionElement.textContent = project.description;
            }
        });
    },
    
    // Utility methods
    getCurrentUserId: function() {
        // Get current user ID from session or localStorage
        return TaskManager.utils.storage.get('current_user_id') || 
               window.currentUserId || 
               null;
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
    
    getPriorityClass: function(priority) {
        const priorityClasses = {
            'low': 'secondary',
            'medium': 'primary',
            'high': 'warning',
            'critical': 'danger'
        };
        return priorityClasses[priority] || 'secondary';
    },
    
    showNotification: function(message, type = 'info', duration = 5000) {
        // Use existing notification system or create one
        if (typeof TaskManager !== 'undefined' && TaskManager.utils && TaskManager.utils.showNotification) {
            TaskManager.utils.showNotification(message, type, duration);
        } else {
            console.log(`Notification [${type}]: ${message}`);
        }
    },
    
    // Send typing indicator
    sendTypingIndicator: function(taskId, isTyping) {
        this.emit('user_typing', {
            task_id: taskId,
            is_typing: isTyping
        });
    },
    
    // Disconnect WebSocket
    disconnect: function() {
        if (this.socket) {
            this.socket.disconnect();
            this.isConnected = false;
        }
    }
};

// Auto-initialize if Socket.IO is available
if (typeof io !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize WebSocket connection
        TaskManagerWebSocket.init();
        
        // Join project room if on project-specific page
        const projectId = window.currentProjectId || 
                         document.querySelector('[data-project-id]')?.dataset.projectId;
        
        if (projectId) {
            TaskManagerWebSocket.joinProject(projectId);
        }
        
        // Setup typing indicators for comment forms
        const commentTextareas = document.querySelectorAll('textarea[name="comment_text"]');
        commentTextareas.forEach(textarea => {
            let typingTimeout;
            const taskId = textarea.closest('form')?.querySelector('[name="task_id"]')?.value ||
                          window.location.pathname.match(/\/tasks\/(\d+)/)?.[1];
            
            if (!taskId) return;
            
            textarea.addEventListener('input', function() {
                TaskManagerWebSocket.sendTypingIndicator(taskId, true);
                
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    TaskManagerWebSocket.sendTypingIndicator(taskId, false);
                }, 3000);
            });
            
            textarea.addEventListener('blur', function() {
                clearTimeout(typingTimeout);
                TaskManagerWebSocket.sendTypingIndicator(taskId, false);
            });
        });
    });
}

// Export for use in other scripts
window.TaskManagerWebSocket = TaskManagerWebSocket;