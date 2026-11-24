
import {
  rx,
  computed,
  effect,
  batch
} from './src/core/rx.js'

const a = rx(1)
const b = rx(2)
const c = rx(3)

let computedRuns = 0
let effectRuns = 0

const total = computed(() => {
  computedRuns++

  console.log('计算 total')

  return a.value + b.value + c.value
})

effect(() => {
  effectRuns++

  console.log('Effect:', total.value)
})

console.log('\n--- MULTI DEP BATCH ---')

batch(() => {
  a.value = 10
  b.value = 20
  c.value = 30
})

console.log('\n--- STATISTICS ---')

console.log('computedRuns:', computedRuns)
console.log('effectRuns:', effectRuns)
