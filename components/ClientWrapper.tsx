'use client'

import { useEffect } from 'react'

export default function ClientZoomWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const applyZoom = () => {
      if (window.innerWidth >= 1440) {
        // Telas grandes
        document.body.style.zoom = '100%'
      } else {
        // Notebooks ou telas menores
        document.body.style.zoom = '85%'
      }
    }

    applyZoom() // aplica no carregamento
    window.addEventListener('resize', applyZoom) // reaplica no resize

    return () => {
      window.removeEventListener('resize', applyZoom)
      document.body.style.zoom = '100%' // restaura ao desmontar
    }
  }, [])

  return <>{children}</>
}
