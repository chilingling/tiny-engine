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

const axios = require('axios')
require('dotenv').config()

/**
 * 测试 AI 服务的 MCP 功能
 */
async function testAiMCP() {
  try {
    console.log('开始测试 AI 服务的 MCP 功能...')

    // 构建请求参数
    const requestData = {
      messages: [
        {
          role: 'system',
          content: '你是一个智能助手，可以帮助用户解决问题。你可以使用工具来完成任务。'
        },
        {
          role: 'user',
          content: '请告诉我北京的天气情况'
        }
      ]
    }

    console.log('发送请求:', JSON.stringify(requestData, null, 2))

    // 发送请求
    const response = await axios({
      method: 'post',
      url: 'http://localhost:9090/app-center/api/ai/chat',
      headers: {
        'Content-Type': 'application/json'
      },
      data: requestData
    })

    console.log('响应结果:', JSON.stringify(response.data, null, 2))

    // 测试天气预报
    const forecastRequestData = {
      messages: [
        {
          role: 'system',
          content: '你是一个智能助手，可以帮助用户解决问题。你可以使用工具来完成任务。'
        },
        {
          role: 'user',
          content: '请告诉我上海未来5天的天气预报'
        }
      ]
    }

    console.log('发送天气预报请求:', JSON.stringify(forecastRequestData, null, 2))

    // 发送请求
    const forecastResponse = await axios({
      method: 'post',
      url: 'http://localhost:9090/app-center/api/ai/chat',
      headers: {
        'Content-Type': 'application/json'
      },
      data: forecastRequestData
    })

    console.log('天气预报响应结果:', JSON.stringify(forecastResponse.data, null, 2))
  } catch (error) {
    console.error('测试失败:', error.message)
    if (error.response) {
      console.error('响应数据:', error.response.data)
    }
  }
}

// 执行测试
testAiMCP()
