import { useState, type FormEvent } from 'react'
import { CalendarDays, Check, Pencil, Trash2, X } from 'lucide-react'
import type { Goal } from '../types/goal'
import type { Priority, Todo, TodoDraft } from '../types/todo'
import { formatDate, getTodoCountdown, isOverdue } from '../utils/todoUtils'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, draft: TodoDraft) => boolean
  goals: Goal[]
}

const priorityLabel = { low: 'Thấp', medium: 'Vừa', high: 'Cao' }

export function TodoItem({ todo, onToggle, onDelete, onUpdate, goals }: TodoItemProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<TodoDraft>({ title: todo.title, priority: todo.priority, category: todo.category, dueDate: todo.dueDate, dueTime: todo.dueTime, goalId: todo.goalId })
  const linkedGoal = goals.find((goal) => goal.id === todo.goalId)
  const countdown = getTodoCountdown(todo)

  const save = (event: FormEvent) => {
    event.preventDefault()
    const selectedGoal = goals.find((goal) => goal.id === draft.goalId)
    if (onUpdate(todo.id, { ...draft, dueDate: selectedGoal?.day || draft.dueDate })) setEditing(false)
  }

  if (editing) return (
    <form className="todo-item edit-card" onSubmit={save}>
      <input className="edit-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} autoFocus />
      <div className="edit-options">
        <select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })}>
          <option value="low">Thấp</option><option value="medium">Vừa</option><option value="high">Cao</option>
        </select>
        <input value={draft.category || ''} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="Danh mục" />
        <input type="date" value={draft.dueDate || ''} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
        <input type="time" value={draft.dueTime || ''} onChange={(e) => setDraft({ ...draft, dueTime: e.target.value })} />
        <select value={draft.goalId || ''} onChange={(e) => {
          const nextGoalId = e.target.value
          const nextGoal = goals.find((goal) => goal.id === nextGoalId)
          setDraft({ ...draft, goalId: nextGoalId, dueDate: nextGoal?.day || draft.dueDate })
          }}>
          <option value="">Không liên kết mục tiêu</option>
          {linkedGoal && linkedGoal.period !== 'day' && <option value={linkedGoal.id}>{linkedGoal.title} · liên kết cũ</option>}
          {goals.filter((goal) => goal.period === 'day').map((goal) => <option key={goal.id} value={goal.id}>{goal.day ? `${goal.day} · ` : ''}{goal.title}</option>)}
        </select>
      </div>
      <div className="item-actions">
        <button className="save-button" type="submit"><Check size={17} /> Lưu</button>
        <button className="text-button" type="button" onClick={() => setEditing(false)}><X size={17} /> Hủy</button>
      </div>
    </form>
  )

  return (
    <article className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <button className="check-button" onClick={() => onToggle(todo.id)} aria-label={todo.completed ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}>
        {todo.completed && <Check size={16} strokeWidth={3} />}
      </button>
      <div className="todo-content">
        <h3>{todo.title}</h3>
        <div className="todo-meta">
          <span className={`badge priority-${todo.priority}`}>{priorityLabel[todo.priority]}</span>
          {todo.category && <span className="badge category">{todo.category}</span>}
          {linkedGoal && <span className="badge goal-link">↗ {linkedGoal.title}</span>}
          {!linkedGoal && todo.dueDate && <span className="badge goal-link fallback-link">↗ Tự xếp theo deadline</span>}
          {todo.dueDate && <span className={isOverdue(todo) ? 'overdue' : ''}><CalendarDays size={14} /> {formatDate(todo.dueDate)}{todo.dueTime ? ` ${todo.dueTime}` : ''}{isOverdue(todo) && ' · Quá hạn'}</span>}
          <span className={`countdown-inline countdown-${countdown.tone}`}>{countdown.label}</span>
        </div>
      </div>
      <div className="item-actions compact">
        <button className="icon-button small" onClick={() => setEditing(true)} aria-label="Sửa công việc"><Pencil size={17} /></button>
        <button className="icon-button small danger" onClick={() => onDelete(todo.id)} aria-label="Xóa công việc"><Trash2 size={17} /></button>
      </div>
    </article>
  )
}
