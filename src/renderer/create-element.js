
import {
  effect, effectScope,
  untracked,
  rx
} from '../core/rx.js'
import { createLifecycle } from './lifecycle.js'

import {
  normalizeEvent,
  getListenerOptions,
  runEventHandler
} from './events/event-modifiers.js'

import {
  createNodeRange,
  insertRange,
  removeRange,
  getFirstNode
} from './node-range.js'



function bindValue(value, apply) {
  if (typeof value === 'function') {
    effect(() => {
      apply(value())
    })
  } else {
    apply(value)
  }
}

function normalizeSpacing(value) {
  if (value == null) return ''

  // 数字默认使用 px
  if (typeof value === 'number') {
    return `${value}px`
  }

  // 允许传入 '1rem'、'2em'、'10%' 等 CSS 长度
  return String(value)
}



// ================================
// Unified DOM Props System
// ================================

// HTML Boolean 属性
const BOOLEAN_PROPS = new Set([
  'disabled',
  'checked',
  'selected',
  'multiple',
  'readonly',
  'required',
  'autofocus',
  'hidden',
  'open',
  'controls',
  'loop',
  'muted',
  'autoplay',
  'novalidate',
  'formnovalidate',
  'allowfullscreen',
  'reversed',
  'ismap',
  'inert'
])

// 仅保留框架内部使用的属性
const RESERVED_PROPS = new Set([
  'children',
  'child',
  'key',
  'tag',

  'open',
  'modal',

  'header',

  'onMount',
  'onUnmount',
  'onCleanup',
  'onUpdate',

  'text',

  'each',
  'condition',
  'fallback',
  'renderItem',

  'component',
  'componentProps'
])

// HTML 不允许包含子节点的标签
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
])
// 图片、链接、媒体等资源类 DOM 属性
const DOM_RESOURCE_PROPS = new Set([
  'src',
  'srcSet',
  'href',
  'poster',
  'action',
  'formAction'
])
// CSS 无单位数值属性
const UNITLESS_CSS_PROPS = new Set([
  'animationIterationCount',
  'aspectRatio',
  'borderImageOutset',
  'borderImageSlice',
  'borderImageWidth',
  'boxFlex',
  'columnCount',
  'columns',
  'fillOpacity',
  'flex',
  'flexGrow',
  'flexShrink',
  'floodOpacity',
  'fontWeight',
  'gridArea',
  'gridColumn',
  'gridColumnEnd',
  'gridColumnStart',
  'gridRow',
  'gridRowEnd',
  'gridRowStart',
  'lineClamp',
  'lineHeight',
  'opacity',
  'order',
  'orphans',
  'scale',
  'shapeImageThreshold',
  'stopOpacity',
  'strokeDasharray',
  'strokeDashoffset',
  'strokeMiterlimit',
  'strokeOpacity',
  'strokeWidth',
  'tabSize',
  'widows',
  'zIndex',
  'zoom'
])

// React 风格事件名转 DOM 事件名
function getEventName(key) {
  return key.slice(2).toLowerCase()
}

// kebab-case 转 camelCase
function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, char) => {
    return char.toUpperCase()
  })
}

// 判断是不是原生 CSS 属性
function isStyleProp(element, key) {
  if (key.startsWith('--')) {
    return true
  }

  const property = toCamelCase(key)

  if (property in element.style) {
    return true
  }

  // 兼容浏览器厂商前缀
  const capitalized = property[0]?.toUpperCase() + property.slice(1)

  return (
    `Webkit${capitalized}` in element.style ||
    `Moz${capitalized}` in element.style ||
    `ms${capitalized}` in element.style
  )
}

// CSS 数值处理
function normalizeStyleValue(key, value) {
  if (value == null) return ''

  if (typeof value !== 'number') {
    return value
  }

  if (key.startsWith('--')) {
    return String(value)
  }

  const property = toCamelCase(key)

  if (
    value === 0 ||
    UNITLESS_CSS_PROPS.has(property)
  ) {
    return String(value)
  }

  return `${value}px`
}

// 设置单个 CSS 属性
function setStyleProp(element, key, value) {
  if (value == null) {
    if (key.startsWith('--') || key.includes('-')) {
      element.style.removeProperty(key)
    } else {
      element.style[key] = ''
    }

    return
  }

  const normalized = normalizeStyleValue(key, value)

  if (key.startsWith('--') || key.includes('-')) {
    element.style.setProperty(key, String(normalized))
  } else {
    element.style[key] = normalized
  }
}

// 绑定单个 CSS 属性
function bindStyleProp(element, key, value) {
  bindValue(value, nextValue => {
    setStyleProp(element, key, nextValue)
  })
}

