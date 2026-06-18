import { Quest } from '../types';

interface TaskCompletion {
  task_id: string;
  user_id: string;
}

/** Derive kanban status from assignee mode and completion records. */
export function deriveTaskStatus(
  assigneeId: string | null | undefined,
  completions: TaskCompletion[],
  taskId: string,
  currentUserId: string
): Pick<Quest, 'status' | 'completedByMe' | 'completionsCount'> {
  const taskCompletions = completions.filter(c => c.task_id === taskId);
  const completionsCount = taskCompletions.length;
  const completedByMe = taskCompletions.some(c => c.user_id === currentUserId);

  if (assigneeId) {
    const assigneeCompleted = taskCompletions.some(c => c.user_id === assigneeId);
    return {
      status: assigneeCompleted ? 'completed' : 'todo',
      completedByMe: assigneeId === currentUserId && completedByMe,
      completionsCount,
    };
  }

  return {
    status: completedByMe ? 'completed' : 'todo',
    completedByMe,
    completionsCount,
  };
}

export function isTaskLockedForUser(
  assigneeId: string | null | undefined,
  currentUserId: string
): boolean {
  return !!assigneeId && assigneeId !== currentUserId;
}
