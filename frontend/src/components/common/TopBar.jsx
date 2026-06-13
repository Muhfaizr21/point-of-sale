import React from 'react'

export function TopBar({ title, subtitle, onToggleSidebar, rightContent }) {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md px-lg py-md h-auto min-h-[72px] w-full border-b border-outline-variant bg-surface z-20 shrink-0 shadow-sm sticky top-0">
      <div className="flex items-center gap-md w-full sm:w-auto">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer mr-2 flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}
        <div>
          <h2 className="text-headline-md text-on-surface font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-label-sm text-on-surface-variant mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {rightContent && (
        <div className="flex items-center gap-3 w-full sm:w-auto mt-3 sm:mt-0">
          {rightContent}
        </div>
      )}
    </header>
  )
}
