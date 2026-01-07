from pydantic import BaseModel, ConfigDict, field_serializer
from datetime import datetime
from typing import Optional
from .models import TaskStatus, TaskPriority


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[datetime] = None
    priority: Optional[TaskPriority] = None


class TaskResponse(BaseModel):
    id: str
    task_number: Optional[int] = None
    title: str
    description: Optional[str]
    status: TaskStatus
    due_date: Optional[datetime]
    priority: TaskPriority
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            datetime: lambda v: v.isoformat() if v else None
        }
    )
    
    @field_serializer('created_at', 'updated_at', 'due_date', when_used='json')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        if value is None:
            return None
        return value.isoformat()