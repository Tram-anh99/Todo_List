import { CalendarDays, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import type { Goal } from '../types/goal'
import { areaLabels, isGoalOverdue, periodLabels, statusLabels } from '../utils/goalUtils'
import { formatDate } from '../utils/todoUtils'

interface Props {
  goal: Goal
  progress: number
  parent?: Goal
  taskCount: number
  onEdit: () => void
  onDelete: () => void
}

export function GoalCard({ goal, progress, parent, taskCount, onEdit, onDelete }: Props) {
  const overdue = isGoalOverdue(goal, progress)
  return (
    <article className="goal-card">
      <div className="goal-card-top">
        <div className="goal-badges">
          <span className={`badge area-${goal.area}`}>{areaLabels[goal.area]}</span>
          <span className="badge category">{periodLabels[goal.period]}</span>
          <span className={`status-dot status-${goal.status}`}>{statusLabels[goal.status]}</span>
        </div>
        <div className="item-actions compact">
          <button className="icon-button small" onClick={onEdit} aria-label="Sửa mục tiêu"><Pencil size={16} /></button>
          <button className="icon-button small danger" onClick={onDelete} aria-label="Xóa mục tiêu"><Trash2 size={16} /></button>
        </div>
      </div>
      <h3>{goal.title}</h3>
      {goal.description && <p className="goal-description">{goal.description}</p>}
      {parent && <p className="parent-goal"><ChevronRight size={14} /> Thuộc: {parent.title}</p>}
      <div className="progress-row"><span>Tiến độ</span><strong>{progress}%</strong></div>
      <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
      <div className="goal-footer">
        <span>{taskCount} công việc</span>
        {goal.dueDate && <span className={overdue ? 'overdue' : ''}><CalendarDays size={14} /> {formatDate(goal.dueDate)}{overdue && ' · Trễ hạn'}</span>}
      </div>
    </article>
  )
}
