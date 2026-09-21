import type { Goal, GoalDraft } from '../types/goal'
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

export const parentPeriod = {
  year: null,
  quarter: 'year',
  month: 'quarter',
  week: 'month',
  day: 'week',
} as const

export function isEligibleGoalParent(child: Goal | GoalDraft, parent: Goal) {
  if (parent.period !== parentPeriod[child.period] || parent.year !== child.year) return false
  if (child.period === 'month') return parent.quarter === child.quarter
  if (child.period === 'week') return parent.month === child.month
  if (child.period === 'day') return parent.week === child.week
  return true
}

export function autoLinkGoalHierarchy(goals: Goal[]) {
  return goals.map((goal) => {
    if (goal.period === 'year' || goal.parentId) return goal
    const candidates = goals.filter((parent) => parent.id !== goal.id && isEligibleGoalParent(goal, parent))
    return candidates.length === 1 ? { ...goal, parentId: candidates[0].id } : goal
  })
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

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function getGoalPeriodRange(goal: Goal | GoalDraft) {
  const year = goal.year
  if (goal.period === 'year') return { start: `${year}-01-01`, end: `${year}-12-31` }
  if (goal.period === 'quarter') {
    const quarter = goal.quarter ?? 1
    const startMonth = (quarter - 1) * 3
    return {
      start: isoDate(new Date(Date.UTC(year, startMonth, 1))),
      end: isoDate(new Date(Date.UTC(year, startMonth + 3, 0))),
    }
  }
  if (goal.period === 'month') {
    const month = goal.month ?? 1
    return {
      start: isoDate(new Date(Date.UTC(year, month - 1, 1))),
      end: isoDate(new Date(Date.UTC(year, month, 0))),
    }
  }
  if (goal.period === 'day') {
    const day = goal.day || `${year}-01-01`
    return { start: day, end: day }
  }
  const week = goal.week ?? 1
  const januaryFourth = new Date(Date.UTC(year, 0, 4))
  const day = januaryFourth.getUTCDay() || 7
  const monday = new Date(januaryFourth)
  monday.setUTCDate(januaryFourth.getUTCDate() - day + 1 + (week - 1) * 7)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  return { start: isoDate(monday), end: isoDate(sunday) }
}

export function getISOWeek(dateString: string) {
  const date = new Date(`${dateString}T12:00:00Z`)
  const target = new Date(date.valueOf())
  const dayNumber = (date.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNumber + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  return 1 + Math.round(((target.valueOf() - firstThursday.valueOf()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
}

export function getISOWeekRange(year: number, week: number) {
  const januaryFourth = new Date(Date.UTC(year, 0, 4))
  const day = januaryFourth.getUTCDay() || 7
  const monday = new Date(januaryFourth)
  monday.setUTCDate(januaryFourth.getUTCDate() - day + 1 + (week - 1) * 7)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setUTCDate(monday.getUTCDate() + index)
    return isoDate(date)
  })
}

function dayDistance(from: string, to: string) {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000)
}

export function getDeadlineMeta(goal: Goal | GoalDraft) {
  if (!goal.dueDate) return { periodNote: '', countdown: '', tone: 'neutral' as const }
  const range = getGoalPeriodRange(goal)
  let periodNote = ''
  if (goal.dueDate < range.start) periodNote = 'Dự kiến hoàn thành sớm hơn kỳ'
  if (goal.dueDate > range.end) periodNote = 'Cảnh báo: deadline nằm ngoài kỳ mục tiêu'

  if ('completedAt' in goal && goal.completedAt) {
    const completedDate = goal.completedAt.slice(0, 10)
    const difference = dayDistance(completedDate, goal.dueDate)
    if (difference > 0) return { periodNote, countdown: `Hoàn thành sớm ${difference} ngày`, tone: 'success' as const }
    if (difference < 0) return { periodNote, countdown: `Hoàn thành muộn ${Math.abs(difference)} ngày`, tone: 'danger' as const }
    return { periodNote, countdown: 'Hoàn thành đúng hạn', tone: 'success' as const }
  }

  const today = new Date()
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const remaining = dayDistance(localToday, goal.dueDate)
  if (remaining < 0) return { periodNote, countdown: `Đã quá hạn ${Math.abs(remaining)} ngày`, tone: 'danger' as const }
  if (remaining === 0) return { periodNote, countdown: 'Hết hạn hôm nay', tone: 'warning' as const }
  if (remaining <= 7) return { periodNote, countdown: `Còn ${remaining} ngày`, tone: 'warning' as const }
  return { periodNote, countdown: `Còn ${remaining} ngày`, tone: 'neutral' as const }
}

export const areaLabels = {
  work: 'Công việc', study: 'Học tập', health: 'Sức khỏe', finance: 'Tài chính',
  personal: 'Bản thân', family: 'Gia đình', other: 'Khác',
} as const

export const statusLabels = {
  planned: 'Dự kiến', active: 'Đang thực hiện', completed: 'Hoàn thành', paused: 'Tạm dừng',
} as const

export const periodLabels = { year: 'Năm', quarter: 'Quý', month: 'Tháng', week: 'Tuần', day: 'Ngày' } as const
