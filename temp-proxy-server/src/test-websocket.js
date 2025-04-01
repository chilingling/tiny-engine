// WebSocket客户端测试脚本
import WebSocket from 'ws';

// 连接到WebSocket服务器
const ws = new WebSocket('ws://localhost:4060');

// 连接建立时
ws.on('open', () => {
  console.log('已连接到WebSocket服务器');
  
  // 发送ping消息
  ws.send(JSON.stringify({
    type: 'ping'
  }));
  
  // 发送聊天消息示例
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'chat',
      messages: [
        {
          role: 'user',
          content: '你好，这是一个测试消息'
        }
      ]
    }));
  }, 1000);
});

// 接收消息
ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('收到服务器消息:', message);
    
    // 如果收到聊天响应，关闭连接
    if (message.type === 'chat_response') {
      console.log('测试完成，关闭连接');
      setTimeout(() => ws.close(), 1000);
    }
  } catch (error) {
    console.error('解析消息出错:', error);
  }
});

// 处理错误
ws.on('error', (error) => {
  console.error('WebSocket连接错误:', error);
});

// 连接关闭
ws.on('close', () => {
  console.log('WebSocket连接已关闭');
  process.exit(0);
}); 