// 设置完整 style 对象
function applyStyles(element, styles = {}) {
  for (const [key, value] of Object.entries(styles)) {
    setStyleProp(element, key, value)
  }
}

// 响应式 style 对象
function bindStyles(element, value) {
  let previousKeys = new Set()

  bindValue(value, styles => {
    const nextStyles =
      styles &&
        typeof styles === 'object' &&
        !Array.isArray(styles)
        ? styles
        : {}

    const nextKeys = new Set(Object.keys(nextStyles))

    // 清理已经删除的样式
    for (const key of previousKeys) {
      if (!nextKeys.has(key)) {
        setStyleProp(element, key, null)
      }
    }

    applyStyles(element, nextStyles)

    previousKeys = nextKeys
  })
}

// class 规范化
function normalizeClass(value, result = new Set()) {
  if (!value) return result

  if (typeof value === 'string') {
    for (const name of value.split(/\s+/)) {
      if (name) result.add(name)
    }

    return result
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      normalizeClass(item, result)
    }

    return result
  }

  if (typeof value === 'object') {
    for (const [name, enabled] of Object.entries(value)) {
      if (enabled) {
        normalizeClass(name, result)
      }
    }
  }

  return result
}

// 响应式 className
function bindClassName(element, value) {
  let previousClasses = new Set()

  bindValue(value, classValue => {
    const nextClasses = normalizeClass(classValue)

    for (const name of previousClasses) {
      if (!nextClasses.has(name)) {
        element.classList.remove(name)
      }
    }

    for (const name of nextClasses) {
      if (!previousClasses.has(name)) {
        element.classList.add(name)
      }
    }

    previousClasses = nextClasses
  })
}

// 普通 DOM 属性
function setDOMProp(element, key, value) {
  const propertyMap = {
    htmlFor: 'for',
    tabIndex: 'tabindex',
    readOnly: 'readonly',
    autoFocus: 'autofocus',
    srcSet: 'srcset',
    crossOrigin: 'crossorigin'
  }

  const attributeName = propertyMap[key] ?? key

  if (value == null) {
    if (key.startsWith('aria-') || key.startsWith('data-')) {
      element.removeAttribute(attributeName)
      return
    }

    if (key in element) {
      try {
        element[key] = typeof element[key] === 'boolean'
          ? false
          : ''
      } catch {
        element.removeAttribute(attributeName)
      }
    } else {
      element.removeAttribute(attributeName)
    }

    return
  }

  if (key === 'className') return

  if (
    key in element &&
    !key.startsWith('aria-') &&
    !key.startsWith('data-')
  ) {
    try {
      element[key] = value
      return
    } catch {
      // 继续使用 attribute
    }
  }

  if (typeof value === 'boolean') {
    if (value) {
      element.setAttribute(attributeName, '')
    } else {
      element.removeAttribute(attributeName)
    }

    return
  }

  element.setAttribute(attributeName, String(value))
}

// Boolean DOM 属性
function setBooleanProp(element, key, value) {
  const enabled = Boolean(value)

  const propertyMap = {
    readonly: 'readOnly',
    autofocus: 'autofocus',
    novalidate: 'noValidate',
    formnovalidate: 'formNoValidate',
    allowfullscreen: 'allowFullscreen'
  }

  const property = propertyMap[key.toLowerCase()] ?? key

  if (property in element) {
    element[property] = enabled
  }

  const attribute = key.toLowerCase()

  if (enabled) {
    element.setAttribute(attribute, '')
  } else {
    element.removeAttribute(attribute)
  }
}

// 动态事件绑定
function bindEvent(
  element,
  key,
  value,
  registerCleanup,
  eventDelegator
) {
  const eventName = getEventName(key)
  const normalized = normalizeEvent(value)

  if (!normalized) return

  const { handler, modifiers } = normalized

  if (eventDelegator) {
    const dispose = eventDelegator.register(
      element,
      eventName,
      handler,
      modifiers
    )

    registerCleanup?.(dispose)
    return
  }

  const options = getListenerOptions(modifiers)

  const listener = event => {
    runEventHandler(
      event,
      handler,
      modifiers,
      element
    )
  }

  element.addEventListener(eventName, listener, options)

  registerCleanup?.(() => {
    element.removeEventListener(
      eventName,
      listener,
      options.capture
    )
  })
}

// 统一 DOM 属性绑定
function bindDOMProp(element, key, value) {
  bindValue(value, nextValue => {
    if (BOOLEAN_PROPS.has(key.toLowerCase())) {
      setBooleanProp(element, key, nextValue)
    } else {
      setDOMProp(element, key, nextValue)
    }
  })
}

