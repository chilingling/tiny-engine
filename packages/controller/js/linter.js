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

import { useEnvironmentConfig } from '../src/useEnvironmentConfig'

export const initLinter = (editor, monacoInstance, state) => {
  const { config } = useEnvironmentConfig()

  let workerUrl = `${config.value.BASE_URL}monaco-linter/eslint.worker.js`

  // worker 资源跨域的情况，需要用 blob 加载
  if (new URL(window.location).origin !== new URL(config.value.BASE_URL).origin) {
    const workerBlob = new Blob([`importScripts('${workerUrl}');`], { type: 'application/javascript' })
    workerUrl = window.URL.createObjectURL(workerBlob)
  }

  const worker = new Worker(workerUrl)

  // 监听 ESLint web worker 的返回
  worker.onmessage = function (event) {
    const { markers, version } = event.data
    const model = editor.getModel()

    state.hasError = markers.filter(({ severity }) => severity === 'Error').length > 0

    // 判断当前 model 的 versionId 与请求时是否一致
    if (model && model.getVersionId() === version) {
      monacoInstance.editor.setModelMarkers(model, 'ESLint', markers)
    }
  }

  return worker
}

let timer = null

export const lint = (model, worker) => {
  if (timer) {
    clearTimeout(timer)
  }

  // 防抖处理
  timer = setTimeout(() => {
    timer = null
    worker.postMessage({
      code: model.getValue(),
      // 发起 ESLint 静态检查时，携带 versionId
      version: model.getVersionId()
    })
  }, 500)
}
