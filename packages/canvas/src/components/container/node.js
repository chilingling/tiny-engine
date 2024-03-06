import { NODE_UID } from '../common'

// 选中节点
// element 实例DOM元素？
// instance Vue 实例
// node schema 实例（带 schema 配置）

// 获取最近的 vue 实例
export const getClosedVueElement = (element) => {
  if (element === element.ownerDocument.body) {
    return element
  }

  if (!element) {
    return
  }

  if (element.__vueParentComponent) {
    return element.__vueParentComponent
  }

  if (element.parentElement) {
    return getClosedVueElement(element.parentElement)
  }
}

// 获取距离点击事件最近的 vue 实例
export const getInstanceByTarget = (element) => {
  let closedVueEle = getClosedVueElement(element)

  if (!closedVueEle) {
    return
  }

  while (closedVueEle && !closedVueEle?.[NODE_UID]) {
    closedVueEle = closedVueEle.parent
  }

  if (closedVueEle) {
    return closedVueEle
  }
}

let range

const getTextRect = (node) => {
  if (!range) {
    range = document.createRange()
  }

  range.selectNode(node)

  return range.getBoundingClientRect()
}

function createRect() {
  const rect = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    get width() {
      return rect.right - rect.left
    },
    get height() {
      return rect.bottom - rect.top
    }
  }

  return rect
}

const mergeRects = (a, b) => {
  if (!a.top || b.top < a.top) {
    a.top = b.top
  }

  if (!a.bottom || b.bottom > a.bottom) {
    a.bottom = b.bottom
  }

  if (!a.left || b.left < a.left) {
    a.left = b.left
  }

  if (!a.right || b.right > a.right) {
    a.right = b.right
  }

  return a
}

const getFragmentRect = (instance) => {
  const rect = createRect()

  if (!instance.children) {
    return rect
  }

  for (const child of instance.children) {
    let childRect

    if (child.component) {
      // eslint-disable-next-line no-use-before-define
      childRect = getInstanceRect(child.component)
    } else if (child.el) {
      const el = child.el

      if (el.nodeType === 1 || el.getBoundingClientRect) {
        childRect = el.getBoundingClientRect()
      } else if (el.nodeType === 3 && el.data.trim()) {
        childRect = getTextRect(el)
      }
    }

    if (childRect) {
      mergeRects(rect, childRect)
    }
  }

  return rect
}

export const getInstanceRect = (instance) => {
  if (instance.$) {
    return getInstanceRect(instance.$)
  }

  // Fragment
  if (instance?.type?.description === 'v-fgt') {
    return getFragmentRect(instance)
  }

  if (instance.el?.nodeType === 1) {
    return instance.el.getBoundingClientRect()
  }

  if (instance.component) {
    return getInstanceRect(instance.component)
  }

  if (instance.subTree) {
    return getInstanceRect(instance.subTree)
  }
}
