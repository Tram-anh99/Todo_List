import { useState, type FormEvent } from 'react'
import { CalendarDays, Check, Pencil, Trash2, X } from 'lucide-react'
import type { Priority, Todo, TodoDraft } from '../types/todo'
import { formatDate, isOverdue } from '../utils/todoUtils'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, draft: TodoDraft) => boolean
}

const priorityLabel = { low: 'Thấp', medium: 'Vừa', high: 'Cao' }

export function TodoItem({ todo, onToggle, onDelete, onUpdate }: TodoItemProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<TodoDraft>({ title: todo.title, priority: todo.priority, category: todo.category, dueDate: todo.dueDate })

  const save = (event: FormEvent) => {
    event.preventDefault()
    if (onUpdate(todo.id, draft)) setEditing(false)
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
          {todo.dueDate && <span className={isOverdue(todo) ? 'overdue' : ''}><CalendarDays size={14} /> {formatDate(todo.dueDate)}{isOverdue(todo) && ' · Quá hạn'}</span>}
        </div>
      </div>
      <div className="item-actions compact">
        <button className="icon-button small" onClick={() => setEditing(true)} aria-label="Sửa công việc"><Pencil size={17} /></button>
        <button className="icon-button small danger" onClick={() => onDelete(todo.id)} aria-label="Xóa công việc"><Trash2 size={17} /></button>
      </div>
    </article>
  )
}
