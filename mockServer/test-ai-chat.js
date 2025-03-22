/**
 * AI 聊天功能测试脚本
 *
 * 使用方法：
 * 1. 确保已经配置了 .env 文件中的 OPENAI_API_KEY
 * 2. 运行命令：node test-ai-chat.js
 */

const axios = require('axios');

// 测试消息
const messages = [
  {
    role: 'system',
    content: '你是一个有用的助手。'
  },
  {
    role: 'user',
    content: '请简单介绍一下 TinyEngine 低代码引擎。'
  }
];

// 发送请求
async function testAiChat() {
  try {
    console.log('发送测试请求到 AI 聊天接口...');

    const response = await axios({
      method: 'post',
      url: 'http://localhost:9090/app-center/api/ai/chat',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        messages
      }
    });

    console.log('请求成功！响应数据：');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.data && response.data.data.choices && response.data.data.choices.length > 0) {
      console.log('\n大模型回复：');
      console.log(response.data.data.choices[0].message.content);
    }
  } catch (error) {
    console.error('请求失败：', error.message);
    if (error.response) {
      console.error('错误详情：', error.response.data);
    }
  }
}

// 执行测试
testAiChat();
