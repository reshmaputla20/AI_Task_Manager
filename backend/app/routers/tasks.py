from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..database import get_db
from ..schemas import TaskResponse, TaskCreate, TaskUpdate
from bson import ObjectId
from datetime import datetime

router = APIRouter()


def _doc_to_response(doc: dict) -> TaskResponse:
    return TaskResponse(
        id=str(doc.get("_id")),
        title=doc.get("title"),
        task_number = doc.get("task_number"),
        description=doc.get("description"),
        status=doc.get("status", "todo"),
        due_date=doc.get("due_date"),
        priority=doc.get("priority", "medium"),
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )


@router.get("/", response_model=List[TaskResponse])
def get_tasks(db=Depends(get_db)):
    docs = list(db.tasks.find())
    return [_doc_to_response(d) for d in docs]


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: str, db=Depends(get_db)):
    try:
        oid = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task id")

    doc = db.tasks.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Task not found")
    return _doc_to_response(doc)


@router.post("/", response_model=TaskResponse)
def create_task_endpoint(task: TaskCreate, db=Depends(get_db)):
    data = task.model_dump()
    data["status"] = data.get("status", "todo")
    data["priority"] = data.get("priority", "medium")
    data["created_at"] = datetime.utcnow()
    data["updated_at"] = datetime.utcnow()
    res = db.tasks.insert_one(data)
    doc = db.tasks.find_one({"_id": res.inserted_id})
    if doc:
        return _doc_to_response(doc)
    raise HTTPException(status_code=500, detail="Failed to create task")


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task_endpoint(task_id: str, task: TaskUpdate, db=Depends(get_db)):
    # Try to parse as ObjectId first, then try as task_number
    query = None
    try:
        oid = ObjectId(task_id)
        query = {"_id": oid}
    except Exception:
        # Try as task_number
        try:
            task_num = int(task_id)
            query = {"task_number": task_num}
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid task id")

    update_data = task.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_data["updated_at"] = datetime.utcnow()

    result = db.tasks.find_one_and_update(query, {"$set": update_data}, return_document=True)
    if not result:
        raise HTTPException(status_code=404, detail="Task not found")
    return _doc_to_response(result)


@router.delete("/{task_id}")
def delete_task_endpoint(task_id: str, db=Depends(get_db)):
    # Try to parse as ObjectId first, then try as task_number
    query = None
    try:
        oid = ObjectId(task_id)
        query = {"_id": oid}
    except Exception:
        # Try as task_number
        try:
            task_num = int(task_id)
            query = {"task_number": task_num}
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid task id")

    res = db.tasks.delete_one(query)
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}