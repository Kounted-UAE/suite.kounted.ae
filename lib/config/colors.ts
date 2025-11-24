export const KountedColors = {
  green: '#80C041',
  charcoal: '#0B4624',
  dark: '#094213',
  light: '#F6F9F3',
} as const

/**
 * Helper function to convert hex color to RGB values (0-1 range)
 * Useful for PDF generation and other contexts requiring RGB
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`)
  }
  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ]
}

