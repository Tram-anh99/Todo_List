import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import type { Goal } from '../types/goal'
import type { Priority, TodoDraft } from '../types/todo'

interface TodoFormProps {
  onAdd: (draft: TodoDraft) => boolean
  goals: Goal[]
}

export function TodoForm({ onAdd, goals }: TodoFormProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [category, setCategory] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [goalId, setGoalId] = useState('')
  const [error, setError] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!onAdd({ title, priority, category, dueDate, goalId })) {
      setError('Vui lòng nhập tên công việc.')
      return
    }
    setTitle('')
    setCategory('')
    setDueDate('')
    setGoalId('')
    setError('')
  }

  return (
    <form className="todo-form" onSubmit={submit}>
      <div className="main-input-row">
        <label className="sr-only" htmlFor="task-title">Tên công việc</label>
        <input id="task-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bạn cần làm gì?" />
        <button className="primary-button" type="submit"><Plus size={18} /> Thêm việc</button>
      </div>
      <div className="task-options four-columns">
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
        <label>Mục tiêu liên kết
          <select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
            <option value="">Không liên kết</option>
            {goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
          </select>
        </label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  )
}
