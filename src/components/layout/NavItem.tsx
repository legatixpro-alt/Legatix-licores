'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from 'cn'

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  variant?: 'desktop' | 'mobile'
}

export function NavItem({ href, icon, label, variant = 'desktop' }: NavItemProps) {
  const pathname = usePathname()
  const isActive = href === '/dashboard'
    ? pathname === '/dashboard'
    : pathname.startsWith(href)

  if (variant === 'mobile') {
    return (
      <Link
        href={href}
        prefetch={true}
        className={cn(
          'flex flex-col items-center justify-center gap-1 w-full h-full text-xs font-medium transition-all duration-200',
          isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
        )}
      >
        <span className={cn(
          'transition-transform duration-200',
          isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(245,176,39,0.5)]' : ''
        )}>
          {icon}
        </span>
        <span className={cn(
          'text-[10px] leading-tight',
          isActive ? 'font-bold' : 'font-medium'
        )}>{label}</span>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      prefetch={true}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-all duration-200 border',
        'hover:bg-primary/10 hover:text-primary hover:translate-x-1 hover:border-primary/20',
        isActive
          ? 'bg-primary/15 text-primary border-primary/30 translate-x-1'
          : 'text-muted-foreground border-transparent'
      )}
    >
      <span className={cn(
        'transition-transform duration-200',
        isActive ? 'scale-110' : 'group-hover:scale-110'
      )}>
        {icon}
      </span>
      {label}
      {isActive && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
      )}
    </Link>
  )
}
