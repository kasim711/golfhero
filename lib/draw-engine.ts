import { GolfScore } from '@/types'

// ============================================================
// DRAW ENGINE
// ============================================================

/**
 * Random draw — standard lottery style
 * Picks 5 unique numbers from 1-45
 */
export function generateRandomDraw(): number[] {
  const numbers = new Set<number>()
  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 45) + 1)
  }
  return Array.from(numbers).sort((a, b) => a - b)
}

/**
 * Algorithmic draw — weighted by most frequent scores across all users
 * More common scores have higher chance of being drawn (exciting for users)
 */
export function generateAlgorithmicDraw(allScores: number[]): number[] {
  if (allScores.length === 0) return generateRandomDraw()

  // Count frequency of each score
  const freq: Record<number, number> = {}
  for (const score of allScores) {
    freq[score] = (freq[score] || 0) + 1
  }

  // Build weighted pool
  const weightedPool: number[] = []
  for (const [scoreStr, count] of Object.entries(freq)) {
    const score = parseInt(scoreStr)
    // Add score proportionally to frequency
    for (let i = 0; i < count; i++) {
      weightedPool.push(score)
    }
  }

  // Pick 5 unique from weighted pool
  const drawn = new Set<number>()
  let attempts = 0
  while (drawn.size < 5 && attempts < 1000) {
    const idx = Math.floor(Math.random() * weightedPool.length)
    drawn.add(weightedPool[idx])
    attempts++
  }

  // Fill remaining with random if needed
  while (drawn.size < 5) {
    drawn.add(Math.floor(Math.random() * 45) + 1)
  }

  return Array.from(drawn).sort((a, b) => a - b)
}

/**
 * Check how many numbers a user's scores match with drawn numbers
 */
export function checkMatch(userScores: number[], drawnNumbers: number[]): number {
  const drawnSet = new Set(drawnNumbers)
  return userScores.filter(s => drawnSet.has(s)).length
}

/**
 * Calculate prize amounts based on match counts and pool sizes
 */
export function calculatePrizes(
  entries: Array<{ user_id: string; scores: number[] }>,
  drawnNumbers: number[],
  pools: { jackpot: number; match4: number; match3: number }
) {
  const results = entries.map(entry => {
    const matchCount = checkMatch(entry.scores, drawnNumbers)
    return { ...entry, matchCount }
  })

  const match5Winners = results.filter(r => r.matchCount === 5)
  const match4Winners = results.filter(r => r.matchCount === 4)
  const match3Winners = results.filter(r => r.matchCount === 3)

  const payoutPerMatch5 = match5Winners.length > 0 ? pools.jackpot / match5Winners.length : 0
  const payoutPerMatch4 = match4Winners.length > 0 ? pools.match4 / match4Winners.length : 0
  const payoutPerMatch3 = match3Winners.length > 0 ? pools.match3 / match3Winners.length : 0

  return {
    results: results.map(r => ({
      ...r,
      prizeAmount:
        r.matchCount === 5 ? payoutPerMatch5 :
        r.matchCount === 4 ? payoutPerMatch4 :
        r.matchCount === 3 ? payoutPerMatch3 : 0,
    })),
    summary: {
      match5Winners: match5Winners.length,
      match4Winners: match4Winners.length,
      match3Winners: match3Winners.length,
      payoutPerMatch5,
      payoutPerMatch4,
      payoutPerMatch3,
      jackpotRolledOver: match5Winners.length === 0,
    }
  }
}

/**
 * Simulate a draw without saving — for admin preview
 */
export function simulateDraw(
  entries: Array<{ user_id: string; scores: number[] }>,
  logic: 'random' | 'algorithmic',
  allScores?: number[]
) {
  const drawnNumbers = logic === 'algorithmic' && allScores
    ? generateAlgorithmicDraw(allScores)
    : generateRandomDraw()

  return { drawnNumbers, entries }
}
