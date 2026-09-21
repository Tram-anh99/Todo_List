import type { Goal } from '../types/goal'
import type { Todo } from '../types/todo'

export function getGoalProgress(goalId: string, goals: Goal[], todos: Todo[], visited = new Set<string>()): number {
  if (visited.has(goalId)) return 0
  if (goals.find((goal) => goal.id === goalId)?.status === 'completed') return 100
  const nextVisited = new Set(visited).add(goalId)
  const directTodos = todos.filter((todo) => todo.goalId === goalId)
  const children = goals.filter((goal) => goal.parentId === goalId)
  const units = [
    ...directTodos.map((todo) => todo.completed ? 100 : 0),
    ...children.map((goal) => getGoalProgress(goal.id, goals, todos, nextVisited)),
  ]
  if (!units.length) return goals.find((goal) => goal.id === goalId)?.status === 'completed' ? 100 : 0
  return Math.round(units.reduce((sum, value) => sum + value, 0) / units.length)
}

export function getGoalQuarter(goal: Goal) {
  if (goal.quarter) return goal.quarter
  if (goal.month) return Math.ceil(goal.month / 3)
  if (goal.dueDate) return Math.ceil((Number(goal.dueDate.slice(5, 7)) || 1) / 3)
  return undefined
}

export function isGoalOverdue(goal: Goal, progress: number) {
  if (!goal.dueDate || progress >= 100 || goal.status === 'completed') return false
  const today = new Date()
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return goal.dueDate < localToday
}

export const areaLabels = {
  work: 'Công việc', study: 'Học tập', health: 'Sức khỏe', finance: 'Tài chính',
  personal: 'Bản thân', family: 'Gia đình', other: 'Khác',
} as const

export const statusLabels = {
  planned: 'Dự kiến', active: 'Đang thực hiện', completed: 'Hoàn thành', paused: 'Tạm dừng',
} as const

export const periodLabels = { year: 'Năm', quarter: 'Quý', month: 'Tháng', week: 'Tuần' } as const
