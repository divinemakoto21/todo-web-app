/**
 * TaskFlow Pro - Application Logic (frontend/js/app.js)
 * University Project Task Management Frontend
 * 
 * Works in tandem with TaskAPI (js/api.js) to manage tasks in-memory.
 * Zero usage of localStorage/sessionStorage.
 * Structured for smooth transition to a Python FastAPI backend with SQLite.
 */

// Retrieve API Service from global scope (set in api.js)
const TaskAPI = window.TaskAPI;
const API_CONFIG = window.API_CONFIG;

// Application State
const state = {
  tasks: [],
  filterStatus: 'all',     // 'all' | 'pending' | 'completed'
  filterPriority: 'all',   // 'all' | 'high' | 'medium' | 'low'
  searchQuery: '',
  sortBy: 'created_desc',
  taskPendingDelete: null,
  isLoading: false
};

// DOM Elements Cache
const DOM = {
  // Stats & Progress (Feature 8)
  statTotalCount: document.getElementById('statTotalCount'),
  statPendingCount: document.getElementById('statPendingCount'),
  statCompletedCount: document.getElementById('statCompletedCount'),
  statCompletionRate: document.getElementById('statCompletionRate'),
  statProgressBar: document.getElementById('statProgressBar'),
  statProgressBarTrack: document.getElementById('statProgressBarTrack'),

  // Form Elements (Feature 1, 5, 6)
  taskForm: document.getElementById('taskForm'),
  taskTitle: document.getElementById('taskTitle'),
  titleError: document.getElementById('titleError'),
  taskDescription: document.getElementById('taskDescription'),
  descCharCount: document.getElementById('descCharCount'),
  priorityRadios: document.querySelectorAll('input[name="priority"]'),
  taskDueDate: document.getElementById('taskDueDate'),
  clearDateBtn: document.getElementById('clearDateBtn'),
  quickDateBtns: document.querySelectorAll('.btn-quick-date[data-days]'),
  submitTaskBtn: document.getElementById('submitTaskBtn'),

  // Filters & Controls (Feature 7)
  filterTabs: document.querySelectorAll('.filter-tab'),
  tabCountAll: document.getElementById('tabCountAll'),
  tabCountPending: document.getElementById('tabCountPending'),
  tabCountCompleted: document.getElementById('tabCountCompleted'),
  searchInput: document.getElementById('searchInput'),
  searchClearBtn: document.getElementById('searchClearBtn'),
  priorityFilterSelect: document.getElementById('priorityFilterSelect'),
  sortBySelect: document.getElementById('sortBySelect'),
  filterStatusBar: document.getElementById('filterStatusBar'),
  filterStatusText: document.getElementById('filterStatusText'),
  resetFiltersBtn: document.getElementById('resetFiltersBtn'),

  // Task List & Empty State (Feature 2)
  taskList: document.getElementById('taskList'),
  emptyState: document.getElementById('emptyState'),
  emptyStateTitle: document.getElementById('emptyStateTitle'),
  emptyStateDesc: document.getElementById('emptyStateDesc'),
  taskCountSummary: document.getElementById('taskCountSummary'),

  // Header & Modals
  headerDateText: document.getElementById('headerDateText'),
  backendStatusText: document.getElementById('backendStatusText'),
  openApiModalBtn: document.getElementById('openApiModalBtn'),
  apiModal: document.getElementById('apiModal'),
  closeApiModalBtn: document.getElementById('closeApiModalBtn'),
  confirmModalCloseBtn: document.getElementById('confirmModalCloseBtn'),
  deleteModal: document.getElementById('deleteModal'),
  closeDeleteModalBtn: document.getElementById('closeDeleteModalBtn'),
  cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
  confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
  deleteTaskTitlePreview: document.getElementById('deleteTaskTitlePreview'),
  toastContainer: document.getElementById('toastContainer')
};

