
import {
  rx,
  effect,
  computed,
  batch,
  stop
} from './src/index.js'

const count = rx(0)

const double = computed(() => {
  return count.value * 2
})

// 普通副作用
effect(() => {
  console.log('Count:', count.value)
})

// 依赖计算属性
effect(() => {
  console.log('Double:', double.value)
})

console.log('--- UPDATE ---')

count.value++

console.log('--- BATCH ---')

batch(() => {
  count.value++
  count.value++
  count.value++
})

console.log('--- COMPUTED CHAIN ---')

const a = rx(2)

const b = computed(() => {
  return a.value + 1
})

const c = computed(() => {
  return b.value * 2
})

effect(() => {
  console.log('C:', c.value)
})

a.value = 5

console.log('--- DYNAMIC DEPENDENCIES ---')

const flag = rx(true)
const x = rx('X')
const y = rx('Y')

effect(() => {
  console.log('Value:', flag.value ? x.value : y.value)
})

console.log('Change flag')
flag.value = false

console.log('Change old dependency')
x.value = 'X2'

console.log('Change new dependency')
y.value = 'Y2'


console.log('--- STOP EFFECT ---')

const message = rx('Hello')

const runner = effect(() => {
  console.log('Message:', message.value)
})

console.log('Stop effect')
stop(runner)

message.value = 'World'
message.value = 'RxFlare'



console.log('--- ERROR RECOVERY ---')

const number = rx(0)

effect(() => {
  console.log('Number:', number.value)

  if (number.value === 1) {
    throw new Error('Test error')
  }
})

try {
  number.value = 1
} catch (error) {
  console.log('Caught:', error.message)
}

number.value = 2



console.log('--- INFINITE LOOP PROTECTION ---')

const counter = rx(0)

effect(() => {
  console.log('Loop:', counter.value)

  if (counter.value < 3) {
    counter.value++
  }
})


// console.log('--- REAL INFINITE LOOP ---')

// const loop = rx(0)

// try {
//   effect(() => {
//     console.log('Infinite:', loop.value)
//     loop.value++
//   })
// } catch (error) {
//   console.log('Protected:', error.message)
// }

console.log('--- ENGINE RECOVERED ---')

const finalValue = rx(100)

effect(() => {
  console.log('Final:', finalValue.value)
})

finalValue.value = 200

console.log('--- OBJECT REACTIVITY ---')

const user = rx({
  name: 'Jack',
  age: 20,
  profile: {
    city: 'Shanghai'
  }
})

effect(() => {
  console.log('Name:', user.value.name)
})

user.value.name = 'Tom'
user.value.age = 25

console.log('--- NESTED OBJECT ---')

effect(() => {
  console.log('City:', user.value.profile.city)
})

user.value.profile.city = 'Beijing'


console.log('--- ARRAY REACTIVITY ---')

const list = rx([1, 2, 3])

effect(() => {
  console.log('List:', list.value.join(', '))
})

console.log('Push')
list.value.push(4)

console.log('Change index')
list.value[0] = 10

console.log('Delete')
list.value.splice(1, 1)

console.log('Change length')
list.value.length = 1


console.log('--- MAP REACTIVITY ---')

const map = rx(new Map([
  ['name', 'Jack']
]))

effect(() => {
  console.log('Map name:', map.value.get('name'))
})

map.value.set('name', 'Tom')

console.log('--- SET REACTIVITY ---')

const set = rx(new Set([1, 2]))

effect(() => {
  console.log('Set size:', set.value.size)
})

set.value.add(3)
set.value.delete(1)

console.log('--- MAP ITERATION ---')

const products = rx(new Map([
  ['apple', 10],
  ['banana', 20]
]))

effect(() => {
  console.log(
    'Products:',
    [...products.value.values()].join(', ')
  )
})

products.value.set('apple', 15)

console.log('--- SET ITERATION ---')

const numbers = rx(new Set([1, 2]))

effect(() => {
  console.log(
    'Numbers:',
    [...numbers.value].join(', ')
  )
})

numbers.value.add(3)

console.log('--- SET ENTRIES ---')

const entrySet = rx(new Set([1, 2]))

effect(() => {
  console.log(
    'Entries:',
    [...entrySet.value.entries()]
      .map(([key, value]) => `${key}:${value}`)
      .join(', ')
  )
})

entrySet.value.add(3)




console.log('--- MAP HAS ---')

const hasMap = rx(new Map([
  ['name', 'Jack']
]))

effect(() => {
  console.log('Has name:', hasMap.value.has('name'))
})

hasMap.value.set('age', 18)
hasMap.value.delete('name')

console.log('--- SET HAS ---')

const hasSet = rx(new Set([1, 2]))

effect(() => {
  console.log('Has 1:', hasSet.value.has(1))
})

hasSet.value.add(3)
hasSet.value.delete(1)








console.log('--- MAP DELETE ---')

const deleteMap = rx(new Map([
  ['name', 'Jack'],
  ['age', 18]
]))

effect(() => {
  console.log('Map size:', deleteMap.value.size)
})

deleteMap.value.delete('name')

console.log('--- SET DELETE ---')

const deleteSet = rx(new Set([1, 2, 3]))

effect(() => {
  console.log('Set size:', deleteSet.value.size)
})

deleteSet.value.delete(2)

console.log('--- MAP CLEAR ---')

const clearMap = rx(new Map([
  ['a', 1],
  ['b', 2]
]))

effect(() => {
  console.log('Map values:', [...clearMap.value.values()].join(', '))
})

clearMap.value.clear()

console.log('--- SET CLEAR ---')

const clearSet = rx(new Set([10, 20, 30]))

effect(() => {
  console.log('Set values:', [...clearSet.value].join(', '))
})

clearSet.value.clear()










console.log('--- NESTED MAP OBJECT ---')

const nestedMap = rx(new Map([
  ['user', {
    name: 'Jack',
    profile: {
      city: 'Shanghai'
    }
  }]
]))

effect(() => {
  console.log(
    'Map user:',
    nestedMap.value.get('user').name
  )
})

nestedMap.value.get('user').name = 'Tom'

effect(() => {
  console.log(
    'Map city:',
    nestedMap.value.get('user').profile.city
  )
})

nestedMap.value.get('user').profile.city = 'Beijing'

console.log('--- NESTED SET OBJECT ---')

const nestedSet = rx(new Set([
  {
    name: 'Apple',
    price: 10
  }
]))

const product = [...nestedSet.value][0]

effect(() => {
  console.log('Product price:', product.price)
})

product.price = 20







console.log('--- MAP FOREACH ---')

const forEachMap = rx(new Map([
  ['name', 'Jack'],
  ['city', 'Shanghai']
]))

effect(() => {
  forEachMap.value.forEach((value, key) => {
    console.log('Map item:', key, value)
  })
})

forEachMap.value.set('age', 18)

console.log('--- SET FOREACH ---')

const forEachSet = rx(new Set([1, 2]))

effect(() => {
  forEachSet.value.forEach((value, key) => {
    console.log('Set item:', value, key)
  })
})

forEachSet.value.add(3)




