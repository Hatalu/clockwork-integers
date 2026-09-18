// ---------------------------------------------------------------------------
// Category metadata + a level GENERATOR for Clockwork Integers.
//
// Nothing here is a fixed puzzle any more — every time a level is entered
// (category pick, "next level", dev-jump) generateLevel() rolls a brand new
// start/target/gear set. The number-line pattern (min/max/step) is derived
// from whatever numbers came up so ticks always stay evenly spaced.
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  {
    id: 'addition',
    label: 'ด่านการบวก',
    subtitle: 'ฝึกบวกจำนวนเต็ม',
    icon: 'plus',
    levelCount: 3,
    theme: {
      grad: 'from-gear-pos-light to-gear-pos',
      border: 'border-gear-pos-dark',
      text: 'text-gear-pos-dark',
    },
  },
  {
    id: 'subtraction',
    label: 'ด่านการลบ',
    subtitle: 'ฝึกลบจำนวนเต็ม',
    icon: 'minus',
    levelCount: 3,
    theme: {
      grad: 'from-gear-neg-light to-gear-neg',
      border: 'border-gear-neg-dark',
      text: 'text-gear-neg-dark',
    },
  },
  {
    id: 'mixed',
    label: 'ด่านผสม',
    subtitle: 'บวกและลบปนกัน',
    icon: 'shuffle',
    levelCount: 3,
    theme: {
      grad: 'from-violet-300 to-violet-500',
      border: 'border-violet-700',
      text: 'text-violet-700',
    },
  },
]

export const findCategory = (categoryId) => CATEGORIES.find((c) => c.id === categoryId)

// ---------------------------------------------------------------------------
// Random helpers
// ---------------------------------------------------------------------------
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

let seq = 0
const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`

const DIFFICULTY_BY_SLOT = [4, 6, 8] // maxAbs per slot index (0,1,2)

const HINTS = {
  addition: 'ใส่เฟืองที่บวกแล้วพาเข็มไปสู่เป้าหมายพอดี',
  subtraction: 'ลบเลขติดลบ = เดินหน้า! ลองสังเกตเฟืองสีแดงดูดี ๆ',
  '+': 'บวกด้วยเลขติดลบจะพาเข็มถอยหลังผ่านศูนย์',
  '-': 'ลบเลขติดลบ = เดินหน้า! ลองสังเกตเฟืองสีแดงดูดี ๆ',
}

// ---------------------------------------------------------------------------
// Level generator
// ---------------------------------------------------------------------------
export function generateLevel(categoryId, slotIndex) {
  const category = findCategory(categoryId)
  const maxAbs = DIFFICULTY_BY_SLOT[Math.min(slotIndex, DIFFICULTY_BY_SLOT.length - 1)]

  let operator
  if (categoryId === 'addition') operator = '+'
  else if (categoryId === 'subtraction') operator = '-'
  else operator = Math.random() < 0.5 ? '+' : '-'

  let start = randInt(-maxAbs, maxAbs)
  let target = randInt(-maxAbs, maxAbs)
  while (target === start) target = randInt(-maxAbs, maxAbs)

  // The final level of "subtraction" always guarantees the climax moment:
  // subtracting a NEGATIVE gear (target ends up above start).
  if (categoryId === 'subtraction' && slotIndex === DIFFICULTY_BY_SLOT.length - 1) {
    target = start + randInt(1, maxAbs)
  }

  const correct = operator === '+' ? target - start : start - target

  // --- decoy gears ---------------------------------------------------------
  const used = new Set([correct])
  const decoys = []
  const candidates = shuffle([
    () => -correct, // classic sign-flip mistake
    () => correct + (Math.random() < 0.5 ? 1 : -1) * randInt(1, 3), // off by a bit
    () => start, // picked the start number by mistake
    () => target, // picked the target number by mistake
    () => randInt(-maxAbs - 2, maxAbs + 2), // wildcard
  ])
  for (const fn of candidates) {
    if (decoys.length >= 3) break
    const v = fn()
    if (!used.has(v)) {
      used.add(v)
      decoys.push(v)
    }
  }
  while (decoys.length < 3) {
    const v = randInt(-maxAbs - 3, maxAbs + 3)
    if (!used.has(v)) {
      used.add(v)
      decoys.push(v)
    }
  }

  const gears = shuffle([correct, ...decoys]).map((value) => ({ id: uid('gear'), value }))

  // --- number-line pattern ---------------------------------------------------
  const bothEven = start % 2 === 0 && target % 2 === 0
  const step = bothEven && Math.random() < 0.5 ? 2 : 1
  const pad = step * 2
  const min = Math.floor((Math.min(start, target) - pad) / step) * step
  const max = Math.ceil((Math.max(start, target) + pad) / step) * step

  return {
    key: uid('level'),
    categoryId,
    slotIndex,
    title: `ภารกิจที่ ${slotIndex + 1} · ${category.label}`,
    story: `เข็มอยู่ที่ ${start} ต้องทำให้เข็มไปอยู่ที่ ${target}!`,
    hint: categoryId === 'mixed' ? HINTS[operator] : HINTS[categoryId],
    start,
    target,
    operator,
    gears,
    line: { min, max, step },
  }
}

export const nextGearId = uid
