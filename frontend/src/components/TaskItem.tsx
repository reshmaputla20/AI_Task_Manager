// 'use client';

// import { Task } from '@/lib/api';
// import { Check, Clock, Trash2, Circle, CheckCircle2, Timer } from 'lucide-react';
// import { format } from 'date-fns';

// interface TaskItemProps {
//   task: Task;
//   onToggle: (id: number, status: Task['status']) => void;
//   onDelete: (id: number) => void;
// }

// export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {

//   return null
//   // const priorityColors = {
//   //   low: {
//   //     gradient: 'from-blue-500 via-blue-600 to-cyan-600',
//   //     bgGradient: 'from-blue-50/80 via-cyan-50/80 to-blue-50/80 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-blue-950/30',
//   //     textColor: 'text-blue-700 dark:text-blue-300',
//   //     icon: '🔵',
//   //   },
//   //   medium: {
//   //     gradient: 'from-yellow-500 via-orange-500 to-yellow-600',
//   //     bgGradient: 'from-yellow-50/80 via-orange-50/80 to-yellow-50/80 dark:from-yellow-950/30 dark:via-orange-950/30 dark:to-yellow-950/30',
//   //     textColor: 'text-yellow-700 dark:text-yellow-300',
//   //     icon: '🟡',
//   //   },
//   //   high: {
//   //     gradient: 'from-red-500 via-pink-600 to-red-600',
//   //     bgGradient: 'from-red-50/80 via-pink-50/80 to-red-50/80 dark:from-red-950/30 dark:via-pink-950/30 dark:to-red-950/30',
//   //     textColor: 'text-red-700 dark:text-red-300',
//   //     icon: '🔴',
//   //   },
//   // };

//   // const statusColors = {
//   //   todo: {
//   //     bg: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl',
//   //     icon: Circle,
//   //     iconColor: 'text-gray-400',
//   //     label: 'To Do',
//   //   },
//   //   in_progress: {
//   //     bg: 'bg-gradient-to-br from-blue-50/90 via-indigo-50/90 to-purple-50/90 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 backdrop-blur-xl',
//   //     icon: Timer,
//   //     iconColor: 'text-blue-600 dark:text-blue-400',
//   //     label: 'In Progress',
//   //   },
//   //   done: {
//   //     bg: 'bg-gradient-to-br from-green-50/90 via-emerald-50/90 to-teal-50/90 dark:from-green-950/40 dark:via-emerald-950/40 dark:to-teal-950/40 backdrop-blur-xl',
//   //     icon: CheckCircle2,
//   //     iconColor: 'text-green-600 dark:text-green-400',
//   //     label: 'Completed',
//   //   },
//   // };

//   // const priority = priorityColors[task.priority];
//   // const status = statusColors[task.status];
//   // const StatusIcon = status.icon;

//   // const getNextStatus = (current: Task['status']): Task['status'] => {

//   //   if (current === 'todo') return 'in_progress';
//   //   if (current === 'in_progress') return 'done';
//   //   return 'todo';
//   // };

//   // return (
//   //   <div
//   //     className={`group relative rounded-2xl p-6 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] transform ${status.bg} overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md`}
//   //   >
//   //     {/* Animated background gradient */}
//   //     <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
//   //       <div className={`absolute inset-0 bg-gradient-to-br ${priority.bgGradient} blur-xl`}></div>
//   //     </div>

//   //     {/* Content */}
//   //     <div className="relative flex items-start gap-4">
//   //       {/* Toggle Button */}
//   //       {/* <button
//   //         onClick={() => onToggle(task.id, getNextStatus(task.status))}
//   //         className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md ${
//   //           task.status === 'done'
//   //             ? 'bg-green-500 border-green-500 text-white'
//   //             : 'border-gray-300 hover:border-green-500 bg-white dark:bg-gray-700'
//   //         }`}
//   //         title="Toggle status"
//   //       >
//   //         {task.status === 'done' && <Check size={16} />}
//   //       </button> */}

//   //       {/* Task Content */}
//   //       <div className="flex-grow min-w-0">
//   //         <div className="flex items-start justify-between gap-3 mb-4">
//   //           <h3
//   //             className={`font-bold text-xl leading-tight transition-all ${
//   //               task.status === 'done'
//   //                 ? 'line-through text-gray-500 dark:text-gray-600'
//   //                 : 'text-gray-900 dark:text-white'
//   //             }`}
//   //           >
//   //             {task.title}
//   //           </h3>

//   //           {/* Status Badge */}
//   //           <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${status.bg} shadow-sm border border-transparent`}>
//   //             <StatusIcon size={16} className={status.iconColor} />
//   //             <span className={`text-sm font-semibold ${status.iconColor}`}>
//   //               {status.label}
//   //             </span>
//   //           </div>
//   //         </div>

//   //         {/* Tags Section */}
//   //         <div className="flex flex-wrap gap-3">
//   //           {/* Priority Badge */}
//   //           <div
//   //             className={`group/badge relative px-4 py-2 rounded-full text-sm font-bold shadow-lg transform hover:scale-110 transition-all cursor-default overflow-hidden`}
//   //           >
//   //             <div className={`absolute inset-0 bg-gradient-to-r ${priority.gradient} opacity-90 group-hover/badge:opacity-100 transition-opacity`}></div>
//   //             <div className="relative flex items-center gap-2 text-white z-10">
//   //               <span>{priority.icon}</span>
//   //               <span className="uppercase tracking-wide">{task.priority}</span>
//   //             </div>
//   //           </div>

//   //           {/* Due Date Badge */}
//   //           {task.due_date && (
//   //             <div className="relative px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 dark:from-purple-950/60 dark:via-pink-950/60 dark:to-purple-950/60 text-purple-800 dark:text-purple-300 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 transition-all border border-purple-200 dark:border-purple-800">
//   //               <Clock size={14} />
//   //               <span>{format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
//   //             </div>
//   //           )}
//   //         </div>
//   //       </div>

//   //       {/* Delete Button */}
//   //       <button
//   //         onClick={() => onDelete(task.id)}
//   //         className="flex-shrink-0 p-3 bg-transparent text-red-500 hover:text-white hover:bg-gradient-to-br hover:from-red-500 hover:to-pink-600 transition-all duration-300 hover:scale-110 hover:rotate-3 shadow-lg hover:shadow-red-500/50 hover:border-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg"
//   //         title="Delete task"
//   //       >
//   //         <Trash2 size={18} />
//   //       </button>
//   //     </div>
//   //   </div>
//   // );
// }