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
 * 测试 MCP 天气服务器
 */

const axios = require('axios')

/**
 * 测试天气服务器
 */
async function testWeatherServer() {
  try {
    console.log('开始测试 MCP 天气服务器...')

    // 测试获取天气信息
    const weatherRequestData = {
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

    console.log('发送天气查询请求:', JSON.stringify(weatherRequestData, null, 2))

    // 发送请求 (假设服务器运行在本地 3000 端口)
    const weatherResponse = await axios({
      method: 'post',
      url: 'http://localhost:3000/chat',
      headers: {
        'Content-Type': 'application/json'
      },
      data: weatherRequestData
    })

    console.log('天气查询响应结果:', JSON.stringify(weatherResponse.data, null, 2))

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
      url: 'http://localhost:3000/chat',
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
testWeatherServer()
