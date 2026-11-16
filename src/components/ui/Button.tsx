import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'violet'
  size?: 'sm' | 'md' | 'lg' | string
  loading?: boolean
  children: ReactNode
}

const variants = {
  primary:
    'bg-[#FF6433] text-white hover:bg-[#F05524] active:scale-[0.98] shadow-xs hover:shadow font-semibold',
  secondary:
    'border border-line bg-white text-ink hover:bg-paper hover:border-line-bold font-medium shadow-2xs',
  ghost: 'text-muted hover:bg-white hover:text-ink font-medium',
  danger: 'bg-danger text-white hover:bg-red-600 font-semibold shadow-xs',
  violet:
    'bg-[#5B4BD8] text-white hover:bg-[#4C3BC7] active:scale-[0.98] shadow-xs hover:shadow font-semibold',
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className = '',
  disabled,
  ...props
}: Props) {
  const chosenSize = sizeClasses[size] || sizeClasses.md

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${chosenSize} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoaderCircle size={16} className="animate-spin" />}
      {children}
    </button>
  )
}
