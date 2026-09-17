interface Props { total: number; active: number; completed: number }

export function TodoStats({ total, active, completed }: Props) {
  return (
    <section className="stats" aria-label="Thống kê công việc">
      <div><strong>{total}</strong><span>Tổng cộng</span></div>
      <div><strong>{active}</strong><span>Đang làm</span></div>
      <div><strong>{completed}</strong><span>Hoàn thành</span></div>
    </section>
  )
}
