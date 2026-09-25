import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Crosshair, Plus, TrendingUp } from 'lucide-react'
import type { Goal, GoalArea, GoalDraft, GoalPeriod } from '../types/goal'
import type { Todo } from '../types/todo'
import { getGoalAncestors, getGoalDescendants, getGoalProgress, getISOWeek, getISOWeekRange, isGoalOverdue, periodLabels } from '../utils/goalUtils'
import { formatDate, isOverdue } from '../utils/todoUtils'
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

function groupGoalsByPeriod(period: GoalPeriod, goals: Goal[], todos: Todo[] = []): PeriodDetailGroup[] {
  if (period === 'quarter') {
    const values = [...new Set([
      ...goals.map((goal) => goal.quarter),
      ...todos.map((todo) => todo.dueDate ? Math.ceil(Number(todo.dueDate.slice(5, 7)) / 3) : undefined),
    ].filter((value): value is number => Boolean(value)))].sort((a, b) => a - b)
    return values.map((value) => ({ key: `linked-quarter-${value}`, label: `Quý ${value}`, goals: goals.filter((goal) => goal.quarter === value), todos: todos.filter((todo) => todo.dueDate && Math.ceil(Number(todo.dueDate.slice(5, 7)) / 3) === value) }))
  }
  if (period === 'month') {
    const values = [...new Set([
      ...goals.map((goal) => goal.month),
      ...todos.map((todo) => todo.dueDate ? Number(todo.dueDate.slice(5, 7)) : undefined),
    ].filter((value): value is number => Boolean(value)))].sort((a, b) => a - b)
    return values.map((value) => ({ key: `linked-month-${value}`, label: `Tháng ${value}`, goals: goals.filter((goal) => goal.month === value), todos: todos.filter((todo) => todo.dueDate && Number(todo.dueDate.slice(5, 7)) === value) }))
  }
  if (period === 'week') {
    const values = [...new Set([
      ...goals.map((goal) => goal.week),
      ...todos.map((todo) => todo.dueDate ? getISOWeek(todo.dueDate) : undefined),
    ].filter((value): value is number => Boolean(value)))].sort((a, b) => a - b)
    return values.map((value) => ({ key: `linked-week-${value}`, label: `Tuần ${value}`, goals: goals.filter((goal) => goal.week === value), todos: todos.filter((todo) => todo.dueDate && getISOWeek(todo.dueDate) === value) }))
  }
  if (period === 'day') {
    const values = [...new Set([
      ...goals.map((goal) => goal.day),
      ...todos.map((todo) => todo.dueDate),
    ].filter((value): value is string => Boolean(value)))].sort()
    return values.map((value) => ({ key: `linked-day-${value}`, label: `Ngày ${formatDate(value)}`, goals: goals.filter((goal) => goal.day === value), todos: todos.filter((todo) => todo.dueDate === value) }))
  }
  return []
}

function uniqueTodos(todos: Todo[]) {
  return [...new Map(todos.map((todo) => [todo.id, todo])).values()]
}

function todoMatchesPeriod(todo: Todo, period: GoalPeriod, year: number, quarter: number, month: number, week: number, day: string) {
  if (!todo.dueDate) return false
  const dueYear = Number(todo.dueDate.slice(0, 4))
  const dueMonth = Number(todo.dueDate.slice(5, 7))
  if (dueYear !== year) return false
  if (period === 'year') return true
  if (period === 'quarter') return Math.ceil(dueMonth / 3) === quarter
  if (period === 'month') return dueMonth === month
  if (period === 'week') return getISOWeekRange(year, week).includes(todo.dueDate)
  return todo.dueDate === day
}