// ================================
// Unified Props Entry
// ================================

function bindProps(
  element,
  props,
  type,
  registerCleanup,
  eventDelegator
) {
  // 通用属性分发
  for (const [key, value] of Object.entries(props)) {
    if (RESERVED_PROPS.has(key)) continue

    // 特殊语义属性
    if (
      key === 'options' &&
      type === 'Select'
    ) {
      continue
    }

    if (
      key === 'value' &&
      ['Input', 'Select', 'Textarea', 'ProgressBar', 'Slider'].includes(type)
    ) {
      continue
    }

    if (
      key === 'checked' &&
      ['Checkbox', 'Radio', 'Switch'].includes(type)
    ) {
      continue
    }

    if (
      key === 'variant' &&
      ['Button', 'Badge'].includes(type)
    ) {
      continue
    }

    // className
    if (key === 'className') {
      bindClassName(element, value)
      continue
    }

    // style 对象
    if (key === 'style') {
      bindStyles(element, value)
      continue
    }

    // 事件
    if (/^on[A-Z]/.test(key)) {
      bindEvent(
        element,
        key,
        value,
        registerCleanup,
        eventDelegator
      )
      continue
    }



    // 优先处理资源类 DOM 属性
    if (DOM_RESOURCE_PROPS.has(key)) {
      bindDOMProp(element, key, value)
      continue
    }

    // CSS 原生属性
    if (isStyleProp(element, key)) {
      bindStyleProp(element, key, value)
      continue
    }

    // 普通 DOM 属性
    bindDOMProp(element, key, value)


  }

  // ==============================
  // Component Semantic Properties
  // ==============================

  switch (type) {

    case 'Dialog': {
      bindValue(props.open, value => {
        const shouldOpen = Boolean(value)

        if (props.modal) {
          if (shouldOpen && !element.open) {
            element.showModal()
          } else if (!shouldOpen && element.open) {
            element.close()
          }
        } else {
          element.open = shouldOpen
        }
      })

      break
    }

    case 'Slider': {
      bindValue(props.value, value => {
        element.value = value ?? 0
      })
      break
    }

    case 'Input': {
      bindValue(props.value, value => {
        const nextValue = value == null
          ? ''
          : String(value)

        if (element.value !== nextValue) {
          element.value = nextValue
        }
      })

      break
    }

    case 'Select': {
      renderSelectOptions(element, props.options)

      bindValue(props.value, value => {
        const nextValue = value == null
          ? ''
          : String(value)

        if (element.value !== nextValue) {
          element.value = nextValue
        }
      })

      break
    }

    case 'Textarea': {
      bindValue(props.value, value => {
        const nextValue = value == null
          ? ''
          : String(value)

        if (element.value !== nextValue) {
          element.value = nextValue
        }
      })

      break
    }

    case 'Checkbox': {
      bindValue(props.checked, value => {
        element.checked = Boolean(value)
      })

      break
    }
    case 'Radio': {
      bindValue(props.checked, value => {
        element.checked = Boolean(value)
      })

      break
    }

    case 'Switch': {
      bindValue(props.checked, value => {
        element.checked = Boolean(value)
      })

      break
    }

    //     case 'Radio':
    // case 'Switch': {
    //   bindValue(props.checked, value => {
    //     element.checked = Boolean(value)
    //   })

    //   if (typeof props.onChange === 'function') {
    //     const handler = event => {
    //       props.onChange(
    //         element.type === 'radio'
    //           ? element.value
    //           : element.checked
    //       )
    //     }

    //     element.addEventListener('change', handler)

    //     registerCleanup?.(() => {
    //       element.removeEventListener('change', handler)
    //     })
    //   }

    //   break
    // }
    case 'Text': {
      renderText(element, props.text, props.onUpdate)
      break
    }

    case 'Button': {
      bindVariant(
        element,
        'rx-button',
        props.variant,
        'primary'
      )

      renderText(element, props.text, props.onUpdate)
      break
    }

    case 'Badge': {
      bindVariant(
        element,
        'rx-badge',
        props.variant,
        'default'
      )

      renderText(element, props.text, props.onUpdate)
      break
    }
  }
}



function bindVariant(element, prefix, value, fallback = 'default') {
  let previousClass = null

  bindValue(value, variant => {
    if (previousClass) {
      element.classList.remove(previousClass)
    }

    previousClass = `${prefix}-${variant ?? fallback}`
    element.classList.add(previousClass)
  })
}


function renderText(element, value, onUpdate) {
  if (typeof value === 'function') {
    let initialized = false

    effect(() => {
      element.textContent = String(value() ?? '')

      if (initialized && typeof onUpdate === 'function') {
        untracked(() => {
          onUpdate()
        })
      }

      initialized = true
    })
  } else {
    element.textContent = String(value ?? '')
  }
}

