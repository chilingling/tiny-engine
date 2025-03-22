# MCP 天气服务器示例

这是一个使用 Model Context Protocol (MCP) 实现的简单天气服务器示例。该示例展示了如何使用 Node.js 创建一个 MCP 服务器，并定义工具供大模型调用。

## 功能介绍

该示例实现了两个工具：

1. `get_weather` - 获取指定位置的当前天气信息
2. `get_weather_forecast` - 获取指定位置的天气预报

## 安装依赖

确保已安装 Node.js (>= 16) 和 npm (>= 6)，然后在项目根目录执行：

```bash
npm install
# 或者使用 pnpm
pnpm install
```

## 运行服务器

执行以下命令启动 MCP 天气服务器：

```bash
node examples/weather_server.js
```

服务器默认在 3000 端口启动。

## 测试服务器

可以使用提供的测试脚本来测试服务器功能：

```bash
node examples/test_weather_server.js
```

测试脚本会发送两个请求：
1. 查询北京的当前天气
2. 查询上海未来 5 天的天气预报

## 服务器 API

### 获取天气信息

工具名称：`get_weather`

参数：
- `location` (string): 位置名称，如"北京"、"上海"等

返回值：
```json
{
  "location": "北京",
  "temperature": 25,
  "condition": "晴天"
}
```

如果未找到指定位置的天气信息，则返回：
```json
{
  "location": "未知位置",
  "error": "未找到该位置的天气信息"
}
```

### 获取天气预报

工具名称：`get_weather_forecast`

参数：
- `location` (string): 位置名称，如"北京"、"上海"等
- `days` (integer, 可选): 预报天数，默认为 3，最大为 7

返回值：
```json
{
  "location": "上海",
  "days": 5,
  "forecasts": [
    {
      "day": 1,
      "temperature": 27,
      "condition": "多云"
    },
    {
      "day": 2,
      "temperature": 29,
      "condition": "晴天"
    },
    // ...更多天气预报
  ]
}
```

## 注意事项

- 本示例使用模拟数据，实际应用中可以替换为真实的天气 API
- 服务器默认监听 3000 端口，可以通过环境变量 `PORT` 修改
- 示例中只包含了几个城市的数据，如需扩展可以修改 `weatherData` 对象
