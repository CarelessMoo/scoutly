import { Slot } from '@radix-ui/react-slot'
import { type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ asChild, className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' && 'bg-cyan-300 text-slate-950 shadow-[0_0_30px_rgba(103,232,249,0.25)] hover:bg-cyan-200',
        variant === 'secondary' && 'border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]',
        variant === 'ghost' && 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
        variant === 'danger' && 'bg-rose-500 text-white hover:bg-rose-400',
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-5 text-base',
        className,
      )}
      {...props}
    />
  )
}
