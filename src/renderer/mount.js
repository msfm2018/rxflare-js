
import { effectScope } from '../core/rx.js'
import { createElement } from './create-element.js'
import { createLifecycle } from './lifecycle.js'
import { createEventDelegator } from './events/event-delegator.js'
import { insertRange } from './node-range.js'
import { createPageStyles } from './page-styles.js'

const mountedInstances = new WeakMap()

// 创建一个独立页面实例
function createPageInstance(container, widget, options = {}) {
  // 页面专属 DOM 根节点
  const pageRoot = document.createElement('div')

  pageRoot.setAttribute('data-rx-page-root', '')
  pageRoot.style.display = 'contents'

  // 页面专属响应式作用域
  const scope = effectScope()

  // 页面专属事件代理
  const eventDelegator = createEventDelegator(pageRoot)

  // 页面专属生命周期
  const lifecycle = createLifecycle(eventDelegator)

  let element
  let cleanupPageStyles = () => {}

  let active = true
  let mounted = false

  try {
    // 创建页面专属 CSS
    cleanupPageStyles = createPageStyles(
      pageRoot,
      options.styles
    )

    // 创建页面组件
    element = scope.run(() =>
      createElement(widget, lifecycle)
    )

    // 将组件插入页面根节点
    insertRange(pageRoot, element)
  } catch (error) {
    try {
      lifecycle.unmount()
    } catch (cleanupError) {
      console.error(cleanupError)
    }

    eventDelegator.dispose()
    scope.stop()

    try {
      cleanupPageStyles()
    } catch (cleanupError) {
      console.error(cleanupError)
    }

    pageRoot.remove()

    throw error
  }

  const instance = {
    element,
    root: pageRoot,

    // 页面插入 DOM 后执行挂载生命周期
    activate() {
      if (!active || mounted) return

      lifecycle.mount()
      mounted = true
    },

    // 更新页面
    update(nextWidget, nextOptions = {}) {
      if (!active) {
        throw new Error(
          'RxFlare: Cannot update an unmounted page.'
        )
      }

      if (mountedInstances.get(container) !== instance) {
        throw new Error(
          'RxFlare: Cannot update a page that is no longer active.'
        )
      }

      // 先创建新页面
      const nextInstance = createPageInstance(
        container,
        nextWidget,
        nextOptions
      )

      try {
        // 插入新页面
        container.appendChild(nextInstance.root)

        // 执行新页面的 onMount
        nextInstance.activate()
      } catch (error) {
        nextInstance.unmount()
        throw error
      }

      // 新页面成为当前页面
      mountedInstances.set(container, nextInstance)

      // 最后清理旧页面
      instance.unmount()

      return nextInstance
    },

    // 卸载当前页面
    unmount() {
      if (!active) return

      active = false

      try {
        lifecycle.unmount()
      } finally {
        try {
          eventDelegator.dispose()
        } finally {
          try {
            scope.stop()
          } finally {
            try {
              cleanupPageStyles()
            } finally {
              pageRoot.remove()

              if (
                mountedInstances.get(container) === instance
              ) {
                mountedInstances.delete(container)
              }
            }
          }
        }
      }
    }
  }

  return instance
}

export function mount(selector, widget, options = {}) {
  const container =
    typeof selector === 'string'
      ? document.querySelector(selector)
      : selector

  if (!container) {
    throw new Error(
      `RxFlare: Mount target "${selector}" not found.`
    )
  }

  const previous = mountedInstances.get(container)

  // 先创建新页面，旧页面暂时保留
  const instance = createPageInstance(
    container,
    widget,
    options
  )

  try {
    // 插入新页面
    container.appendChild(instance.root)

    // DOM 插入后执行 onMount
    instance.activate()
  } catch (error) {
    instance.unmount()
    throw error
  }

  // 更新当前页面实例
  mountedInstances.set(container, instance)

  // 新页面成功后再卸载旧页面
  if (previous) {
    previous.unmount()
  }

  // 清理容器中其他非页面节点
  for (const child of [...container.childNodes]) {
    if (child !== instance.root) {
      child.remove()
    }
  }

  return instance
}
