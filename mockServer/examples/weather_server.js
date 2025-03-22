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

/**
 * 一个简单的 MCP 天气服务器示例
 */

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

    // 这里可以实现获取天气的逻辑，这里使用模拟数据
    const weatherData = {
      '北京': { temperature: 25, condition: '晴天' },
      '上海': { temperature: 28, condition: '多云' },
      '广州': { temperature: 30, condition: '雨天' },
      '深圳': { temperature: 29, condition: '多云' },
      '杭州': { temperature: 26, condition: '晴天' }
    }

    if (location in weatherData) {
      return {
        location,
        temperature: weatherData[location].temperature,
        condition: weatherData[location].condition
      }
    } else {
      return {
        location,
        error: '未找到该位置的天气信息'
      }
    }
  }
})

server.defineTool({
  name: 'get_weather_forecast',
  description: '获取指定位置的天气预报',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: '位置名称'
      },
      days: {
        type: 'integer',
        description: '预报天数',
        default: 3
      }
    },
    required: ['location']
  },
  handler: async (params) => {
    const { location, days = 3 } = params

    // 限制最多预报 7 天
    const forecastDays = days > 7 ? 7 : days

    const forecasts = []
    const baseTemp = {
      '北京': 25,
      '上海': 28,
      '广州': 30,
      '深圳': 29,
      '杭州': 26
    }[location] || 25

    const conditions = ['晴天', '多云', '阴天', '小雨', '中雨']

    for (let i = 0; i < forecastDays; i++) {
      const tempChange = Math.floor(Math.random() * 7) - 3 // -3 到 3 之间的随机数
      const conditionIndex = Math.floor(Math.random() * conditions.length)

      forecasts.push({
        day: i + 1,
        temperature: baseTemp + tempChange,
        condition: conditions[conditionIndex]
      })
    }

    return {
      location,
      days: forecastDays,
      forecasts
    }
  }
})

// 启动服务器
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`启动 MCP 天气服务器，监听端口 ${PORT}...`)
})

// 处理进程退出
process.on('SIGINT', () => {
  console.log('关闭 MCP 天气服务器...')
  server.close()
  process.exit(0)
})
