import OpenAI from "openai"
// import MCPClient from './mcpClient'
import { getResponseData } from './utils.js'
import mcpServerManager from './mcpServerManager.js'
import wsManager from "./wsManager.js"
class AiService {
  constructor() {
    // 配置大模型 API 的基本信息
    this.apiKey = ''
    this.apiBaseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    this.model = 'qwq-32b'
    this.timeout = 60000 // 请求超时时间，默认 60 秒

    // MCP 相关配置
    this.tools = [] // 可用工具列表
    this.toolExecutors = {} // 工具执行器映射
    this.mcpServerManager = mcpServerManager
    // this.mcpClient = new MCPClient() // MCP 客户端
    this.openai = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.apiBaseUrl
    })

    // 初始化工具
    // this.initTools()

    // 初始化 MCP 客户端
    // this.initMCPClient()
  }
  async getStreamRes(messages, tools = []) {
    try {
      console.log('发送请求到大模型 API:', `${this.apiBaseUrl}/chat/completions`)
      const toolConverted = tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      }))
      const stream = await this.openai.chat.completions.create({
          model: 'qwq-32b',
          messages,
          tools: toolConverted,
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
              // console.log('toolCall item', toolCall)

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
      console.log('res', res)
      return res
    } catch (error) {
      console.error('AI 聊天请求失败:', JSON.stringify(error))
    }
  }
  async processToolCalls(toolCalls, messages) {
    const toolResults = []
      for (const toolCall of toolCalls) {
        try {
          // 执行工具调用
          console.log('执行工具调用:', toolCall)
          const result = await this.mcpServerManager.callToolByToolName(toolCall.function.name, toolCall.id, toolCall.function.arguments)
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
  
  async chat(data) {
    console.log('data', data)
    
    // const { messages } = req.body
    const messages = data.content.messages
    console.log('messages', messages)
    try {
      // 检查 API Key 是否配置
      if (!this.apiKey) {
        throw new Error('未配置 API Key，请在 .env 文件中设置 OPENAI_API_KEY')
      }
      // const tools = await this.mcpServerManager.$getBuiltinTools()
      const tools = await this.mcpServerManager.getAllTools()
      console.log('all tools', tools)
      const streamRes = await this.getStreamRes(messages, tools)

      console.log('大模型响应:', streamRes)

      let finalResponse = streamRes

      // 检查是否有工具调用
      while (finalResponse?.tool_calls?.length > 0) {
        console.log('检测到工具调用:', streamRes.tool_calls)

        // 将助手消息添加到历史
        const { reasoning_content, ...rest } = streamRes
        const updatedMessages = [...messages, rest]

        // 处理工具调用
        const messagesWithToolResults = await this.processToolCalls(
          streamRes.tool_calls,
          updatedMessages
        )

        console.log('messagesWithToolResults', messagesWithToolResults)
        const followUpRequestData = await this.getStreamRes(messagesWithToolResults, tools)

        finalResponse = followUpRequestData
      }

      const res = {
        originalResponse: finalResponse,
        replyWithoutCode: finalResponse
      }
      // 返回大模型的响应结果
      // return res.json(
      //   getResponseData(res)
      // )
      wsManager.sendWebSocketRequest({
        type: 'chat_response',
        data: res
      })
    } catch (error) {
      console.error('AI 聊天请求失败:', JSON.stringify(error))
      console.error('AI 聊天请求失败:', error.message)

      // 返回错误信息
      // return res.json(
      //   getResponseData(null, {
      //     code: error.response?.status || 500,
      //     message: error.message || '请求大模型 API 失败'
      //   })
      // )
      wsManager.sendWebSocketRequest({
        type: 'chat_response',
        data: {
          code: error.response?.status || 500,
          message: error.message || '请求大模型 API 失败'
        }
      })
    }
  }
}

export default new AiService();