function renderSelectOptions(element, value) {
  bindValue(value, options => {
    const selectedValue = element.value

    element.replaceChildren()

    for (const option of Array.from(options ?? [])) {
      const item = document.createElement('option')

      if (
        option === null ||
        typeof option !== 'object'
      ) {
        item.value = String(option ?? '')
        item.textContent = String(option ?? '')
      } else {
        item.value = String(
          option.value ?? option.label ?? ''
        )

        item.textContent = String(
          option.label ?? option.value ?? ''
        )

        item.disabled = Boolean(option.disabled)
      }

      element.appendChild(item)
    }

    // 尽量保留当前选择值
    if (selectedValue !== '') {
      element.value = selectedValue
    }
  })
}

function renderWhen(
  element,
  props,
  lifecycle,
  eventDelegator
) {
  let currentBranch = null
  let isMounted = false
  let isDisposed = false

  function disposeBranch() {
    if (!currentBranch) return

    const branch = currentBranch
    currentBranch = null

    try {
      branch.lifecycle.unmount()
    } finally {
      branch.scope.stop()
      removeRange(branch.element)
    }
  }

  function renderBranch() {
    if (isDisposed) return

    const condition = typeof props.condition === 'function'
      ? props.condition()
      : props.condition

    const nextWidget = condition
      ? props.child
      : props.fallback

    // 相同分支不重复创建
    if (
      currentBranch &&
      currentBranch.widget === nextWidget
    ) {
      return
    }

    disposeBranch()

    const branchScope = effectScope()
    const branchLifecycle = createLifecycle(eventDelegator)

    try {
      const childElement = branchScope.run(() =>
        createElement(
          nextWidget,
          branchLifecycle,
          eventDelegator
        )
      )

      // 支持普通节点和 Fragment NodeRange
      insertRange(element, childElement)

      currentBranch = {
        widget: nextWidget,
        element: childElement,
        scope: branchScope,
        lifecycle: branchLifecycle
      }

      // 初次渲染时等待根组件挂载；
      // 后续动态切换时立即执行生命周期。
      if (isMounted) {
        branchLifecycle.mount()
      }
    } catch (error) {
      try {
        branchLifecycle.unmount()
      } catch (cleanupError) {
        console.error(cleanupError)
      }

      branchScope.stop()
      element.replaceChildren()
      throw error
    }
  }

  // 这个 effect 负责监听 condition
  effect(renderBranch)

  // 将分支生命周期接入父组件生命周期
  lifecycle?.register({
    onMount() {
      isMounted = true
      currentBranch?.lifecycle.mount()
    },

    onUnmount() {
      isDisposed = true
      disposeBranch()
    }
  })
}



function getSequence(values) {
  const predecessors = values.slice()
  const result = []

  for (let i = 0; i < values.length; i++) {
    const value = values[i]

    // 0 代表新创建的节点
    if (value === 0) continue

    const lastIndex = result[result.length - 1]

    if (
      lastIndex === undefined ||
      values[lastIndex] < value
    ) {
      predecessors[i] = lastIndex ?? -1
      result.push(i)
      continue
    }

    let start = 0
    let end = result.length - 1

    while (start < end) {
      const middle = (start + end) >> 1

      if (values[result[middle]] < value) {
        start = middle + 1
      } else {
        end = middle
      }
    }

    if (value < values[result[start]]) {
      predecessors[i] = start > 0
        ? result[start - 1]
        : -1

      result[start] = i
    }
  }

  let cursor = result.length
  let last = result[cursor - 1]

  while (cursor-- > 0) {
    result[cursor] = last
    last = predecessors[last]
  }

  return result
}


