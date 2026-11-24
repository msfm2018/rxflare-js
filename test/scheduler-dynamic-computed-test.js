
import {
  rx,
  computed,
  effect
} from './src/core/rx.js'

const flag = rx(true)
const a = rx(10)
const b = rx(20)

let computedRuns = 0
let effectRuns = 0

const result = computed(() => {
  computedRuns++

  console.log('计算 result')

  return flag.value
    ? a.value
    : b.value
})

effect(() => {
  effectRuns++

  console.log('Effect:', result.value)
})

console.log('\n--- SWITCH FLAG ---')

flag.value = false

console.log('\n--- UPDATE OLD DEPENDENCY ---')

a.value = 100

console.log('\n--- UPDATE NEW DEPENDENCY ---')

b.value = 200

console.log('\n--- STATISTICS ---')

console.log('computedRuns:', computedRuns)
console.log('effectRuns:', effectRuns)
