import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const UNICORN_CDN =
  'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.4/dist/unicornStudio.umd.js'

declare global {
  interface Window {
    UnicornStudio: { init: () => Promise<void> }
  }
}

const W = 520
const H = 64

// Caret lands at (46.11%, 50%) within the canvas after H-centering calculation.
// xOffset shifts the canvas so the caret aligns to left: 0 of the text area.
const CX_PCT = '46.11%'
const xOffset = -(W * 0.4611)

// ─── Radial mask ────────────────────────────────────────────────────────────
// Ellipse centered on the caret; keeps the core opaque and smoothly decays
// rays to transparent before they hit the canvas edge.
const RADIAL_MASK = [
  `radial-gradient(`,
  `  ellipse 240px 44px at ${CX_PCT} 50%,`,
  `  black 0%,`,
  `  black 28%,`,
  `  transparent 100%`,
  `)`,
].join('')

// ─── Progressive blur rings ──────────────────────────────────────────────────
// backdrop-filter blurs the WebGL canvas content behind each overlay div.
// Each ring is an annular radial gradient mask: transparent → opaque → transparent.
// Blur ramps from ~12px at 40px radius to 100px at ~80px radius.
const BLUR_RINGS = [
  { blur: 12,  r0: 28, rPeak: 38,  r1: 55  },
  { blur: 30,  r0: 42, rPeak: 56,  r1: 72  },
  { blur: 60,  r0: 55, rPeak: 68,  r1: 86  },
  { blur: 100, r0: 65, rPeak: 80,  r1: 120 },
] as const

function ringMask(r0: number, rPeak: number, r1: number) {
  return `radial-gradient(circle at ${CX_PCT} 50%, transparent ${r0}px, black ${rPeak}px, transparent ${r1}px)`
}

function loadUnicornScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.UnicornStudio) { resolve(); return }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${UNICORN_CDN}"]`
    )
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = UNICORN_CDN
    script.async = true
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

export function CaretScene() {
  const sceneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadUnicornScript().then(() => {
      requestAnimationFrame(() => window.UnicornStudio?.init())
    })
  }, [])

  return (
    <motion.div
      className="pointer-events-none"
      style={{
        position: 'relative',
        width: W,
        height: H,
        transform: `translateX(${xOffset}px)`,
        // Radial mask applied to the composited output of this whole subtree
        maskImage: RADIAL_MASK,
        WebkitMaskImage: RADIAL_MASK,
      }}
      animate={{ opacity: [1, 0.2, 1] }}
      transition={{
        duration: 2,
        ease: [0.45, 0, 0.55, 1],
        repeat: Infinity,
        repeatType: 'loop',
      }}
    >
      {/* Unicorn Studio WebGL scene */}
      <div
        ref={sceneRef}
        data-us-project-src="/caret.json"
        style={{ position: 'absolute', inset: 0 }}
      />

      {/* Progressive blur rings — backdrop-filter blurs the canvas behind each annular mask */}
      {BLUR_RINGS.map(({ blur, r0, rPeak, r1 }) => {
        const mask = ringMask(r0, rPeak, r1)
        return (
          <div
            key={blur}
            style={{
              position: 'absolute',
              inset: 0,
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
              pointerEvents: 'none',
            }}
          />
        )
      })}
    </motion.div>
  )
}
