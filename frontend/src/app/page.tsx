'use client';

import { useState, useEffect, useCallback } from 'react';
import ChatInterface from '@/components/ChatInterface';
import TaskList from '@/components/TaskList';
import { Task, getTasks, updateTask, deleteTask } from '@/lib/api';
import { Moon, Sun, Menu } from 'lucide-react';
import './App.css';


export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMobileTasks, setShowMobileTasks] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Check system preference for dark mode if no saved preference
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, [fetchTasks]);

  useEffect(() => {
    // Update dark class whenever darkMode changes
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleToggleTask = async (id: number | string, status: Task['status']) => {
    try {
      // Use task_number if available, otherwise use task id
      const taskId = typeof id === 'number' ? id : id;
      await updateTask(taskId, { status });
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (id: number | string) => {
    try {
      // Use task_number if available, otherwise use task id
      const taskId = typeof id === 'number' ? id : id;
      await deleteTask(taskId);
      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-blue-600 border-r-purple-600 border-b-pink-600 mx-auto mb-6 shadow-2xl"></div>
          </div>
          <p className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

 return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950">
      {/* Enhanced Header with glassmorphism */}
      <header className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl shadow-2xl border-b border-gray-200/50 dark:border-gray-700/50 z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
        <div className="relative px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo with animated gradient */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-2 rounded-xl shadow-2xl transform hover:scale-110 hover:rotate-3 transition-all">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Task Manager
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-0.5">
                Manage your tasks with the power of AI ✨
              </p>
            </div>
          </div>
           {/* <button
            onClick={handleToggleDarkMode}
            className="group relative p-3 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-110 hover:rotate-12 border border-gray-300 dark:border-gray-600"
            aria-label="Toggle dark mode"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            {darkMode ? (
              <Sun size={24} className="text-yellow-500 relative z-10" />
            ) : (
              <Moon size={24} className="text-gray-700 relativ z-10" />
            )}
          </button>  */}
          
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
        {/* Chat Section (Left Panel) */}
        <div className="w-full md:w-1/2 border-r border-gray-300/50 dark:border-gray-700/50 flex flex-col shadow-2xl">
          <div className="flex-1 min-h-0">
            <ChatInterface onTasksUpdated={fetchTasks} />
          </div>
        </div>

        {/* Task List Section (Right Panel) */}
        <div className="w-full md:w-1/2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl overflow-auto shadow-2xl">
          <TaskList
            tasks={tasks}
            onToggle={handleToggleTask}
            onDelete={handleDeleteTask}
          />
        </div>
      </div>

      {/* Mobile Task List Floating Button */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowMobileTasks(true)}
          className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-full p-5 shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-110 hover:rotate-12 border-4 border-white dark:border-gray-900"
          aria-label="Open task list"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-50 blur-xl transition-opacity animate-pulse"></div>
          <Menu size={28} className="relative z-10" />
        </button>
      </div>

      {/* Mobile Slide-up Panel */}
      {showMobileTasks && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden animate-slide-up">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMobileTasks(false)}
          />
          <div className="relative w-full bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-auto border-t-4 border-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
            <div className="sticky top-0 p-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl z-10">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Your Tasks
              </h3>
              <button
                onClick={() => setShowMobileTasks(false)}
                className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all transform hover:scale-110 hover:rotate-90"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <TaskList
                tasks={tasks}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
              />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}