import type { SortOption, Todo } from '../types/todo'

const priorityRank = { high: 3, medium: 2, low: 1 }

export function sortTodos(todos: Todo[], sortBy: SortOption) {
  return [...todos].sort((a, b) => {
    if (sortBy === 'oldest') return Date.parse(a.createdAt) - Date.parse(b.createdAt)
    if (sortBy === 'priority') return priorityRank[b.priority] - priorityRank[a.priority]
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.localeCompare(b.dueDate)
    }
    return Date.parse(b.createdAt) - Date.parse(a.createdAt)
  })
}

export function isOverdue(todo: Todo) {
  if (!todo.dueDate || todo.completed) return false
  const today = new Date()
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return todo.dueDate < localToday
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('vi-VN').format(new Date(`${date}T00:00:00`))
}
