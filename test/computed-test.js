
import {
  rx,
  effect,
  computed,
  batch
} from './src/index.js'

console.log('--- LAZY COMPUTED ---')

const count = rx(10)

let computeCount = 0

const double = computed(() => {
  computeCount++

  console.log('计算 double')

  return count.value * 2
})

console.log('创建之后:', computeCount)

console.log('第一次读取:', double.value)
console.log('第二次读取:', double.value)

console.log('计算次数:', computeCount)

console.log('\n--- INVALIDATION ---')

count.value = 20

console.log('修改之后:', computeCount)

console.log('重新读取:', double.value)
console.log('再次读取:', double.value)

console.log('最终计算次数:', computeCount)

console.log('\n--- EFFECT ---')

effect(() => {
  console.log('Effect:', double.value)
})

count.value = 30

console.log('\n--- BATCH ---')

batch(() => {
  count.value = 40
  count.value = 50
  count.value = 60
})

console.log('Batch result:', double.value)




const count1 = rx(10)

const double1 = computed(() => {
  return count1.value * 2
})

const quadruple = computed(() => {
  return double1.value * 2
})

effect(() => {
  console.log(quadruple.value)
})

count1.value = 20