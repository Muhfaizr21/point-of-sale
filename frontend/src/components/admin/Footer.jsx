import React from 'react'

export function Footer() {
  return (
    <footer className="text-center text-label-xs text-on-surface-variant py-sm bg-surface-container-low border-t border-outline-variant/30">
      <p>&copy; {new Date().getFullYear()} Sentrakas POS. All rights reserved.</p>
    </footer>
  )
}
