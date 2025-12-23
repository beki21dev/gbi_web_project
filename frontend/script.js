// Nexus To-Do List Application
document.addEventListener('DOMContentLoaded', function() {
    // Theme Toggle Functionality
    const themeToggle = document.getElementById('themeToggle');
    
    // Initialize theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    // Theme toggle event listener
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }
    
    // Update theme icon based on current theme
    function updateThemeIcon(theme) {
        if (!themeToggle) return;
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fas fa-moon';
        } else {
            icon.className = 'fas fa-sun';
        }
    }
    
    // Only run task management code if we're on the main app page
    if (document.getElementById('taskInput')) {
        initializeTaskManager();
    }
});

function initializeTaskManager() {
    // DOM Elements
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    const sortSelect = document.getElementById('sortSelect');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const editModal = document.getElementById('editModal');
    const editTaskInput = document.getElementById('editTaskInput');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const closeModalBtn = document.querySelector('#editModal .close-btn');
    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    const confirmOkBtn = document.getElementById('confirmOkBtn');
    const emptyState = document.getElementById('emptyState');
    const notificationToast = document.getElementById('notificationToast');
    const toastMessage = document.getElementById('toastMessage');
    
    // Statistics elements
    const totalTasksElement = document.getElementById('totalTasks');
    const completedTasksElement = document.getElementById('completedTasks');
    const pendingTasksElement = document.getElementById('pendingTasks');
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const visibleTasksElement = document.getElementById('visibleTasks');
    
    // Priority buttons
    const priorityButtons = document.querySelectorAll('.priority-btn');
    const editPriorityButtons = document.querySelectorAll('#editModal .priority-btn');
    
    // Task data
    let tasks = JSON.parse(localStorage.getItem('nexusTasks')) || [];
    let currentEditId = null;
    let currentPriority = 'medium';
    let currentEditPriority = 'medium';
    let confirmCallback = null;
    
    // Initialize the app
    initApp();
    
    // Initialize the application
    function initApp() {
        renderTasks();
        updateStatistics();
        
        // Event listeners
        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
        
        // Priority button listeners
        priorityButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                priorityButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentPriority = this.dataset.priority;
            });
        });
        
        if (editPriorityButtons.length > 0) {
            editPriorityButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    editPriorityButtons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentEditPriority = this.dataset.priority;
                });
            });
        }
        
        // Search and filter listeners
        searchInput.addEventListener('input', filterTasks);
        filterSelect.addEventListener('change', filterTasks);
        sortSelect.addEventListener('change', filterTasks);
        
        // Clear completed tasks
        clearCompletedBtn.addEventListener('click', () => {
            showConfirmModal('Are you sure you want to clear all completed tasks?', clearCompletedTasks);
        });
        
        // Modal event listeners
        if (saveEditBtn) saveEditBtn.addEventListener('click', saveEditedTask);
        if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeEditModal);
        
        // Confirm modal listeners
        if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', closeConfirmModal);
        if (confirmOkBtn) confirmOkBtn.addEventListener('click', executeConfirmedAction);
        
        // Close modals when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === editModal) closeEditModal();
            if (e.target === confirmModal) closeConfirmModal();
        });
        
        // Add some sample tasks if empty
        if (tasks.length === 0) {
            addSampleTasks();
        }
    }
    
    // Add sample tasks for demonstration
    function addSampleTasks() {
        const sampleTasks = [
            { text: 'Complete project proposal', priority: 'high' },
            { text: 'Buy groceries', priority: 'medium' },
            { text: 'Schedule dentist appointment', priority: 'low' },
            { text: 'Finish reading book', priority: 'low' },
            { text: 'Prepare presentation for meeting', priority: 'high' }
        ];
        
        sampleTasks.forEach(task => {
            const newTask = {
                id: Date.now() + Math.random(),
                text: task.text,
                priority: task.priority,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            tasks.push(newTask);
        });
        
        saveTasks();
        renderTasks();
        updateStatistics();
    }
    
    // Add a new task
    function addTask() {
        const taskText = taskInput.value.trim();
        
        if (taskText === '') {
            showNotification('Please enter a task!', 'warning');
            taskInput.focus();
            return;
        }
        
        const newTask = {
            id: Date.now(),
            text: taskText,
            priority: currentPriority,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        saveTasks();
        renderTasks();
        updateStatistics();
        
        // Clear input and show notification
        taskInput.value = '';
        showNotification('Task added successfully!', 'success');
        
        // Focus back on input
        taskInput.focus();
    }
    
    // Render tasks to the DOM
    function renderTasks(filteredTasks = tasks) {
        // Clear current task list
        taskList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            emptyState.style.display = 'block';
            visibleTasksElement.textContent = '0';
            return;
        }
        
        emptyState.style.display = 'none';
        visibleTasksElement.textContent = filteredTasks.length;
        
        // Sort tasks based on selected sort option
        const sortedTasks = sortTasks(filteredTasks);
        
        // Create task elements
        sortedTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }
    
    // Create a single task element
    function createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.dataset.id = task.id;
        
        // Format date
        const taskDate = new Date(task.createdAt);
        const formattedDate = taskDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: taskDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
        
        // Priority class
        const priorityClass = `priority-${task.priority}`;
        const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        
        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-text">${escapeHtml(task.text)}</div>
                <div class="task-meta">
                    <div class="task-priority ${priorityClass}">${priorityText}</div>
                    <div class="task-date">${formattedDate}</div>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-icon edit-btn" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete-btn" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add event listeners to the task elements
        const checkbox = taskItem.querySelector('.task-checkbox');
        const editBtn = taskItem.querySelector('.edit-btn');
        const deleteBtn = taskItem.querySelector('.delete-btn');
        
        checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
        editBtn.addEventListener('click', () => openEditModal(task.id));
        deleteBtn.addEventListener('click', () => {
            showConfirmModal('Are you sure you want to delete this task?', () => deleteTask(task.id));
        });
        
        return taskItem;
    }
    
    // Toggle task completion status
    function toggleTaskCompletion(id) {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            renderTasks();
            updateStatistics();
            
            const status = tasks[taskIndex].completed ? 'completed' : 'marked as active';
            showNotification(`Task ${status}!`, 'success');
        }
    }
    
    // Delete a task
    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateStatistics();
        showNotification('Task deleted successfully!', 'success');
        closeConfirmModal();
    }
    
    // Open edit modal
    function openEditModal(id) {
        const task = tasks.find(task => task.id === id);
        if (task) {
            currentEditId = id;
            currentEditPriority = task.priority;
            editTaskInput.value = task.text;
            
            // Set active priority button
            if (editPriorityButtons.length > 0) {
                editPriorityButtons.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.priority === task.priority) {
                        btn.classList.add('active');
                    }
                });
            }
            
            editModal.style.display = 'flex';
            editTaskInput.focus();
        }
    }
    
    // Save edited task
    function saveEditedTask() {
        const taskText = editTaskInput.value.trim();
        
        if (taskText === '') {
            showNotification('Task cannot be empty!', 'warning');
            editTaskInput.focus();
            return;
        }
        
        const taskIndex = tasks.findIndex(task => task.id === currentEditId);
        if (taskIndex !== -1) {
            tasks[taskIndex].text = taskText;
            tasks[taskIndex].priority = currentEditPriority;
            saveTasks();
            renderTasks();
            updateStatistics();
            closeEditModal();
            showNotification('Task updated successfully!', 'success');
        }
    }
    
    // Close edit modal
    function closeEditModal() {
        editModal.style.display = 'none';
        currentEditId = null;
        editTaskInput.value = '';
        currentEditPriority = 'medium';
    }
    
    // Show confirmation modal
    function showConfirmModal(message, callback) {
        confirmMessage.textContent = message;
        confirmModal.style.display = 'flex';
        
        // Store the callback to execute when confirmed
        confirmCallback = callback;
    }
    
    // Close confirmation modal
    function closeConfirmModal() {
        confirmModal.style.display = 'none';
        confirmCallback = null;
    }
    
    // Execute the confirmed action
    function executeConfirmedAction() {
        if (confirmCallback) {
            confirmCallback();
        }
        closeConfirmModal();
    }
    
    // Clear completed tasks
    function clearCompletedTasks() {
        const initialCount = tasks.length;
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateStatistics();
        
        const clearedCount = initialCount - tasks.length;
        showNotification(`${clearedCount} completed task${clearedCount !== 1 ? 's' : ''} cleared!`, 'success');
    }
    
    // Filter and sort tasks
    function filterTasks() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value;
        const sortValue = sortSelect.value;
        
        let filteredTasks = tasks;
        
        // Apply search filter
        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.text.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply status filter
        if (filterValue === 'active') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (filterValue === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        }
        
        // Apply sorting
        filteredTasks = sortTasks(filteredTasks, sortValue);
        
        renderTasks(filteredTasks);
    }
    
    // Sort tasks based on selected option
    function sortTasks(tasksToSort, sortBy = sortSelect.value) {
        const sortedTasks = [...tasksToSort];
        
        switch(sortBy) {
            case 'priority':
                // High > Medium > Low
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                sortedTasks.sort((a, b) => {
                    if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
                        return priorityOrder[b.priority] - priorityOrder[a.priority];
                    }
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
                break;
                
            case 'name':
                sortedTasks.sort((a, b) => a.text.localeCompare(b.text));
                break;
                
            case 'added':
            default:
                // Most recent first
                sortedTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }
        
        return sortedTasks;
    }
    
    // Update statistics
    function updateStatistics() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        totalTasksElement.textContent = total;
        completedTasksElement.textContent = completed;
        pendingTasksElement.textContent = pending;
        progressFill.style.width = `${progress}%`;
        progressPercent.textContent = `${progress}%`;
    }
    
    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('nexusTasks', JSON.stringify(tasks));
    }
    
    // Show notification toast
    function showNotification(message, type) {
        // Set icon based on type
        let icon = 'fa-check-circle';
        if (type === 'warning') icon = 'fa-exclamation-triangle';
        if (type === 'error') icon = 'fa-times-circle';
        
        toastMessage.textContent = message;
        notificationToast.querySelector('i').className = `fas ${icon}`;
        
        // Set color based on type
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
        const warningColor = '#ffaa00';
        const errorColor = '#ff4444';
        
        notificationToast.style.borderLeftColor = type === 'success' ? accentColor : 
                                                 type === 'warning' ? warningColor : errorColor;
        
        // Show toast
        notificationToast.classList.add('show');
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            notificationToast.classList.remove('show');
        }, 3000);
    }
    
    // Helper function to escape HTML (for security)
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}