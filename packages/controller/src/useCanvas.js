/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

/* eslint-disable no-new-func */
import { reactive, ref, watch } from 'vue'
import { constants, utils } from '@opentiny/tiny-engine-utils'
import useHistory from './useHistory'
import useProperties from './useProperties'
import debounce from '@opentiny/vue-renderless/common/deps/debounce'

const { COMPONENT_NAME } = constants

const defaultPageState = {
  currentVm: null,
  currentSchema: null,
  currentType: null,
  pageSchema: null,
  properties: null,
  dataSource: null,
  dataSourceMap: null,
  isSaved: true,
  isLock: false,
  isBlock: false,
  nodesStatus: {},
  loading: false
}

const defaultSchema = {
  componentName: 'Page',
  fileName: '',
  css: '',
  props: {},
  lifeCycles: {},
  children: [],
  dataSource: {
    list: []
  },
  methods: {},
  bridge: {
    imports: []
  },
  state: {},
  inputs: [],
  outputs: []
}

const renderer = ref(null)

const pageState = reactive({ ...defaultPageState, loading: true })

const nodesMap = ref(new Map())
const rootid = 'root_id'
const newCurrentSchema = ref({})

const buildNodes = (schema, id, parentId) => {
  schema.parentId = parentId
  nodesMap.value.set(id, schema)

  if (Array.isArray(schema?.children)) {
    schema.children.forEach((item) => {
      buildNodes(item, item.id, id)
    })
  }
}

const schema = ref({})

const getTestSchema = () => nodesMap.value
// 重置画布数据
const resetCanvasState = async (state = {}) => {
  Object.assign(pageState, defaultPageState, state)

  schema.value = pageState.pageSchema
  buildNodes(schema.value, rootid)
  // testNode.value = nodesMap.value.get("54780a26")
  await renderer.value?.setSchema(pageState.pageSchema, nodesMap)
  // renderer.value?.setTestSchema(schema.value)
}

// watch(
//   () => testNode.value,
//   () => {
//     console.log('test node change', testNode.value)
//   },
//   {
//     deep: true
//   }
// )

const setSchema = (newSchema) => {
  // schema.value = newSchema
}

// const getSchema = () => {

// }

const syncSchema = debounce(1000, () => {
  requestIdleCallback(() => {
    schema.value = nodesMap.value.get('root_id')
  }, { timeout: 5000 })
})

watch(
  () => schema.value,
  () => {
    console.log('schema.value change', schema.value)
  },
  {
    deep: true
  }
)

const setNodeProps = (nodeId, key, value) => {
  const node = nodesMap.value?.get?.(nodeId)

  if (!node) {
    return false
  }

  node.props[key] = value
  renderer.value.setTestSchema(nodeId)
  // syncSchema()

  // console.log('setNodeProps', node)
  // console.log('pageState.currentSchema', pageState.currentSchema)
  // console.log('rootNodeId', nodesMap.value.get('root_id'))
  // console.log('schema.value', schema.value)
}

const deleteNodeProps = (nodeId, key) => {
  const node = nodesMap.value?.get?.(nodeId)

  if (!node) {
    return false
  }

  delete node.props[key]

  renderer.value.setTestSchema(nodeId)
}

const getNodeIndex = (parentNodeId, nodeId) => {
  const parentNode = nodesMap.value.get(parentNodeId)
  console.log('getNodeIndex', nodesMap.value)
  console.log('getNodeIndex', parentNode)

  if (!parentNode) {
    return -1
  }

  return (parentNode.children || []).findIndex((nodeItem) => nodeItem.id === nodeId)
}

const recursiveUpdateChildren = (node) => {
  (node.children || []).forEach((childItem) => {
    const id = childItem.id || utils.guid()
    childItem.id = id
    childItem.parentId = node.id

    nodesMap.value.set(id, childItem)

    if (Array.isArray(childItem.children) && childItem.children.length) {
      recursiveUpdateChildren(childItem)
    }
  })
}

