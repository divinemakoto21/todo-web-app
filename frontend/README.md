# TaskFlow Pro — Frontend Documentation
**University Project: Academic Task Management System**

This is the standalone frontend interface for TaskFlow Pro, designed with HTML5, Vanilla CSS, and Vanilla JavaScript. It is structured for integration with a **Python FastAPI** backend and **SQLite** database.

---

## 📁 File Structure

```text
todo-web-app/
├── backend/                  # Python FastAPI workspace (to be implemented)
│   └── venv/
└── frontend/
    ├── index.html            # Semantic HTML5 dashboard layout & modals
    ├── css/
    │   └── style.css         # Modern design system, responsive styles & theme
    ├── js/
    │   ├── api.js            # Modular REST API client & in-memory demo data
    │   └── app.js            # UI controller, event handlers & metric calculations
    └── README.md             # Project documentation & preview instructions
```

---

## 🚀 How to Preview the Frontend

You can preview the frontend using either of the following two methods:

### Option 1: Using Python's Built-in Server (Recommended)
Open a terminal in your project root (`c:\Users\Divine Makoto\Desktop\todo-web-app`) and run:

```bash
python -m http.server 3000 --directory frontend
```

Then open your browser at:
👉 **[http://localhost:3000](http://localhost:3000)**

### Option 2: Direct File Launch
Double-click `frontend/index.html` in Windows File Explorer or open it in your browser (`file:///.../frontend/index.html`). The code is built to run standalone without external build tools.

---

## 🎯 Implemented Features

1. **Add Task**: Title (required with validation) and optional multi-line description.
2. **Display Tasks**: Dynamic cards with priority tags, due date badges, and completion states.
3. **Toggle Completion**: Mark tasks completed/incomplete with strikethrough and status updates.
4. **Delete Tasks**: Delete task with a confirmation dialog modal.
5. **Priority Levels**: **Low** (Emerald), **Medium** (Amber), and **High** (Rose).
6. **Due Dates**: Date selector with quick presets (*Today*, *Tomorrow*, *+1 Week*) and overdue detection.
7. **Filter & Search**:
   - Filter by status: **All**, **Pending**, and **Completed** with live counter badges.
   - Filter by priority: All, High, Medium, Low.
   - Real-time search by task title or description.
   - Sort by Newest, Earliest Due Date, Priority, or Alphabetical.
8. **Dashboard Metrics**:
   - Total Tasks
   - Pending Tasks
   - Completed Tasks
   - Completion Rate (%) with an animated progress bar.
9. **Responsive Layout**: Two-column layout on desktop, stacked layout on tablets and mobile phones.
10. **Lecturer Presentation Ready**: Pre-seeded with university project tasks in demo mode.

---

## 🔌 Python FastAPI REST API Contract (For Next Phase)

All frontend API calls are centralized in [api.js](file:///c:/Users/Divine%20Makoto/Desktop/todo-web-app/frontend/js/api.js). When your FastAPI backend is ready, switch `USE_LIVE_BACKEND: true` in `api.js`.

The expected REST endpoints are:

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | Retrieve all tasks | *None* | `List[Task]` |
| `POST` | `/api/tasks` | Create a new task | `{ title, description, priority, due_date }` | `Task` |
| `PUT` | `/api/tasks/{id}` | Update task status or fields | Partial task fields or `{ is_completed }` | `Task` |
| `DELETE` | `/api/tasks/{id}` | Remove a task | *None* | `{ success: true, id }` |
| `GET` | `/api/health` | Health check | *None* | `{ status: "ok" }` |

### Proposed SQLite Table Schema:
```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(120) NOT NULL,
    description TEXT,
    priority VARCHAR(10) DEFAULT 'medium',
    due_date DATE,
    is_completed BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
