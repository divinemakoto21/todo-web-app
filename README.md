# TaskFlow Pro — Full-Stack University Project
**Modern Todo Web Application with Python FastAPI, SQLite, and Vanilla Frontend**

TaskFlow Pro is a modern, responsive academic task management system developed for a university engineering demonstration.

---

## 🏗️ Architecture Overview

```text
todo-web-app/
├── backend/
│   ├── app/
│   │   ├── __init__.py       # Package definition
│   │   ├── main.py           # FastAPI application, CORS configuration, REST endpoints
│   │   ├── database.py       # SQLite connection manager, schema initialization & seeding
│   │   ├── schemas.py        # Pydantic v2 validation models
│   │   └── crud.py           # SQL queries for CRUD task operations
│   ├── tasks.db              # SQLite Database file (auto-generated & seeded on startup)
│   ├── requirements.txt      # Backend Python dependencies
│   ├── run.py                # Server runner script
│   └── test_backend.py       # Automated integration test suite
│
├── frontend/
│   ├── index.html            # Semantic HTML5 dashboard & modal dialogs
│   ├── css/
│   │   └── style.css         # Modern design system, slate theme & responsive layout
│   ├── js/
│   │   ├── api.js            # REST API client configured for http://127.0.0.1:8000/api
│   │   └── app.js            # DOM controllers, dynamic filtering, analytics & toasts
│   └── README.md             # Frontend specific documentation
└── README.md
```

---

## ⚡ Quick Start: Running the Full Stack

### 1. Start the Python FastAPI Backend (Terminal 1)
```powershell
# From the project root:
& 'backend\venv\Scripts\python.exe' backend\run.py
```
* Backend runs on: `http://127.0.0.1:8000`
* Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
* SQLite database file is created at `backend/tasks.db`

### 2. Start the Frontend (Terminal 2)
```powershell
python -m http.server 3000 --directory frontend
```
* Open in browser: `http://localhost:3000`

---

## 📡 REST API Specification

| HTTP Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and SQLite connectivity check |
| `GET` | `/api/tasks` | Fetch all tasks from SQLite |
| `POST` | `/api/tasks` | Create a new task in SQLite |
| `GET` | `/api/tasks/{id}` | Retrieve a single task by ID |
| `PUT` | `/api/tasks/{id}` | Update task fields (title, description, priority, completion) |
| `DELETE` | `/api/tasks/{id}` | Remove a task permanently from SQLite |

---

## 🧪 Testing the Backend
To run automated tests against the running FastAPI backend and SQLite database:
```powershell
& 'backend\venv\Scripts\python.exe' backend\test_backend.py
```
