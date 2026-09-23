import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Crosshair, Plus, TrendingUp } from 'lucide-react'
import type { Goal, GoalArea, GoalDraft, GoalPeriod } from '../types/goal'
import type { Todo } from '../types/todo'
import { getGoalAncestors, getGoalDescendants, getGoalProgress, getISOWeek, getISOWeekRange, isGoalOverdue, periodLabels } from '../utils/goalUtils'
import { formatDate } from '../utils/todoUtils'
import { GoalCard } from './GoalCard'
import { GoalForm } from './GoalForm'
import { PeriodDetails, type PeriodDetailGroup } from './PeriodDetails'
import { ProgressBars } from './ProgressCharts'
import { TaskCountdownTable } from './TaskCountdownTable'
import { WeeklyPlanner } from './WeeklyPlanner'

interface Props {
  goals: Goal[]
  todos: Todo[]
  onAdd: (draft: GoalDraft) => boolean
  onUpdate: (id: string, draft: GoalDraft) => boolean
  onDelete: (id: string) => void
}

const today = new Date()
const currentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
const childPeriod: Record<GoalPeriod, GoalPeriod | null> = { year: 'quarter', quarter: 'month', month: 'week', week: 'day', day: null }
const periodOrder: GoalPeriod[] = ['year', 'quarter', 'month', 'week', 'day']

function getWeeksInMonth(year: number, month: number) {
  const lastDay = new Date(year, month, 0).getDate()
  return [...new Set(Array.from({ length: lastDay }, (_, index) => getISOWeek(`${year}-${String(month).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`)))].sort((a, b) => a - b)
}

function groupGoalsByPeriod(period: GoalPeriod, goals: Goal[]): PeriodDetailGroup[] {
  if (period === 'quarter') {
    const values = [...new Set(goals.map((goal) => goal.quarter).filter((value): value is number => Boolean(value)))].sort((a, b) => a - b)
    return values.map((value) => ({ key: `linked-quarter-${value}`, label: `Quý ${value}`, goals: goals.filter((goal) => goal.quarter === value) }))
  }
  if (period === 'month') {
    const values = [...new Set(goals.map((goal) => goal.month).filter((value): value is number => Boolean(value)))].sort((a, b) => a - b)
    return values.map((value) => ({ key: `linked-month-${value}`, label: `Tháng ${value}`, goals: goals.filter((goal) => goal.month === value) }))
  }
  if (period === 'week') {
    const values = [...new Set(goals.map((goal) => goal.week).filter((value): value is number => Boolean(value)))].sort((a, b) => a - b)
    return values.map((value) => ({ key: `linked-week-${value}`, label: `Tuần ${value}`, goals: goals.filter((goal) => goal.week === value) }))
  }
  if (period === 'day') {
    const values = [...new Set(goals.map((goal) => goal.day).filter((value): value is string => Boolean(value)))].sort()
    return values.map((value) => ({ key: `linked-day-${value}`, label: `Ngày ${formatDate(value)}`, goals: goals.filter((goal) => goal.day === value) }))
  }
  return []
}

