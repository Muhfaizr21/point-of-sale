import React from 'react'

export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
  type = 'button',
  ariaLabel,
}) {
  const baseStyles = 'rounded-lg font-headline-md font-semibold text-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center justify-center gap-2 cursor-pointer'
  
  const variants = {
    primary: 'bg-primary text-on-primary hover:bg-surface-tint',
    secondary: 'bg-secondary text-on-secondary hover:bg-secondary/90',
    outline: 'border-2 border-primary text-primary hover:bg-surface-tint/10 bg-surface-container-lowest',
    text: 'text-secondary hover:text-primary hover:bg-surface-container-highest',
  }

  const combinedStyles = `${baseStyles} ${variants[variant]} ${className}`

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedStyles}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}
