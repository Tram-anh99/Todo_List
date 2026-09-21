import { CalendarCheck, CircleAlert, Flag } from 'lucide-react'
import type { Goal } from '../types/goal'
import type { Todo } from '../types/todo'

interface Props { goals: Goal[]; todos: Todo[]; week: number; year: number }

function getISOWeek(dateString?: string) {
  if (!dateString) return undefined
  const date = new Date(`${dateString}T12:00:00`)
  const target = new Date(date.valueOf())
  const dayNumber = (date.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNumber + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  return 1 + Math.round(((target.valueOf() - firstThursday.valueOf()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7)
}

export function WeeklyPlanner({ goals, todos, week, year }: Props) {
  const weekGoals = goals.filter((goal) => goal.period === 'week' && goal.year === year && (goal.week === week || getISOWeek(goal.dueDate) === week))
  const weekTasks = todos.filter((todo) => {
    if (!todo.dueDate) return false
    return Number(todo.dueDate.slice(0, 4)) === year && getISOWeek(todo.dueDate) === week
  })
  const focus = [...weekGoals].sort((a, b) => ({ high: 3, medium: 2, low: 1 }[b.priority] - { high: 3, medium: 2, low: 1 }[a.priority])).slice(0, 3)
  const overdue = weekTasks.filter((todo) => !todo.completed && todo.dueDate && todo.dueDate < new Date().toISOString().slice(0, 10)).length

  return (
    <section className="panel weekly-planner">
      <div className="section-heading"><div><h2>Kế hoạch tuần {week}</h2><p>Ưu tiên và công việc cần tập trung trong tuần.</p></div></div>
      <div className="weekly-summary">
        <div><CalendarCheck size={20} /><strong>{weekTasks.length}</strong><span>Công việc</span></div>
        <div><Flag size={20} /><strong>{weekGoals.length}</strong><span>Mục tiêu</span></div>
        <div className={overdue ? 'warning' : ''}><CircleAlert size={20} /><strong>{overdue}</strong><span>Đang trễ</span></div>
      </div>
      <h3 className="focus-title">Ba ưu tiên quan trọng</h3>
      <ol className="focus-list">
        {focus.length ? focus.map((goal) => <li key={goal.id}><span>{goal.title}</span><small>{goal.priority === 'high' ? 'Cao' : goal.priority === 'medium' ? 'Vừa' : 'Thấp'}</small></li>) : <li className="muted-item">Chưa có mục tiêu cho tuần này.</li>}
      </ol>
    </section>
  )
}
