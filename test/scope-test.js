
import {
  rx,
  effect,
  effectScope
} from './src/index.js'

const count = rx(0)

const scope = effectScope()

console.log('--- SCOPE START ---')

scope.run(() => {
  effect(() => {
    console.log('Effect A:', count.value)
  })

  effect(() => {
    console.log('Effect B:', count.value * 2)
  })
})

console.log('\n--- UPDATE ---')

count.value = 1

console.log('\n--- STOP SCOPE ---')

scope.stop()

console.log('\n--- UPDATE AFTER STOP ---')

count.value = 2

console.log('\n--- FINISHED ---')