/* ==========================================================================
   Initialization
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  initializeDateDisplay();
  setupEventListeners();
  await checkBackendStatus();
  await loadTasks();
});

/**
 * Check whether FastAPI backend & SQLite database are reachable
 */
async function checkBackendStatus() {
  const dot = document.querySelector('.status-dot');
  try {
    const health = await TaskAPI.checkBackendHealth();
    if (health.connected) {
      if (dot) {
        dot.classList.remove('disconnected');
        dot.classList.add('connected');
      }
      if (DOM.backendStatusText) {
        DOM.backendStatusText.textContent = "FastAPI + SQLite (Live)";
      }
    } else {
      if (dot) {
        dot.classList.remove('connected');
        dot.classList.add('disconnected');
      }
      if (DOM.backendStatusText) {
        DOM.backendStatusText.textContent = "In-Memory Mode (Offline)";
      }
    }
  } catch {
    if (dot) {
      dot.classList.remove('connected');
      dot.classList.add('disconnected');
    }
    if (DOM.backendStatusText) {
      DOM.backendStatusText.textContent = "In-Memory Mode (Offline)";
    }
  }
}

/**
 * Display today's human-readable date in the header
 */
function initializeDateDisplay() {
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  const todayFormatted = new Date().toLocaleDateString('en-US', options);
  if (DOM.headerDateText) {
    DOM.headerDateText.textContent = todayFormatted;
  }
}

/**
 * Register all user interaction event listeners
 */
function setupEventListeners() {
  // Form submission (Feature 1, 5, 6)
  DOM.taskForm.addEventListener('submit', handleTaskSubmit);

  // Description character count indicator
  DOM.taskDescription.addEventListener('input', (e) => {
    DOM.descCharCount.textContent = `${e.target.value.length}/500`;
  });

  // Clear title validation error state upon typing
  DOM.taskTitle.addEventListener('input', () => {
    DOM.titleError.classList.remove('visible');
    DOM.taskTitle.classList.remove('input-invalid');
  });

  // Quick Date presets ("Today", "Tomorrow", "+1 Week")
  DOM.quickDateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const days = parseInt(btn.dataset.days, 10);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      DOM.taskDueDate.value = targetDate.toISOString().split('T')[0];
    });
  });

  // Clear Due Date button
  DOM.clearDateBtn.addEventListener('click', () => {
    DOM.taskDueDate.value = '';
  });

  // Filter Tabs (Feature 7: All, Pending, Completed)
  DOM.filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      DOM.filterTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      state.filterStatus = tab.dataset.filter;
      renderTasks();
    });
  });

  // Priority Filter Dropdown (Feature 5, 7)
  DOM.priorityFilterSelect.addEventListener('change', (e) => {
    state.filterPriority = e.target.value;
    renderTasks();
  });

  // Sort Order Dropdown
  DOM.sortBySelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    renderTasks();
  });

  // Real-time Search Input
  DOM.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    DOM.searchClearBtn.style.display = state.searchQuery ? 'block' : 'none';
    renderTasks();
  });

  // Clear Search Button
  DOM.searchClearBtn.addEventListener('click', () => {
    DOM.searchInput.value = '';
    state.searchQuery = '';
    DOM.searchClearBtn.style.display = 'none';
    renderTasks();
  });

  // Reset Filters Bar Action
  DOM.resetFiltersBtn.addEventListener('click', resetAllFilters);

  // Modal Triggers
  DOM.openApiModalBtn.addEventListener('click', () => openModal(DOM.apiModal));
  DOM.closeApiModalBtn.addEventListener('click', () => closeModal(DOM.apiModal));
  DOM.confirmModalCloseBtn.addEventListener('click', () => closeModal(DOM.apiModal));

  DOM.closeDeleteModalBtn.addEventListener('click', () => closeModal(DOM.deleteModal));
  DOM.cancelDeleteBtn.addEventListener('click', () => closeModal(DOM.deleteModal));
  DOM.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

  // Close modals on clicking outside or pressing Escape
  window.addEventListener('click', (e) => {
    if (e.target === DOM.apiModal) closeModal(DOM.apiModal);
    if (e.target === DOM.deleteModal) closeModal(DOM.deleteModal);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(DOM.apiModal);
      closeModal(DOM.deleteModal);
    }
  });
}

