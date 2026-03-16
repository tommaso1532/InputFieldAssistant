import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CaretScene } from '@/components/CaretScene'

const orbitIcon = "https://www.figma.com/api/mcp/asset/f1ac9bdd-dc53-4608-be2d-f0daedeb098b"

// Shared font style — must match the input exactly so text measurement is accurate
const MEASURE_STYLE: React.CSSProperties = {
  position: 'absolute',
  visibility: 'hidden',
  whiteSpace: 'pre',
  pointerEvents: 'none',
  fontSize: '0.875rem',   // text-sm
  fontFamily: 'inherit',
  letterSpacing: 'inherit',
  fontWeight: 'inherit',
}

function App() {
  const [focused, setFocused] = useState(false)
  const [caretX, setCaretX] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)

  const syncCaret = useCallback(() => {
    requestAnimationFrame(() => {
      const input = inputRef.current
      const measure = measureRef.current
      if (!input || !measure) return
      const pos = input.selectionStart ?? 0
      // Use a zero-width space for empty string so the span has measurable height
      measure.textContent = input.value.slice(0, pos) || '\u200b'
      setCaretX(pos === 0 ? 0 : measure.offsetWidth)
    })
  }, [])

  const handleFocus = useCallback(() => {
    setFocused(true)
    syncCaret()
  }, [syncCaret])

  const handleBlur = useCallback(() => {
    setFocused(false)
    setCaretX(0)
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.label
        className="flex items-center gap-2 px-[9px] py-[9.5px] w-80 rounded-full border border-border bg-card shadow-xs cursor-text overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <img src={orbitIcon} alt="" className="size-5 shrink-0" />

        <div className="relative flex-1 flex items-center min-w-0">
          {/* Hidden span mirrors input text for pixel-accurate width measurement */}
          <span ref={measureRef} aria-hidden="true" style={MEASURE_STYLE} />

          <input
            ref={inputRef}
            className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-foreground/40"
            style={{ caretColor: 'transparent' }}
            placeholder="Ask everything..."
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyUp={syncCaret}
            onMouseUp={syncCaret}
            onSelect={syncCaret}
            onChange={syncCaret}
          />

          {focused && (
            <span
              className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: caretX }}
            >
              <CaretScene />
            </span>
          )}
        </div>
      </motion.label>
    </div>
  )
}

export default App
