/**
 * TaskFlow Pro - API Service Module (frontend/js/api.js)
 * 
 * Modular REST API client designed for seamless integration with Python FastAPI & SQLite.
 * 
 * ARCHITECTURAL DESIGN:
 * This client decouples frontend UI components from data persistence.
 * All API interactions funnel through this service.
 * 
 * WHEN FASTAPI IS CONNECTED:
 * Set API_CONFIG.USE_LIVE_BACKEND = true.
 * Endpoints expected:
 *   - GET    /api/tasks        -> Returns List[Task]
 *   - POST   /api/tasks        -> Creates Task, returns Task
 *   - PUT    /api/tasks/{id}   -> Updates Task, returns Task
 *   - DELETE /api/tasks/{id}   -> Deletes Task, returns { success: true, id }
 *   - GET    /api/health       -> Returns { status: "ok" }
 * 
 * CURRENT DEMONSTRATION STATE:
 * In compliance with project requirements:
 *   1. localStorage and sessionStorage are NOT used.
 *   2. Backend is NOT assumed to be connected yet.
 *   3. Uses an active In-Memory store with realistic university project tasks
 *      so the app is immediately testable and demonstrable to a lecturer.
 */

const API_CONFIG = {
  BASE_URL: 'http://127.0.0.1:8000/api',
  TIMEOUT_MS: 5000,
  // Connected to live Python FastAPI backend & SQLite database
  USE_LIVE_BACKEND: true
};

// In-Memory Task Data Store (Runtime state only, reset on full page refresh)
let inMemoryTasks = [
  {
    id: 1,
    title: "Finalize Software Engineering Proposal",
    description: "Prepare project scope document, entity-relationship diagram, and system architecture overview for university evaluation.",
    priority: "high",
    due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
    is_completed: false,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 2,
    title: "Design Database Schema in SQLite",
    description: "Write SQL DDL tables for tasks with primary keys, priority constraints, timestamps, and indexes.",
    priority: "medium",
    due_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], // 5 days from now
    is_completed: false,
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 3,
    title: "Implement FastAPI REST Endpoints",
    description: "Develop Python routers for /api/tasks with Pydantic schemas, validation, and CORS middleware enabled.",
    priority: "high",
    due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // 7 days from now
    is_completed: false,
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    title: "Review UI/UX Accessibility Guidelines",
    description: "Audit responsive viewport behavior, contrast ratios, and keyboard navigation across laptop and mobile displays.",
    priority: "low",
    due_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday (shows completed)
    is_completed: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 5,
    title: "Configure Python Virtual Environment",
    description: "Setup backend/venv with FastAPI, Uvicorn, SQLAlchemy, and automated test runners.",
    priority: "low",
    due_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    is_completed: true,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString()
  }
];

let nextGeneratedId = 6;

const TaskAPI = {
  /**
   * Check connection status to the Python FastAPI backend
   * @returns {Promise<{ connected: boolean, message: string }>}
   */
  async checkBackendHealth() {
    if (!API_CONFIG.USE_LIVE_BACKEND) {
      return {
        connected: false,
        message: "Running in In-Memory Demo Mode (FastAPI disconnected)"
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_CONFIG.BASE_URL}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        return { connected: true, message: "FastAPI Backend Connected" };
      }
      return { connected: false, message: "FastAPI returned non-200 status" };
    } catch {
      return { connected: false, message: "FastAPI server unreachable" };
    }
  },

  /**
   * GET /api/tasks
   * Fetch all tasks
   * @returns {Promise<Array>}
   */
  async getTasks() {
    if (API_CONFIG.USE_LIVE_BACKEND) {
      const response = await fetch(`${API_CONFIG.BASE_URL}/tasks`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json();
    }

    // In-memory simulation with realistic micro-latency
    await new Promise(resolve => setTimeout(resolve, 60));
    return [...inMemoryTasks];
  },

  /**
   * POST /api/tasks
   * Create a new task
   * @param {Object} taskData
   * @returns {Promise<Object>}
   */
  async createTask(taskData) {
    if (API_CONFIG.USE_LIVE_BACKEND) {
      const response = await fetch(`${API_CONFIG.BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      if (!response.ok) throw new Error(`Failed to create task (HTTP ${response.status})`);
      return await response.json();
    }

    await new Promise(resolve => setTimeout(resolve, 80));
    const newTask = {
      id: nextGeneratedId++,
      title: taskData.title.trim(),
      description: taskData.description ? taskData.description.trim() : "",
      priority: taskData.priority || "medium",
      due_date: taskData.due_date || null,
      is_completed: false,
      created_at: new Date().toISOString()
    };
    inMemoryTasks.unshift(newTask);
    return { ...newTask };
  },

  /**
   * PUT /api/tasks/{id}
   * Update task fields (e.g. title, description, priority, completion)
   * @param {number|string} taskId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateTask(taskId, updates) {
    if (API_CONFIG.USE_LIVE_BACKEND) {
      const response = await fetch(`${API_CONFIG.BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error(`Failed to update task (HTTP ${response.status})`);
      return await response.json();
    }

    await new Promise(resolve => setTimeout(resolve, 50));
    const index = inMemoryTasks.findIndex(t => t.id === taskId);
    if (index === -1) throw new Error(`Task with id ${taskId} not found`);

    inMemoryTasks[index] = {
      ...inMemoryTasks[index],
      ...updates
    };
    return { ...inMemoryTasks[index] };
  },

  /**
   * Helper to toggle task completion status
   * @param {number|string} taskId
   * @param {boolean} isCompleted
   * @returns {Promise<Object>}
   */
  async toggleTaskCompletion(taskId, isCompleted) {
    return this.updateTask(taskId, { is_completed: isCompleted });
  },

  /**
   * DELETE /api/tasks/{id}
   * Remove a task
   * @param {number|string} taskId
   * @returns {Promise<{ success: boolean, id: number|string }>}
   */
  async deleteTask(taskId) {
    if (API_CONFIG.USE_LIVE_BACKEND) {
      const response = await fetch(`${API_CONFIG.BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`Failed to delete task (HTTP ${response.status})`);
      return await response.json();
    }

    await new Promise(resolve => setTimeout(resolve, 60));
    const index = inMemoryTasks.findIndex(t => t.id === taskId);
    if (index === -1) throw new Error(`Task with id ${taskId} not found`);

    inMemoryTasks.splice(index, 1);
    return { success: true, id: taskId };
  },

  /**
   * Reset in-memory tasks (for test/demo resets)
   */
  resetInMemoryStore() {
    inMemoryTasks = [];
    nextGeneratedId = 1;
  }
};

// Expose globally to window for direct file:// preview and module support
if (typeof window !== 'undefined') {
  window.API_CONFIG = API_CONFIG;
  window.TaskAPI = TaskAPI;
}
