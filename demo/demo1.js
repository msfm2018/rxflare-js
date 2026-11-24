
import {
  App,
  Column,
  Text,
  Button,
  Component,
  rx,
  effect,
  onCleanup
} from './src/index.js'

// ==============================
// 测试统计
// ==============================

const stats = {
  A: {
    mount: 0,
    cleanup: 0,
    unmount: 0,
    effect: 0
  },

  B: {
    mount: 0,
    cleanup: 0,
    unmount: 0,
    effect: 0
  }
}

const countA = rx(0)
const countB = rx(0)

let page

// ==============================
// 页面 A
// ==============================

const PageA = Component(() => {
  return Column({
    children: [
      Text('页面 A'),

      Text(() => `A 响应式数据：${countA.value}`),

      Button('修改 A 数据', {
        onClick: () => {
          countA.value++
        }
      }),

      Button('切换到 B', {
        onClick: () => {
          page = page.update(PageB)
        }
      })
    ],

    onMount() {
      stats.A.mount++

      console.log('A onMount')

      effect(() => {
        countA.value

        stats.A.effect++

        console.log(
          'A effect:',
          stats.A.effect
        )
      })

      onCleanup(() => {
        stats.A.cleanup++

        console.log('A onCleanup')
      })
    },

    onUnmount() {
      stats.A.unmount++

      console.log('A onUnmount')
    }
  })
})

// ==============================
// 页面 B
// ==============================

const PageB = Component(() => {
  return Column({
    children: [
      Text('页面 B'),

      Text(() => `B 响应式数据：${countB.value}`),

      Button('修改 B 数据', {
        onClick: () => {
          countB.value++
        }
      }),

      Button('返回 A', {
        onClick: () => {
          page = page.update(PageA)
        }
      })
    ],

    onMount() {
      stats.B.mount++

      console.log('B onMount')

      effect(() => {
        countB.value

        stats.B.effect++

        console.log(
          'B effect:',
          stats.B.effect
        )
      })

      onCleanup(() => {
        stats.B.cleanup++

        console.log('B onCleanup')
      })
    },

    onUnmount() {
      stats.B.unmount++

      console.log('B onUnmount')
    }
  })
})

// ==============================
// 挂载
// ==============================

page = App({
  home: PageA
}).mount('#app')

// ==============================
// 查看统计
// ==============================

window.showStats = () => {
  console.table(stats)
}

// ==============================
// 最终卸载
// ==============================

window.testUnmount = () => {
  page.unmount()

  console.log('最终测试统计：')
  console.table(stats)
}


window.countA = countA
window.countB = countB