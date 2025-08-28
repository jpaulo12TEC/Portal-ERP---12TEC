'use client'

import { useEffect } from 'react'

export default function ClientZoomWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const applyZoom = () => {
      const width = window.innerWidth
      const ratio = window.devicePixelRatio
      const effectiveWidth = width / ratio

      if (effectiveWidth >= 1920) {
        // Monitores ultrawide ou 2K+
        document.body.style.zoom = '110%'
      } else if (effectiveWidth >= 1366) {
        // Desktops médios e grandes
        document.body.style.zoom = '100%'
      } else {
        // Notebooks ou telas menores
        document.body.style.zoom = '85%'
      }
    }

    applyZoom()
    window.addEventListener('resize', applyZoom)

    return () => {
      window.removeEventListener('resize', applyZoom)
      document.body.style.zoom = '100%' // restaura ao desmontar
    }
  }, [])

  return <>{children}</>
}