function todoMatchesChartGroup(todo: Todo, group: PeriodDetailGroup, period: GoalPeriod, year: number, month: number) {
  if (!todo.dueDate || Number(todo.dueDate.slice(0, 4)) !== year) return false
  const dueMonth = Number(todo.dueDate.slice(5, 7))
  if (period === 'year') return Math.ceil(dueMonth / 3) === Number(group.key.replace('q-', ''))
  if (period === 'quarter') return dueMonth === Number(group.key.replace('m-', ''))
  if (period === 'month') return dueMonth === month && getISOWeek(todo.dueDate) === Number(group.key.replace('w-', ''))
  if (period === 'week' || period === 'day') return todo.dueDate === group.key
  return false
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
    const matchesTaskArea = (todo: Todo) => area === 'all' || goals.find((goal) => goal.id === todo.goalId)?.area === area
    if (period === 'year') return [1, 2, 3, 4].map((value) => ({
      key: `q-${value}`,
      label: `Quý ${value}`,
      goals: yearGoals.filter((goal) => goal.period === 'quarter' && goal.quarter === value && isLinkedChild(goal) && (area === 'all' || goal.area === area)),
      todos: todos.filter((todo) => Boolean(todo.dueDate) && Number(todo.dueDate!.slice(0, 4)) === year && Math.ceil(Number(todo.dueDate!.slice(5, 7)) / 3) === value && matchesTaskArea(todo)),
    }))
    if (period === 'quarter') {
      const start = (quarter - 1) * 3 + 1
      return [start, start + 1, start + 2].map((value) => ({
        key: `m-${value}`,
        label: `Tháng ${value}`,
        goals: yearGoals.filter((goal) => goal.period === 'month' && goal.month === value && isLinkedChild(goal) && (area === 'all' || goal.area === area)),
        todos: todos.filter((todo) => Boolean(todo.dueDate) && Number(todo.dueDate!.slice(0, 4)) === year && Number(todo.dueDate!.slice(5, 7)) === value && matchesTaskArea(todo)),
      }))
    }
    if (period === 'month') return getWeeksInMonth(year, month).map((value) => ({
      key: `w-${value}`,
      label: `Tuần ${value}`,
      goals: yearGoals.filter((goal) => goal.period === 'week' && goal.week === value && goal.month === month && isLinkedChild(goal) && (area === 'all' || goal.area === area)),
      todos: todos.filter((todo) => Boolean(todo.dueDate) && Number(todo.dueDate!.slice(0, 4)) === year && Number(todo.dueDate!.slice(5, 7)) === month && getISOWeek(todo.dueDate!) === value && matchesTaskArea(todo)),
    }))
    if (period === 'week') return getISOWeekRange(year, week).map((date, index) => ({
      key: date,
      label: `${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][index]} · ${date.slice(8, 10)}/${date.slice(5, 7)}`,
      goals: goals.filter((goal) => goal.period === 'day' && goal.day === date && isLinkedChild(goal) && (area === 'all' || goal.area === area)),
      todos: todos.filter((todo) => todo.dueDate === date && matchesTaskArea(todo)),
    }))
    return [{ key: day, label: `Ngày ${formatDate(day)}`, goals: [], todos: uniqueTodos([
      ...todos.filter((todo) => Boolean(todo.goalId && parentIds.has(todo.goalId))),
      ...todos.filter((todo) => todo.dueDate === day && matchesTaskArea(todo)),
    ]) }]
  }, [period, yearGoals, displayedGoals, goals, todos, area, quarter, month, week, year, day])

  const linkedDescendants = useMemo(() => getGoalDescendants(displayedGoals.map((goal) => goal.id), goals)
    .filter((goal) => area === 'all' || goal.area === area), [displayedGoals, goals, area])

  const scopedGoals = useMemo(() => [...displayedGoals, ...linkedDescendants], [displayedGoals, linkedDescendants])
  const linkedDayGoals = useMemo(() => scopedGoals.filter((goal) => goal.period === 'day'), [scopedGoals])
  const linkedDayGoalIds = useMemo(() => new Set(linkedDayGoals.map((goal) => goal.id)), [linkedDayGoals])
  const linkedTaskTodos = useMemo(() => todos.filter((todo) => Boolean(todo.goalId && linkedDayGoalIds.has(todo.goalId))), [todos, linkedDayGoalIds])
  const periodDeadlineTodos = useMemo(() => todos.filter((todo) => {
    if (!todoMatchesPeriod(todo, period, year, quarter, month, week, day)) return false
    if (area === 'all') return true
    return goals.find((goal) => goal.id === todo.goalId)?.area === area
  }), [todos, goals, area, period, year, quarter, month, week, day])
  const visibleTaskTodos = useMemo(() => uniqueTodos([...linkedTaskTodos, ...periodDeadlineTodos]), [linkedTaskTodos, periodDeadlineTodos])

  const detailSections = useMemo(() => {
    const currentIndex = periodOrder.indexOf(period)
    const goalSections = periodOrder.slice(currentIndex + 1).map((targetPeriod, index) => ({
      key: targetPeriod,
      title: `Mục tiêu ${periodLabels[targetPeriod]} thuộc ${periodLabels[period]}`,
      subtitle: index === 0
        ? `Mục tiêu liên kết và Task được xếp theo deadline vào từng ${periodLabels[targetPeriod].toLowerCase()}.`
        : `Mục tiêu được truy theo chuỗi liên kết; Task cũ được bổ sung theo deadline ở cấp ${periodLabels[targetPeriod].toLowerCase()}.`,
      groups: index === 0 ? childGroups : groupGoalsByPeriod(targetPeriod, linkedDescendants.filter((goal) => goal.period === targetPeriod), periodDeadlineTodos),
    }))
    const taskDate = (todo: Todo) => linkedDayGoals.find((goal) => goal.id === todo.goalId)?.day || todo.dueDate
    const dates = [...new Set([
      ...linkedDayGoals.map((goal) => goal.day),
      ...visibleTaskTodos.map(taskDate),
    ].filter((value): value is string => Boolean(value)))].sort()
    const taskGroups: PeriodDetailGroup[] = dates.map((date) => {
      const dateGoals = linkedDayGoals.filter((goal) => goal.day === date)
      const dateGoalIds = new Set(dateGoals.map((goal) => goal.id))
      return {
        key: `tasks-${date}`,
        label: `${formatDate(date)} · ${dateGoals.length ? dateGoals.map((goal) => goal.title).join(', ') : 'Tự xếp theo deadline'}`,
        goals: [],
        todos: visibleTaskTodos.filter((todo) => dateGoalIds.has(todo.goalId || '') || (!linkedDayGoalIds.has(todo.goalId || '') && todo.dueDate === date)),
      }
    })

    return [...goalSections, {
      key: 'tasks',
      title: `Task theo ${periodLabels[period]}`,
      subtitle: 'Bao gồm Task liên kết mục tiêu Ngày và Task cũ được tự xếp theo deadline.',
      groups: taskGroups,
    }]
  }, [period, childGroups, linkedDescendants, linkedDayGoals, linkedDayGoalIds, periodDeadlineTodos, visibleTaskTodos])

  const chartData = childGroups.map((group) => {
    const groupGoals = [...group.goals, ...getGoalDescendants(group.goals.map((goal) => goal.id), goals)]
    const groupGoalIds = new Set(groupGoals.map((goal) => goal.id))
    const groupTodos = todos.filter((todo) => Boolean(todo.goalId && groupGoalIds.has(todo.goalId)))
    const deadlineTodos = todos.filter((todo) => todoMatchesChartGroup(todo, group, period, year, month) && (area === 'all' || goals.find((goal) => goal.id === todo.goalId)?.area === area))
    const directTodos = group.todos || []
    const chartTodos = uniqueTodos([...groupTodos, ...deadlineTodos, ...directTodos])
    const linkedTodoIds = new Set(groupTodos.map((todo) => todo.id))
    const fallbackTodos = chartTodos.filter((todo) => !linkedTodoIds.has(todo.id))
    const values = [...group.goals.map(progressOf), ...fallbackTodos.map((todo) => todo.completed ? 100 : 0)]
    return { label: group.label.split(' · ')[0].replace('Quý ', 'Q').replace('Tháng ', 'T').replace('Tuần ', 'W'), count: groupGoals.length + chartTodos.length, goalCount: groupGoals.length, taskCount: chartTodos.length, value: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0 }
  })
  const scopedGoalIds = new Set(scopedGoals.map((goal) => goal.id))
  const fallbackPeriodTodos = periodDeadlineTodos.filter((todo) => !todo.goalId || !scopedGoalIds.has(todo.goalId))
  const periodValues = [...displayedGoals.map(progressOf), ...fallbackPeriodTodos.map((todo) => todo.completed ? 100 : 0)]
  const periodProgress = periodValues.length ? Math.round(periodValues.reduce((sum, value) => sum + value, 0) / periodValues.length) : 0
  const completed = displayedGoals.filter((goal) => progressOf(goal) === 100 || goal.status === 'completed').length + visibleTaskTodos.filter((todo) => todo.completed).length
  const overdue = displayedGoals.filter((goal) => isGoalOverdue(goal, progressOf(goal))).length + visibleTaskTodos.filter(isOverdue).length
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
      <ProgressBars title={chartTitle} subtitle={`Biểu đồ tổng hợp mục tiêu ${detailLabel.toLowerCase()} và Task; Task chưa liên kết được tự xếp theo deadline.`} data={chartData} />

      <section className="goal-stats">
        <div><span className="stat-icon green"><TrendingUp size={20} /></span><p>Tiến độ {periodLabels[period]}</p><strong>{periodProgress}%</strong></div>
        <div><span className="stat-icon blue"><Crosshair size={20} /></span><p>Mục tiêu / Task</p><strong>{displayedGoals.length} / {visibleTaskTodos.length}</strong></div>
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
      <TaskCountdownTable todos={visibleTaskTodos} goals={goals} periodLabel={chartTitle.replace('Biểu đồ ', '')} />
      {detailSections.map((section) => <PeriodDetails key={section.key} title={section.title} subtitle={section.subtitle} groups={section.groups} getProgress={progressOf} getAncestors={(goal) => getGoalAncestors(goal, goals)} />)}
    </div>
  )
}
