export type Priority = 'low' | 'medium' | 'high'
export type Filter = 'all' | 'active' | 'completed'
export type SortOption = 'newest' | 'oldest' | 'priority' | 'dueDate'

export interface Todo {
  id: string
  title: string
  completed: boolean
  priority: Priority
  category?: string
  dueDate?: string
  dueTime?: string
  goalId?: string
  createdAt: string
  updatedAt?: string
}

export type TodoDraft = Pick<Todo, 'title' | 'priority' | 'category' | 'dueDate' | 'dueTime' | 'goalId'>
