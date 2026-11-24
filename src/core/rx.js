let activeScope = null
let activeEffect = null
// 是否允许收集响应式依赖
let shouldTrack = true
const effectStack = []

let batchDepth = 0
let isFlushing = false
let runningDepth = 0

const computedQueue = new Set()
const effectQueue = new Set()

// 对象响应式依赖
const targetMap = new WeakMap()
const reactiveMap = new WeakMap()
const rawMap = new WeakMap()

const ITERATE_KEY = Symbol('iterate')
const MAP_KEY_ITERATE_KEY = Symbol('map keys')
const RAW_KEY = Symbol('raw')

function cleanup(effectFn) {
  for (const dep of effectFn.deps) {
    dep.delete(effectFn)
  }

  effectFn.deps.clear()
}

function trackDep(dep) {
  if (
    !shouldTrack ||
    !activeEffect ||
    dep.has(activeEffect)
  ) {
    return
  }

  dep.add(activeEffect)
  activeEffect.deps.add(dep)
}

function track(target, key) {
  let depsMap = targetMap.get(target)

  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  let dep = depsMap.get(key)

  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }

  trackDep(dep)
}

function enqueueEffect(effectFn) {
  if (!effectFn.active) return

  // 自定义调度器
  if (effectFn.scheduler) {
    effectFn.scheduler()
    return
  }

  if (effectFn.computed) {
    computedQueue.add(effectFn)
  } else {
    effectQueue.add(effectFn)
  }
}

function flushEffects() {
  if (isFlushing || batchDepth > 0 || runningDepth > 0) {
    return
  }

  isFlushing = true

  try {
    let count = 0

    while (computedQueue.size || effectQueue.size) {
      if (++count > 10000) {
        computedQueue.clear()
        effectQueue.clear()

        throw new Error(
          'RxFlare: Maximum update depth exceeded.'
        )
      }

      const queue = computedQueue.size
        ? computedQueue
        : effectQueue

      const effectFn = queue.values().next().value

      queue.delete(effectFn)

      if (effectFn.active) {
        effectFn()
      }
    }
  } finally {
    isFlushing = false
  }
}

function triggerDepEffects(dep) {
  if (!dep) return

  for (const effectFn of dep) {
    enqueueEffect(effectFn)
  }
}

function trigger(target, key, type, newValue) {
  const depsMap = targetMap.get(target)

  if (!depsMap) return

  const effects = new Set()

  const addEffects = (dep) => {
    if (!dep) return

    for (const effectFn of dep) {
      effects.add(effectFn)
    }
  }

  addEffects(depsMap.get(key))

  if (type === 'add' || type === 'delete') {
    addEffects(depsMap.get(ITERATE_KEY))
  }

  // Map 新增或删除 key
  if (
    target instanceof Map &&
    (type === 'add' || type === 'delete')
  ) {
    addEffects(depsMap.get(MAP_KEY_ITERATE_KEY))
  }

  // Map 修改已有 key 的 value，也要通知 values/entries 依赖
  if (target instanceof Map && type === 'set') {
    addEffects(depsMap.get(ITERATE_KEY))
  }

  // 数组长度和索引变化
  if (Array.isArray(target)) {
    if (key === 'length') {
      for (const [depKey, dep] of depsMap) {
        if (
          depKey === 'length' ||
          (typeof depKey === 'string' &&
            /^\d+$/.test(depKey) &&
            Number(depKey) >= newValue)
        ) {
          addEffects(dep)
        }
      }
    } else if (
      type === 'add' &&
      /^\d+$/.test(String(key))
    ) {
      addEffects(depsMap.get('length'))
    }
  }

  for (const effectFn of effects) {
    enqueueEffect(effectFn)
  }

  flushEffects()
}

function toRaw(value) {
  return rawMap.get(value) ?? value
}

function triggerCollectionClear(target) {
  const depsMap = targetMap.get(target)

  if (!depsMap) return

  batch(() => {
    for (const dep of depsMap.values()) {
      for (const effectFn of dep) {
        enqueueEffect(effectFn)
      }
    }

    flushEffects()
  })
}

