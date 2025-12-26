"use client"
import React, { useEffect, useRef } from "react"
import createGlobe from "cobe"
import { useMotionValue, useSpring } from "motion/react"
import { cn } from "../../lib/utils"

const MOVEMENT_DAMPING = 1400
const GLOBE_CONFIG = {
  width: 1000,
  height: 1000,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.1,
  dark: 0.1,
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 10.2,
  baseColor: [1, 1, 1],
  markerColor: [0.98, 0.18, 0.22],
  glowColor: [1, 1, 1],
  markers: [
    // India
    { location: [19.076, 72.8777], size: 0.04 }, // Mumbai
    { location: [28.6139, 77.209], size: 0.04 }, // Delhi
    { location: [12.9716, 77.5946], size: 0.03 }, // Bangalore
    { location: [13.0827, 80.2707], size: 0.03 }, // Chennai
    { location: [22.5726, 88.3639], size: 0.03 }, // Kolkata
    { location: [23.0225, 72.5714], size: 0.02 }, // Ahmedabad
    { location: [17.385, 78.4867], size: 0.03 }, // Hyderabad
    { location: [18.5204, 73.8567], size: 0.02 }, // Pune
    
    // Other Asia
    { location: [23.8103, 90.4125], size: 0.03 }, // Dhaka, Bangladesh
    { location: [39.9042, 116.4074], size: 0.04 }, // Beijing, China
    { location: [31.2304, 121.4737], size: 0.04 }, // Shanghai, China
    { location: [35.6762, 139.6503], size: 0.03 }, // Tokyo, Japan
    { location: [34.6937, 135.5022], size: 0.02 }, // Osaka, Japan
    { location: [37.5665, 126.978], size: 0.03 }, // Seoul, South Korea
    { location: [1.3521, 103.8198], size: 0.03 }, // Singapore
    { location: [13.7563, 100.5018], size: 0.03 }, // Bangkok, Thailand
    { location: [14.5995, 120.9842], size: 0.02 }, // Manila, Philippines
    { location: [-6.2088, 106.8456], size: 0.03 }, // Jakarta, Indonesia
    { location: [25.2048, 55.2708], size: 0.03 }, // Dubai, UAE
    
    // Other continents
    { location: [30.0444, 31.2357], size: 0.03 }, // Cairo, Egypt
    { location: [41.0082, 28.9784], size: 0.03 }, // Istanbul, Turkey
    { location: [40.7128, -74.006], size: 0.04 }, // New York, USA
    { location: [34.0522, -118.2437], size: 0.03 }, // Los Angeles, USA
    { location: [19.4326, -99.1332], size: 0.03 }, // Mexico City, Mexico
    { location: [-23.5505, -46.6333], size: 0.04 }, // São Paulo, Brazil
    { location: [51.5074, -0.1278], size: 0.03 }, // London, UK
    { location: [48.8566, 2.3522], size: 0.03 }, // Paris, France
    { location: [-33.8688, 151.2093], size: 0.03 }, // Sydney, Australia
  ],
}

export function Globe({
  className,
  config = GLOBE_CONFIG,
}) {
  let phi = 0
  let width = 0
  const canvasRef = useRef(null)
  const pointerInteracting = useRef(null)
  const pointerInteractionMovement = useRef(0)
  const r = useMotionValue(0)
  const rs = useSpring(r, {
    mass: 1,
    damping: 30,
    stiffness: 100,
  })

  const updatePointerInteraction = (value) => {
    pointerInteracting.current = value
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab"
    }
  }

  const updateMovement = (clientX) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current
      pointerInteractionMovement.current = delta
      r.set(r.get() + delta / MOVEMENT_DAMPING)
    }
  }

  useEffect(() => {
    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth
      }
    }
    window.addEventListener("resize", onResize)
    onResize()

    const globe = createGlobe(canvasRef.current, {
      ...config,
      width: width * 2,
      height: width * 2,
      onRender: (state) => {
        if (!pointerInteracting.current) phi += 0.005
        state.phi = phi + rs.get()
        state.width = width * 2
        state.height = width * 2
      },
    })

    setTimeout(() => (canvasRef.current.style.opacity = "1"), 0)
    return () => {
      globe.destroy()
      window.removeEventListener("resize", onResize)
    }
  }, [rs, config])

  return (
    <div
      className={cn(
        "absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[750px]",
        className
      )}
    >
      <canvas
        className={cn(
          "size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]"
        )}
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
    </div>
  )
}
