// src/components/branding/ArcflowLogo.tsx
import type { ImgHTMLAttributes } from 'react'
import arcflowLogo from '../../assets/arcflow-logo.png'

interface ArcflowLogoProps extends ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Compact mode for navbars / tighter layouts.
   */
  compact?: boolean
}

/**
 * Arcflow logo (image-based, mock-accurate)
 * - EXTRA oversized for maximum brand presence
 * - Built for very tall navbar / hero nav
 * - Aspect ratio preserved
 */
export function ArcflowLogo({
  compact = false,
  className = '',
  style,
  ...rest
}: ArcflowLogoProps) {
  return (
    <img
      src={arcflowLogo}
      alt="Arcflow"
      className={['block select-none', className].filter(Boolean).join(' ')}
      style={{
        height: compact ? 220 : 256, // ⬅️ increased again
        width: 'auto',
        objectFit: 'contain',
        ...style,
      }}
      draggable={false}
      {...rest}
    />
  )
}
