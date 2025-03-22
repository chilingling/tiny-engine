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

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { getResponseData } from '../tool/Common';
import path from 'path';
import fs from 'fs-extra';

/**
 * MCP 客户端服务
 * 基于官方 MCP SDK 实现，用于与 MCP 服务器通信
 */
export default class MCPClient {
  constructor() {
    this.transport = null;
    this.serverProcess = null;
    this.availableTools = [];
    this.isConnected = false;
    this.serverScriptPath = process.env.MCP_SERVER_SCRIPT_PATH || '';
    this.client = new Client({
      name: 'tiny-engine-mcp-client',
      version: '1.0.0'
    });
  }

  /**
   * 连接到 MCP 服务器
   * @param {string} serverScriptPath 服务器脚本路径
   * @returns {Promise<boolean>} 连接是否成功
   */
  async connect(serverScriptPath = this.serverScriptPath) {
    if (this.isConnected) {
      console.log('已连接到 MCP 服务器');
      return true;
    }

    try {
      if (!serverScriptPath) {
        throw new Error('未指定 MCP 服务器脚本路径');
      }

      // 检查服务器脚本是否存在
      if (!fs.existsSync(serverScriptPath)) {
        throw new Error(`MCP 服务器脚本不存在: ${serverScriptPath}`);
      }

      // 确定脚本类型
      const isPython = serverScriptPath.endsWith('.py');
      const isJS = serverScriptPath.endsWith('.js');

      if (!isPython && !isJS) {
        throw new Error('MCP 服务器脚本必须是 .py 或 .js 文件');
      }

      // 创建 StdioClientTransport
      const command = isPython ? 'python' : 'node';
      const args = [serverScriptPath];

      console.log(`启动 MCP 服务器: ${command} ${args.join(' ')}`);

      // 创建传输层
      this.transport = new StdioClientTransport({
        command,
        args
      });

      // 连接客户端到传输层
      await this.client.connect(this.transport);

      // 获取可用工具
      const toolsResponse = await this.client.listTools();
      this.availableTools = toolsResponse.tools;

      console.log('已连接到 MCP 服务器，可用工具:', this.availableTools.map(tool => tool.name));

      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('连接 MCP 服务器失败:', error);
      this.isConnected = false;

      // 确保在连接失败时清理资源
      // if (this.transport) {
      //   try {
      //     await this.transport.close();
      //     this.transport = null;
      //   } catch (closeError) {
      //     console.error('关闭传输层失败:', closeError);
      //   }
      // }

      return false;
    }
  }

  /**
   * 调用工具
   * @param {string} toolName 工具名称
   * @param {Object} toolArgs 工具参数
   * @returns {Promise<Object>} 工具执行结果
   */
  async callTool(toolName, toolArgs) {
    if (!this.isConnected) {
      await this.connect();
      if (!this.isConnected) {
        throw new Error('未连接到 MCP 服务器');
      }
    }

    try {
      console.log(`调用工具: ${toolName}，参数:`, toolArgs);

      // 调用工具
      const result = await this.client.callTool({
        name: toolName,
        arguments: toolArgs
      });

      console.log(`工具 ${toolName} 执行结果:`, result);

      return result;
    } catch (error) {
      console.error(`调用工具 ${toolName} 失败:`, error);
      throw error;
    }
  }

  /**
   * 处理工具调用
   * @param {Array} toolCalls 工具调用列表
   * @returns {Promise<Array>} 工具执行结果列表
   */
  async processToolCalls(toolCalls) {
    const results = [];

    for (const toolCall of toolCalls) {
      try {
        const { name, arguments: argsString } = toolCall.function;
        const args = JSON.parse(argsString);

        // 调用工具
        const result = await this.callTool(name, args);

        // 添加结果
        results.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: typeof result.content === 'object'
            ? JSON.stringify(result.content)
            : result.content
        });
      } catch (error) {
        console.error('处理工具调用失败:', error);
        results.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: JSON.stringify({ error: error.message })
        });
      }
    }

    return results;
  }

  /**
   * 获取可用工具列表
   * @returns {Array} 可用工具列表
   */
  getAvailableTools() {
    return this.availableTools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }
    }));
  }

  /**
   * 关闭连接
   */
  // async close() {
  //   if (this.isConnected && this.transport) {
  //     try {
  //       await this.client.disconnect();
  //       await this.transport.close();
  //       this.transport = null;
  //       this.isConnected = false;
  //       console.log('已关闭 MCP 服务器连接');
  //     } catch (error) {
  //       console.error('关闭 MCP 服务器连接失败:', error);
  //     }
  //   }
  // }

  /**
   * 添加标准的析构方法，确保资源在对象销毁时被释放
   */
  // async destroy() {
  //   await this.close();
  // }
}
