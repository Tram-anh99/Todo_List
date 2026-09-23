import { useEffect, useState } from 'react'
import type { Todo, TodoDraft } from '../types/todo'

const STORAGE_KEY = 'my-tasks.todos.v1'

function loadTodos(): Todo[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  const addTodo = (draft: TodoDraft) => {
    const title = draft.title.trim()
    if (!title) return false
    setTodos((current) => [
      ...current,
      {
        ...draft,
        title,
        category: draft.category?.trim() || undefined,
        dueDate: draft.dueDate || undefined,
        dueTime: draft.dueTime || undefined,
        id: crypto.randomUUID(),
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ])
    return true
  }

  const updateTodo = (id: string, draft: TodoDraft) => {
    const title = draft.title.trim()
    if (!title) return false
    setTodos((current) => current.map((todo) => todo.id === id
      ? { ...todo, ...draft, title, category: draft.category?.trim() || undefined, dueDate: draft.dueDate || undefined, dueTime: draft.dueTime || undefined, updatedAt: new Date().toISOString() }
      : todo))
    return true
  }

  const toggleTodo = (id: string) => setTodos((current) => current.map((todo) => (
    todo.id === id ? { ...todo, completed: !todo.completed, updatedAt: new Date().toISOString() } : todo
  )))

  const deleteTodo = (id: string) => setTodos((current) => current.filter((todo) => todo.id !== id))
  const clearCompleted = () => setTodos((current) => current.filter((todo) => !todo.completed))

  return { todos, addTodo, updateTodo, toggleTodo, deleteTodo, clearCompleted }
}
