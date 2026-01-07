Task Manager - AI-Powered Task Management

A modern full-stack application that integrates an AI agent with intelligent task management, allowing users to manage tasks entirely through natural language using Google's Gemini 2.5-flash-lite LLM.

## 🌟 Features

### Core Functionality
- **Natural Language Interface**: Interact with your task manager through conversational AI
- **Real-time Chat**: WebSocket-based chat for instant AI-powered responses
- **Dual-View Interface**: Split-screen design with chat on one side and live task list on the other
- **Intelligent Agent**: LangGraph-powered AI that understands context and task intent
- **Full CRUD Operations**: Create, read, update, and delete tasks via chat or REST API
- **User-Friendly IDs**: Sequential task numbering (1, 2, 3...) instead of cryptic ObjectIDs

### AI Capabilities
- Create tasks with natural language (e.g., "Add a task to buy groceries tomorrow")
- Update task status by checking checkboxes or sending chat commands
- Filter tasks by priority, status, or due date with intelligent queries
- Delete tasks by ID or name matching
- List all tasks with formatted output
- Date interpretation: Automatically converts natural dates to ISO format (YYYY-MM-DD)
- Context awareness: Remembers task context and provides helpful suggestions

### Task Management Features
- **Intelligent Priority Levels**: Low, Medium, High with visual color indicators
- **Task Status Tracking**: Todo (gray) → In Progress (blue) → Done (green)
- **Due Date Management**: Set and track due dates with proper date handling
- **Task Descriptions**: Optional detailed descriptions for each task
- **Automatic Updates**: Task list syncs instantly after any changes
- **Task Filtering**: Filter by status, priority, or due date

### UI/UX Features
- **Responsive Design**: Mobile-friendly with Tailwind CSS
- **Real-time Sync**: Task list updates automatically after agent actions
- **Priority Colors**: Visual indicators for task priority levels
- **Status Indicators**: Color-coded status display for quick scanning
- **Error Handling**: User-friendly error messages displayed in red
- **Checkbox Toggle**: Mark tasks as done directly from the UI

