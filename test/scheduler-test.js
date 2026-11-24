
import {
  rx,
  computed,
  effect,
  batch
} from './src/core/rx.js'

const first = rx(1)
const second = rx(2)

const total = computed(() => {
  console.log('计算 Total')

  return first.value + second.value
})

effect(() => {
  console.log('Effect Total:', total.value)
})

console.log('\n--- BATCH UPDATE ---')

batch(() => {
  first.value = 10
  second.value = 20
})

console.log('\n--- FINISHED ---')
