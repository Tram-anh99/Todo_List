import { Search } from 'lucide-react'
import type { Filter, SortOption } from '../types/todo'

interface Props {
  filter: Filter
  onFilter: (filter: Filter) => void
  search: string
  onSearch: (value: string) => void
  sort: SortOption
  onSort: (value: SortOption) => void
}

export function TodoControls({ filter, onFilter, search, onSearch, sort, onSort }: Props) {
  return (
    <section className="controls" aria-label="Lọc và tìm kiếm">
      <div className="filters">
        {([['all', 'Tất cả'], ['active', 'Đang làm'], ['completed', 'Hoàn thành']] as const).map(([value, label]) => (
          <button key={value} className={filter === value ? 'active' : ''} onClick={() => onFilter(value)}>{label}</button>
        ))}
      </div>
      <div className="control-fields">
        <label className="search-field"><Search size={17} /><input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Tìm công việc..." /></label>
        <select aria-label="Sắp xếp" value={sort} onChange={(e) => onSort(e.target.value as SortOption)}>
          <option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="priority">Ưu tiên</option><option value="dueDate">Hạn chót</option>
        </select>
      </div>
    </section>
  )
}
