import { getImportMap } from './parseImport'
import { genTemplateByHook } from './generateTemplate'
import { generateStyleTag } from './generateStyle'

const parseConfig = (config = {}) => {
  const {
    blockRelativePath = '../components/',
    blockSuffix = '.vue',
    scriptConfig = {},
    styleConfig = {}
  } = config || {}
  const res = {
    ...config,
    blockRelativePath,
    blockSuffix,
    scriptConfig,
    styleConfig
  }

  return res
}

const defaultScriptConfig = {
  lang: '',
  setup: true
}

const defaultStyleConfig = {
  scoped: true,
  lang: ''
}

const generateSFCFile = (schema, componentsMap, config = {}) => {
  const parsedConfig = parseConfig(config)
  const { blockRelativePath, blockSuffix, scriptConfig: initScriptConfig, styleConfig: initStyleConfig } = parsedConfig
  // 前置动作，对 Schema 进行解析初始化相关配置与变量

  // 解析 import
  const { pkgMap, blockPkgMap } = getImportMap(schema, componentsMap, { blockRelativePath, blockSuffix })

  // 解析 state
  const state = schema.state || {}

  // 解析 method
  const methods = schema.methods || {}

  const POSITION = {
    AFTER_IMPORT: 'AFTER_IMPORT',
    BEFORE_PROPS: 'BEFORE_PROPS',
    AFTER_PROPS: 'AFTER_PROPS',
    BEFORE_STATE: 'BEFORE_STATE',
    AFTER_STATE: 'AFTER_STATE',
    BEFORE_METHODS: 'BEFORE_METHODS',
    AFTER_METHODS: 'AFTER_METHODS'
  }

  // 其他表达式语句
  const statements = {
    [POSITION.AFTER_IMPORT]: [],
    [POSITION.BEFORE_PROPS]: [],
    [POSITION.AFTER_PROPS]: [],
    [POSITION.BEFORE_STATE]: [],
    [POSITION.AFTER_STATE]: [],
    [POSITION.BEFORE_METHODS]: [],
    [POSITION.AFTER_METHODS]: []
  }

  // config
  let scriptConfig = {
    ...defaultScriptConfig,
    ...initScriptConfig
  }

  let styleConfig = {
    ...defaultStyleConfig,
    ...initStyleConfig
  }

  const globalHooks = {
    addStatement: (newStatement) => {
      if (!newStatement?.value) {
        return false
      }

      ;(statements[newStatement?.position] || statements[POSITION.AFTER_METHODS]).push(newStatement?.value)

      return true
    },
    addMethod: (key, value) => {
      if (methods[key]) {
        return false
      }

      methods[key] = value

      return true
    },
    addState: (key, value) => {
      if (state[key]) {
        return false
      }

      state[key] = value

      return true
    },
    addImport: (fromPath, config) => {
      const dependenciesMap = pkgMap[fromPath] || blockPkgMap[fromPath]

      if (dependenciesMap) {
        // 默认导出
        if (!config.destructuring && dependenciesMap.find(({ destructuring }) => !destructuring)) {
          return false
        }

        dependenciesMap.push(config)

        return true
      }

      pkgMap[fromPath] = [config]

      return true
    },
    setScriptConfig: (newConfig) => {
      if (!newConfig || typeof newConfig !== 'object') {
        return
      }

      scriptConfig = {
        ...scriptConfig,
        ...newConfig
      }
    },
    getScriptConfig: () => scriptConfig,
    setStyleConfig: (newConfig = {}) => {
      if (!newConfig || typeof newConfig !== 'object') {
        return
      }

      styleConfig = {
        ...styleConfig,
        ...newConfig
      }
    },
    getStyleConfig: () => styleConfig,
    addCss: (css) => {
      schema.css = `${schema.css}\n${css}`
    }
  }

  // TODO: 支持页面级别的 dataSource、utils

  // 解析 template
  const templateStr = genTemplateByHook(schema, globalHooks, parsedConfig)

  // 生成 script
  const scriptStr = ''

  // 生成 style
  const styleStr = generateStyleTag(schema, styleConfig)

  return `${templateStr}\n${scriptStr}\n${styleStr}`
}

export default generateSFCFile