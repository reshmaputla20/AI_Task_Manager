from typing import Optional, List
from datetime import datetime
from langchain.tools import tool
from ..models import TaskStatus, TaskPriority


_db_session = None

def set_db_session(db):
    global _db_session
    _db_session = db
    
@tool
def create_task(title: str, description: Optional[str] = None, 
                due_date: Optional[str] = None, priority: Optional[str] = "medium") -> str:
    """Create a new task with title, optional description, due_date, and priority.
    Priority can be: low, medium, or high.
    Due date should be in format: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS"""
    try:
        if _db_session is None:
            return "Database not initialized"


        last_task = _db_session.tasks.find_one(sort=[("task_number", -1)])
        task_number = (last_task.get("task_number", 0) if last_task else 0) + 1

        doc = {
            "task_number": task_number,
            "title": title,
            "description": description,
            "priority": TaskPriority(priority.lower()).value if priority else TaskPriority.MEDIUM.value,
            "status": TaskStatus.TODO.value,
            "created_at": datetime.utcnow(),
        }

        if due_date:
            try:
                doc["due_date"] = datetime.fromisoformat(due_date)
            except Exception:
                pass

        res = _db_session.tasks.insert_one(doc)
        return f"Task created successfully: '{title}' (Task ID: {task_number})"
    except Exception as e:
        return f"Error creating task: {str(e)}"

@tool
def update_task(task_id: Optional[str] = None, title_match: Optional[str] = None,
                new_title: Optional[str] = None, new_description: Optional[str] = None,
                new_status: Optional[str] = None, new_priority: Optional[str] = None,
                new_due_date: Optional[str] = None) -> str:
    """Update an existing task by ID or title match. Provide new values for fields to update.
    Status can be: todo, in_progress, or done.
    Priority can be: low, medium, or high."""
    try:
        if _db_session is None:
            return "Database not initialized"

        query = {}
        if task_id:
            try:
             
                task_num = int(task_id)
                query["task_number"] = task_num
            except ValueError:
              
                try:
                    from bson import ObjectId
                    query["_id"] = ObjectId(task_id)
                except Exception:
                    return "Invalid task id"
        elif title_match:
            import re
            query["title"] = {"$regex": title_match, "$options": "i"}
        else:
            return "Please provide either task_id or title_match"

        update = {}
        if new_title:
            update["title"] = new_title
        if new_description:
            update["description"] = new_description
        if new_status:
            update["status"] = TaskStatus(new_status.lower()).value
        if new_priority:
            update["priority"] = TaskPriority(new_priority.lower()).value
        if new_due_date:
            try:
                update["due_date"] = datetime.fromisoformat(new_due_date)
            except Exception:
                pass

        if not update:
            return "No updates provided"

        update["updated_at"] = datetime.utcnow()

        res = _db_session.tasks.find_one_and_update(query, {"$set": update})
        if not res:
            return "Task not found"
        return f"Task updated successfully"
    except Exception as e:
        return f"Error updating task: {str(e)}"

@tool
def delete_task(task_id: Optional[str] = None, title_match: Optional[str] = None) -> str:
    """Delete a task by ID or title match."""
    try:
        if _db_session is None:
            return "Database not initialized"

        query = {}
        if task_id:
            try:
            
                task_num = int(task_id)
                query["task_number"] = task_num
            except ValueError:
             
                try:
                    from bson import ObjectId
                    query["_id"] = ObjectId(task_id)
                except Exception:
                    return "Invalid task id"
        elif title_match:
            query["title"] = {"$regex": title_match, "$options": "i"}
        else:
            return "Please provide either task_id or title_match"

        res = _db_session.tasks.find_one_and_delete(query)
        if not res:
            return "Task not found"
        return f"Task deleted successfully: '{res.get('title')}'"
    except Exception as e:
        return f"Error deleting task: {str(e)}"

@tool
def list_tasks() -> str:
    """List all tasks."""
    
    try:
        if _db_session is None:
            return "Database not initialized"

        cursor = _db_session.tasks.find().sort("task_number", 1)
        tasks = list(cursor)
        if not tasks:
            return "No tasks found"

        result = f"Found {len(tasks)} tasks:\n\n"
        for task in tasks:
            task_num = task.get("task_number", "?")
            due = f", Due: {task.get('due_date').strftime('%Y-%m-%d')}" if task.get('due_date') else ""
            result += f"[Task {task_num}] {task.get('title')} | Status: {task.get('status')} | Priority: {task.get('priority')}{due}\n"

        return result
    except Exception as e:
        return f"Error listing tasks: {str(e)}"

@tool
def filter_tasks(status: Optional[str] = None, priority: Optional[str] = None) -> str:
    """Filter tasks by status (todo/in_progress/done) or priority (low/medium/high)."""
    
    try:
        if _db_session is None:
            return "Database not initialized"

        query = {}
        if status:
            query["status"] = TaskStatus(status.lower()).value
        if priority:
            query["priority"] = TaskPriority(priority.lower()).value

        tasks = list(_db_session.tasks.find(query).sort("task_number", 1))

        if not tasks:
            return f"No tasks found with filters: status={status}, priority={priority}"

        result = f"Found {len(tasks)} tasks:\n\n"
        for task in tasks:
            task_num = task.get("task_number", "?")
            due = f", Due: {task.get('due_date').strftime('%Y-%m-%d')}" if task.get('due_date') else ""
            result += f"[Task {task_num}] {task.get('title')} | Status: {task.get('status')} | Priority: {task.get('priority')}{due}\n"

        return result
    except Exception as e:
        return f"Error filtering tasks: {str(e)}"

def get_all_tools():
    return [create_task, update_task, delete_task, list_tasks, filter_tasks]
