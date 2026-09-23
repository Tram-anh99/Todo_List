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
  return getTodoDeadline(todo).getTime() < Date.now()
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('vi-VN').format(new Date(`${date}T00:00:00`))
}

export function getTodoDeadline(todo: Pick<Todo, 'dueDate' | 'dueTime'>) {
  if (!todo.dueDate) return new Date(Number.NaN)
  const [year, month, day] = todo.dueDate.split('-').map(Number)
  const [hour, minute] = (todo.dueTime || '23:59').split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute, 0, 0)
}

export function getTodoCountdown(todo: Pick<Todo, 'dueDate' | 'dueTime' | 'completed'>, now = new Date()) {
  if (todo.completed) return { label: 'Đã hoàn thành', tone: 'success' as const, milliseconds: 0 }
  if (!todo.dueDate) return { label: 'Chưa đặt hạn', tone: 'neutral' as const, milliseconds: Number.POSITIVE_INFINITY }

  const milliseconds = getTodoDeadline(todo).getTime() - now.getTime()
  const absoluteMinutes = Math.max(1, Math.ceil(Math.abs(milliseconds) / 60000))
  const days = Math.floor(absoluteMinutes / 1440)
  const hours = Math.floor((absoluteMinutes % 1440) / 60)
  const minutes = absoluteMinutes % 60
  const duration = days > 0 ? `${days} ngày ${hours} giờ` : hours > 0 ? `${hours} giờ ${minutes} phút` : `${minutes} phút`

  if (milliseconds < 0) return { label: `Đã trễ ${duration}`, tone: 'danger' as const, milliseconds }
  if (milliseconds <= 86400000) return { label: `Còn ${duration}`, tone: 'warning' as const, milliseconds }
  return { label: `Còn ${duration}`, tone: 'neutral' as const, milliseconds }
}
