import { Moon, Sun } from 'lucide-react'

interface HeaderProps {
  dark: boolean
  onToggleTheme: () => void
}

export function Header({ dark, onToggleTheme }: HeaderProps) {
  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">PERSONAL GOAL PLANNER</p>
        <h1>Tầm nhìn thành hành động.</h1>
        <p className="subtitle">Theo dõi mục tiêu năm, quý, tháng và từng tuần.</p>
      </div>
      <button className="icon-button" onClick={onToggleTheme} aria-label={dark ? 'Bật giao diện sáng' : 'Bật giao diện tối'}>
        {dark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </header>
  )
}
