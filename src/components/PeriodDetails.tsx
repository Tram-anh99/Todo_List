import { CheckCircle2, Circle } from 'lucide-react'
import type { Goal } from '../types/goal'
import type { Todo } from '../types/todo'

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
}

export function PeriodDetails({ title, subtitle, groups, getProgress }: Props) {
  return (
    <section className="panel period-details">
      <div className="section-heading"><div><h2>{title}</h2><p>{subtitle}</p></div></div>
      <div className="period-detail-grid">
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
                {group.goals.slice(0, 4).map((goal) => <li key={goal.id}>{getProgress(goal) === 100 ? <CheckCircle2 size={14} /> : <Circle size={14} />}<span>{goal.title}</span></li>)}
                {(group.todos || []).slice(0, 4).map((todo) => <li key={todo.id}>{todo.completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}<span>{todo.title}</span></li>)}
                {!itemCount && <li className="muted-item">Chưa có mục tiêu chi tiết.</li>}
                {itemCount > 4 && <li className="more-items">+{itemCount - 4} mục khác</li>}
              </ul>
            </article>
          )
        })}
      </div>
    </section>
  )
}
