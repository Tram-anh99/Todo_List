import { useMemo, useState, type CSSProperties } from 'react'
import { AlertTriangle, CheckCircle2, Crosshair, Plus, TrendingUp } from 'lucide-react'
import type { Goal, GoalArea, GoalDraft, GoalPeriod } from '../types/goal'
import type { Todo } from '../types/todo'
import { getGoalProgress, getGoalQuarter, isGoalOverdue, periodLabels } from '../utils/goalUtils'
import { GoalCard } from './GoalCard'
import { GoalForm } from './GoalForm'
import { ProgressBars } from './ProgressCharts'
import { WeeklyPlanner } from './WeeklyPlanner'

interface Props {
  goals: Goal[]
  todos: Todo[]
  onAdd: (draft: GoalDraft) => boolean
  onUpdate: (id: string, draft: GoalDraft) => boolean
  onDelete: (id: string) => void
}

const currentYear = new Date().getFullYear()
const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)
function getCurrentWeek() {
  const today = new Date()
  const target = new Date(today.valueOf())
  const dayNumber = (today.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNumber + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  return 1 + Math.round(((target.valueOf() - firstThursday.valueOf()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7)
}

export function GoalDashboard({ goals, todos, onAdd, onUpdate, onDelete }: Props) {
  const [period, setPeriod] = useState<GoalPeriod>('year')
  const [year, setYear] = useState(currentYear)
  const [quarter, setQuarter] = useState(currentQuarter)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [week, setWeek] = useState(getCurrentWeek)
  const [area, setArea] = useState<GoalArea | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Goal | undefined>()

  const progressOf = (goal: Goal) => getGoalProgress(goal.id, goals, todos)
  const yearGoals = goals.filter((goal) => goal.year === year)
  const displayedGoals = useMemo(() => yearGoals.filter((goal) => {
    if (area !== 'all' && goal.area !== area) return false
    if (goal.period !== period) return false
    if (period === 'year') return true
    if (period === 'quarter') return goal.quarter === quarter
    if (period === 'month') return goal.month === month
    return goal.week === week
  }), [yearGoals, area, period, quarter, month, week])

  const rootGoals = yearGoals.filter((goal) => goal.period === 'year' && !goal.parentId)
  const overallProgress = rootGoals.length ? Math.round(rootGoals.reduce((sum, goal) => sum + progressOf(goal), 0) / rootGoals.length) : 0
  const completed = displayedGoals.filter((goal) => progressOf(goal) === 100 || goal.status === 'completed').length
  const overdue = displayedGoals.filter((goal) => isGoalOverdue(goal, progressOf(goal))).length

  const quarterData = [1, 2, 3, 4].map((value) => {
    const group = yearGoals.filter((goal) => goal.period === 'quarter' && getGoalQuarter(goal) === value)
    return { label: `Q${value}`, count: group.length, value: group.length ? Math.round(group.reduce((sum, goal) => sum + progressOf(goal), 0) / group.length) : 0 }
  })
  const monthData = Array.from({ length: 12 }, (_, index) => index + 1).map((value) => {
    const group = yearGoals.filter((goal) => goal.period === 'month' && goal.month === value)
    return { label: `T${value}`, count: group.length, value: group.length ? Math.round(group.reduce((sum, goal) => sum + progressOf(goal), 0) / group.length) : 0 }
  })

  const openCreate = () => { setEditing(undefined); setShowForm(true) }
  const save = (draft: GoalDraft) => {
    const saved = editing ? onUpdate(editing.id, draft) : onAdd(draft)
    if (saved) { setShowForm(false); setEditing(undefined) }
    return saved
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-toolbar">
        <div className="period-tabs">
          {(Object.keys(periodLabels) as GoalPeriod[]).map((value) => <button key={value} className={period === value ? 'active' : ''} onClick={() => setPeriod(value)}>{periodLabels[value]}</button>)}
        </div>
        <div className="dashboard-filters">
          <input aria-label="Năm" type="number" min="2020" max="2100" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          {period === 'quarter' && <select aria-label="Quý" value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}>{[1, 2, 3, 4].map((value) => <option key={value} value={value}>Quý {value}</option>)}</select>}
          {period === 'month' && <select aria-label="Tháng" value={month} onChange={(e) => setMonth(Number(e.target.value))}>{Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>Tháng {value}</option>)}</select>}
          {period === 'week' && <input aria-label="Tuần" type="number" min="1" max="53" value={week} onChange={(e) => setWeek(Number(e.target.value))} />}
          <select aria-label="Lĩnh vực" value={area} onChange={(e) => setArea(e.target.value as GoalArea | 'all')}>
            <option value="all">Mọi lĩnh vực</option><option value="work">Công việc</option><option value="study">Học tập</option><option value="health">Sức khỏe</option><option value="finance">Tài chính</option><option value="personal">Bản thân</option><option value="family">Gia đình</option><option value="other">Khác</option>
          </select>
          <button className="primary-button" onClick={openCreate}><Plus size={17} /> Mục tiêu mới</button>
        </div>
      </section>

      {showForm && <GoalForm goals={goals} initial={editing} defaultYear={year} onSave={save} onCancel={() => { setShowForm(false); setEditing(undefined) }} />}

      <section className="goal-stats">
        <div><span className="stat-icon green"><TrendingUp size={20} /></span><p>Tiến độ năm</p><strong>{overallProgress}%</strong></div>
        <div><span className="stat-icon blue"><Crosshair size={20} /></span><p>Mục tiêu đang xem</p><strong>{displayedGoals.length}</strong></div>
        <div><span className="stat-icon teal"><CheckCircle2 size={20} /></span><p>Đã hoàn thành</p><strong>{completed}</strong></div>
        <div><span className="stat-icon orange"><AlertTriangle size={20} /></span><p>Có nguy cơ trễ</p><strong>{overdue}</strong></div>
      </section>

      <div className="dashboard-grid">
        <ProgressBars title="Tiến độ theo quý" subtitle={`So sánh bốn quý trong năm ${year}.`} data={quarterData} />
        <section className="panel year-progress-panel">
          <div className="section-heading"><div><h2>Mục tiêu năm {year}</h2><p>Tiến độ được tổng hợp tự động từ mục tiêu con và Todo.</p></div></div>
          <div className="donut" style={{ '--progress': `${overallProgress * 3.6}deg` } as CSSProperties}><div><strong>{overallProgress}%</strong><span>hoàn thành</span></div></div>
          <div className="year-legend"><span><i className="legend-done" /> Mục tiêu năm đã xong: {rootGoals.filter((goal) => progressOf(goal) === 100).length}</span><span><i className="legend-active" /> Còn lại: {Math.max(rootGoals.length - rootGoals.filter((goal) => progressOf(goal) === 100).length, 0)}</span></div>
        </section>
      </div>

      {period === 'month' && <ProgressBars title="Tiến độ 12 tháng" subtitle={`Mục tiêu theo từng tháng trong năm ${year}.`} data={monthData} />}
      {period === 'week' && <WeeklyPlanner goals={goals} todos={todos} week={week} year={year} />}

      <section className="goals-section">
        <div className="section-heading"><div><h2>Mục tiêu {periodLabels[period].toLowerCase()}</h2><p>{displayedGoals.length} mục tiêu phù hợp với bộ lọc.</p></div></div>
        <div className="goal-grid">
          {displayedGoals.length ? displayedGoals.map((goal) => <GoalCard
            key={goal.id}
            goal={goal}
            progress={progressOf(goal)}
            parent={goals.find((item) => item.id === goal.parentId)}
            taskCount={todos.filter((todo) => todo.goalId === goal.id).length}
            onEdit={() => { setEditing(goal); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            onDelete={() => { if (window.confirm(`Xóa mục tiêu “${goal.title}”? Các Todo liên kết sẽ được giữ lại.`)) onDelete(goal.id) }}
          />) : <div className="empty-state span-full"><span>◎</span><p>Chưa có mục tiêu trong khoảng thời gian này.</p><button className="text-button" onClick={openCreate}>Tạo mục tiêu đầu tiên</button></div>}
        </div>
      </section>
    </div>
  )
}