function wrapIterator(iterator, isMap, isEntry = false) {
  return {
    next() {
      const result = iterator.next()

      if (result.done) return result

      if (isEntry) {
        return {
          value: [
            reactive(result.value[0]),
            reactive(result.value[1])
          ],
          done: false
        }
      }

      return {
        value: reactive(result.value),
        done: false
      }
    },

    [Symbol.iterator]() {
      return this
    }
  }
}


function createCollectionHandlers(isMap) {
  return {
    get(target, key, receiver) {
      if (key === RAW_KEY) return target

      // Collection size
      if (key === 'size') {
        track(target, ITERATE_KEY)
        return Reflect.get(target, 'size', target)
      }

      // Map
      if (isMap) {
        if (key === 'get') {
          return (mapKey) => {
            const rawKey = toRaw(mapKey)

            track(target, rawKey)

            return reactive(target.get(rawKey))
          }
        }

        if (key === 'set') {
          return (mapKey, value) => {
            const rawKey = toRaw(mapKey)
            const rawValue = toRaw(value)

            const hadKey = target.has(rawKey)
            const oldValue = target.get(rawKey)

            if (
              !hadKey ||
              !Object.is(oldValue, rawValue)
            ) {
              batch(() => {
                target.set(rawKey, rawValue)

                trigger(
                  target,
                  rawKey,
                  hadKey ? 'set' : 'add',
                  rawValue
                )
              })
            }

            return receiver
          }
        }

        if (key === 'has') {
          return (mapKey) => {
            const rawKey = toRaw(mapKey)

            track(target, rawKey)

            return target.has(rawKey)
          }
        }

        if (key === 'keys') {
          return () => {
            track(target, MAP_KEY_ITERATE_KEY)

            return wrapIterator(
              target.keys(),
              true
            )
          }
        }

        if (key === 'values') {
          return () => {
            track(target, ITERATE_KEY)

            return wrapIterator(
              target.values(),
              true
            )
          }
        }

        if (key === 'entries') {
          return () => {
            track(target, ITERATE_KEY)

            return wrapIterator(
              target.entries(),
              true,
              true
            )
          }
        }

        if (key === Symbol.iterator) {
          return () => {
            track(target, ITERATE_KEY)

            return wrapIterator(
              target.entries(),
              true,
              true
            )
          }
        }

        if (key === 'forEach') {
          return (callback, thisArg) => {
            track(target, ITERATE_KEY)

            target.forEach((value, mapKey) => {
              callback.call(
                thisArg,
                reactive(value),
                reactive(mapKey),
                receiver
              )
            })
          }
        }
      }

      // Set
      else {
        if (key === 'has') {
          return (value) => {
            const rawValue = toRaw(value)

            track(target, rawValue)

            return target.has(rawValue)
          }
        }

        if (key === 'add') {
          return (value) => {
            const rawValue = toRaw(value)

            if (!target.has(rawValue)) {
              batch(() => {
                target.add(rawValue)

                trigger(
                  target,
                  rawValue,
                  'add'
                )
              })
            }

            return receiver
          }
        }

        if (
          key === 'values' ||
          key === 'keys' ||
          key === Symbol.iterator
        ) {
          return () => {
            track(target, ITERATE_KEY)

            return wrapIterator(
              target.values(),
              false
            )
          }
        }

        if (key === 'entries') {
          return () => {
            track(target, ITERATE_KEY)

            return wrapIterator(
              target.entries(),
              false,
              true
            )
          }
        }

        if (key === 'forEach') {
          return (callback, thisArg) => {
            track(target, ITERATE_KEY)

            target.forEach((value) => {
              const wrapped = reactive(value)

              callback.call(
                thisArg,
                wrapped,
                wrapped,
                receiver
              )
            })
          }
        }
      }

      // Delete
      if (key === 'delete') {
        return (value) => {
          const rawValue = toRaw(value)

          if (!target.has(rawValue)) {
            return false
          }

          return batch(() => {
            const result = target.delete(rawValue)

            if (result) {
              trigger(
                target,
                rawValue,
                'delete'
              )
            }

            return result
          })
        }
      }

      // Clear
      if (key === 'clear') {
        return () => {
          if (target.size === 0) {
            return undefined
          }

          return batch(() => {
            target.clear()
            triggerCollectionClear(target)
          })
        }
      }

      return Reflect.get(target, key, target)
    }
  }
}