function renderFor(
  element,
  props,
  lifecycle,
  eventDelegator
) {
  const records = new Map()

  let orderedRecords = []
  let isMounted = false
  let isDisposed = false

  function createItemProxy(itemRef) {
    return new Proxy({}, {
      get(_, key) {
        const item = itemRef.value

        if (item == null) return undefined

        return Reflect.get(item, key, item)
      },

      set(_, key, value) {
        const item = itemRef.value

        if (item == null) return false

        return Reflect.set(item, key, value, item)
      },

      has(_, key) {
        const item = itemRef.value
        return item != null && Reflect.has(item, key)
      },

      ownKeys() {
        const item = itemRef.value

        return item == null
          ? []
          : Reflect.ownKeys(item)
      },

      getOwnPropertyDescriptor(_, key) {
        const item = itemRef.value

        if (item == null) return undefined

        const descriptor = Reflect.getOwnPropertyDescriptor(
          item,
          key
        )

        return descriptor
          ? { ...descriptor, configurable: true }
          : undefined
      }
    })
  }

  function createRecord(item, index, key) {
    const scope = effectScope()
    const itemLifecycle = createLifecycle(eventDelegator)

    const itemRef = rx(item)
    const indexRef = rx(index)
    const itemProxy = createItemProxy(itemRef)

    try {
      const childElement = scope.run(() => {
        return createElement(
          props.renderItem(itemProxy, indexRef),
          itemLifecycle,
          eventDelegator
        )
      })

      return {
        key,
        itemRef,
        indexRef,
        element: childElement,
        scope,
        lifecycle: itemLifecycle,
        mounted: false
      }
    } catch (error) {
      try {
        itemLifecycle.unmount()
      } catch (cleanupError) {
        console.error(cleanupError)
      }

      scope.stop()
      throw error
    }
  }

  function mountRecord(record) {
    if (record.mounted) return

    record.mounted = true
    record.lifecycle.mount()
  }

  function removeRecord(record) {
    records.delete(record.key)

    try {
      record.lifecycle.unmount()
    } finally {
      record.scope.stop()
      removeRange(record.element)
      record.mounted = false
    }
  }

  function renderList() {
    if (isDisposed) return

    const source = typeof props.each === 'function'
      ? props.each()
      : props.each

    const items = Array.from(source ?? [])

    const nextKeys = new Set()
    const nextRecords = new Array(items.length)

    // 记录旧节点索引，索引从 1 开始
    const oldIndexMap = new Map()

    for (let i = 0; i < orderedRecords.length; i++) {
      oldIndexMap.set(
        orderedRecords[i].key,
        i + 1
      )
    }

    // 检查 key，避免重复 key
    const keys = items.map((item, index) => {
      const key = typeof props.key === 'function'
        ? props.key(item, index)
        : index

      if (nextKeys.has(key)) {
        throw new Error(
          `RxFlare: Duplicate key "${String(key)}" in For.`
        )
      }

      nextKeys.add(key)

      return key
    })

    // 新位置对应的旧位置
    // 0 表示这是一个新节点
    const sourceIndexes = new Array(items.length).fill(0)

    // 创建或复用节点
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const key = keys[i]

      let record = records.get(key)

      if (record) {
        const oldIndex = oldIndexMap.get(key)

        sourceIndexes[i] = oldIndex

        // 更新列表项数据和序号
        record.itemRef.value = item
        record.indexRef.value = i
      } else {
        record = createRecord(item, i, key)
        records.set(key, record)
      }

      nextRecords[i] = record
    }

    // 删除不存在的旧节点
    for (const record of orderedRecords) {
      if (!nextKeys.has(record.key)) {
        removeRecord(record)
      }
    }

    // 计算最长递增子序列
    const sequence = getSequence(sourceIndexes)

    let sequenceIndex = sequence.length - 1

    // 从后向前调整 DOM
    for (let i = nextRecords.length - 1; i >= 0; i--) {
      const record = nextRecords[i]

      const anchor = i + 1 < nextRecords.length
        ? getFirstNode(nextRecords[i + 1].element)
        : null

      if (sourceIndexes[i] === 0) {
        // 新节点：插入
        insertRange(element, record.element, anchor)
      } else if (
        sequenceIndex < 0 ||
        i !== sequence[sequenceIndex]
      ) {
        // 不属于 LIS：移动
        insertRange(element, record.element, anchor)
      } else {
        // 属于 LIS：保持原位置
        sequenceIndex--
      }
    }

    orderedRecords = nextRecords

    // 新节点插入 DOM 后再执行 onMount
    if (isMounted) {
      for (const record of nextRecords) {
        mountRecord(record)
      }
    }
  }

  effect(renderList)

  lifecycle?.register({
    onMount() {
      isMounted = true

      for (const record of orderedRecords) {
        mountRecord(record)
      }
    },

    onUnmount() {
      isDisposed = true

      for (const record of [...orderedRecords].reverse()) {
        removeRecord(record)
      }

      orderedRecords = []
    }
  })
}