/* ==========================================================================
   Data Operations & State Management
   ========================================================================== */

/**
 * Load tasks from the API layer
 */
async function loadTasks() {
  try {
    state.isLoading = true;
    const tasks = await TaskAPI.getTasks();
    state.tasks = tasks;
    updateAnalytics();
    renderTasks();
  } catch (err) {
    showToast(`Error fetching tasks: ${err.message}`, 'danger');
  } finally {
    state.isLoading = false;
  }
}

/**
 * Handle new task creation (Features 1, 5, 6)
 */
async function handleTaskSubmit(e) {
  e.preventDefault();

  const title = DOM.taskTitle.value.trim();
  const description = DOM.taskDescription.value.trim();
  const dueDate = DOM.taskDueDate.value || null;

  // Selected priority radio value
  let priority = 'medium';
  for (const radio of DOM.priorityRadios) {
    if (radio.checked) {
      priority = radio.value;
      break;
    }
  }

  // Validate Title requirement
  if (!title) {
    DOM.titleError.classList.add('visible');
    DOM.taskTitle.classList.add('input-invalid');
    DOM.taskTitle.focus();
    return;
  }

  try {
    DOM.submitTaskBtn.disabled = true;
    DOM.submitTaskBtn.innerHTML = `
      <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>
      <span>Adding Task...</span>
    `;

    const newTask = await TaskAPI.createTask({
      title,
      description,
      priority,
      due_date: dueDate
    });

    state.tasks.unshift(newTask);

    // Reset Form Fields
    DOM.taskForm.reset();
    document.getElementById('priorityMedium').checked = true;
    DOM.descCharCount.textContent = '0/500';
    DOM.taskDueDate.value = '';

    updateAnalytics();
    renderTasks();
    showToast(`Task "${title}" created successfully!`, 'success');
  } catch (err) {
    showToast(`Failed to add task: ${err.message}`, 'danger');
  } finally {
    DOM.submitTaskBtn.disabled = false;
    DOM.submitTaskBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      <span>Add Task</span>
    `;
  }
}

/**
 * Toggle task completion (Feature 3)
 */
async function toggleTaskStatus(taskId, isCompleted) {
  try {
    const updated = await TaskAPI.toggleTaskCompletion(taskId, isCompleted);
    const index = state.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      state.tasks[index] = updated;
    }
    updateAnalytics();
    renderTasks();
    showToast(
      isCompleted ? 'Task marked as completed' : 'Task marked as pending',
      'info'
    );
  } catch (err) {
    showToast(`Error updating task: ${err.message}`, 'danger');
  }
}

/**
 * Prompt delete confirmation modal (Feature 4)
 */
function promptDeleteTask(task) {
  state.taskPendingDelete = task;
  DOM.deleteTaskTitlePreview.textContent = `"${task.title}"`;
  openModal(DOM.deleteModal);
}

/**
 * Confirm deletion after user approves modal prompt
 */
async function handleConfirmDelete() {
  if (!state.taskPendingDelete) return;

  const taskId = state.taskPendingDelete.id;
  const taskTitle = state.taskPendingDelete.title;

  try {
    DOM.confirmDeleteBtn.disabled = true;
    await TaskAPI.deleteTask(taskId);
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    closeModal(DOM.deleteModal);
    state.taskPendingDelete = null;
    updateAnalytics();
    renderTasks();
    showToast(`Deleted task: "${taskTitle}"`, 'danger');
  } catch (err) {
    showToast(`Error deleting task: ${err.message}`, 'danger');
  } finally {
    DOM.confirmDeleteBtn.disabled = false;
  }
}

/* ==========================================================================
   Analytics Computations (Feature 8)
   ========================================================================== */

function updateAnalytics() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.is_completed).length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Counter Badges
  DOM.statTotalCount.textContent = total;
  DOM.statPendingCount.textContent = pending;
  DOM.statCompletedCount.textContent = completed;
  DOM.statCompletionRate.textContent = `${completionRate}%`;

  // Dynamic Progress Bar Fill
  DOM.statProgressBar.style.width = `${completionRate}%`;
  DOM.statProgressBarTrack.setAttribute('aria-valuenow', completionRate);

  // Tab Counts
  DOM.tabCountAll.textContent = total;
  DOM.tabCountPending.textContent = pending;
  DOM.tabCountCompleted.textContent = completed;
}

/* ==========================================================================
   Filtering & Sorting Engine (Features 2, 7)
   ========================================================================== */

function getFilteredTasks() {
  let list = [...state.tasks];

  // 1. Status Filter (All / Pending / Completed)
  if (state.filterStatus === 'pending') {
    list = list.filter(t => !t.is_completed);
  } else if (state.filterStatus === 'completed') {
    list = list.filter(t => t.is_completed);
  }

  // 2. Priority Filter (All / High / Medium / Low)
  if (state.filterPriority !== 'all') {
    list = list.filter(t => t.priority === state.filterPriority);
  }

  // 3. Search Query Filter
  if (state.searchQuery) {
    const q = state.searchQuery;
    list = list.filter(t => 
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  }

  // 4. Sorting
  list.sort((a, b) => {
    switch (state.sortBy) {
      case 'created_desc':
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);

      case 'due_asc':
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);

      case 'priority_desc': {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      }

      case 'title_asc':
        return a.title.localeCompare(b.title);

      default:
        return 0;
    }
  });

  return list;
}

/**
 * Render the filtered task cards onto the DOM
 */
function renderTasks() {
  const filtered = getFilteredTasks();

  // Active filter status banner
  const hasActiveSecondaryFilters = state.filterPriority !== 'all' || Boolean(state.searchQuery);
  if (hasActiveSecondaryFilters) {
    DOM.filterStatusBar.style.display = 'flex';
    const filterParts = [];
    if (state.filterPriority !== 'all') filterParts.push(`Priority: ${state.filterPriority.toUpperCase()}`);
    if (state.searchQuery) filterParts.push(`Query: "${state.searchQuery}"`);
    DOM.filterStatusText.textContent = `Filtered by [${filterParts.join(', ')}] — ${filtered.length} match(es)`;
  } else {
    DOM.filterStatusBar.style.display = 'none';
  }

  // Bottom summary counter
  DOM.taskCountSummary.textContent = `Displaying ${filtered.length} of ${state.tasks.length} task${state.tasks.length === 1 ? '' : 's'}`;

  // Empty state handling
  if (filtered.length === 0) {
    DOM.taskList.innerHTML = '';
    DOM.emptyState.style.display = 'flex';

    if (state.tasks.length === 0) {
      DOM.emptyStateTitle.textContent = "No tasks yet";
      DOM.emptyStateDesc.textContent = "Your task list is clear. Add your first task using the panel on the left.";
    } else {
      DOM.emptyStateTitle.textContent = "No matching tasks found";
      DOM.emptyStateDesc.textContent = "Try adjusting your search terms or clearing your priority filter.";
    }
    return;
  }

  DOM.emptyState.style.display = 'none';
  DOM.taskList.innerHTML = '';

  const fragment = document.createDocumentFragment();

  filtered.forEach(task => {
    const li = createTaskElement(task);
    fragment.appendChild(li);
  });

  DOM.taskList.appendChild(fragment);
}

/**
 * Construct the DOM element for an individual task card
 */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = `task-card priority-${task.priority} ${task.is_completed ? 'is-completed' : ''}`;
  li.dataset.id = task.id;

  const dueDateInfo = formatDueDate(task.due_date, task.is_completed);

  li.innerHTML = `
    <!-- Checkbox Toggle (Feature 3) -->
    <label class="task-checkbox-container" title="${task.is_completed ? 'Mark as incomplete' : 'Mark as completed'}">
      <input type="checkbox" class="task-checkbox" ${task.is_completed ? 'checked' : ''} aria-label="Toggle completion for ${escapeHTML(task.title)}">
      <span class="custom-checkbox">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </span>
    </label>

    <!-- Task Content Area -->
    <div class="task-content">
      <h3 class="task-title">${escapeHTML(task.title)}</h3>
      ${task.description ? `<p class="task-description">${escapeHTML(task.description)}</p>` : ''}
      
      <div class="task-meta">
        <!-- Priority Badge (Feature 5) -->
        <span class="badge-tag badge-priority-${task.priority}">
          ${capitalize(task.priority)} Priority
        </span>

        <!-- Due Date Badge (Feature 6) -->
        ${dueDateInfo.html}
      </div>
    </div>

    <!-- Actions (Feature 4: Delete) -->
    <div class="task-actions">
      <button type="button" class="btn-task-action btn-task-delete" title="Delete task" aria-label="Delete task: ${escapeHTML(task.title)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;

  // Attach Checkbox Change Event
  const checkbox = li.querySelector('.task-checkbox');
  checkbox.addEventListener('change', (e) => {
    toggleTaskStatus(task.id, e.target.checked);
  });

  // Attach Delete Button Event
  const deleteBtn = li.querySelector('.btn-task-delete');
  deleteBtn.addEventListener('click', () => {
    promptDeleteTask(task);
  });

  return li;
}

/**
 * Format due dates with contextual tags (Overdue alert, Today, Tomorrow, Date)
 */
function formatDueDate(dueDateStr, isCompleted) {
  if (!dueDateStr) {
    return { html: '' };
  }

  const [year, month, day] = dueDateStr.split('-').map(Number);
  const due = new Date(year, month - 1, day);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const formattedDate = due.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: due.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  });

  // Overdue status (only active if task is incomplete)
  if (!isCompleted && diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    const label = daysAgo === 1 ? 'Overdue: Yesterday' : `Overdue: ${daysAgo}d ago`;
    return {
      html: `
        <span class="badge-tag badge-due-date is-overdue" title="Due date: ${formattedDate}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          ${label}
        </span>
      `
    };
  }

  if (diffDays === 0) {
    return {
      html: `
        <span class="badge-tag badge-due-date is-today" title="Due Today">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Due Today
        </span>
      `
    };
  }

  if (diffDays === 1) {
    return {
      html: `
        <span class="badge-tag badge-due-date" title="Due Tomorrow">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
          Tomorrow
        </span>
      `
    };
  }

  return {
    html: `
      <span class="badge-tag badge-due-date" title="Due date: ${formattedDate}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
        Due ${formattedDate}
      </span>
    `
  };
}

/**
 * Reset all active secondary filters to defaults
 */
function resetAllFilters() {
  state.filterPriority = 'all';
  state.searchQuery = '';
  DOM.priorityFilterSelect.value = 'all';
  DOM.searchInput.value = '';
  DOM.searchClearBtn.style.display = 'none';
  renderTasks();
}

/* ==========================================================================
   UI Helpers: Modals & Toasts
   ========================================================================== */

function openModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add('open');
  modalEl.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove('open');
  modalEl.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/**
 * Toast Notification system
 */
function showToast(message, type = 'info') {
  if (!DOM.toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    danger: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
  };

  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type] || iconMap.info}</span>
    <span class="toast-message">${escapeHTML(message)}</span>
  `;

  DOM.toastContainer.appendChild(toast);

  // Animate into view
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto dismiss after 3.2 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  }, 3200);
}

/**
 * Prevent HTML injection
 */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
