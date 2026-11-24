import { computed } from './src/index.js'

console.log('--- DIRECT CYCLE ---')

let a

a = computed(() => a.value + 1)

try {
  console.log(a.value)
} catch (error) {
  console.log(error.message)
}

console.log('\n--- INDIRECT CYCLE ---')

let x
let y

x = computed(() => y.value + 1)
y = computed(() => x.value + 1)

try {
  console.log(x.value)
} catch (error) {
  console.log(error.message)
}