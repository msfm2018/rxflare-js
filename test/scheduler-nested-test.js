
import {
  rx,
  effect,
  batch
} from './src/core/rx.js'

const a = rx(1)
const b = rx(2)
const c = rx(3)

let runs = 0

effect(() => {
  runs++

  console.log(
    `Effect: a=${a.value}, b=${b.value}, c=${c.value}`
  )
})

console.log('\n--- NESTED BATCH ---')

batch(() => {
  a.value = 10

  batch(() => {
    b.value = 20

    batch(() => {
      c.value = 30
      a.value = 100
    })
  })

  b.value = 200
})

console.log('\n--- STATISTICS ---')
console.log('Effect runs:', runs)

console.log('\n--- SINGLE UPDATE ---')

a.value = 999

console.log('Effect runs:', runs)
