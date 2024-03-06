import { ref } from 'vue'

const nodeToInstanceMap = ref(new Map())

const setInstanceMap = (nodeId, instance) => {
  if (!instance && nodeToInstanceMap.value.has(nodeId)) {
    nodeToInstanceMap.value.delete(nodeId)

    return
  }

  nodeToInstanceMap.value.set(nodeId, instance)
}

const clearInstanceMap = () => {
  nodeToInstanceMap.value.clear()
}

const getInstanceById = (id) => {
  return nodeToInstanceMap.value.get(id)
}

export const useNode = () => {
  return {
    nodeToInstanceMap,
    setInstanceMap,
    getInstanceById,
    clearInstanceMap
  }
}
