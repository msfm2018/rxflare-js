import {
  App,
  Column,
  Text,
  Header,
  Main,
  Footer,
  Nav,
  Section,
  Article,
  Aside
} from './src/index.js'

App({
  home: Column({
    gap: 12,
    padding: 24,

    children: [
      Header({
        padding: 20,
        backgroundColor: '#dbeafe',
        children: Text('网站头部')
      }),

      Nav({
        padding: 12,
        backgroundColor: '#f1f5f9',
        children: Text('首页 | 产品 | 关于我们')
      }),

      Main({
        children: [
          Section({
            padding: 16,
            backgroundColor: '#dcfce7',
            children: Text('主要内容区域')
          }),

          Article({
            padding: 16,
            backgroundColor: '#fef3c7',
            children: Text('独立文章内容')
          }),

          Aside({
            padding: 16,
            backgroundColor: '#fce7f3',
            children: Text('侧边栏内容')
          })
        ]
      }),

      Footer({
        padding: 20,
        backgroundColor: '#e2e8f0',
        children: Text('网站底部')
      })
    ]
  })
}).mount('#app')