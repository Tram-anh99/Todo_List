import { useState, type FormEvent } from 'react'
import { Check, X } from 'lucide-react'
import type { Goal, GoalArea, GoalDraft, GoalPeriod, GoalStatus } from '../types/goal'
import { areaLabels, periodLabels, statusLabels } from '../utils/goalUtils'

interface Props {
  goals: Goal[]
  initial?: Goal
  defaultYear: number
  onSave: (draft: GoalDraft) => boolean
  onCancel: () => void
}

function createDraft(year: number): GoalDraft {
  return { title: '', description: '', area: 'work', period: 'year', year, status: 'active', priority: 'medium', dueDate: '', parentId: '' }
}

export function GoalForm({ goals, initial, defaultYear, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<GoalDraft>(() => initial ? {
    title: initial.title, description: initial.description, area: initial.area, period: initial.period,
    year: initial.year, quarter: initial.quarter, month: initial.month, week: initial.week,
    parentId: initial.parentId, status: initial.status, priority: initial.priority, dueDate: initial.dueDate,
  } : createDraft(defaultYear))
  const [error, setError] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const normalized: GoalDraft = {
      ...draft,
      quarter: draft.period === 'year' ? undefined : (draft.quarter ?? Math.ceil((draft.month ?? 1) / 3)),
      month: ['month', 'week'].includes(draft.period) ? (draft.month ?? 1) : undefined,
      week: draft.period === 'week' ? (draft.week ?? 1) : undefined,
    }
    if (!onSave(normalized)) {
      setError('Vui lòng nhập tên mục tiêu.')
      return
    }
    setError('')
  }

  return (
    <form className="goal-form panel" onSubmit={submit}>
      <div className="section-heading compact-heading">
        <div><p className="eyebrow">{initial ? 'CHỈNH SỬA' : 'MỤC TIÊU MỚI'}</p><h2>{initial ? initial.title : 'Tạo mục tiêu'}</h2></div>
        <button className="icon-button small" type="button" onClick={onCancel} aria-label="Đóng"><X size={17} /></button>
      </div>
      <div className="goal-form-grid">
        <label className="span-2">Tên mục tiêu
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Ví dụ: Hoàn thành bài báo khoa học" autoFocus />
        </label>
        <label>Lĩnh vực
          <select value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value as GoalArea })}>
            {Object.entries(areaLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>Cấp kế hoạch
          <select value={draft.period} onChange={(e) => setDraft({ ...draft, period: e.target.value as GoalPeriod })}>
            {Object.entries(periodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>Năm
          <input type="number" min="2020" max="2100" value={draft.year} onChange={(e) => setDraft({ ...draft, year: Number(e.target.value) })} />
        </label>
        {draft.period !== 'year' && <label>Quý
          <select value={draft.quarter || 1} onChange={(e) => setDraft({ ...draft, quarter: Number(e.target.value) })}>
            {[1, 2, 3, 4].map((value) => <option key={value} value={value}>Quý {value}</option>)}
          </select>
        </label>}
        {['month', 'week'].includes(draft.period) && <label>Tháng
          <select value={draft.month || 1} onChange={(e) => setDraft({ ...draft, month: Number(e.target.value), quarter: Math.ceil(Number(e.target.value) / 3) })}>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>Tháng {value}</option>)}
          </select>
        </label>}
        {draft.period === 'week' && <label>Tuần trong năm
          <input type="number" min="1" max="53" value={draft.week || 1} onChange={(e) => setDraft({ ...draft, week: Number(e.target.value) })} />
        </label>}
        <label>Mục tiêu cha
          <select value={draft.parentId || ''} onChange={(e) => setDraft({ ...draft, parentId: e.target.value })}>
            <option value="">Không có</option>
            {goals.filter((goal) => goal.id !== initial?.id).map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
          </select>
        </label>
        <label>Trạng thái
          <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as GoalStatus })}>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>Ưu tiên
          <select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as Goal['priority'] })}>
            <option value="low">Thấp</option><option value="medium">Vừa</option><option value="high">Cao</option>
          </select>
        </label>
        <label>Hạn hoàn thành
          <input type="date" value={draft.dueDate || ''} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
        </label>
        <label className="span-2">Mô tả / kết quả mong muốn
          <textarea value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Mục tiêu này có ý nghĩa gì và kết quả cần đạt là gì?" />
        </label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        <button className="save-button" type="submit"><Check size={17} /> {initial ? 'Lưu thay đổi' : 'Tạo mục tiêu'}</button>
        <button className="text-button" type="button" onClick={onCancel}>Hủy</button>
      </div>
    </form>
  )
}
