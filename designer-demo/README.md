# 设计器 Demo for OpenTiny Official site

## 使用 usage

### 启动

```bash
pnpm i
pnpm serve:frontend
```

### 构建

```bash
pnpm i
pnpm build:plugin
pnpm build:alpha
```

## 修改说明 

### 数据 Mock

**请求拦截**

使用 `axios-mock-adapter`

```javascript
// http 是 axios 实例
mock = new AxiosMockAdapter(http)
// 不拦截 bundle.json 请求
mock.onGet('/mock/bundle.json').passThrough()

// 拦截剩余的请求
mock.onAny().reply((config) => {
  // ...
})
```

**本地数据存储**

使用 `Dexie` 连接 浏览器 IndexDB，将数据存储到 indexDB

```javascript
// 创建实例
export const db = new Dexie('tiny-engine-demo-indexdb')

// 声明数据库表
export const createDB = async () => {
  return db.version(1).stores({
    ...schema
  })
}
```

