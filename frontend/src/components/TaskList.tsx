'use client';

import { Task } from '@/lib/api';
import { Check, Clock, Trash2, Circle, CheckCircle2, Timer, ListChecks } from 'lucide-react';
import { format } from 'date-fns';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: number | string, status: Task['status']) => void;
  onDelete: (id: number | string) => void;
}

export default function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
  const getNextStatus = (current: Task['status']): Task['status'] => {
    if (current === 'todo') return 'in_progress';
    if (current === 'in_progress') return 'done';
    return 'todo';
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return <Circle size={16} className="text-gray-400" />;
      case 'in_progress':
        return <Timer size={16} className="text-blue-600" />;
      case 'done':
        return <CheckCircle2 size={16} className="text-green-600" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'low':
        return 'text-blue-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
    }
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-2 rounded-xl shadow-xl">
                <ListChecks size={20} className="text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Your Tasks
              </h2>
            </div>
          </div>
          
          {/* Stats Badge */}
          <div className="flex items-center gap-6 px-2 py-3">
            <div className="text-center">
              <div className="text-xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {tasks.length}
              </div>
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Total</div>
            </div>
            <div className="w-px h-10 bg-gray-300 dark:bg-gray-600"></div>
            <div className="text-center">
              <div className="text-xl font-black text-green-600 dark:text-green-400">
                {doneTasks.length}
              </div>
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Done</div>
            </div>
            <div className="w-px h-10 bg-gray-300 dark:bg-gray-600"></div>
            <div className="text-center">
              <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                {inProgressTasks.length}
              </div>
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Active</div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <table className="w-full table-auto">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Priority</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Due Date</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {tasks && tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No tasks yet. Try asking the AI to create one!
                  </td>
                </tr>
              ) : (
                tasks && tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-md transition-all duration-200 cursor-pointer">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {task.task_number || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onToggle(task.id, getNextStatus(task.status))}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            task.status === 'done'
                              ? 'bg-green-500 border-green-500 text-white'
                              : task.status === 'in_progress'
                              ? 'bg-blue-500 border-blue-500 text-white'
                              : 'border-gray-300 hover:border-gray-500'
                          }`}
                          title="Toggle status"
                        >
                          {task.status === 'done' && <Check size={14} />}
                          {task.status === 'in_progress' && <Timer size={14} />}
                        </button>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* {getStatusIcon(task.status)} */}
                        <span
                          className={`text-sm font-medium ${
                            task.status === 'done'
                              ? 'line-through text-gray-500'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium capitalize ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {task.due_date ? (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Clock size={14} />
                          {format(new Date(task.due_date), 'MMM dd, yyyy')}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onDelete(task.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}