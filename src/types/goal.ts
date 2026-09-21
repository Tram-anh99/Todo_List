export type GoalPeriod = 'year' | 'quarter' | 'month' | 'week'
export type GoalStatus = 'planned' | 'active' | 'completed' | 'paused'
export type GoalArea = 'work' | 'study' | 'health' | 'finance' | 'personal' | 'family' | 'other'

export interface Goal {
  id: string
  title: string
  description?: string
  area: GoalArea
  period: GoalPeriod
  year: number
  quarter?: number
  month?: number
  week?: number
  parentId?: string
  status: GoalStatus
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  completedAt?: string
  createdAt: string
  updatedAt?: string
}

export type GoalDraft = Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>
