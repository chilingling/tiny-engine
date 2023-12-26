import { mergeOptions } from '../utils/mergeOptions'
import { generatePageCode } from '../generator/page'

const defaultOption = {
  blockBasePath: './src/components'
}

function genBlockPlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { blockBasePath } = realOptions

  return {
    name: 'tinyengine-plugin-generatecode-block',
    description: 'transform block schema to code',
    parseSchema(schema) {
      const { blockHistories } = schema
      const blockSchema = blockHistories.map((block) => block?.content).filter((schema) => typeof schema === 'object')

      return {
        id: 'blocks',
        result: blockSchema
      }
    },
    transform(transformedSchema) {
      const { blocks } = transformedSchema

      const resBlocks = []

      for (const block of blocks) {
        const res = generatePageCode({
          pageInfo: { schema: block, name: block.componentName },
          componentsMap: this.schema.componentsMap
        })

        const { errors, ...restInfo } = res[0]

        if (errors?.length > 0) {
          this.genLogs.push(...errors)
          continue
        }

        const { panelName, panelValue } = restInfo

        resBlocks.push({
          fileName: panelName,
          path: blockBasePath,
          fileContent: panelValue
        })
      }

      return resBlocks
    }
  }
}

export default genBlockPlugin