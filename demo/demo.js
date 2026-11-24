import {
  App,
  Column,
  Text,
  Button,
  Element,
  rx
} from './src/index.js'

const count = rx(0)

App({
  home: Column({
    gap: 12,
    children: [
      Element('header', {
        className: 'header',
        backgroundColor: '#222',
        color: '#fff',
        padding: 16,
        children: [
          Element('h1', {
            children: 'RxFlare 原生 HTML 测试'
          })
        ]
      }),

      Element('section', {
        className: 'content',
        children: [
          Element('p', {
            children: '这是原生 HTML 段落'
          }),

          Element('a', {
            href: 'https://github.com',
            target: '_blank',
            children: 'GitHub'
          }),

          Element('img', {
            src: 'https://placehold.com/200x100',
            alt: '测试图片',
            width: 200
          })
        ]
      }),

      Text(() => `点击次数：${count.value}`),

      Button('增加', {
        onClick: () => count.value++
      })
    ]
  })
}).mount('#app')