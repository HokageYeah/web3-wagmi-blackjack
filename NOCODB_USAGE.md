# NocoDB 集成使用说明

## 概述
这个项目已经集成了 NocoDB 来持久化存储 BlackJack 游戏的分数。分数会自动保存到你的 NocoDB `blackJack` 表中。

## 配置
确保 `.env.local` 文件中包含以下配置：
```
NOCODB_API_TOKEN=2kbhw9qrrMgng-mlB84te6ZXriQQmLgxpAt2bwUp
NOCODB_BASE_URL=https://app.nocodb.com
```

## 主要功能

### 1. 自动分数持久化
- 游戏开始时会自动从 NocoDB 加载最新分数
- 每次游戏结束时会自动保存分数到 NocoDB

### 2. API 端点

#### 游戏 API (`/api`)
- `GET /api` - 开始新游戏，自动加载分数
- `POST /api` - 游戏操作（hit/stand），自动保存分数

#### 分数管理 API (`/api/score`)
- `GET /api/score` - 获取当前分数
- `POST /api/score` - 保存分数
- `PUT /api/score` - 更新指定ID的分数

### 3. 使用示例

#### 后端使用（服务器端）
```typescript
import { nocoDBClient } from '@/lib/nocodb';

// 获取最新分数
const score = await nocoDBClient.getLatestScore();

// 保存分数
await nocoDBClient.saveScore(100);

// 获取所有记录
const records = await nocoDBClient.getAllRecords();

// 创建新记录
const newRecord = await nocoDBClient.createRecord(200);

// 更新记录
await nocoDBClient.updateRecord(1, 300);
```

#### 前端使用（客户端）
```typescript
import { scoreAPI } from '@/lib/scoreApi';

// 获取当前分数
const score = await scoreAPI.getCurrentScore();

// 保存分数
const success = await scoreAPI.saveScore(100);

// 更新分数
const updated = await scoreAPI.updateScore(1, 200);
```

### 4. 数据结构
NocoDB 表 `blackJack` 包含以下字段：
- `id` - 自动生成的主键
- `score` - 分数（数字类型）
- `created_at` - 创建时间（自动生成）
- `updated_at` - 更新时间（自动生成）

### 5. 测试
运行测试来验证 NocoDB 连接：
```typescript
import { testNocoDBOperations } from '@/lib/test-nocodb';
await testNocoDBOperations();
```

## 注意事项
1. 确保你的 NocoDB 表名为 `blackJack`
2. 确保 API Token 有正确的读写权限
3. 网络连接问题会导致分数保存失败，但不会影响游戏进行
4. 分数会在每次游戏结束时自动保存，无需手动操作