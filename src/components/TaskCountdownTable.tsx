import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3 } from 'lucide-react'
import type { Goal } from '../types/goal'
import type { Todo } from '../types/todo'
import { periodLabels } from '../utils/goalUtils'
import { formatDate, getTodoCountdown } from '../utils/todoUtils'

interface Props {
  todos: Todo[]
  goals: Goal[]
  periodLabel: string
}

const priorityLabels = { high: 'Cao', medium: 'Vừa', low: 'Thấp' }

export function TaskCountdownTable({ todos, goals, periodLabel }: Props) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  const rows = useMemo(() => [...todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return getTodoCountdown(a, now).milliseconds - getTodoCountdown(b, now).milliseconds
  }), [todos, now])

  return (
    <section className="panel countdown-board">
      <div className="section-heading">
        <div><h2>Đếm ngược công việc</h2><p>Task liên kết mục tiêu hoặc tự xếp theo deadline trong {periodLabel}; đồng hồ tự cập nhật mỗi phút.</p></div>
        <span className="countdown-total"><Clock3 size={16} /> {rows.filter((todo) => !todo.completed).length} việc chưa xong</span>
      </div>
      {rows.length ? <div className="countdown-table-wrap"><table className="countdown-table">
        <thead><tr><th>Công việc</th><th>Nguồn liên kết</th><th>Hạn chót</th><th>Ưu tiên</th><th>Thời gian còn lại</th></tr></thead>
        <tbody>{rows.map((todo) => {
          const goal = goals.find((item) => item.id === todo.goalId)
          const countdown = getTodoCountdown(todo, now)
          return <tr key={todo.id} className={todo.completed ? 'completed-row' : ''}>
            <td><strong>{todo.title}</strong></td>
            <td>{goal ? <><b>{goal.title}</b><small>Mục tiêu {periodLabels[goal.period]}{goal.day ? ` · ${formatDate(goal.day)}` : ' · xếp theo deadline'}</small></> : <><b className="deadline-link"><Clock3 size={14} /> Theo deadline</b><small>Chưa liên kết mục tiêu Ngày</small></>}</td>
            <td>{todo.dueDate ? `${formatDate(todo.dueDate)}${todo.dueTime ? ` · ${todo.dueTime}` : ' · 23:59'}` : 'Chưa đặt hạn'}</td>
            <td><span className={`badge priority-${todo.priority}`}>{priorityLabels[todo.priority]}</span></td>
            <td><span className={`countdown-status countdown-${countdown.tone}`}>{todo.completed && <CheckCircle2 size={14} />}{countdown.label}</span></td>
          </tr>
        })}</tbody>
      </table></div> : <div className="empty-state"><span>◷</span><p>Chưa có Task liên kết hoặc có deadline trong thời điểm này.</p></div>}
    </section>
  )
}