function reactive(value) {
  if (
    value === null ||
    typeof value !== 'object'
  ) {
    return value
  }

  // 先只处理普通对象和数组
const isMap = value instanceof Map
const isSet = value instanceof Set

const prototype = Object.getPrototypeOf(value)

if (
  !Array.isArray(value) &&
  !isMap &&
  !isSet &&
  prototype !== Object.prototype &&
  prototype !== null
) {
  return value
}

  if (rawMap.has(value)) {
    return value
  }

  const existingProxy = reactiveMap.get(value)

  if (existingProxy) {
    return existingProxy
  }

if (isMap || isSet) {
  const proxy = new Proxy(
    value,
    createCollectionHandlers(isMap)
  )

  reactiveMap.set(value, proxy)
  rawMap.set(proxy, value)

  return proxy
}




  const proxy = new Proxy(value, {
get(target, key, receiver) {
  if (key === RAW_KEY) return target

  track(target, key)

  // 数组变更方法自动批量更新
  if (
    Array.isArray(target) &&
    [
      'push',
      'pop',
      'shift',
      'unshift',
      'splice',
      'sort',
      'reverse',
      'fill',
      'copyWithin'
    ].includes(key)
  ) {
    return (...args) => {
      return batch(() => {
        return Array.prototype[key].apply(receiver, args)
      })
    }
  }

  const result = Reflect.get(target, key, receiver)

  return reactive(result)
},

    set(target, key, newValue, receiver) {
      const rawValue = toRaw(newValue)

      const oldValue = Reflect.get(target, key, receiver)

      const hadKey = Object.prototype.hasOwnProperty.call(
        target,
        key
      )

      const result = Reflect.set(
        target,
        key,
        rawValue,
        receiver
      )

      if (!result) return false

      if (!hadKey) {
        trigger(target, key, 'add', rawValue)
      } else if (!Object.is(toRaw(oldValue), rawValue)) {
        trigger(target, key, 'set', rawValue)
      }

      return true
    },

    deleteProperty(target, key) {
      const hadKey = Object.prototype.hasOwnProperty.call(
        target,
        key
      )

      const result = Reflect.deleteProperty(target, key)

      if (result && hadKey) {
        trigger(target, key, 'delete')
      }

      return result
    },

    ownKeys(target) {
      track(target, ITERATE_KEY)
      return Reflect.ownKeys(target)
    },

    has(target, key) {
      track(target, key)
      return Reflect.has(target, key)
    }
  })

  reactiveMap.set(value, proxy)
  rawMap.set(proxy, value)

  return proxy
}

function createEffect(fn, options = {}) {
  const effectFn = () => {
    if (!effectFn.active) {
      return fn()
    }

    cleanup(effectFn)

    runningDepth++

    try {
      effectStack.push(effectFn)
      activeEffect = effectFn

      try {
        return fn()
      } catch (error) {
        // 将异常交给所属 ErrorBoundary
        if (typeof effectFn.onError === 'function') {
          effectFn.onError(error, effectFn)
          return undefined
        }

        // 没有错误处理器，继续抛出
        throw error
      }
    } finally {
      effectStack.pop()

      activeEffect =
        effectStack[effectStack.length - 1] ?? null

      runningDepth--

      if (runningDepth === 0) {
        flushEffects()
      }
    }
  }

  effectFn.deps = new Set()
  effectFn.active = true
  effectFn.computed = options.computed ?? false
  effectFn.scheduler = options.scheduler ?? null

  effectFn.scope = activeScope

  // 优先使用 Effect 自己的错误处理器，
  // 否则继承所属 Scope 的错误处理器。
effectFn.onError =
  options.onError ??
  (options.lazy ? null : activeScope?.onError ?? null)

  if (activeScope) {
    activeScope.effects.push(effectFn)
  }

  // lazy 模式下，创建时不执行
  if (!options.lazy) {
    effectFn()
  }

  return effectFn
}
export function effect(fn, options = {}) {
  return createEffect(fn, options)
}