const insertNode = (parentNodeId, newNode, index) => {
  const parentNode = nodesMap.value.get(parentNodeId)

  if (!parentNode) {
    return false
  }

  const newNodeSchema = {
    ...newNode,
    id: utils.guid(),
    parentId: parentNodeId
  }

  console.log('insertNode newNodeSchema', newNodeSchema)

  parentNode.children.splice(index, 0, newNodeSchema)
  nodesMap.value.set(newNodeSchema.id, newNodeSchema)

  recursiveUpdateChildren(newNodeSchema)

  renderer.value.setTestSchema(parentNodeId)
}

const deleteNode = (nodeId) => {
  const node = nodesMap.value.get(nodeId)

  if (!node) {
    return false
  }

  const parentNodeId = node.parentId
  const parentNode = nodesMap.value.get(parentNodeId)

  if (!parentNode) {
    return false
  }

  const index = parentNode.children.findIndex(( item ) => item.id === nodeId)

  if (index !== -1) {
    parentNode.children.splice(index, 1)
  }

  nodesMap.value.delete(nodeId)

  renderer.value.setTestSchema(parentNodeId)
}

// 页面重置画布数据
const resetPageCanvasState = (state = {}) => {
  state.isBlock = false
  resetCanvasState(state)
  useHistory().addHistory(state.pageSchema)
}

// 区块重置画布数据
const resetBlockCanvasState = async (state = {}) => {
  state.isBlock = true
  await resetCanvasState(state)
}

const getDefaultSchema = (componentName = 'Page', fileName = '') => ({
  ...defaultSchema,
  componentName,
  fileName
})

const setSaved = (flag = false) => {
  pageState.isSaved = flag
}

// 清空画布
const clearCanvas = () => {
  pageState.properties = null

  const { fileName, componentName } = pageState.pageSchema || {}

  resetCanvasState({
    pageSchema: { ...getDefaultSchema(componentName, fileName) }
  })

  setSaved(false)
}

const isBlock = () => pageState.isBlock

// 初始化页面数据
const initData = (schema = { ...defaultSchema }, currentPage) => {
  if (schema.componentName === COMPONENT_NAME.Block) {
    resetBlockCanvasState({
      pageSchema: schema,
      loading: false
    })
  } else {
    resetPageCanvasState({
      pageSchema: schema,
      currentPage,
      loading: false
    })
  }

  useHistory().addHistory(schema)
}

const isSaved = () => pageState.isSaved

const isLoading = () => pageState.loading

const getPageSchema = () => {
  return pageState.pageSchema || {}
}

const setCurrentSchema = (schema) => {
  const node = nodesMap.value.get(schema.id)
  pageState.currentSchema = node

  if (node) {
    newCurrentSchema.value = node
  }
}

watch(
  () => pageState.currentSchema,
  () => {
    // console.log('currentSchema change', pageState.currentSchema)
    const parent = nodesMap.value.get(pageState.currentSchema.id)
    useProperties().getProps(pageState.currentSchema, parent)
  },
  {
    deep: true
  }
)

const getCurrentSchema = () => pageState.currentSchema

const clearCurrentState = () => {
  pageState.currentVm = null
  pageState.hoverVm = null
  pageState.properties = {}
  pageState.pageSchema = null
}
const getCurrentPage = () => pageState.currentPage



export default function () {
  return {
    pageState,
    renderer,
    isBlock,
    isSaved,
    isLoading,
    initData,
    setSaved,
    clearCanvas,
    getPageSchema,
    resetPageCanvasState,
    resetBlockCanvasState,
    clearCurrentState,
    getDataSourceMap: renderer.value?.getDataSourceMap,
    setDataSourceMap: renderer.value?.setDataSourceMap,
    getCurrentSchema,
    setCurrentSchema,
    getCurrentPage,
    setSchema,
    getTestSchema,
    deleteNode,
    insertNode,
    setNodeProps,
    deleteNodeProps,
    getNodeIndex,
    schema
  }
}
