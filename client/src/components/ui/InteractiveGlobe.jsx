"use client"
import React, { useEffect, useRef, useMemo, useCallback } from "react"
import createGlobe from "cobe"
import { useMotionValue, useSpring } from "motion/react"
import { cn } from "../../lib/utils"

const FALLBACK_CITIES = [
  { location: [37.78, -122.44], size: 0.04, id: 'sf', label: 'San Francisco' },
  { location: [40.71, -74.01], size: 0.04, id: 'nyc', label: 'New York' },
  { location: [51.51, -0.13], size: 0.04, id: 'lon', label: 'London' },
  { location: [35.69, 139.69], size: 0.04, id: 'tyo', label: 'Tokyo' },
  { location: [19.08, 72.88], size: 0.03, id: 'bom', label: 'Mumbai' },
  { location: [-23.55, -46.63], size: 0.04, id: 'sao', label: 'São Paulo' },
  { location: [25.20, 55.27], size: 0.03, id: 'dxb', label: 'Dubai' },
  { location: [1.35, 103.82], size: 0.03, id: 'sin', label: 'Singapore' },
  { location: [-33.87, 151.21], size: 0.03, id: 'syd', label: 'Sydney' },
  { location: [6.52, 3.38], size: 0.03, id: 'los', label: 'Lagos' },
  { location: [19.43, -99.13], size: 0.03, id: 'mex', label: 'Mexico City' },
  { location: [48.86, 2.35], size: 0.03, id: 'par', label: 'Paris' },
  { location: [52.52, 13.40], size: 0.03, id: 'ber', label: 'Berlin' },
  { location: [41.90, 12.49], size: 0.03, id: 'rom', label: 'Rome' },
  { location: [28.61, 77.21], size: 0.03, id: 'del', label: 'Delhi' },
  { location: [12.97, 77.59], size: 0.03, id: 'blr', label: 'Bangalore' },
  { location: [-34.60, -58.38], size: 0.03, id: 'bue', label: 'Buenos Aires' },
  { location: [38.72, -9.14], size: 0.03, id: 'lis', label: 'Lisbon' },
  { location: [30.04, 31.24], size: 0.03, id: 'cai', label: 'Cairo' },
  { location: [52.23, 21.01], size: 0.03, id: 'waw', label: 'Warsaw' },
]

const GLOBE_CONFIG = {
  width: 1000,
  height: 1000,
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.2,
  dark: 0,
  diffuse: 1.2,
  mapSamples: 16000,
  mapBrightness: 6,
  baseColor: [1, 1, 1],
  markerColor: [0.2, 0.5, 1],
  glowColor: [1, 1, 1],
  markerElevation: 0.02,
  arcHeight: 0.25,
  arcWidth: 0.4,
}

const MAX_MARKERS = 50

export function InteractiveGlobe({ mockUsers = [] }) {
  const canvasRef = useRef(null)
  const globeRef = useRef(null)
  const phiRef = useRef(0)
  const isInitialized = useRef(false)
  const r = useMotionValue(0)
  const rs = useSpring(r, {
    mass: 1,
    damping: 30,
    stiffness: 100,
  })

  const processedMarkers = useMemo(() => {
    const userMarkers = mockUsers
      .filter(user => user.location?.coordinates?.length === 2)
      .map(user => ({
        location: [user.location.coordinates[1], user.location.coordinates[0]],
        size: 0.035,
        color: [0.2, 0.5, 1],
        id: user._id,
        label: `${user.name} • Live Watching`,
      }))

    const fallbackMarkers = FALLBACK_CITIES.filter(
      fallback => !userMarkers.some(user => 
        Math.abs(user.location[0] - fallback.location[0]) < 0.5 && 
        Math.abs(user.location[1] - fallback.location[1]) < 0.5
      )
    )

    const combined = [...userMarkers, ...fallbackMarkers]
    return combined.slice(0, MAX_MARKERS)
  }, [mockUsers])

  const pointerInteracting = useRef(null)
  const updatePointerInteraction = useCallback((value) => {
    pointerInteracting.current = value
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab"
    }
  }, [])

  const updateMovement = useCallback((clientX) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current
      r.set(r.get() + delta / 1400)
    }
  }, [r])

  useEffect(() => {
    if (isInitialized.current) return

    let destroyed = false

    const tryInit = () => {
      if (destroyed) return
      const canvas = canvasRef.current
      if (!canvas) {
        requestAnimationFrame(tryInit)
        return
      }
      const w = canvas.offsetWidth
      if (w <= 0) {
        requestAnimationFrame(tryInit)
        return
      }

      try {
        const globe = createGlobe(canvas, {
          ...GLOBE_CONFIG,
          width: w * 2,
          height: w * 2,
          markers: processedMarkers,
          onRender: (state) => {
            if (destroyed) return
            if (!pointerInteracting.current) phiRef.current += 0.002
            state.phi = phiRef.current + rs.get()
            state.width = w * 2
            state.height = w * 2
          },
        })

        if (destroyed) {
          globe.destroy()
          return
        }

        globeRef.current = globe
        isInitialized.current = true
        canvas.style.opacity = "1"
      } catch (error) {
        console.error("Failed to create globe:", error)
      }
    }

    const onResize = () => {
      if (globeRef.current && canvasRef.current) {
        const w = canvasRef.current.offsetWidth
        if (w > 0) {
          globeRef.current.update({ width: w * 2, height: w * 2 })
        }
      }
    }

    requestAnimationFrame(tryInit)
    window.addEventListener("resize", onResize)

    return () => {
      destroyed = true
      window.removeEventListener("resize", onResize)
    }
  }, [processedMarkers, rs])

  useEffect(() => {
    return () => {
      if (globeRef.current) {
        try {
          globeRef.current.destroy()
        } catch (error) {
          console.error("Failed to destroy globe:", error)
        }
        globeRef.current = null
        isInitialized.current = false
      }
    }
  }, [])

  return (
    <div className={cn("relative aspect-square w-full max-w-[500px] mx-auto select-none")}>
      <canvas
        className={cn(
          "size-full [contain:layout_paint_size]",
          "touch-action-none rounded-full"
        )}
        style={{ opacity: 0, transition: "opacity 1.2s ease", cursor: "grab" }}
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX
          updatePointerInteraction(e.clientX)
        }}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) =>
          e.touches[0] && updateMovement(e.touches[0].clientX)
        }
      />
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {processedMarkers.map((marker) => (
          <div
            key={marker.id}
            className="marker-label"
            style={{
              position: "absolute",
              positionAnchor: `--cobe-${marker.id}`,
              opacity: `var(--cobe-visible-${marker.id}, 0)`,
              transition: "opacity 0.2s ease",
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-900/90 backdrop-blur-sm rounded-full text-white text-xs font-medium shadow-lg border border-white/10">
              <span className="relative flex items-center">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse mr-1" />
                Live Watching
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}