import { CheckCircle2, Circle } from 'lucide-react'
import type { Goal } from '../types/goal'
import type { Todo } from '../types/todo'
import { formatDate, getTodoCountdown } from '../utils/todoUtils'

export interface PeriodDetailGroup {
  key: string
  label: string
  goals: Goal[]
  todos?: Todo[]
}

interface Props {
  title: string
  subtitle: string
  groups: PeriodDetailGroup[]
  getProgress: (goal: Goal) => number
  getAncestors: (goal: Goal) => Goal[]
}

export function PeriodDetails({ title, subtitle, groups, getProgress, getAncestors }: Props) {
  return (
    <section className="panel period-details">
      <div className="section-heading"><div><h2>{title}</h2><p>{subtitle}</p></div></div>
      {groups.length ? <div className="period-detail-grid">
        {groups.map((group) => {
          const goalValues = group.goals.map(getProgress)
          const todoValues = (group.todos || []).map((todo) => todo.completed ? 100 : 0)
          const values = [...goalValues, ...todoValues]
          const progress = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0
          const itemCount = group.goals.length + (group.todos?.length || 0)
          return (
            <article className="period-detail-card" key={group.key}>
              <div className="period-detail-head"><strong>{group.label}</strong><span>{itemCount ? `${progress}%` : 'Chưa có'}</span></div>
              <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
              <ul>
                {group.goals.slice(0, 4).map((goal) => {
                  const ancestors = getAncestors(goal)
                  return <li key={goal.id}>{getProgress(goal) === 100 ? <CheckCircle2 size={14} /> : <Circle size={14} />}<span><b>{goal.title}</b><small>{ancestors.length ? `Liên kết: ${ancestors.map((item) => item.title).join(' › ')}` : 'Chưa liên kết mục tiêu cha'}</small></span></li>
                })}
                {(group.todos || []).slice(0, 4).map((todo) => {
                  const countdown = getTodoCountdown(todo)
                  return <li key={todo.id}>{todo.completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}<span><b>{todo.title}</b><small>{todo.dueDate ? `${formatDate(todo.dueDate)}${todo.dueTime ? ` ${todo.dueTime}` : ' 23:59'} · ` : ''}{countdown.label}</small></span></li>
                })}
                {!itemCount && <li className="muted-item">Chưa có mục tiêu chi tiết.</li>}
                {itemCount > 4 && <li className="more-items">+{itemCount - 4} mục khác</li>}
              </ul>
            </article>
          )
        })}
      </div> : <div className="empty-state"><span>◎</span><p>Chưa có mục tiêu liên kết ở cấp này.</p></div>}
    </section>
  )
}