function renderErrorBoundary(
  element,
  props,
  lifecycle,
  eventDelegator
) {
  let activeBranch = null
  let currentError = null
  let mounted = false
  let disposed = false
  let parentErrorHandler = null

  function disposeBranch() {
    if (!activeBranch) return

    const branch = activeBranch
    activeBranch = null

    try {
      branch.lifecycle.unmount()
    } finally {
      branch.scope.stop()
      removeRange(branch.element)
    }
  }

  function createBranch(widget, onError = null) {
    const scope = effectScope({
      detached: true,
      onError
    })

    // 保存当前边界的父级错误处理器
    if (parentErrorHandler === null) {
      parentErrorHandler = scope.parent?.onError ?? null
    }

    const branchLifecycle = createLifecycle(
      eventDelegator
    )

    try {
      const branchElement = scope.run(() =>
        createElement(
          widget,
          branchLifecycle,
          eventDelegator
        )
      )

      return {
        scope,
        lifecycle: branchLifecycle,
        element: branchElement
      }
    } catch (error) {
      try {
        branchLifecycle.unmount()
      } finally {
        scope.stop()
      }

      throw error
    }
  }

  function mountBranch(branch) {
    activeBranch = branch

    // 支持普通节点和 Fragment NodeRange
    insertRange(element, branch.element)

    if (mounted) {
      branch.lifecycle.mount()
    }
  }

  function handleError(error) {
    if (disposed) return

    showFallback(error)
  }

  function showFallback(error) {
    if (disposed) return

    currentError = error

    // 在销毁子组件前，保留父级错误处理器
    const fallbackErrorHandler =
      activeBranch?.scope.parent?.onError ??
      parentErrorHandler

    disposeBranch()

    const reset = () => {
      if (disposed) return

      currentError = null
      renderChild()
    }

    const fallback = props.fallback

    const fallbackWidget =
      typeof fallback === 'function'
        ? fallback({
          error,
          reset
        })
        : fallback

    const fallbackBranch = createBranch(
      fallbackWidget ?? String(error?.message ?? error),
      fallbackErrorHandler
    )

    mountBranch(fallbackBranch)
  }

  function renderChild() {
    if (disposed) return

    disposeBranch()

    currentError = null

    const child = props.child ?? props.children

    let branch

    try {
      branch = createBranch(
        child,
        handleError
      )
    } catch (error) {
      showFallback(error)
      return
    }

    // 防止首次创建 Effect 时已经触发 fallback，
    // 后续又把原来的子组件挂载回来。
    if (currentError !== null || disposed) {
      try {
        branch.lifecycle.unmount()
      } finally {
        branch.scope.stop()
      }

      return
    }

    mountBranch(branch)
  }

  renderChild()

  const registerBoundary = lifecycle?.register({
    onMount() {
      mounted = true

      if (activeBranch) {
        activeBranch.lifecycle.mount()
      }
    }
  })

  registerBoundary?.(() => {
    disposed = true
    disposeBranch()
  })

  return {
    reset() {
      if (currentError !== null) {
        currentError = null
        renderChild()
      }
    }
  }
}


function createReadonlyProps(props) {
  return new Proxy(props, {
    set() {
      throw new TypeError(
        'RxFlare: Component props are readonly.'
      )
    },

    deleteProperty() {
      throw new TypeError(
        'RxFlare: Component props are readonly.'
      )
    },

    defineProperty() {
      throw new TypeError(
        'RxFlare: Component props are readonly.'
      )
    }
  })
}



function renderComponent(
  element,
  props,
  lifecycle,
  eventDelegator
) {
  const component = props.component
  const rawProps = props.componentProps ?? {}

  if (typeof component !== 'function') {
    throw new TypeError(
      'RxFlare: Component requires a component function.'
    )
  }

  if (
    rawProps === null ||
    typeof rawProps !== 'object' ||
    Array.isArray(rawProps)
  ) {
    throw new TypeError(
      'RxFlare: Component props must be an object.'
    )
  }

  const componentProps = createReadonlyProps(rawProps)

  const scope = effectScope()
  const componentLifecycle = createLifecycle(eventDelegator)

  let childElement = null
  let mounted = false
  let disposed = false

  try {
    childElement = scope.run(() => {
      const widget = component(componentProps)

      return createElement(
        widget,
        componentLifecycle,
        eventDelegator
      )
    })

    // 支持普通 DOM 节点和 Fragment NodeRange
    insertRange(element, childElement)
  } catch (error) {
    try {
      componentLifecycle.unmount()
    } finally {
      scope.stop()
    }

    throw error
  }

  const registerCleanup = lifecycle?.register({
    onMount() {
      if (disposed || mounted) return

      mounted = true
      componentLifecycle.mount()
    }
  })

  registerCleanup?.(() => {
    if (disposed) return

    disposed = true

    try {
      componentLifecycle.unmount()
    } finally {
      scope.stop()

      removeRange(childElement)
      childElement = null
    }
  })
}


