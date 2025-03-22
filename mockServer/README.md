# TinyEngine Mock Server

TinyEngine 的模拟服务器，提供 API 接口和 AI 功能。

## 功能特性

- 提供 TinyEngine 所需的 API 接口
- 支持 AI 聊天功能
- 支持 MCP (Model Context Protocol) 功能，可自动调用工具

## 安装

```bash
# 安装依赖
npm install
# 或者使用 pnpm
pnpm install
```

## 配置

复制 `.env.example` 文件为 `.env`，并根据需要修改配置：

```bash
cp .env.example .env
```

主要配置项：

- `OPENAI_API_KEY`: OpenAI API 密钥
- `OPENAI_API_BASE_URL`: OpenAI API 基础 URL
- `OPENAI_MODEL`: 使用的模型名称
- `ENABLE_MCP`: 是否启用 MCP 功能
- `MCP_SERVER_SCRIPT_PATH`: MCP 服务器脚本路径

## 运行

```bash
# 开发模式运行
npm run dev
# 或者使用 pnpm
pnpm dev
```

## 测试

```bash
# 测试 AI 聊天功能
npm run test:ai
# 或者使用 pnpm
pnpm test:ai

# 测试 AI MCP 功能
npm run test:ai-mcp
# 或者使用 pnpm
pnpm test:ai-mcp
```

## MCP 功能使用

MCP (Model Context Protocol) 是一种用于大模型上下文交互的协议，可以让大模型自动调用工具。在 TinyEngine 中，我们使用官方的 MCP SDK 实现了客户端功能，可以与任何符合 MCP 规范的服务器通信。

### 配置 MCP 服务器

1. 创建一个 MCP 服务器脚本，可以是 Python 或 JavaScript
2. 在 `.env` 文件中设置 `ENABLE_MCP=true` 和 `MCP_SERVER_SCRIPT_PATH=path/to/your/server.js`

### API 接口

- `/app-center/api/ai/chat`: AI 聊天接口，已支持 MCP 功能

### 请求示例

```javascript
// AI MCP 聊天请求示例
const requestData = {
  messages: [
    {
      role: 'system',
      content: '你是一个智能助手，可以帮助用户解决问题。你可以使用工具来完成任务。'
    },
    {
      role: 'user',
      content: '请帮我列出当前目录下的所有文件'
    }
  ]
}

// 发送请求
const response = await axios({
  method: 'post',
  url: 'http://localhost:9090/app-center/api/ai/chat',
  headers: {
    'Content-Type': 'application/json'
  },
  data: requestData
})
```

### 自定义工具

可以在 `src/services/ai.js` 文件中注册自定义工具：

```javascript
// 注册自定义工具示例
this.registerTool(
  {
    type: 'function',
    function: {
      name: 'custom_tool',
      description: '自定义工具描述',
      parameters: {
        type: 'object',
        properties: {
          param1: {
            type: 'string',
            description: '参数1描述'
          }
        },
        required: ['param1']
      }
    }
  },
  async (params) => {
    // 工具实现逻辑
    return { result: '工具执行结果' }
  }
)
```

### 创建 MCP 服务器

您可以使用官方的 MCP SDK 创建自己的 MCP 服务器。以下是一个简单的 Node.js 示例：

```javascript
const { Server } = require('@modelcontextprotocol/sdk')

// 创建服务器
const server = new Server()

// 定义工具
server.defineTool({
  name: 'get_weather',
  description: '获取指定位置的天气信息',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: '位置名称'
      }
    },
    required: ['location']
  },
  handler: async (params) => {
    const { location } = params
    // 这里可以实现获取天气的逻辑
    return {
      location,
      temperature: 25,
      condition: '晴天'
    }
  }
})

// 启动服务器
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`MCP 服务器已启动，监听端口 ${PORT}...`)
})
```

将此脚本保存为 `weather_server.js`，然后在 `.env` 文件中设置 `MCP_SERVER_SCRIPT_PATH=/path/to/weather_server.js`。

## 许可证

MIT