// 在函数执行期间暂停依赖收集
export function untracked(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError(
      'RxFlare: untracked expects a function.'
    )
  }

  const previous = shouldTrack

  shouldTrack = false

  try {
    return fn()
  } finally {
    shouldTrack = previous
  }
}

export function rx(initialValue) {
  let value = reactive(initialValue)

  const subscribers = new Set()

  return {
    get value() {
      trackDep(subscribers)
      return value
    },

    set value(newValue) {
      const nextValue = reactive(newValue)

      if (Object.is(value, nextValue)) return

      value = nextValue

      triggerDepEffects(subscribers)
      flushEffects()
    }
  }
}


export function computed(getter) {
  let value
  let dirty = true
  let evaluating = false

  // 缓存计算异常
  let error = null
  let hasError = false

  const subscribers = new Set()

  const runner = createEffect(getter, {
    lazy: true,

    scheduler() {
      // 已经失效，不重复通知
      if (dirty) return

      dirty = true

      // 通知使用这个 computed 的 effect
      triggerDepEffects(subscribers)
    }
  })

  return {
    get value() {
      // 收集当前 effect 对 computed 的依赖
      trackDep(subscribers)

      if (dirty) {
        if (evaluating) {
          throw new Error(
            'RxFlare: Circular computed dependency detected.'
          )
        }

        evaluating = true

        try {
          const nextValue = runner()

          value = nextValue

          error = null
          hasError = false

          dirty = false
        } catch (err) {
          // 缓存异常，避免每次读取都重复计算
          error = err
          hasError = true

          dirty = false

          throw err
        } finally {
          evaluating = false
        }
      }

      // 如果上一次计算失败，继续抛出缓存的异常
      if (hasError) {
        throw error
      }

      return value
    }
  }
}


export function batch(fn) {
  batchDepth++

  try {
    return fn()
  } finally {
    batchDepth--

    if (batchDepth === 0) {
      flushEffects()
    }
  }
}

export function stop(effectFn) {
  if (!effectFn || !effectFn.active) return

  effectFn.active = false

  cleanup(effectFn)

  computedQueue.delete(effectFn)
  effectQueue.delete(effectFn)
}


export function effectScope(options = {}) {
  const parent = activeScope

  const hasOwnErrorHandler =
    Object.prototype.hasOwnProperty.call(
      options,
      'onError'
    )

  const scope = {
    active: true,

    // 当前 Scope 创建的 Effect
    effects: [],

    // 当前 Scope 创建的子 Scope
    scopes: [],

    // 父 Scope
    parent,

    // 错误处理器
    onError: hasOwnErrorHandler
      ? options.onError
      : parent?.onError ?? null,

    setErrorHandler(handler) {
      if (
        handler !== null &&
        typeof handler !== 'function'
      ) {
        throw new TypeError(
          'RxFlare: Error handler must be a function or null.'
        )
      }

      scope.onError = handler

      return scope
    },

    run(fn) {
      if (!scope.active) {
        throw new Error(
          'RxFlare: Cannot run an inactive effect scope.'
        )
      }

      const previousScope = activeScope

      activeScope = scope

      try {
        return fn()
      } finally {
        activeScope = previousScope
      }
    },

    stop() {
      if (!scope.active) return

      scope.active = false

      // 先停止所有子 Scope
      for (const child of [...scope.scopes].reverse()) {
        child.stop()
      }

      scope.scopes.length = 0

      // 再停止当前 Scope 的 Effect
      for (const effectFn of [...scope.effects]) {
        stop(effectFn)
      }

      scope.effects.length = 0

      // 从父 Scope 中解除注册
      if (parent && !options.detached) {
        const index = parent.scopes.indexOf(scope)

        if (index !== -1) {
          parent.scopes.splice(index, 1)
        }
      }
    }
  }

  // detached Scope 不参与父级自动销毁
  if (
    parent &&
    parent.active &&
    !options.detached
  ) {
    parent.scopes.push(scope)
  }

  return scope
}