function renderFragment(
  props,
  lifecycle,
  eventDelegator
) {
  // 使用 DocumentFragment 暂存节点
  // 它本身不会成为最终 DOM 的容器
  const container = document.createDocumentFragment()

  const start = document.createComment('rx-fragment-start')
  const end = document.createComment('rx-fragment-end')

  container.appendChild(start)

  renderChildren(
    container,
    props,
    lifecycle,
    eventDelegator
  )

  container.appendChild(end)

  // Fragment 自身也支持生命周期
  lifecycle?.register(props)

  return createNodeRange(start, end)
}

function hasRenderableChildren(value) {
  if (Array.isArray(value)) {
    return value.some(hasRenderableChildren)
  }

  return value != null && value !== false
}

function renderChildren(
  element,
  props,
  lifecycle,
  eventDelegator
) {
  const children = props.children ?? (
    props.child != null ? [props.child] : []
  )

  // 递归展开所有嵌套 children 数组
  function flattenChildren(value, result = []) {
    if (Array.isArray(value)) {
      for (const child of value) {
        flattenChildren(child, result)
      }
    } else {
      result.push(value)
    }

    return result
  }

  const list = flattenChildren(children)

  for (const child of list) {
    if (child == null || child === false) continue

    insertRange(
      element,
      createElement(child, lifecycle, eventDelegator)
    )
  }
}

