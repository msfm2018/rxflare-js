
let pageScopeId = 0

// 创建页面专属 CSS
export function createPageStyles(root, styles) {
  if (
    typeof styles !== 'string' ||
    !styles.trim()
  ) {
    return () => {}
  }

  const scopeId = `rx-page-${++pageScopeId}`

  root.setAttribute(
    'data-rx-page',
    scopeId
  )

  const styleElement = document.createElement('style')

  styleElement.setAttribute(
    'data-rx-page-style',
    scopeId
  )

  styleElement.textContent = `
    @scope ([data-rx-page="${scopeId}"]) {
      ${styles}
    }
  `

  try {
    document.head.appendChild(styleElement)
  } catch (error) {
    root.removeAttribute('data-rx-page')
    throw error
  }

  let active = true

  return function cleanupPageStyles() {
    if (!active) return

    active = false

    styleElement.remove()
    root.removeAttribute('data-rx-page')
  }
}
