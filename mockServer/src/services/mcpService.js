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

import { getResponseData } from '../tool/Common'
import MCPClient from './mcpClient'
import fs from 'fs-extra'
import path from 'path'

/**
 * MCP 服务
 * 用于处理 AI 聊天请求，并自动调用工具
 */
export default class MCPService {
  constructor() {
    this.mcpClient = new MCPClient()
    this.initTools()
  }

  /**
   * 初始化工具
   */
  initTools() {
    // 注册文件操作工具
    this.registerFileTools()

    // 注册组件操作工具
    this.registerComponentTools()

    // 注册其他工具
    this.registerMiscTools()
  }

  /**
   * 注册文件操作工具
   */
  registerFileTools() {
    // 读取文件工具
    this.mcpClient.registerTool(
      {
        type: 'function',
        function: {
          name: 'read_file',
          description: '读取文件内容',
          parameters: {
            type: 'object',
            properties: {
              file_path: {
                type: 'string',
                description: '要读取的文件路径'
              }
            },
            required: ['file_path']
          }
        }
      },
      async (params) => {
        try {
          const { file_path } = params
          const content = await fs.readFile(file_path, 'utf-8')
          return { content }
        } catch (error) {
          return { error: error.message }
        }
      }
    )

    // 写入文件工具
    this.mcpClient.registerTool(
      {
        type: 'function',
        function: {
          name: 'write_file',
          description: '写入文件内容',
          parameters: {
            type: 'object',
            properties: {
              file_path: {
                type: 'string',
                description: '要写入的文件路径'
              },
              content: {
                type: 'string',
                description: '要写入的文件内容'
              }
            },
            required: ['file_path', 'content']
          }
        }
      },
      async (params) => {
        try {
          const { file_path, content } = params
          await fs.ensureDir(path.dirname(file_path))
          await fs.writeFile(file_path, content, 'utf-8')
          return { success: true }
        } catch (error) {
          return { error: error.message }
        }
      }
    )

    // 列出目录内容工具
    this.mcpClient.registerTool(
      {
        type: 'function',
        function: {
          name: 'list_directory',
          description: '列出目录内容',
          parameters: {
            type: 'object',
            properties: {
              directory_path: {
                type: 'string',
                description: '要列出内容的目录路径'
              }
            },
            required: ['directory_path']
          }
        }
      },
      async (params) => {
        try {
          const { directory_path } = params
          const files = await fs.readdir(directory_path)
          const fileStats = await Promise.all(
            files.map(async (file) => {
              const filePath = path.join(directory_path, file)
              const stats = await fs.stat(filePath)
              return {
                name: file,
                path: filePath,
                is_directory: stats.isDirectory(),
                size: stats.size,
                created_at: stats.birthtime,
                modified_at: stats.mtime
              }
            })
          )
          return { files: fileStats }
        } catch (error) {
          return { error: error.message }
        }
      }
    )
  }

  /**
   * 注册组件操作工具
   */
  registerComponentTools() {
    // 获取组件列表工具
    this.mcpClient.registerTool(
      {
        type: 'function',
        function: {
          name: 'get_components',
          description: '获取可用组件列表',
          parameters: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: '组件类别，可选'
              }
            }
          }
        }
      },
      async (params) => {
        try {
          // 这里可以实现获取组件列表的逻辑
          // 示例实现，实际应根据 TinyEngine 的组件管理逻辑来实现
          return {
            components: [
              { name: 'Button', category: 'basic', description: '按钮组件' },
              { name: 'Input', category: 'form', description: '输入框组件' },
              { name: 'Table', category: 'data', description: '表格组件' }
            ]
          }
        } catch (error) {
          return { error: error.message }
        }
      }
    )

    // 获取组件详情工具
    this.mcpClient.registerTool(
      {
        type: 'function',
        function: {
          name: 'get_component_detail',
          description: '获取组件详细信息',
          parameters: {
            type: 'object',
            properties: {
              component_name: {
                type: 'string',
                description: '组件名称'
              }
            },
            required: ['component_name']
          }
        }
      },
      async (params) => {
        try {
          const { component_name } = params
          // 这里可以实现获取组件详情的逻辑
          // 示例实现，实际应根据 TinyEngine 的组件管理逻辑来实现
          const componentDetails = {
            Button: {
              name: 'Button',
              props: [
                { name: 'type', type: 'string', description: '按钮类型', default: 'default' },
                { name: 'size', type: 'string', description: '按钮大小', default: 'medium' }
              ],
              events: [
                { name: 'click', description: '点击事件' }
              ]
            },
            Input: {
              name: 'Input',
              props: [
                { name: 'value', type: 'string', description: '输入值' },
                { name: 'placeholder', type: 'string', description: '占位文本' }
              ],
              events: [
                { name: 'change', description: '值变化事件' },
                { name: 'focus', description: '获取焦点事件' }
              ]
            }
          }

          return componentDetails[component_name] || { error: '未找到组件' }
        } catch (error) {
          return { error: error.message }
        }
      }
    )
  }

  /**
   * 注册其他工具
   */
  registerMiscTools() {
    // 搜索代码工具
    this.mcpClient.registerTool(
      {
        type: 'function',
        function: {
          name: 'search_code',
          description: '在代码库中搜索',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜索关键词'
              },
              file_pattern: {
                type: 'string',
                description: '文件匹配模式，例如 "*.js"'
              }
            },
            required: ['query']
          }
        }
      },
      async (params) => {
        try {
          const { query, file_pattern } = params
          // 这里可以实现代码搜索逻辑
          // 示例实现，实际应根据需求实现
          return {
            results: [
              { file: 'example.js', line: 10, content: `function example() { // ${query}` }
            ]
          }
        } catch (error) {
          return { error: error.message }
        }
      }
    )
  }

  /**
   * 处理 AI 聊天请求
   * @param {Object} query 查询参数
   * @returns {Promise<Object>} 聊天响应
   */
  async chat(query) {
    try {
      const result = await this.mcpClient.chat(query)

      return getResponseData({
        originalResponse: result,
        replyWithoutCode: result
      })
    } catch (error) {
      console.error('MCP 服务聊天请求失败:', error.message)

      return getResponseData(null, {
        code: error.response?.status || 500,
        message: error.message || '请求 MCP 服务失败'
      })
    }
  }
}