export function createElement(
  widget,
  lifecycle,
  eventDelegator = lifecycle?.eventDelegator
) {


  if (widget == null || widget === false) {
    return document.createTextNode('')
  }

  if (
    typeof widget === 'string' ||
    typeof widget === 'number'
  ) {
    return document.createTextNode(String(widget))
  }

  if (typeof widget === 'function') {
    throw new TypeError(
      'RxFlare: Function widgets are not supported directly. Use Component(fn, props).'
    )
  }

  const { type, props = {} } = widget

  // Fragment 是多节点范围，不是普通 DOM 元素
  if (type === 'Fragment') {
    return renderFragment(
      props,
      lifecycle,
      eventDelegator
    )
  }

  let element

  switch (type) {

    // ==============================
    // Semantic HTML Elements
    // ==============================

    case 'Header': {
      element = document.createElement('header')
      break
    }

    case 'Main': {
      element = document.createElement('main')
      break
    }

    case 'Footer': {
      element = document.createElement('footer')
      break
    }

    case 'Nav': {
      element = document.createElement('nav')
      break
    }

    case 'Section': {
      element = document.createElement('section')
      break
    }

    case 'Article': {
      element = document.createElement('article')
      break
    }

    case 'Aside': {
      element = document.createElement('aside')
      break
    }

    case 'Canvas': {
      element = document.createElement('canvas')
      element.className = 'rx-canvas'
      break
    }

    case 'Video': {
      element = document.createElement('video')
      element.className = 'rx-video'
      break
    }

    case 'Table': {
      element = document.createElement('table')
      element.className = 'rx-table'
      break
    }

    case 'TableHead': {
      element = document.createElement('thead')
      break
    }

    case 'TableBody': {
      element = document.createElement('tbody')
      break
    }

    case 'TableRow': {
      element = document.createElement('tr')
      break
    }

    case 'TableCell': {
      element = document.createElement(
        props.header ? 'th' : 'td'
      )
      break
    }


    case 'Tabs': {
      element = document.createElement('div')
      element.className = 'rx-tabs'
      break
    }

    case 'Tab': {
      element = document.createElement('button')
      element.type = 'button'
      element.className = 'rx-tab'
      element.setAttribute('role', 'tab')
      break
    }

    case 'TabPanel': {
      element = document.createElement('div')
      element.className = 'rx-tab-panel'
      element.setAttribute('role', 'tabpanel')
      break
    }
    case 'Slider': {
      element = document.createElement('input')
      element.type = 'range'
      element.className = 'rx-slider'
      break
    }
    case 'Dialog': {
      element = document.createElement('dialog')
      element.classList.add('rx-dialog')
      break
    }
    case 'Radio': {
      element = document.createElement('input')
      element.type = 'radio'
      break
    }

    case 'Switch': {
      element = document.createElement('input')
      element.type = 'checkbox'
      element.className = 'rx-switch'
      break
    }

    case 'Form': {
      element = document.createElement('form')
      break
    }

    case 'Label': {
      element = document.createElement('label')
      break
    }

    case 'Image': {
      element = document.createElement('img')

      if (hasRenderableChildren(props.children ?? props.child)) {
        throw new Error(
          'RxFlare: Image cannot have children.'
        )
      }

      break
    }

    case 'Link': {
      element = document.createElement('a')
      break
    }
    case 'Element': {
      const tag = props.tag

      if (
        typeof tag !== 'string' ||
        !/^[a-z][a-z0-9-]*$/i.test(tag)
      ) {
        throw new TypeError(
          `RxFlare: Invalid HTML tag "${String(tag)}".`
        )
      }

      element = document.createElement(tag.toLowerCase())

      const children = props.children ?? props.child

      if (
        VOID_ELEMENTS.has(tag.toLowerCase()) &&
        hasRenderableChildren(children)
      ) {
        throw new Error(
          `RxFlare: HTML element <${tag}> cannot have children.`
        )
      }

      break
    }

    case 'Component':
      element = document.createElement('div')
      element.className = 'rx-component'



      renderComponent(
        element,
        props,
        lifecycle,
        eventDelegator
      )
      break

    case 'Input':
      element = document.createElement('input')
      element.type = 'text'
      break

    case 'Select':
      element = document.createElement('select')
      break

    case 'Textarea':
      element = document.createElement('textarea')
      break

    case 'Checkbox':
      element = document.createElement('input')
      element.type = 'checkbox'
      break

    case 'Column':
    case 'Row':
      element = document.createElement('div')
      element.className = `rx-${type.toLowerCase()}`
      break

    case 'Card':
      element = document.createElement('section')
      element.className = 'rx-card'
      break

    case 'Text':
      element = document.createElement('div')
      element.className = 'rx-text'
      break

    case 'Button':
      element = document.createElement('button')
      element.className = 'rx-button'
      element.type = 'button'
      break

    case 'ErrorBoundary':
      element = document.createElement('div')
      element.className = 'rx-error-boundary'

      renderErrorBoundary(
        element,
        props,
        lifecycle,
        eventDelegator
      )
      break

    case 'When':
      element = document.createElement('div')
      element.className = 'rx-when'
      renderWhen(
        element,
        props,
        lifecycle,
        eventDelegator
      )
      break

    case 'For':
      element = document.createElement('div')
      element.className = 'rx-for'
      renderFor(
        element,
        props,
        lifecycle,
        eventDelegator
      )
      break

    case 'Badge':
      element = document.createElement('span')
      element.className = 'rx-badge'
      break

    case 'ProgressBar': {
      element = document.createElement('div')
      element.className = 'rx-progress'

      const track = document.createElement('div')
      track.className = 'rx-progress-track'

      const fill = document.createElement('div')
      fill.className = 'rx-progress-fill'

      track.appendChild(fill)
      element.appendChild(track)

      const update = () => {
        const value = typeof props.value === 'function'
          ? props.value()
          : props.value ?? 0

        const safeValue = Math.max(0, Math.min(100, Number(value) || 0))

        fill.style.width = `${safeValue}%`
      }

      if (typeof props.value === 'function') {
        let initialized = false

        effect(() => {
          update()

          if (
            initialized &&
            typeof props.onUpdate === 'function'
          ) {
            untracked(() => {
              props.onUpdate()
            })
          }

          initialized = true
        })
      } else {
        update()
      }

      break
    }

    case 'Spacer':
      element = document.createElement('div')
      element.className = 'rx-spacer'
      break

    default:
      throw new Error(`RxFlare: Unknown widget "${type}"`)
  }
  // 先登记当前 Widget 的生命周期
  // 获取当前 Widget 专属的清理注册函数
  const registerCleanup = lifecycle?.register(
    props,
    element
  )

  // 统一处理所有 Widget 属性
  // 事件监听器会注册到当前 Widget 的清理队列
  bindProps(
    element,
    props,
    type,
    registerCleanup,
    eventDelegator
  )

  if (
    ![
      'Image',
      'Canvas',
      'Text',
      'Button',
      'Badge',
      'ProgressBar',
      'Spacer',
      'When',
      'For',
      'ErrorBoundary',
      'Component'
    ].includes(type) &&
    !(
      type === 'Element' &&
      VOID_ELEMENTS.has(props.tag.toLowerCase())
    )
  ) {
    renderChildren(
      element,
      props,
      lifecycle,
      eventDelegator
    )
  }



  // if (
  //   type !== 'Image' &&
  //   type !== 'Link' &&
  //   type !== 'Text' &&
  //   type !== 'Button' &&
  //   type !== 'Badge' &&
  //   type !== 'ProgressBar' &&
  //   type !== 'Spacer' &&
  //   type !== 'When' &&
  //   type !== 'For' &&
  //   type !== 'ErrorBoundary' &&
  //   type !== 'Component' &&
  //   !(
  //     type === 'Element' &&
  //     VOID_ELEMENTS.has(props.tag.toLowerCase())
  //   )
  // ) {



  //   renderChildren(
  //     element,
  //     props,
  //     lifecycle,
  //     eventDelegator
  //   )
  // }
  return element
}

