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
 * 测试 MCP 聊天功能
 */
async function testMCPChat() {
  try {
    console.log('开始测试 MCP 聊天功能...')

    // 构建请求参数
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

    console.log('发送请求:', JSON.stringify(requestData, null, 2))

    // 发送请求
    const response = await axios({
      method: 'post',
      url: 'http://localhost:9090/app-center/api/ai/mcp-chat',
      headers: {
        'Content-Type': 'application/json'
      },
      data: requestData
    })

    console.log('响应结果:', JSON.stringify(response.data, null, 2))
  } catch (error) {
    console.error('测试失败:', error.message)
    if (error.response) {
      console.error('响应数据:', error.response.data)
    }
  }
}

// 执行测试
testMCPChat()
