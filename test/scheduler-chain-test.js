
import {
  rx,
  computed,
  effect,
  batch
} from './src/core/rx.js'

const count = rx(2)

let doubleRuns = 0
let totalRuns = 0
let effectRuns = 0

const double = computed(() => {
  doubleRuns++

  console.log('计算 double')

  return count.value * 2
})

const total = computed(() => {
  totalRuns++

  console.log('计算 total')

  return double.value + 10
})

effect(() => {
  effectRuns++

  console.log('Effect:', total.value)
})

console.log('\n--- UPDATE ---')

count.value = 5

console.log('\n--- BATCH ---')

batch(() => {
  count.value = 10
  count.value = 20
  count.value = 30
})

console.log('\n--- STATISTICS ---')

console.log('doubleRuns:', doubleRuns)
console.log('totalRuns:', totalRuns)
console.log('effectRuns:', effectRuns)
