import Link from "next/link"

interface Props {
  icon: any
  title: string
  description: string
  action?: { label: string; href: string }
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-4 bg-white/4 rounded-2xl mb-4">
        <Icon className="w-8 h-8 text-white/20" />
      </div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-white/35 text-sm max-w-xs">{description}</p>
      {action && (
        <Link href={action.href}
          className="mt-5 text-sm font-semibold bg-gradient-primary text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
          {action.label}
        </Link>
      )}
    </div>
  )
}