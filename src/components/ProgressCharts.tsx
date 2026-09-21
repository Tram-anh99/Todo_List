interface DataPoint { label: string; value: number; count: number }

export function ProgressBars({ title, subtitle, data }: { title: string; subtitle: string; data: DataPoint[] }) {
  return (
    <section className="panel chart-panel">
      <div className="section-heading"><div><h2>{title}</h2><p>{subtitle}</p></div></div>
      <div className="bar-chart">
        {data.map((item) => (
          <div className="bar-column" key={item.label}>
            <span className="bar-value">{item.count ? `${item.value}%` : '—'}</span>
            <div className="bar-track"><span style={{ height: `${Math.max(item.count ? item.value : 2, 2)}%` }} /></div>
            <strong>{item.label}</strong>
            <small>{item.count} mục tiêu</small>
          </div>
        ))}
      </div>
    </section>
  )
}
