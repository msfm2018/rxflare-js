
import {
  rx,
  computed,
  effect
} from './src/core/rx.js'

const count = rx(10)

let computedRuns = 0
let effectRuns = 0

const result = computed(() => {
  computedRuns++

  console.log('计算 result')

  if (count.value < 0) {
    throw new Error('Count cannot be negative')
  }

  return count.value * 2
})

effect(() => {
  effectRuns++

  try {
    console.log('Effect:', result.value)
  } catch (error) {
    console.log('Caught:', error.message)
  }
})

console.log('\n--- THROW ERROR ---')

count.value = -1

console.log('\n--- RECOVER ---')

count.value = 20

console.log('\n--- STATISTICS ---')

console.log('computedRuns:', computedRuns)
console.log('effectRuns:', effectRuns)
