export function ChartCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-bg-card rounded-tile p-4 flex flex-col gap-3 h-full enter-card ${className}`}>
      {children}
    </div>
  )
}
