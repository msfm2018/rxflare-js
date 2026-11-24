
import {
  rx,
  effect,
  computed
} from './src/index.js'

console.log('--- DYNAMIC DEPENDENCIES ---')

const flag = rx(true)
const a = rx(10)
const b = rx(20)

const result = computed(() => {
  return flag.value ? a.value : b.value
})

effect(() => {
  console.log('Result:', result.value)
})

a.value = 100

flag.value = false

a.value = 200
b.value = 300

console.log('\n--- SAME VALUE CACHE ---')

let calls = 0

const cached = computed(() => {
  calls++
  return b.value * 2
})

console.log(cached.value)
console.log(cached.value)
console.log('Calls:', calls)

console.log('\n--- ERROR RECOVERY ---')

const shouldThrow = rx(false)
const source = rx(10)

const risky = computed(() => {
  if (shouldThrow.value) {
    throw new Error('Test error')
  }

  return source.value * 2
})

console.log('Initial:', risky.value)

shouldThrow.value = true

try {
  console.log(risky.value)
} catch (error) {
  console.log('Caught:', error.message)
}

shouldThrow.value = false

console.log('Recovered:', risky.value)

source.value = 20

console.log('Updated:', risky.value)
