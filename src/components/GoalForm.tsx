import { useState, type FormEvent } from 'react'
import { Check, X } from 'lucide-react'
import type { Goal, GoalArea, GoalDraft, GoalPeriod, GoalStatus } from '../types/goal'
import { areaLabels, getDeadlineMeta, getGoalPeriodRange, getISOWeek, isEligibleGoalParent, parentPeriod, periodLabels, statusLabels } from '../utils/goalUtils'
import { formatDate } from '../utils/todoUtils'

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
    year: initial.year, quarter: initial.quarter, month: initial.month, week: initial.week, day: initial.day,
    parentId: initial.parentId, status: initial.status, priority: initial.priority, dueDate: initial.dueDate,
  } : createDraft(defaultYear))
  const [error, setError] = useState('')
  const periodRange = getGoalPeriodRange(draft)
  const deadlineMeta = getDeadlineMeta(draft)
  const parentContext: GoalDraft = {
    ...draft,
    quarter: draft.period === 'year' ? undefined : (draft.quarter ?? Math.ceil((draft.month ?? 1) / 3)),
    month: ['month', 'week', 'day'].includes(draft.period) ? (draft.month ?? 1) : undefined,
    week: ['week', 'day'].includes(draft.period) ? (draft.week ?? 1) : undefined,
  }
  const parentCandidates = goals.filter((goal) => goal.id !== initial?.id && isEligibleGoalParent(parentContext, goal))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const normalized: GoalDraft = {
      ...draft,
      quarter: draft.period === 'year' ? undefined : (draft.quarter ?? Math.ceil((draft.month ?? 1) / 3)),
      month: ['month', 'week', 'day'].includes(draft.period) ? (draft.month ?? 1) : undefined,
      week: ['week', 'day'].includes(draft.period) ? (draft.week ?? 1) : undefined,
      day: draft.period === 'day' ? (draft.day || `${draft.year}-01-01`) : undefined,
      parentId: draft.period === 'year' ? undefined : draft.parentId,
    }
    if (normalized.period !== 'year') {
      const selectedParent = goals.find((goal) => goal.id === normalized.parentId)
      if (!selectedParent || !isEligibleGoalParent(normalized, selectedParent)) {
        setError(`Vui lòng chọn mục tiêu cha cấp ${periodLabels[parentPeriod[normalized.period]!]} phù hợp.`)
        return
      }
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
          <select value={draft.period} onChange={(e) => setDraft({ ...draft, period: e.target.value as GoalPeriod, parentId: '' })}>
            {Object.entries(periodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>Năm
          <input type="number" min="2020" max="2100" value={draft.year} onChange={(e) => setDraft({ ...draft, year: Number(e.target.value), parentId: '' })} />
        </label>
        {draft.period !== 'year' && <label>Quý
          <select value={draft.quarter || 1} onChange={(e) => setDraft({ ...draft, quarter: Number(e.target.value), parentId: '' })}>
            {[1, 2, 3, 4].map((value) => <option key={value} value={value}>Quý {value}</option>)}
          </select>
        </label>}
        {['month', 'week', 'day'].includes(draft.period) && <label>Tháng
          <select value={draft.month || 1} onChange={(e) => setDraft({ ...draft, month: Number(e.target.value), quarter: Math.ceil(Number(e.target.value) / 3), parentId: '' })}>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>Tháng {value}</option>)}
          </select>
        </label>}
        {['week', 'day'].includes(draft.period) && <label>Tuần trong năm
          <input type="number" min="1" max="53" value={draft.week || 1} onChange={(e) => setDraft({ ...draft, week: Number(e.target.value), parentId: '' })} />
        </label>}
        {draft.period === 'day' && <label>Ngày mục tiêu
          <input type="date" value={draft.day || ''} onChange={(e) => {
            const day = e.target.value
            if (!day) return setDraft({ ...draft, day: '' })
            const selectedMonth = Number(day.slice(5, 7))
            setDraft({ ...draft, day, dueDate: day, year: Number(day.slice(0, 4)), month: selectedMonth, quarter: Math.ceil(selectedMonth / 3), week: getISOWeek(day), parentId: '' })
          }} />
        </label>}
        {draft.period !== 'year' && <label>Mục tiêu cha bắt buộc
          <select value={draft.parentId || ''} onChange={(e) => setDraft({ ...draft, parentId: e.target.value })}>
            <option value="">Chọn mục tiêu {periodLabels[parentPeriod[draft.period]!]}</option>
            {parentCandidates.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
          </select>
          {!parentCandidates.length && <small className="field-warning">Chưa có mục tiêu {periodLabels[parentPeriod[draft.period]!].toLowerCase()} phù hợp. Hãy tạo mục tiêu cha trước.</small>}
        </label>}
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
          <small className="field-hint">Kỳ mục tiêu: {formatDate(periodRange.start)} – {formatDate(periodRange.end)}</small>
          {deadlineMeta.periodNote && <small className={deadlineMeta.periodNote.startsWith('Cảnh báo') ? 'field-warning' : 'field-note'}>{deadlineMeta.periodNote}</small>}
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
