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
import axios from 'axios'
import { openai } from '../config/config'
import fs from 'fs-extra'
import path from 'path'
import OpenAI from "openai"
import MCPClient from './mcpClient'

export default class AiService {
  constructor() {
    // 配置大模型 API 的基本信息
    this.apiKey = openai.apiKey
    this.apiBaseUrl = openai.apiBaseUrl
    this.model = openai.model
    this.timeout = 60000 // 请求超时时间，默认 60 秒

    // MCP 相关配置
    this.tools = [] // 可用工具列表
    this.toolExecutors = {} // 工具执行器映射
    this.mcpClient = new MCPClient() // MCP 客户端
    this.openai = new OpenAI({
        apiKey: openai.apiKey,
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    })

    // 初始化工具
    // this.initTools()

    // 初始化 MCP 客户端
    this.initMCPClient()
  }

  /**
   * 初始化 MCP 客户端
   */
  async initMCPClient() {
    // 检查是否启用 MCP
    // if (process.env.ENABLE_MCP !== 'true') {
    //   console.log('MCP 功能未启用，跳过初始化 MCP 客户端');
    //   return;
    // }

    // 连接 MCP 服务器
    // const serverScriptPath = process.env.MCP_SERVER_SCRIPT_PATH;
    const serverScriptPath = '/Users/chiling/Code/tiny-engine/mcp-server/weather/build/index.js'
    if (!serverScriptPath) {
      console.log('未配置 MCP 服务器脚本路径，跳过初始化 MCP 客户端');
      return;
    }

    try {
      const connected = await this.mcpClient.connect(serverScriptPath);
      if (connected) {
        // 获取 MCP 服务器提供的工具
        const mcpTools = this.mcpClient.getAvailableTools();

        console.log('mcpTools', JSON.stringify(mcpTools))

        // 添加到工具列表
        this.tools = [...this.tools, ...mcpTools];

        console.log('已初始化 MCP 客户端，添加工具:', mcpTools.map(tool => tool.function.name));
      }
    } catch (error) {
      console.error('初始化 MCP 客户端失败:', error);
    }
  }
    /**
   * 执行工具调用
   * @param {Object} toolCall 工具调用信息
   * @returns {Promise<any>} 工具执行结果
   */
    async executeToolCall(toolCall) {
      const { name, arguments: argsString } = (toolCall?.function || {})

      // 检查是否是 MCP 工具
      const isMCPTool = this.mcpClient.availableTools.some(tool => tool.name === name);

      if (isMCPTool) {
        try {
          // 解析工具参数
          const args = JSON.parse(argsString);

          // 调用 MCP 工具
          return await this.mcpClient.callTool(name, args);
        } catch (error) {
          console.error(`执行 MCP 工具 ${name} 失败:`, error);
          return { error: error.message };
        }
      } else if (this.toolExecutors[name]) {
        try {
          // 解析工具参数
          const args = JSON.parse(argsString);

          // 执行本地工具
          return await this.toolExecutors[name](args);
        } catch (error) {
          console.error(`执行本地工具 ${name} 失败:`, error);
          return { error: error.message };
        }
      } else {
        throw new Error(`未找到工具: ${name}`);
      }
    }