### API Management
- **Multi-API Key Support**: Seamlessly switch between multiple Google API keys
- **Automatic Fallback**: Detects quota exhaustion and automatically switches to backup keys
- **User-Friendly Error Messages**: Converts technical API errors to clear, actionable messages
- **Key Rotation**: Tracks exhausted keys with timestamps for recovery tracking

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (Next.js 14)                   │
│  ┌──────────────────┐        ┌──────────────────┐      │
│  │  Chat Interface  │        │    Task List     │      │
│  │   (WebSocket)    │◄──────►│  (REST + Polling)│      │
│  └──────────────────┘        └──────────────────┘      │
│  - Dark/Light Theme            - Real-time Sync        │
│  - Error Messages (Red)        - Task Filtering        │
│  - Message History             - Priority Colors       │
└────────────────┬────────────────────┬───────────────────┘
                 │                    │
                 │ WebSocket          │ REST API
                 │ /api/chat/ws       │ /api/tasks/*
                 │                    │
┌────────────────▼────────────────────▼───────────────────┐
│                   Backend (FastAPI)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │              LangGraph Agent                      │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │  │
│  │  │Gemini 2.5- │  │   Tools    │  │   State    │ │  │
│  │  │flash-lite  │  │ (CRUD ops) │  │ Management │ │  │
│  │  └────────────┘  └────────────┘  └────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │        API Key Manager (Multi-key support)       │  │
│  │  - Quota detection & auto-fallback               │  │
│  │  - Key rotation on exhaustion                    │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │            MongoDB (PyMongo)                      │  │
│  │  - Task documents with task_number field         │  │
│  │  - Status, Priority, Due dates                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 📋 Technology Stack

### Backend
- **FastAPI** (0.125.0): Modern async web framework for building APIs
- **LangChain** (1.2.0) + **LangGraph** (1.0.5): Orchestrates multi-step agent workflows with state management
- **Google Generative AI** (1.56.0): Gemini 2.5-flash-lite for natural language understanding
- **MongoDB + PyMongo**: NoSQL database with document-based task storage
- **Pydantic**: Type-safe data validation and serialization
- **Uvicorn**: ASGI server for async request handling
- **WebSockets**: Real-time bidirectional communication with frontend

### Frontend
- **Next.js 14**: React framework with App Router for modern web applications
- **TypeScript**: Type-safe JavaScript for component development
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **React Hooks**: State management and component lifecycle
- **localStorage**: Persistent theme preferences across sessions

### DevOps & Infrastructure
- **Python 3.x**: Backend runtime
- **Node.js**: Frontend build and development
- **Uvicorn**: Async Python server
- **npm**: JavaScript package management

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **MongoDB** (local or MongoDB Atlas)
- **Google Gemini API Key** ([Get it here](https://aistudio.google.com/app/apikey))
- (Optional) **Docker & Docker Compose** for containerized deployment

### Setup Instructions

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create and activate Python virtual environment**
   ```bash
   python -m venv env
   source env/bin/activate  # On Windows: env\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   Create `backend/.env` file:
   ```env
   MONGODB_URL=mongodb://localhost:27017/task_manager
   GOOGLE_API_KEY=your_gemini_api_key_here
   # OR for multiple keys:
   GOOGLE_API_KEYS=key1,key2,key3
   CORS_ORIGINS=http://localhost:3000
   ```

5. **Start the backend server**
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   
   Backend will be available at: `http://localhost:8000`
   API Documentation: `http://localhost:8000/docs`

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create `frontend/.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/chat/ws
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   Frontend will be available at: `http://localhost:3000`
📖 Usage Examples
Chat Commands
Creating Tasks
"Add a task to buy groceries tomorrow"
"Create a high priority task: Finish project report by Friday"
"Remind me to call John at 3pm"
Updating Tasks
"Mark task 5 as done"
"Change the priority of 'buy groceries' to high"
"Update task 3 status to in progress"
Listing and Filtering
"Show me all my tasks"
"List all high priority tasks"
"Show me tasks that are in progress"
"What tasks are due soon?"
Deleting Tasks
"Delete task 7"
"Remove the task about groceries"
"Delete all completed tasks"
## 🛠️ Additional Tools
- **PyMongo**: Python MongoDB driver for document-based data access
- **Pydantic**: Data validation and serialization
- **WebSockets**: Real-time bidirectional communication

📁 Project Structure
ai-task-manager/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application entry
│   │   ├── database.py          # MongoDB connection & initialization
│   │   ├── models.py            # Pydantic schemas & data models
│   │   ├── schemas.py           # API request/response schemas
│   │   ├── agent/
│   │   │   ├── __init__.py
│   │   │   ├── tools.py         # LangGraph tools
│   │   │   ├── graph.py         # Agent graph definition
│   │   │   └── prompts.py       # System prompts
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── tasks.py         # Task CRUD endpoints
│   │       └── chat.py          # WebSocket chat endpoint
│   ├── requirements.txt
│   ├── .env
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Main page component
│   │   │   ├── layout.tsx       # Root layout
│   │   │   └── globals.css      # Global styles
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx    # Chat UI
│   │   │   ├── TaskList.tsx         # Task list view
│   │   │   └── TaskItem.tsx         # Individual task
│   │   └── lib/
│   │       └── api.ts           # API client
│   ├── package.json
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── .env.local
├── docker-compose.yml
└── README.md
## 🔧 Configuration

### Backend Environment Variables
```env
MONGODB_URL=mongodb://localhost:27017/task_manager
GOOGLE_API_KEY=your_gemini_api_key
GOOGLE_API_KEYS=key1,key2,key3  # For multi-key support
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Frontend Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/chat/ws
```
🧪 Testing
Backend Tests
bashcd backend
pytest tests/
Frontend Tests
bashcd frontend
npm test
Integration Tests
bash# Test LangGraph agent logic
cd backend
pytest tests/test_agent.py -v
## 🚀 Deployment

### Backend Deployment (Railway, Render, Heroku, etc.)

1. Set environment variables in your platform:
   - `MONGODB_URL`: MongoDB Atlas or self-hosted connection string
   - `GOOGLE_API_KEY` or `GOOGLE_API_KEYS`: Your Gemini API key(s)
   - `CORS_ORIGINS`: Allowed frontend origins

2. Connect your GitHub repository

3. Deploy from main branch

4. Ensure MongoDB database is accessible

### Frontend Deployment (Vercel, Netlify)

Connect GitHub repository
Set environment variables
Configure build settings:

Build command: npm run build
Output directory: .next


Deploy

Docker Deployment
bash# Build and push images
docker-compose build
docker-compose push

# Deploy to your server
docker-compose -f docker-compose.prod.yml up -d
🎯 Bonus Features Implemented

✅ Real-time sync with WebSockets
✅ Dark mode support
✅ Responsive mobile design
✅ Task priority visualization
✅ Due date tracking
✅ Status progression (Todo → In Progress → Done)
✅ Checkbox toggle for task completion
✅ Natural language understanding
✅ Context-aware responses

## 📊 Database Schema

### MongoDB Task Collection
```javascript
{
  _id: ObjectId,
  task_number: Number,           // Sequential user-friendly ID (1, 2, 3...)
  title: String,                 // Task title (required)
  description: String,           // Optional detailed description
  status: String,                // 'todo' | 'in_progress' | 'done'
  priority: String,              // 'low' | 'medium' | 'high'
  due_date: Date,                // Optional due date/datetime
  created_at: Date,              // Auto-set on creation
  updated_at: Date               // Auto-updated on changes
}
```
## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🙏 Acknowledgments

- Google Gemini for the AI capabilities
- LangChain & LangGraph teams for the agent framework
- FastAPI and Next.js communities
- MongoDB for document-based storage