export function GoalDashboard({ goals, todos, onAdd, onUpdate, onDelete }: Props) {
  const [period, setPeriod] = useState<GoalPeriod>('year')
  const [year, setYear] = useState(today.getFullYear())
  const [quarter, setQuarter] = useState(Math.ceil((today.getMonth() + 1) / 3))
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [week, setWeek] = useState(getISOWeek(currentDate))
  const [day, setDay] = useState(currentDate)
  const [area, setArea] = useState<GoalArea | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Goal | undefined>()

  const progressOf = (goal: Goal) => getGoalProgress(goal.id, goals, todos)
  const matchesArea = (goal: Goal) => area === 'all' || goal.area === area
  const yearGoals = goals.filter((goal) => goal.year === year)
  const displayedGoals = useMemo(() => yearGoals.filter((goal) => {
    if (area !== 'all' && goal.area !== area) return false
    if (goal.period !== period) return false
    if (period === 'year') return true
    if (period === 'quarter') return goal.quarter === quarter
    if (period === 'month') return goal.month === month
    if (period === 'week') return goal.week === week
    return goal.day === day
  }), [yearGoals, area, period, quarter, month, week, day])

  const childGroups: PeriodDetailGroup[] = useMemo(() => {
    const parentIds = new Set(displayedGoals.map((goal) => goal.id))
    const isLinkedChild = (goal: Goal) => Boolean(goal.parentId && parentIds.has(goal.parentId))
    if (period === 'year') return [1, 2, 3, 4].map((value) => ({ key: `q-${value}`, label: `Quý ${value}`, goals: yearGoals.filter((goal) => goal.period === 'quarter' && goal.quarter === value && isLinkedChild(goal) && (area === 'all' || goal.area === area)) }))
    if (period === 'quarter') {
      const start = (quarter - 1) * 3 + 1
      return [start, start + 1, start + 2].map((value) => ({ key: `m-${value}`, label: `Tháng ${value}`, goals: yearGoals.filter((goal) => goal.period === 'month' && goal.month === value && isLinkedChild(goal) && (area === 'all' || goal.area === area)) }))
    }
    if (period === 'month') return getWeeksInMonth(year, month).map((value) => ({ key: `w-${value}`, label: `Tuần ${value}`, goals: yearGoals.filter((goal) => goal.period === 'week' && goal.week === value && goal.month === month && isLinkedChild(goal) && (area === 'all' || goal.area === area)) }))
    if (period === 'week') return getISOWeekRange(year, week).map((date, index) => ({ key: date, label: `${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][index]} · ${date.slice(8, 10)}/${date.slice(5, 7)}`, goals: goals.filter((goal) => goal.period === 'day' && goal.day === date && isLinkedChild(goal) && (area === 'all' || goal.area === area)) }))
    return [{ key: day, label: `Ngày ${formatDate(day)}`, goals: [], todos: todos.filter((todo) => Boolean(todo.goalId && parentIds.has(todo.goalId))) }]
  }, [period, yearGoals, displayedGoals, goals, todos, area, quarter, month, week, year, day])

  const linkedDescendants = useMemo(() => getGoalDescendants(displayedGoals.map((goal) => goal.id), goals)
    .filter((goal) => area === 'all' || goal.area === area), [displayedGoals, goals, area])

  const scopedGoals = useMemo(() => [...displayedGoals, ...linkedDescendants], [displayedGoals, linkedDescendants])
  const linkedDayGoals = useMemo(() => scopedGoals.filter((goal) => goal.period === 'day'), [scopedGoals])
  const linkedDayGoalIds = useMemo(() => new Set(linkedDayGoals.map((goal) => goal.id)), [linkedDayGoals])
  const linkedTaskTodos = useMemo(() => todos.filter((todo) => Boolean(todo.goalId && linkedDayGoalIds.has(todo.goalId))), [todos, linkedDayGoalIds])

  const detailSections = useMemo(() => {
    const currentIndex = periodOrder.indexOf(period)
    const goalSections = periodOrder.slice(currentIndex + 1).map((targetPeriod, index) => ({
      key: targetPeriod,
      title: `Mục tiêu ${periodLabels[targetPeriod]} thuộc ${periodLabels[period]}`,
      subtitle: index === 0
        ? `Các mục tiêu ${periodLabels[targetPeriod].toLowerCase()} liên kết trực tiếp với mục tiêu ${periodLabels[period].toLowerCase()} đang xem.`
        : `Các mục tiêu ${periodLabels[targetPeriod].toLowerCase()} được truy theo toàn bộ chuỗi liên kết từ mục tiêu ${periodLabels[period].toLowerCase()}.`,
      groups: index === 0 ? childGroups : groupGoalsByPeriod(targetPeriod, linkedDescendants.filter((goal) => goal.period === targetPeriod)),
    }))
    const taskGroups: PeriodDetailGroup[] = linkedDayGoals
      .filter((goal) => goal.day)
      .sort((a, b) => (a.day || '').localeCompare(b.day || ''))
      .map((goal) => ({
        key: `tasks-${goal.id}`,
        label: `${goal.day ? formatDate(goal.day) : 'Chưa đặt ngày'} · ${goal.title}`,
        goals: [],
        todos: linkedTaskTodos.filter((todo) => todo.goalId === goal.id),
      }))

    return [...goalSections, {
      key: 'tasks',
      title: `Task thuộc mục tiêu Ngày của ${periodLabels[period]}`,
      subtitle: 'Chỉ hiển thị công việc đã liên kết với các mục tiêu Ngày trong thời điểm đang chọn.',
      groups: taskGroups,
    }]
  }, [period, childGroups, linkedDescendants, linkedDayGoals, linkedTaskTodos])

  const chartData = childGroups.map((group) => {
    const groupGoals = [...group.goals, ...getGoalDescendants(group.goals.map((goal) => goal.id), goals)]
    const groupGoalIds = new Set(groupGoals.map((goal) => goal.id))
    const groupTodos = todos.filter((todo) => Boolean(todo.goalId && groupGoalIds.has(todo.goalId)))
    const directTodos = group.todos || []
    const uniqueTodos = [...new Map([...groupTodos, ...directTodos].map((todo) => [todo.id, todo])).values()]
    const values = group.goals.length ? group.goals.map(progressOf) : uniqueTodos.map((todo) => todo.completed ? 100 : 0)
    return { label: group.label.split(' · ')[0].replace('Quý ', 'Q').replace('Tháng ', 'T').replace('Tuần ', 'W'), count: groupGoals.length + uniqueTodos.length, goalCount: groupGoals.length, taskCount: uniqueTodos.length, value: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0 }
  })
  const periodProgress = displayedGoals.length ? Math.round(displayedGoals.reduce((sum, goal) => sum + progressOf(goal), 0) / displayedGoals.length) : 0
  const completed = displayedGoals.filter((goal) => progressOf(goal) === 100 || goal.status === 'completed').length
  const overdue = displayedGoals.filter((goal) => isGoalOverdue(goal, progressOf(goal))).length
  const detailLabel = childPeriod[period] ? periodLabels[childPeriod[period]!] : 'Công việc'
  const chartTitle = period === 'year' ? `Biểu đồ mục tiêu năm ${year}` : period === 'quarter' ? `Biểu đồ Quý ${quarter}/${year}` : period === 'month' ? `Biểu đồ Tháng ${month}/${year}` : period === 'week' ? `Biểu đồ Tuần ${week}/${year}` : `Biểu đồ ngày ${formatDate(day)}`

  const openCreate = () => { setEditing(undefined); setShowForm(true) }
  const save = (draft: GoalDraft) => {
    const saved = editing ? onUpdate(editing.id, draft) : onAdd(draft)
    if (saved) { setShowForm(false); setEditing(undefined) }
    return saved
  }
  const selectDay = (value: string) => {
    if (!value) return
    setDay(value)
    setYear(Number(value.slice(0, 4)))
    setMonth(Number(value.slice(5, 7)))
    setQuarter(Math.ceil(Number(value.slice(5, 7)) / 3))
    setWeek(getISOWeek(value))
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-toolbar">
        <div className="period-tabs">{(Object.keys(periodLabels) as GoalPeriod[]).map((value) => <button key={value} className={period === value ? 'active' : ''} onClick={() => setPeriod(value)}>{periodLabels[value]}</button>)}</div>
        <div className="dashboard-filters">
          <input aria-label="Năm" type="number" min="2020" max="2100" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          {period === 'quarter' && <select aria-label="Quý" value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}>{[1, 2, 3, 4].map((value) => <option key={value} value={value}>Quý {value}</option>)}</select>}
          {period === 'month' && <select aria-label="Tháng" value={month} onChange={(e) => setMonth(Number(e.target.value))}>{Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>Tháng {value}</option>)}</select>}
          {period === 'week' && <input aria-label="Tuần" type="number" min="1" max="53" value={week} onChange={(e) => setWeek(Number(e.target.value))} />}
          {period === 'day' && <input aria-label="Ngày" type="date" value={day} onChange={(e) => selectDay(e.target.value)} />}
          <select aria-label="Lĩnh vực" value={area} onChange={(e) => setArea(e.target.value as GoalArea | 'all')}><option value="all">Mọi lĩnh vực</option><option value="work">Công việc</option><option value="study">Học tập</option><option value="health">Sức khỏe</option><option value="finance">Tài chính</option><option value="personal">Bản thân</option><option value="family">Gia đình</option><option value="other">Khác</option></select>
          <button className="primary-button" onClick={openCreate}><Plus size={17} /> Mục tiêu mới</button>
        </div>
      </section>

      {showForm && <GoalForm goals={goals} initial={editing} defaultYear={year} onSave={save} onCancel={() => { setShowForm(false); setEditing(undefined) }} />}
      <ProgressBars title={chartTitle} subtitle={`Biểu đồ chính tổng hợp mục tiêu ${detailLabel.toLowerCase()}, mục tiêu Ngày và các Task liên kết bên dưới.`} data={chartData} />

      <section className="goal-stats">
        <div><span className="stat-icon green"><TrendingUp size={20} /></span><p>Tiến độ {periodLabels[period]}</p><strong>{periodProgress}%</strong></div>
        <div><span className="stat-icon blue"><Crosshair size={20} /></span><p>Mục tiêu đang xem</p><strong>{displayedGoals.length}</strong></div>
        <div><span className="stat-icon teal"><CheckCircle2 size={20} /></span><p>Đã hoàn thành</p><strong>{completed}</strong></div>
        <div><span className="stat-icon orange"><AlertTriangle size={20} /></span><p>Có nguy cơ trễ</p><strong>{overdue}</strong></div>
      </section>

      <section className="goals-section">
        <div className="section-heading"><div><h2>Mục tiêu {periodLabels[period]}</h2><p>{displayedGoals.length} mục tiêu đúng cấp đang được hiển thị.</p></div></div>
        <div className="goal-grid">
          {displayedGoals.length ? displayedGoals.map((goal) => {
            const descendants = getGoalDescendants([goal.id], goals)
            const goalIds = new Set([goal.id, ...descendants.map((item) => item.id)])
            return <GoalCard key={goal.id} goal={goal} progress={progressOf(goal)} parent={goals.find((item) => item.id === goal.parentId)} ancestors={getGoalAncestors(goal, goals)} taskCount={todos.filter((todo) => Boolean(todo.goalId && goalIds.has(todo.goalId))).length} childCount={descendants.length} onEdit={() => { setEditing(goal); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }} onDelete={() => { if (window.confirm(`Xóa mục tiêu “${goal.title}”? Các Todo liên kết sẽ được giữ lại.`)) onDelete(goal.id) }} />
          }) : <div className="empty-state span-full"><span>◎</span><p>Chưa có mục tiêu {periodLabels[period].toLowerCase()} trong thời điểm này.</p><button className="text-button" onClick={openCreate}>Tạo mục tiêu đầu tiên</button></div>}
        </div>
      </section>

      {period === 'week' && <WeeklyPlanner goals={goals.filter(matchesArea)} todos={todos} week={week} year={year} />}
      <TaskCountdownTable todos={linkedTaskTodos} goals={linkedDayGoals} periodLabel={chartTitle.replace('Biểu đồ ', '')} />
      {detailSections.map((section) => <PeriodDetails key={section.key} title={section.title} subtitle={section.subtitle} groups={section.groups} getProgress={progressOf} getAncestors={(goal) => getGoalAncestors(goal, goals)} />)}
    </div>
  )
}