    /**
     * 处理工具调用
     * @param {Array} toolCalls 工具调用列表
     * @param {Array} messages 消息历史
     * @returns {Promise<Array>} 更新后的消息历史
     */
    async processToolCalls(toolCalls, messages) {
      // 添加助手消息到历史
      // const assistantMessage = messages[messages.length - 1]

      // 处理每个工具调用
      const toolResults = []
      for (const toolCall of toolCalls) {
        try {
          // 执行工具调用
          console.log('执行工具调用:', toolCall)
          const result = await this.executeToolCall(toolCall)
          console.log('工具调用结果:', result)

          // 添加工具结果到结果列表
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: JSON.stringify(result.content || result)
          })
        } catch (error) {
          console.error('处理工具调用失败:', error)
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: JSON.stringify({ error: error.message })
          })
        }
      }

      // 将工具结果添加到消息历史
      return [...messages, ...toolResults]
    }
    async getStreamRes(messages, tools = []) {
      try {
        console.log('发送请求到大模型 API:', `${this.apiBaseUrl}/chat/completions`)
        const stream = await this.openai.chat.completions.create({
            model: 'qwq-32b',
            messages,
            tools,
            parallel_tool_calls: true,
            // QwQ 模型仅支持流式输出方式调用
            stream: true
        })
        const res = {
          role: 'assistant',
          reasoning_content: '',
          content: '',
          chunkUsage: '',
          tool_calls: []
        }

        for await (const chunk of stream) {
          if (!chunk.choices?.length) {
              console.log('\nUsage:');
              console.log(chunk.usage);
              res.chunkUsage = chunk.usage;
              continue;
          }

          const delta = chunk.choices[0].delta;

          // 处理思考过程
          if (delta.reasoning_content) {
              res.reasoning_content += delta.reasoning_content;
          }
          // 处理正式回复
          else if (delta.content) {
              res.content += delta.content;
          }

          if (delta.tool_calls) {
            for (const toolCall of delta.tool_calls) {
                const index = toolCall.index;
                console.log('toolCall item', toolCall)

                // 确保数组长度足够
                while (res.tool_calls.length <= index) {
                    res.tool_calls.push({});
                }

                // 更新工具ID
                if (toolCall.id) {
                    res.tool_calls[index].id = (res.tool_calls[index].id || "") + toolCall.id
                }

                if (toolCall.function && ! res.tool_calls[index].function) {
                    res.tool_calls[index].function = {}
                }

                // 更新函数名称
                if (toolCall.function?.name) {
                  res.tool_calls[index].function.name = (res.tool_calls[index].function?.name || "") + toolCall.function.name
                }

                // // 更新参数
                if (toolCall.function?.arguments) {
                    res.tool_calls[index].function.arguments = (res.tool_calls[index].function?.arguments || "") + toolCall.function.arguments
                }
            }
          }
        }

        return res
      } catch (error) {
        console.error('AI 聊天请求失败:', JSON.stringify(error))
      }
    }

    async chat(query) {
      console.log('query', query)
      const { messages } = query

      try {
        // 检查 API Key 是否配置
        if (!this.apiKey) {
          throw new Error('未配置 API Key，请在 .env 文件中设置 OPENAI_API_KEY')
        }

        // 构建请求参数，兼容 OpenAI API 格式
        // const requestData = {
        //   model: this.model,
        //   messages,
        //   temperature: query.temperature || 0.7,
        //   max_tokens: query.max_tokens || 131072,
        //   top_p: query.top_p || 1,
        //   frequency_penalty: query.frequency_penalty || 0,
        //   presence_penalty: query.presence_penalty || 0,
        //   stream: query.stream || false
        // }

        // 如果有工具，添加到请求中
        // if (this.tools.length > 0) {
        //   requestData.tools = this.tools
        //   requestData.tool_choice = 'auto'
        // }
        const streamRes = await this.getStreamRes(messages, this.tools)


        // console.log('requestData', requestData)

        // 发送请求到大模型 API
        // const response = await axios({
        //   method: 'post',
        //   url: `${this.apiBaseUrl}/chat/completions`,
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${this.apiKey}`
        //   },
        //   data: requestData,
        //   timeout: this.timeout
        // })

        console.log('大模型响应:', streamRes)

        let finalResponse = streamRes
        // const assistantMessage = response.data.choices[0].message
        // console.log('response.data.choices', response.data.choices)

        // 检查是否有工具调用
        if (streamRes.tool_calls.length > 0) {
          console.log('检测到工具调用:', streamRes.tool_calls)

          // 将助手消息添加到历史
          const { reasoning_content, ...rest } = streamRes
          const updatedMessages = [...messages, rest]

          // 处理工具调用
          const messagesWithToolResults = await this.processToolCalls(
            streamRes.tool_calls,
            updatedMessages
          )

          // 继续对话，将工具调用结果发送给模型
          // const followUpRequestData = {
          //   model: this.model,
          //   messages: messagesWithToolResults,
          //   temperature: query.temperature || 0.7,
          //   max_tokens: query.max_tokens || 16384,
          //   top_p: query.top_p || 1,
          //   frequency_penalty: query.frequency_penalty || 0,
          //   presence_penalty: query.presence_penalty || 0,
          //   stream: query.stream || false,
          //   tools: this.tools,
          //   tool_choice: 'auto'
          // }
          console.log('messagesWithToolResults', messagesWithToolResults)
          const followUpRequestData = await this.getStreamRes(messagesWithToolResults, this.tools)

          // 发送后续请求
          // const followUpResponse = await axios({
          //   method: 'post',
          //   url: `${this.apiBaseUrl}/chat/completions`,
          //   headers: {
          //     'Content-Type': 'application/json',
          //     'Authorization': `Bearer ${this.apiKey}`
          //   },
          //   data: followUpRequestData,
          //   timeout: this.timeout
          // })

          finalResponse = followUpRequestData
        }

        const res = {
          originalResponse: finalResponse,
          replyWithoutCode: finalResponse
        }
        // 返回大模型的响应结果
        return getResponseData(res)
      } catch (error) {
        console.error('AI 聊天请求失败:', JSON.stringify(error))
        console.error('AI 聊天请求失败:', error.message)

        // 返回错误信息
        return getResponseData(null, {
          code: error.response?.status || 500,
          message: error.message || '请求大模型 API 失败'
        })
      }
    }

  // /**
  //  * 初始化工具
  //  */
  // initTools() {
  //   // 注册文件操作工具
  //   this.registerFileTools()

  //   // 注册组件操作工具
  //   this.registerComponentTools()

  //   // 注册其他工具
  //   this.registerMiscTools()
  // }

  // /**
  //  * 注册工具
  //  * @param {Object} tool 工具定义
  //  * @param {Function} executor 工具执行函数
  //  */
  // registerTool(tool, executor) {
  //   this.tools.push(tool)
  //   this.toolExecutors[tool.function.name] = executor
  // }

  // /**
  //  * 注册文件操作工具
  //  */
  // registerFileTools() {
  //   // 读取文件工具
  //   this.registerTool(
  //     {
  //       type: 'function',
  //       function: {
  //         name: 'read_file',
  //         description: '读取文件内容',
  //         parameters: {
  //           type: 'object',
  //           properties: {
  //             file_path: {
  //               type: 'string',
  //               description: '要读取的文件路径'
  //             }
  //           },
  //           required: ['file_path']
  //         }
  //       }
  //     },
  //     async (params) => {
  //       try {
  //         const { file_path } = params
  //         const content = await fs.readFile(file_path, 'utf-8')
  //         return { content }
  //       } catch (error) {
  //         return { error: error.message }
  //       }
  //     }
  //   )

  //   // 写入文件工具
  //   this.registerTool(
  //     {
  //       type: 'function',
  //       function: {
  //         name: 'write_file',
  //         description: '写入文件内容',
  //         parameters: {
  //           type: 'object',
  //           properties: {
  //             file_path: {
  //               type: 'string',
  //               description: '要写入的文件路径'
  //             },
  //             content: {
  //               type: 'string',
  //               description: '要写入的文件内容'
  //             }
  //           },
  //           required: ['file_path', 'content']
  //         }
  //       }
  //     },
  //     async (params) => {
  //       try {
  //         const { file_path, content } = params
  //         await fs.ensureDir(path.dirname(file_path))
  //         await fs.writeFile(file_path, content, 'utf-8')
  //         return { success: true, message: '文件写入成功' }
  //       } catch (error) {
  //         return { error: error.message }
  //       }
  //     }
  //   )

  //   // 列出目录内容工具
  //   this.registerTool(
  //     {
  //       type: 'function',
  //       function: {
  //         name: 'list_directory',
  //         description: '列出目录内容',
  //         parameters: {
  //           type: 'object',
  //           properties: {
  //             directory_path: {
  //               type: 'string',
  //               description: '要列出内容的目录路径'
  //             }
  //           },
  //           required: ['directory_path']
  //         }
  //       }
  //     },
  //     async (params) => {
  //       try {
  //         const { directory_path } = params
  //         const files = await fs.readdir(directory_path)
  //         const fileStats = await Promise.all(
  //           files.map(async (file) => {
  //             const filePath = path.join(directory_path, file)
  //             const stats = await fs.stat(filePath)
  //             return {
  //               name: file,
  //               path: filePath,
  //               is_directory: stats.isDirectory(),
  //               size: stats.size,
  //               created_at: stats.birthtime,
  //               modified_at: stats.mtime
  //             }
  //           })
  //         )
  //         return { files: fileStats }
  //       } catch (error) {
  //         return { error: error.message }
  //       }
  //     }
  //   )
  // }

  // /**
  //  * 注册组件操作工具
  //  */
  // registerComponentTools() {
  //   // 获取组件列表工具
  //   this.registerTool(
  //     {
  //       type: 'function',
  //       function: {
  //         name: 'get_components',
  //         description: '获取可用组件列表',
  //         parameters: {
  //           type: 'object',
  //           properties: {
  //             category: {
  //               type: 'string',
  //               description: '组件类别，可选'
  //             }
  //           }
  //         }
  //       }
  //     },
  //     async (params) => {
  //       try {
  //         // 这里可以实现获取组件列表的逻辑
  //         // 示例实现，实际应根据 TinyEngine 的组件管理逻辑来实现
  //         return {
  //           components: [
  //             { name: 'Button', category: 'basic', description: '按钮组件' },
  //             { name: 'Input', category: 'form', description: '输入框组件' },
  //             { name: 'Table', category: 'data', description: '表格组件' }
  //           ]
  //         }
  //       } catch (error) {
  //         return { error: error.message }
  //       }
  //     }
  //   )

  //   // 获取组件详情工具
  //   this.registerTool(
  //     {
  //       type: 'function',
  //       function: {
  //         name: 'get_component_detail',
  //         description: '获取组件详细信息',
  //         parameters: {
  //           type: 'object',
  //           properties: {
  //             component_name: {
  //               type: 'string',
  //               description: '组件名称'
  //             }
  //           },
  //           required: ['component_name']
  //         }
  //       }
  //     },
  //     async (params) => {
  //       try {
  //         const { component_name } = params
  //         // 这里可以实现获取组件详情的逻辑
  //         // 示例实现，实际应根据 TinyEngine 的组件管理逻辑来实现
  //         const componentDetails = {
  //           Button: {
  //             name: 'Button',
  //             props: [
  //               { name: 'type', type: 'string', description: '按钮类型', default: 'default' },
  //               { name: 'size', type: 'string', description: '按钮大小', default: 'medium' }
  //             ],
  //             events: [
  //               { name: 'click', description: '点击事件' }
  //             ]
  //           },
  //           Input: {
  //             name: 'Input',
  //             props: [
  //               { name: 'value', type: 'string', description: '输入值' },
  //               { name: 'placeholder', type: 'string', description: '占位文本' }
  //             ],
  //             events: [
  //               { name: 'change', description: '值变化事件' },
  //               { name: 'focus', description: '获取焦点事件' }
  //             ]
  //           }
  //         }

  //         return componentDetails[component_name] || { error: '未找到组件' }
  //       } catch (error) {
  //         return { error: error.message }
  //       }
  //     }
  //   )
  // }

  // /**
  //  * 注册其他工具
  //  */
  // registerMiscTools() {
  //   // 搜索代码工具
  //   this.registerTool(
  //     {
  //       type: 'function',
  //       function: {
  //         name: 'search_code',
  //         description: '在代码库中搜索',
  //         parameters: {
  //           type: 'object',
  //           properties: {
  //             query: {
  //               type: 'string',
  //               description: '搜索关键词'
  //             },
  //             file_pattern: {
  //               type: 'string',
  //               description: '文件匹配模式，例如 "*.js"'
  //             }
  //           },
  //           required: ['query']
  //         }
  //       }
  //     },
  //     async (params) => {
  //       try {
  //         const { query, file_pattern } = params
  //         // 这里可以实现代码搜索逻辑
  //         // 示例实现，实际应根据需求实现
  //         return {
  //           results: [
  //             { file: 'example.js', line: 10, content: `function example() { // ${query}` }
  //           ]
  //         }
  //       } catch (error) {
  //         return { error: error.message }
  //       }
  //     }
  //   )
  // }


}
