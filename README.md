This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-wagmi`](https://github.com/wevm/wagmi/tree/main/packages/create-wagmi).


### 项目简介

这是一个基于 Next.js、wagmi、RainbowKit 与 NocoDB 的 Web3 BlackJack（21 点）小游戏示例。项目包含两部分：
- `web3-wagmi-blackjack`：Next.js 14 App Router 前端与内置 API（游戏逻辑 + 钱包签名登录 + 分数持久化调用）。
- `lambda-function`：独立的边缘函数示例（只读 NocoDB 记录，带 CORS 与简易 API Key 校验）。

### 项目结构

```
web3-wagmi-blackjack/        # Next.js DApp（主应用）
  ├─ src/app/api/route.ts    # 游戏后端 API（签名鉴权 / 发牌 / 结算 / 分数持久化）
  ├─ src/app/page.tsx        # 黑杰克页面（连接钱包、签名、游戏操作）
  ├─ src/libs/nocodb.ts      # NocoDB 客户端（读/写/更新分数记录）
  ├─ src/wagmi.ts            # wagmi & WalletConnect 配置
  ├─ NOCODB_USAGE.md         # 早期 NocoDB 使用说明（部分与现实现不一致，仅供参考）
  └─ package.json            # 项目依赖与脚本

lambda-function/
  └─ api/nocodb-api.js       # 边缘函数：读取 NocoDB 记录（带 CORS 与 API Key）
```

### 功能特性
- **钱包连接与签名登录**：使用 RainbowKit + wagmi；EIP-191 签名后由后端签发 JWT。
- **黑杰克游戏逻辑**：发牌、Hit/Stand、结算。
- **分数持久化**：使用 NocoDB 持久化记录玩家分数，并在新局开始时加载最新分数。
- **可选边缘函数**：演示如何在独立函数中按地址读取 NocoDB 记录（带 CORS 与 API Key 校验）。

## 快速开始（Next.js DApp）

### 先决条件
- Node.js 18+
- pnpm（或使用 npm/yarn 亦可）

### 环境变量
在 `web3-wagmi-blackjack` 目录创建 `.env.local`：

```bash
# WalletConnect（用于 RainbowKit 的 WalletConnect 连接器）
NEXT_PUBLIC_WC_PROJECT_ID=你的_walletconnect_project_id

# 后端签发 JWT 的密钥（务必设置为强随机值）
JWT_SECRET=请替换为安全的随机字符串

# NocoDB 接入（用于后端读写分数）
NOCODB_API_TOKEN=你的_nocodb_api_token
NOCODB_BASE_URL=https://app.nocodb.com
# 若你的表名不同，可将客户端代码中的默认表名替换（参见 src/libs/nocodb.ts）
```

注意：`src/libs/nocodb.ts` 默认表名为 `m9tzsugscwperp5`，如与你的 NocoDB 表不一致，请修改该文件中的 `tableName` 或扩展为读取环境变量。

### 安装与运行

```bash
cd web3-wagmi-blackjack
pnpm install
pnpm dev
```

启动后访问 `http://localhost:3000`：
- 点击页面中的 Connect 连接钱包
- 点击 Sign 按钮进行信息签名（后端会校验并返回 JWT）
- 点击 Hit / Stand 进行游戏；每局结束会自动保存分数到 NocoDB

## API 说明（Next.js 内置 `/api`）

- **GET `/api?address=<EVM_Address>`**：开始新局（重置状态），并从 NocoDB 载入该地址的最新分数。
- **POST `/api`**：带 JSON Body 与（除 `auth` 外）鉴权头：
  - Body：
    - `{"action":"auth","address","message","signature"}` 用于签名验证。验证成功返回 `{ jsonwebtoken }`。
    - `{"action":"hit","address"}` / `{"action":"stand","address"}` 进行操作。
  - Headers：`bearer: Bearer <JWT>`（`hit/stand` 时必填；`auth` 不需要）。

返回示例（简化）：
```json
{
  "playerHand": [{"rank":"K","suit":"♠️"}, ...],
  "dealerHand": [{"rank":"Q","suit":"♦️"}, {"rank":"?","suit":"?"}],
  "message": "Player wins!",
  "score": 100
}
```

## NocoDB 集成
- 客户端封装位于 `src/libs/nocodb.ts`：
  - `getAllRecords(address)`：拉取表记录并按 `player` 过滤
  - `getLatestScore(address)`：按 `CreatedAt` 降序取最新分数
  - `saveScore(score, address)`：若无记录则创建，有记录则更新最新记录
- 数据结构：
  - `Id?: number; score: number; player: string; CreatedAt?: string; UpdatedAt?: string;`

请为 NocoDB API Token 授予对应表的读写权限。

## 独立边缘函数（lambda-function）
`lambda-function/api/nocodb-api.js` 为演示性质的只读 API：
- 运行时：Edge（示例中使用了 `export const config = { runtime: 'edge' }`）
- CORS：允许 `GET, OPTIONS`，`Access-Control-Allow-Origin: *`
- 鉴权：需在请求头携带 `api-key` 与代码中的 `API_KEY` 常量匹配（生产环境请改为使用环境变量并移除硬编码）。
- 环境变量（建议）：
  - `NOCODB_BASE_URL`
  - `NOCODB_API_TOKEN`
  - `NOCODB_TABLE_NAME`（默认 `m9tzsugscwperp5`）

示例请求：
```bash
curl -H "api-key: <你的_api_key>" \
  "https://<你的边缘函数域名>/api/nocodb-api?address=0xYourAddress"
```

响应：
```json
{ "records": [ { "Id": 1, "score": 200, "player": "0x..." } ] }
```

## 安全与注意事项
- 不要在代码中硬编码敏感信息（如 API Token、API Key）。请改为使用环境变量，并在部署平台配置。
- 生产环境请将 CORS 的 `Access-Control-Allow-Origin` 从 `*` 收紧到你的前端域名。
- `JWT_SECRET` 必须是安全的随机值，并妥善保管。
- 目前仓库中的 `NOCODB_USAGE.md` 与 `src/libs/scoreApi.ts` 中的 `/api/score` 属于早期示例/占位，未在当前路由实现，请以本文档与 `src/app/api/route.ts` 为准。

## 常见问题
- 钱包无法连接：确认 `NEXT_PUBLIC_WC_PROJECT_ID` 已配置，并检查网络（默认支持 `mainnet` 与 `sepolia`，见 `src/wagmi.ts`）。
- 分数未能保存：检查服务端日志与 `NOCODB_API_TOKEN` 权限是否包含读写；确认表名与字段匹配。
- 401 或签名失败：确保 `auth` 后拿到的 JWT 被以 `bearer: Bearer <token>` 形式传入 `hit/stand` 请求。

## 许可
示例项目，仅供学习与演示使用。