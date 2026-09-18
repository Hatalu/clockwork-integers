import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion'
import {
  Play,
  RotateCcw,
  PartyPopper,
  Sparkles,
  Star,
  Flag,
  Plus,
  Minus,
  Shuffle,
  KeyRound,
  ArrowLeft,
  Lock,
  ListChecks,
  X,
  Wand2,
} from 'lucide-react'
import { CATEGORIES, findCategory, generateLevel, nextGearId } from './levels'

const DEV_CODE = '211406'

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const toPercent = (v, min, max) => ((clamp(v, min, max) - min) / (max - min)) * 100

// ---------------------------------------------------------------------------
// Gear face (happy vs grumpy)
// ---------------------------------------------------------------------------
function GearFace({ positive }) {
  if (positive) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex gap-2.5">
          <span className="block h-2 w-2 rounded-full bg-white shadow-sm" />
          <span className="block h-2 w-2 rounded-full bg-white shadow-sm" />
        </div>
        <span className="block h-2 w-4 rounded-b-full border-b-[3px] border-white" />
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex gap-2">
        <span className="block h-[3px] w-2.5 rotate-[20deg] rounded-full bg-white" />
        <span className="block h-[3px] w-2.5 -rotate-[20deg] rounded-full bg-white" />
      </div>
      <span className="block h-2 w-4 rounded-t-full border-t-[3px] border-white" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Gear component (cartoon cog, spins when active)
// ---------------------------------------------------------------------------
function Gear({ gear, size = 84, spinning = false, onClick, muted = false }) {
  const positive = gear.value >= 0
  const teeth = Array.from({ length: 10 })
  const teethColor = positive
    ? 'bg-gear-pos-dark border-gear-pos-dark'
    : 'bg-gear-neg-dark border-gear-neg-dark'
  const bodyGradient = positive
    ? 'from-gear-pos-light to-gear-pos'
    : 'from-gear-neg-light to-gear-neg'
  const ringColor = positive ? 'border-gear-pos-dark' : 'border-gear-neg-dark'

  return (
    <motion.button
      type="button"
      layout
      layoutId={`gear-${gear.id}`}
      onClick={onClick}
      disabled={!onClick}
      whileHover={onClick ? { scale: 1.08, rotate: 4 } : {}}
      whileTap={onClick ? { scale: 0.9 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      className={`relative shrink-0 select-none rounded-full outline-none ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      } ${muted ? 'opacity-40 grayscale' : ''}`}
      style={{ width: size, height: size }}
    >
      <motion.div
        className="absolute inset-0"
        animate={spinning ? { rotate: positive ? 360 : -360 } : { rotate: 0 }}
        transition={
          spinning
            ? { repeat: Infinity, duration: 0.9, ease: 'linear' }
            : { duration: 0.25 }
        }
      >
        {teeth.map((_, i) => (
          <span
            key={i}
            className={`absolute left-1/2 top-1/2 block rounded-[3px] border-2 ${teethColor}`}
            style={{
              width: '20%',
              height: '28%',
              transform: `translate(-50%, -50%) rotate(${i * 36}deg) translateY(-42%)`,
            }}
          />
        ))}
      </motion.div>
      <div
        className={`absolute inset-[14%] flex flex-col items-center justify-center rounded-full border-4 ${ringColor} bg-gradient-to-br ${bodyGradient} shadow-[inset_0_-4px_8px_rgba(0,0,0,0.2)]`}
      >
        <span className="text-lg font-extrabold text-white drop-shadow-sm sm:text-xl">
          {gear.value > 0 ? `+${gear.value}` : gear.value}
        </span>
        <div className="mt-0.5">
          <GearFace positive={positive} />
        </div>
      </div>
      {gear.corrective && (
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 12 }}
          className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-amber-400 shadow"
        >
          <Wand2 className="h-3.5 w-3.5 text-amber-900" />
        </motion.div>
      )}
    </motion.button>
  )
}

// ---------------------------------------------------------------------------
// Number line with mechanical indicator — ticks follow the level's own
// pattern (min/max/step) so spacing always stays even and relevant.
// ---------------------------------------------------------------------------
function NumberLine({ position, target, line }) {
  const { min, max, step } = line
  const marks = []
  for (let v = min; v <= max + 1e-9; v += step) marks.push(Math.round(v * 100) / 100)

  return (
    <div className="w-full">
      <div className="relative mx-1 pt-10 pb-8 sm:mx-3">
        {/* target flag */}
        <motion.div
          className="absolute -top-1 z-10 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${toPercent(target, min, max)}%` }}
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        >
          <Flag className="h-6 w-6 fill-amber-400 text-amber-700" strokeWidth={2.5} />
          <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-900 shadow">
            {target}
          </span>
        </motion.div>

        {/* track */}
        <div className="relative h-3 rounded-full bg-stone-300 shadow-inner">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-stone-300 via-stone-200 to-stone-300" />
          {marks.map((v) => (
            <div
              key={v}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${toPercent(v, min, max)}%` }}
            >
              <div
                className={`rounded-full ${
                  v === 0 ? 'h-4 w-1.5 bg-stone-600' : 'h-2.5 w-1 bg-stone-500/70'
                }`}
              />
              <span className="absolute left-1/2 top-4 -translate-x-1/2 text-[11px] font-bold text-stone-500">
                {v}
              </span>
            </div>
          ))}
        </div>

        {/* mechanical indicator */}
        <motion.div
          className="absolute top-0 z-20 flex -translate-x-1/2 flex-col items-center"
          animate={{ left: `${toPercent(position, min, max)}%` }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          <motion.div
            key={position}
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            className="mb-1 rounded-full border-2 border-amber-700 bg-white px-2 py-0.5 text-xs font-extrabold text-amber-800 shadow"
          >
            {position}
          </motion.div>
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-amber-700 bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg">
            <div className="absolute -top-3 h-3 w-0.5 bg-amber-700" />
            <div className="absolute -top-4 h-1.5 w-1.5 rounded-full bg-amber-600" />
            <div className="flex gap-1.5">
              <span className="block h-1.5 w-1.5 rounded-full bg-stone-800" />
              <span className="block h-1.5 w-1.5 rounded-full bg-stone-800" />
            </div>
          </div>
          <div
            className="h-0 w-0 border-x-8 border-t-[10px] border-x-transparent border-t-amber-700"
            style={{ marginTop: -2 }}
          />
        </motion.div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Confetti + smoke effects
// ---------------------------------------------------------------------------
function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.4 + Math.random() * 0.8,
      rotate: Math.random() * 360,
      color: ['#06B6D4', '#EF4444', '#FBBF24', '#34D399', '#818CF8'][i % 5],
    }))
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 block h-3 w-2 rounded-sm"
          style={{ left: `${p.x}%`, backgroundColor: p.color }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: 420, opacity: 0, rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}

function SmokePuff() {
  const [puffs] = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      angle: (i / 8) * 360,
    }))
  )
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {puffs.map((p) => (
        <motion.span
          key={p.id}
          className="absolute h-6 w-6 rounded-full bg-stone-400/70 blur-[2px]"
          initial={{ x: 0, y: 0, opacity: 0.9, scale: 0.4 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * 70,
            y: Math.sin((p.angle * Math.PI) / 180) * 70,
            opacity: 0,
            scale: 1.3,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Category icon helper
// ---------------------------------------------------------------------------
function CategoryIcon({ icon, className }) {
  if (icon === 'plus') return <Plus className={className} strokeWidth={3} />
  if (icon === 'minus') return <Minus className={className} strokeWidth={3} />
  return <Shuffle className={className} strokeWidth={3} />
}

// ---------------------------------------------------------------------------
// Dev code-gate modal
// ---------------------------------------------------------------------------
function DevGateModal({ onClose, onUnlock }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const controls = useAnimationControls()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (code === DEV_CODE) {
      onUnlock()
    } else {
      setError(true)
      controls.start({ x: [0, -10, 10, -8, 8, -4, 4, 0], transition: { duration: 0.4 } })
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="relative w-full max-w-xs rounded-3xl border-4 border-stone-600 bg-white p-6 text-center shadow-2xl"
      >
        <motion.div animate={controls}>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
            <Lock className="h-6 w-6 text-stone-500" />
          </div>
          <h3 className="text-lg font-extrabold text-stone-700">โหมดนักพัฒนา</h3>
          <p className="mt-1 text-xs font-semibold text-stone-400">กรอกรหัส 6 หลักเพื่อเข้าใช้งาน</p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setError(false)
              setCode(e.target.value.replace(/[^0-9]/g, ''))
            }}
            className={`mt-4 w-full rounded-2xl border-4 bg-stone-50 px-4 py-3 text-center text-2xl font-extrabold tracking-[0.5em] text-stone-700 outline-none ${
              error ? 'border-red-400' : 'border-stone-300 focus:border-stone-500'
            }`}
            placeholder="------"
            autoFocus
          />
          {error && (
            <p className="mt-2 text-xs font-bold text-red-500">รหัสไม่ถูกต้อง ลองใหม่อีกครั้ง</p>
          )}
          <button
            type="submit"
            className="mt-4 w-full rounded-full border-4 border-stone-700 bg-stone-700 px-6 py-2.5 font-extrabold text-white shadow-[0_4px_0_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-none"
          >
            ยืนยัน
          </button>
        </motion.div>
      </motion.form>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Dev panel — free level jump, unlocked after entering the code
// ---------------------------------------------------------------------------
function DevPanelModal({ onClose, onJump }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="relative w-full max-w-md rounded-3xl border-4 border-stone-600 bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-3 flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-emerald-500" />
          <h3 className="text-lg font-extrabold text-stone-700">โหมดนักพัฒนา · เลือกด่านได้อิสระ</h3>
        </div>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          {CATEGORIES.map((cat) => (
            <div key={cat.id}>
              <p className={`mb-1.5 text-sm font-extrabold ${cat.theme.text}`}>{cat.label}</p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: cat.levelCount }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onJump(cat.id, idx)}
                    className={`rounded-xl border-2 ${cat.theme.border} bg-white px-3 py-1.5 text-xs font-bold text-stone-600 hover:bg-stone-50`}
                  >
                    ด่านที่ {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Home screen — pick a category
// ---------------------------------------------------------------------------
function HomeScreen({ progress, onSelectCategory, onOpenDev }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-skybg px-4 py-10 font-cartoon">
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
        >
          <Gear gear={{ id: 'logo', value: 4 }} size={48} />
        </motion.div>
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-700 sm:text-4xl">
          Clockwork <span className="text-gear-pos-dark">Integers</span>
        </h1>
      </div>
      <p className="mt-2 text-center text-sm font-semibold text-stone-400 sm:text-base">
        เลือกด่านที่อยากฝึกกันเลย!
      </p>

      <div className="mt-10 flex w-full max-w-md flex-col gap-5">
        {CATEGORIES.map((cat) => {
          const done = progress[cat.id]?.size ?? 0
          const totalLvls = cat.levelCount
          return (
            <motion.button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-4 rounded-3xl border-4 ${cat.theme.border} bg-gradient-to-br ${cat.theme.grad} px-5 py-4 text-left shadow-[0_6px_0_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none`}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/30">
                <CategoryIcon icon={cat.icon} className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xl font-extrabold text-white drop-shadow">{cat.label}</p>
                <p className="text-xs font-semibold text-white/85">{cat.subtitle}</p>
              </div>
              <div className="rounded-full bg-white/30 px-3 py-1 text-xs font-extrabold text-white">
                {done}/{totalLvls}
              </div>
            </motion.button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onOpenDev}
        aria-label="Dev"
        className="fixed bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-stone-300 bg-white/70 text-stone-400 opacity-60 shadow transition hover:opacity-100"
      >
        <KeyRound className="h-4 w-4" />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Game screen — plays a single level within a category
// ---------------------------------------------------------------------------
function GameScreen({ category, level, levelIndex, onExit, onLevelComplete, onNextLevel }) {
  const isLastLevel = levelIndex === category.levelCount - 1

  const [position, setPosition] = useState(level.start)
  const [inventory, setInventory] = useState(level.gears)
  const [selectedGear, setSelectedGear] = useState(null)
  const [phase, setPhase] = useState('idle') // idle | running | success | miss
  const [attempt, setAttempt] = useState(0)
  const [showClimaxBurst, setShowClimaxBurst] = useState(false)

  const timerRef = useRef(null)
  const recoverRef = useRef(null)
  const machineControls = useAnimationControls()

  useLayoutEffect(() => {
    setPosition(level.start)
    setInventory(level.gears)
    setSelectedGear(null)
    setPhase('idle')
    setShowClimaxBurst(false)
    return () => {
      clearInterval(timerRef.current)
      clearTimeout(recoverRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.key])

  useEffect(() => {
    if (phase === 'miss') {
      machineControls.start({
        x: [0, -14, 14, -10, 10, -5, 5, 0],
        transition: { duration: 0.5 },
      })
    }
  }, [phase, attempt, machineControls])

  const handleSelectGear = (gear) => {
    if (phase === 'running') return
    setSelectedGear((prev) => (prev?.id === gear.id ? null : gear))
  }

  const handleRewind = () => {
    clearInterval(timerRef.current)
    clearTimeout(recoverRef.current)
    setPosition(level.start)
    setInventory(level.gears)
    setSelectedGear(null)
    setPhase('idle')
    setShowClimaxBurst(false)
  }

  const handleRun = () => {
    if (!selectedGear || phase === 'running') return

    const base = position
    const result = level.operator === '+' ? base + selectedGear.value : base - selectedGear.value
    const removingNegative = level.operator === '-' && selectedGear.value < 0

    const step = result === base ? 0 : result > base ? 1 : -1
    const path = [base]
    let v = base
    while (v !== result) {
      v += step
      path.push(v)
    }

    setInventory((prev) => prev.filter((g) => g.id !== selectedGear.id))
    setAttempt((a) => a + 1)
    setPhase('running')

    let i = 1
    timerRef.current = setInterval(() => {
      setPosition(path[i])
      i++
      if (i >= path.length) {
        clearInterval(timerRef.current)
        if (removingNegative) {
          setShowClimaxBurst(true)
          setTimeout(() => setShowClimaxBurst(false), 1200)
        }
        setTimeout(() => {
          const won = result === level.target
          setSelectedGear(null)
          if (won) {
            onLevelComplete(category.id, levelIndex)
            setPhase('success')
          } else {
            // Guarantee a way forward: hand the player a corrective gear
            // that walks straight from here to the target.
            const correctiveValue =
              level.operator === '+' ? level.target - result : result - level.target
            setInventory((prev) =>
              prev.some((g) => g.value === correctiveValue)
                ? prev
                : [...prev, { id: nextGearId('fix'), value: correctiveValue, corrective: true }]
            )
            setPhase('miss')
            recoverRef.current = setTimeout(() => setPhase('idle'), 900)
          }
        }, 350)
      }
    }, 360)
  }

  const slotFilled = Boolean(selectedGear)
  const inventoryGears = inventory.filter((g) => g.id !== selectedGear?.id)

  return (
    <div className="relative min-h-screen w-full bg-skybg px-4 py-6 font-cartoon sm:px-6">
      <button
        type="button"
        onClick={onExit}
        className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border-2 border-stone-300 bg-white/80 text-stone-500 shadow sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        {/* Header */}
        <header className="flex items-center justify-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-700 sm:text-3xl">
            {category.label}
          </h1>
        </header>

        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: category.levelCount }).map((_, idx) => (
            <span
              key={idx}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                idx === levelIndex
                  ? 'bg-amber-500'
                  : idx < levelIndex
                    ? 'bg-emerald-400'
                    : 'bg-stone-300'
              }`}
            />
          ))}
        </div>

        {/* Machine card */}
        <motion.div
          animate={machineControls}
          className="relative overflow-hidden rounded-3xl border-4 border-stone-700/80 bg-gradient-to-b from-amber-50 to-stone-100 p-5 shadow-[0_10px_0_rgba(68,64,60,0.4)] sm:p-6"
        >
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-stone-700 sm:text-xl">{level.title}</h2>
          </div>
          <p className="mb-4 text-sm font-semibold text-stone-500 sm:text-base">{level.story}</p>

          <NumberLine position={position} target={level.target} line={level.line} />

          {/* Equation */}
          <div className="relative mt-2 flex items-center justify-center gap-2 sm:gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-stone-400 bg-white text-xl font-extrabold text-stone-700 shadow sm:h-16 sm:w-16 sm:text-2xl">
              {position}
            </div>
            <span className="text-2xl font-extrabold text-stone-500 sm:text-3xl">
              {level.operator}
            </span>

            {/* slot */}
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-dashed border-stone-400 bg-white/60 sm:h-[4.5rem] sm:w-[4.5rem]">
              <AnimatePresence>
                {selectedGear && (
                  <Gear
                    gear={selectedGear}
                    size={64}
                    spinning={phase === 'running'}
                    onClick={() => handleSelectGear(selectedGear)}
                  />
                )}
              </AnimatePresence>
              {!selectedGear && (
                <span className="text-2xl font-extrabold text-stone-300">?</span>
              )}

              {/* climax burst */}
              <AnimatePresence>
                {showClimaxBurst && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.span
                      className="absolute h-16 w-16 rounded-full border-4 border-emerald-400"
                      initial={{ scale: 0.5, opacity: 0.9 }}
                      animate={{ scale: 2.4, opacity: 0 }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className="text-2xl font-extrabold text-stone-500 sm:text-3xl">=</span>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-amber-400 bg-amber-50 text-xl font-extrabold text-amber-700 shadow sm:h-16 sm:w-16 sm:text-2xl">
              {level.target}
            </div>
          </div>

          <AnimatePresence>
            {showClimaxBurst && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-center text-sm font-extrabold text-emerald-600 sm:text-base"
              >
                ✨ ถอดเฟืองติดลบ = เครื่องจักรพุ่งไปข้างหน้า! ✨
              </motion.p>
          )}
          </AnimatePresence>

          {phase === 'idle' && !selectedGear && (
            <p className="mt-3 text-center text-xs font-semibold text-stone-400 sm:text-sm">
              💡 {level.hint}
            </p>
          )}

          {phase === 'miss' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-center text-sm font-extrabold text-red-500 sm:text-base"
            >
              ยังไม่ถึงเป้าหมาย! แต่ไม่เป็นไร ได้เฟืองพิเศษ ✨ มาช่วยไปต่อแล้ว
            </motion.p>
          )}

          <AnimatePresence>{phase === 'miss' && <SmokePuff key={attempt} />}</AnimatePresence>
        </motion.div>

        {/* Inventory */}
        <div className="rounded-3xl border-4 border-stone-700/80 bg-white/70 p-4 shadow-[0_6px_0_rgba(68,64,60,0.25)]">
          <p className="mb-3 text-center text-sm font-bold text-stone-500">
            🔩 คลังเฟือง — เลือกเฟืองมาใส่ในช่องว่าง
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <AnimatePresence>
              {inventoryGears.map((gear) => (
                <Gear
                  key={gear.id}
                  gear={gear}
                  onClick={() => handleSelectGear(gear)}
                  muted={phase === 'running'}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <motion.button
            type="button"
            onClick={handleRewind}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 rounded-full border-4 border-stone-600 bg-stone-200 px-5 py-3 font-extrabold text-stone-700 shadow-[0_5px_0_rgba(68,64,60,0.5)] active:translate-y-1 active:shadow-none"
          >
            <RotateCcw className="h-5 w-5" />
            ย้อนกลับ
          </motion.button>

          <motion.button
            type="button"
            onClick={handleRun}
            disabled={!slotFilled || phase === 'running'}
            whileHover={slotFilled && phase !== 'running' ? { scale: 1.05 } : {}}
            whileTap={slotFilled && phase !== 'running' ? { scale: 0.95 } : {}}
            animate={
              slotFilled && phase === 'idle'
                ? { scale: [1, 1.06, 1] }
                : { scale: 1 }
            }
            transition={
              slotFilled && phase === 'idle'
                ? { repeat: Infinity, duration: 1.2 }
                : {}
            }
            className={`flex items-center gap-2 rounded-full border-4 px-8 py-3 text-lg font-extrabold shadow-[0_5px_0_rgba(6,95,70,0.6)] active:translate-y-1 active:shadow-none ${
              slotFilled && phase !== 'running'
                ? 'border-emerald-700 bg-emerald-400 text-emerald-950'
                : 'cursor-not-allowed border-stone-400 bg-stone-200 text-stone-400 shadow-none'
            }`}
          >
            <Play className="h-6 w-6 fill-current" />
            เดินเครื่อง!
          </motion.button>
        </div>
      </div>

      {/* Victory modal */}
      <AnimatePresence>
        {phase === 'success' && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.6, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border-4 border-amber-400 bg-white p-6 text-center shadow-2xl"
            >
              <Confetti />
              <motion.div
                animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100"
              >
                <PartyPopper className="h-9 w-9 text-amber-500" />
              </motion.div>
              <h3 className="text-2xl font-extrabold text-stone-700">
                {isLastLevel ? 'สุดยอด! จบหมวดนี้แล้ว! 🎉' : 'เก่งมาก! ผ่านด่านแล้ว!'}
              </h3>
              <p className="mt-1 text-sm font-semibold text-stone-500">
                {isLastLevel
                  ? `เธอเชี่ยวชาญ "${category.label}" แล้ว!`
                  : `เข็มชี้ไปที่ ${level.target} ได้สำเร็จ!`}
              </p>

              <div className="mt-4 flex items-center justify-center gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2 + i * 0.15, type: 'spring' }}
                  >
                    <Star className="h-7 w-7 fill-amber-400 text-amber-500" />
                  </motion.div>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-2">
                {!isLastLevel && (
                  <motion.button
                    type="button"
                    onClick={onNextLevel}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full rounded-full border-4 border-emerald-700 bg-emerald-400 px-6 py-3 text-lg font-extrabold text-emerald-950 shadow-[0_5px_0_rgba(6,95,70,0.6)] active:translate-y-1 active:shadow-none"
                  >
                    ด่านต่อไป ➜
                  </motion.button>
                )}
                <motion.button
                  type="button"
                  onClick={onExit}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full rounded-full border-4 px-6 py-3 font-extrabold shadow-[0_4px_0_rgba(0,0,0,0.25)] active:translate-y-1 active:shadow-none ${
                    isLastLevel
                      ? 'border-emerald-700 bg-emerald-400 text-emerald-950 text-lg py-3'
                      : 'border-stone-400 bg-stone-100 text-stone-600'
                  }`}
                >
                  กลับหน้าหลัก
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------
export default function ClockworkGame() {
  const [screen, setScreen] = useState('home') // home | game
  const [categoryId, setCategoryId] = useState(null)
  const [levelIndex, setLevelIndex] = useState(0)
  const [level, setLevel] = useState(null)
  const [progress, setProgress] = useState(() =>
    Object.fromEntries(CATEGORIES.map((c) => [c.id, new Set()]))
  )
  const [devGateOpen, setDevGateOpen] = useState(false)
  const [devPanelOpen, setDevPanelOpen] = useState(false)

  const startLevel = (catId, idx) => {
    setCategoryId(catId)
    setLevelIndex(idx)
    setLevel(generateLevel(catId, idx))
    setScreen('game')
  }

  const handleSelectCategory = (id) => {
    startLevel(id, 0)
  }

  const handleExit = () => {
    setScreen('home')
  }

  const handleLevelComplete = (catId, idx) => {
    setProgress((prev) => {
      const next = { ...prev, [catId]: new Set(prev[catId]) }
      next[catId].add(idx)
      return next
    })
  }

  const handleNextLevel = () => {
    startLevel(categoryId, levelIndex + 1)
  }

  const handleDevUnlock = () => {
    setDevGateOpen(false)
    setDevPanelOpen(true)
  }

  const handleDevJump = (catId, idx) => {
    startLevel(catId, idx)
    setDevPanelOpen(false)
  }

  return (
    <>
      {screen === 'home' && (
        <HomeScreen
          progress={progress}
          onSelectCategory={handleSelectCategory}
          onOpenDev={() => setDevGateOpen(true)}
        />
      )}

      {screen === 'game' && level && (
        <GameScreen
          category={findCategory(categoryId)}
          level={level}
          levelIndex={levelIndex}
          onExit={handleExit}
          onLevelComplete={handleLevelComplete}
          onNextLevel={handleNextLevel}
        />
      )}

      <AnimatePresence>
        {devGateOpen && (
          <DevGateModal onClose={() => setDevGateOpen(false)} onUnlock={handleDevUnlock} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {devPanelOpen && (
          <DevPanelModal onClose={() => setDevPanelOpen(false)} onJump={handleDevJump} />
        )}
      </AnimatePresence>
    </>
  )
}
