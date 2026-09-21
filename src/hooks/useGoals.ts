import { useEffect, useState } from 'react'
import type { Goal, GoalDraft } from '../types/goal'

const STORAGE_KEY = 'my-tasks.goals.v1'

function loadGoals(): Goal[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>(loadGoals)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
  }, [goals])

  const addGoal = (draft: GoalDraft) => {
    const title = draft.title.trim()
    if (!title) return false
    setGoals((current) => [...current, {
      ...draft,
      title,
      description: draft.description?.trim() || undefined,
      parentId: draft.parentId || undefined,
      dueDate: draft.dueDate || undefined,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }])
    return true
  }

  const updateGoal = (id: string, draft: GoalDraft) => {
    const title = draft.title.trim()
    if (!title) return false
    setGoals((current) => current.map((goal) => goal.id === id ? {
      ...goal,
      ...draft,
      title,
      description: draft.description?.trim() || undefined,
      parentId: draft.parentId || undefined,
      dueDate: draft.dueDate || undefined,
      updatedAt: new Date().toISOString(),
    } : goal))
    return true
  }

  const deleteGoal = (id: string) => {
    setGoals((current) => current
      .filter((goal) => goal.id !== id)
      .map((goal) => goal.parentId === id ? { ...goal, parentId: undefined } : goal))
  }

  return { goals, addGoal, updateGoal, deleteGoal }
}
