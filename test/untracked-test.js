
import { rx, effect, untracked } from './src/core/rx.js'

const count = rx(0)
const extra = rx(100)

let effectRuns = 0

effect(() => {
  effectRuns++

  console.log('Effect:', count.value)

  untracked(() => {
    console.log('Extra:', extra.value)
  })
})

console.log('\n--- UPDATE EXTRA ---')

extra.value++

console.log('Effect runs:', effectRuns)

console.log('\n--- UPDATE COUNT ---')

count.value++

console.log('Effect runs:', effectRuns)
