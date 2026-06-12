import React from 'react'

export function Input({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  icon = '',
  className = '',
}) {
  return (
    <div className={`relative ${className}`}>
      {icon && (
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2 bg-surface-container-high border border-outline-variant focus:border-primary focus:ring-0 rounded-lg text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant`}
      />
    </div>
  )
}
