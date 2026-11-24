
const NODE_RANGE = Symbol('RxFlare.NodeRange')

/**
 * 创建节点范围
 *
 * start 和 end 是范围的起止 DOM 节点。
 * 普通 DOM 节点不需要包装。
 */
export function createNodeRange(start, end = start) {
  if (!(start instanceof Node) || !(end instanceof Node)) {
    throw new TypeError(
      'RxFlare: NodeRange requires valid DOM nodes.'
    )
  }

  return {
    [NODE_RANGE]: true,
    start,
    end
  }
}

/**
 * 判断是否为节点范围
 */
export function isNodeRange(value) {
  return Boolean(value?.[NODE_RANGE])
}

/**
 * 获取第一个 DOM 节点
 */
export function getFirstNode(value) {
  return isNodeRange(value)
    ? value.start
    : value
}

/**
 * 获取最后一个 DOM 节点
 */
export function getLastNode(value) {
  return isNodeRange(value)
    ? value.end
    : value
}

/**
 * 将节点或节点范围插入指定位置
 *
 * anchor 为 null 时插入末尾。
 */
export function insertRange(parent, value, anchor = null) {
  if (!parent || !value) return

  if (!isNodeRange(value)) {
    parent.insertBefore(value, anchor)
    return
  }

  const { start, end } = value

  // 如果 anchor 本身就在当前范围内，无需移动
  let check = start

  while (check) {
    if (check === anchor) return
    if (check === end) break
    check = check.nextSibling
  }

  // 从前向后移动整个范围
  let node = start

  while (node) {
    const next = node.nextSibling

    parent.insertBefore(node, anchor)

    if (node === end) break

    node = next
  }
}

/**
 * 移除节点或整个节点范围
 */
export function removeRange(value) {
  if (!value) return

  if (!isNodeRange(value)) {
    value.remove()
    return
  }

  const { start, end } = value

  let node = start

  while (node) {
    const next = node.nextSibling

    node.parentNode?.removeChild(node)

    if (node === end) break

    node = next
  }
}
