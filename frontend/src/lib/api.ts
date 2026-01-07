export interface Task {
  id: number | string;
  task_number?: number;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getTasks(): Promise<Task[]> {
  console.log("15 inside get tasks");
  
  const response = await fetch(`${API_URL}/api/tasks`);
  console.log("18 response:", response);
  
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

export async function updateTask(id: number | string, data: Partial<Task>): Promise<Task> {
  const response = await fetch(`${API_URL}/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update task');
  return response.json();
}

export async function deleteTask(id: number | string): Promise<void> {
  const response = await fetch(`${API_URL}/api/tasks/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete task');
}

export interface TaskCreate {
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: 'low' | 'medium' | 'high';
}

export async function createTask(data: TaskCreate): Promise<Task> {
  console.log("inside CreateTask");
  

  const payload = {
    ...data,
    due_date: data.due_date ? 
      (typeof data.due_date === 'string' ? data.due_date : new Date(data.due_date).toISOString().split('T')[0])
      : null
  };
  
  const response = await fetch(`${API_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text();
    console.error('createTask failed', { url: `${API_URL}/api/tasks/`, status: response.status, body: text });
    throw new Error(`Failed to create task: ${response.status} ${text}`);
  }
  return response.json();
}

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(
    private url: string,
    private onMessage: (payload: any) => void,
    private onOpen?: () => void,
    private onClose?: () => void
  ) {}

  connect() {
    try {
      this.ws = new WebSocket(this.url);
    } catch (err) {
      console.warn('Failed to create WebSocket');
      // Retry connection after a delay
      this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
      return;
    }

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      if (this.onOpen) this.onOpen();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket received:', data);
        this.onMessage(data);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err, 'raw:', event.data);
      }
    };

    this.ws.onclose = (ev) => {
      console.log('WebSocket disconnected', { code: (ev && (ev as any).code) ?? null, reason: (ev && (ev as any).reason) ?? null });
      if (this.onClose) this.onClose();

      // Reconnect after 3 seconds
      this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = (ev) => {

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.warn('WebSocket encountered an error');
      }
    };
  }

  send(message: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = { message };
      try {
        console.log('ChatWebSocket: sending', payload);
      } catch (e) {
        // ignore
      }
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn('ChatWebSocket: send called but socket not open', { readyState: this.ws ? this.ws.readyState : 'no-socket' });
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
    }
  }
}
