/**
 * WebSocket测试客户端
 * 用于测试与tiny-engine-mcp-demo的WebSocket连接
 */

const WS_URL = 'ws://localhost:4090';
let ws = null;

// 发送WebSocket消息
function sendMessage(msgType, content) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const message = {
      type: msgType,
      content,
      timestamp: Date.now()
    };
    ws.send(JSON.stringify(message));
    return true;
  } else {
    return false;
  }
}

// 发送AI聊天消息
function sendChatMessage(content, model = 'gpt-3.5-turbo', token = '') {
  return sendMessage('chat', { 
    query: content, 
    model: model,
    token: token
  });
}

// 初始化WebSocket连接
function initWebSocket() {
  if (ws) {
    ws.close();
  }
  
  ws = new WebSocket(WS_URL);
  
  ws.onopen = () => {
    // 发送初始化消息
    sendMessage('ping', { timestamp: Date.now() });
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // 根据消息类型处理不同的响应
      switch(data.type) {
        case 'pong':
          // 收到pong响应
          break;
        case 'welcome':
          // 收到欢迎消息
          break;
        case 'chat_response':
          // 收到AI聊天响应
          break;
        default:
          // 未知的消息类型
      }
    } catch (error) {
      // 处理消息解析错误
    }
  };
  
  ws.onerror = () => {
    // WebSocket错误
  };
  
  ws.onclose = () => {
    // WebSocket连接已关闭
    setTimeout(() => {
      if (!ws || ws.readyState === WebSocket.CLOSED) {
        initWebSocket();
      }
    }, 3000);
  };
}

// 暴露全局函数供浏览器控制台使用
window.wsTest = {
  init: initWebSocket,
  send: sendMessage,
  sendChat: sendChatMessage
};

// 自动初始化
initWebSocket(); 