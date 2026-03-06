import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface Props {
  title: string
  subtitle?: string
  action?: { label: string; href?: string; onClick?: () => void; icon?: any }
  breadcrumb?: { label: string; href: string }[]
}

export function PageHeader({ title, subtitle, action, breadcrumb }: Props) {
  const Icon = action?.icon
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
      <div>
        {breadcrumb && (
          <div className="flex items-center gap-1.5 text-xs text-white/35 mb-1.5">
            {breadcrumb.map((b, i) => (
              <span key={b.href} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="w-3 h-3" />}
                <Link href={b.href} className="hover:text-white/60 transition-colors">{b.label}</Link>
              </span>
            ))}
          </div>
        )}
        <h2 className="text-2xl font-display font-bold text-white">{title}</h2>
        {subtitle && <p className="text-white/40 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action && (
        action.href ? (
          <Link href={action.href}
            className="flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap">
            {Icon && <Icon className="w-4 h-4" />}
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick}
            className="flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap">
            {Icon && <Icon className="w-4 h-4" />}
            {action.label}
          </button>
        )
      )}
    </div>
  )
}