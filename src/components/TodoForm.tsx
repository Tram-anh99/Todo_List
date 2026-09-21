import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import type { Priority, TodoDraft } from '../types/todo'

interface TodoFormProps { onAdd: (draft: TodoDraft) => boolean }

export function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [category, setCategory] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!onAdd({ title, priority, category, dueDate })) {
      setError('Vui lòng nhập tên công việc.')
      return
    }
    setTitle('')
    setCategory('')
    setDueDate('')
    setError('')
  }

  return (
    <form className="todo-form" onSubmit={submit}>
      <div className="main-input-row">
        <label className="sr-only" htmlFor="task-title">Tên công việc</label>
        <input id="task-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bạn cần làm gì?" />
        <button className="primary-button" type="submit"><Plus size={18} /> Thêm việc</button>
      </div>
      <div className="task-options">
        <label>Ưu tiên
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            <option value="low">Thấp</option><option value="medium">Vừa</option><option value="high">Cao</option>
          </select>
        </label>
        <label>Danh mục
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Công việc, Cá nhân..." />
        </label>
        <label>Hạn chót
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  )
}
