import { useEffect, useMemo, useState } from 'react'
import { LayoutDashboard, ListTodo, Trash2 } from 'lucide-react'
import { GoalDashboard } from './components/GoalDashboard'
import { Header } from './components/Header'
import { TodoControls } from './components/TodoControls'
import { TodoForm } from './components/TodoForm'
import { TodoItem } from './components/TodoItem'
import { TodoStats } from './components/TodoStats'
import { useGoals } from './hooks/useGoals'
import { useTodos } from './hooks/useTodos'
import type { Filter, SortOption } from './types/todo'
import { sortTodos } from './utils/todoUtils'

const THEME_KEY = 'my-tasks.theme'

export default function App() {
  const { todos, addTodo, updateTodo, toggleTodo, deleteTodo, clearCompleted } = useTodos()
  const { goals, addGoal, updateGoal, deleteGoal } = useGoals()
  const [view, setView] = useState<'dashboard' | 'tasks'>('dashboard')
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
  }, [dark])

  const active = todos.filter((todo) => !todo.completed).length
  const completed = todos.length - active
  const visibleTodos = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi')
    const filtered = todos.filter((todo) => {
      const matchesFilter = filter === 'all' || (filter === 'completed' ? todo.completed : !todo.completed)
      return matchesFilter && todo.title.toLocaleLowerCase('vi').includes(query)
    })
    return sortTodos(filtered, sort)
  }, [todos, filter, search, sort])

  const emptyMessage = search.trim()
    ? 'Không tìm thấy công việc phù hợp.'
    : filter === 'active' ? 'Bạn đã hoàn thành mọi việc 🎉'
      : filter === 'completed' ? 'Chưa có công việc hoàn thành.'
        : 'Chưa có công việc. Hãy thêm việc đầu tiên ở phía trên.'

  return (
    <main className="app-shell">
      <Header dark={dark} onToggleTheme={() => setDark((value) => !value)} />
      <nav className="app-nav" aria-label="Điều hướng chính">
        <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}><LayoutDashboard size={18} /> Dashboard mục tiêu</button>
        <button className={view === 'tasks' ? 'active' : ''} onClick={() => setView('tasks')}><ListTodo size={18} /> Danh sách công việc</button>
      </nav>
      {view === 'dashboard' ? (
        <GoalDashboard goals={goals} todos={todos} onAdd={addGoal} onUpdate={updateGoal} onDelete={deleteGoal} />
      ) : (
        <div className="tasks-page">
          <TodoStats total={todos.length} active={active} completed={completed} />
          <TodoForm onAdd={addTodo} goals={goals} />
          <TodoControls filter={filter} onFilter={setFilter} search={search} onSearch={setSearch} sort={sort} onSort={setSort} />
          <section className="todo-list" aria-live="polite">
            {visibleTodos.length ? visibleTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} goals={goals} onToggle={toggleTodo} onDelete={deleteTodo} onUpdate={updateTodo} />
            )) : <div className="empty-state"><span>✓</span><p>{emptyMessage}</p></div>}
          </section>
          <footer className="list-footer">
            <span>{active} công việc còn lại</span>
            {completed > 0 && <button className="text-button danger" onClick={clearCompleted}><Trash2 size={16} /> Xóa việc đã xong</button>}
          </footer>
        </div>
      )}
    </main>
  )
}
