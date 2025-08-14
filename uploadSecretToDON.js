/**
 * uploadSecretToDON.js - Chainlink Functions 密钥上传脚本
 * 
 * 📋 主要功能：
 * 这个脚本用于将敏感信息（如API密钥）安全地上传到 Chainlink DON（去中心化Oracle网络）
 * 上传后，智能合约可以在执行 Chainlink Functions 时安全地访问这些密钥
 * 
 * 🔄 业务流程：
 * 1. 环境变量验证 → 2. 网络连接测试 → 3. 创建签名器 → 4. 初始化密钥管理器 
 * → 5. 加密密钥 → 6. 上传到DON → 7. 保存配置信息
 * 
 * 💡 使用场景：
 * - 在智能合约中调用外部API但需要API密钥时
 * - 保护敏感信息不在链上明文存储
 * - 为 Chainlink Functions 提供安全的密钥访问机制
 */

// 导入必需的依赖包
import { SecretsManager } from "@chainlink/functions-toolkit";  // Chainlink 密钥管理工具
import { ethers } from "ethers";  // 以太坊JavaScript库，用于区块链交互
import dotenv from "dotenv";      // 环境变量加载工具
import fs from "fs";              // Node.js 文件系统模块

// 加载环境变量配置文件
dotenv.config({path: "./.env.local"});

/**
 * 主要业务逻辑函数：上传密钥到 Chainlink DON
 * 
 * 🎯 目标：将API密钥安全地上传到去中心化Oracle网络
 * 📊 返回：上传成功后的版本号和配置信息
 */
const makeRequestSepolia = async () => {
  // 🔍 步骤1：环境变量验证和检查
  // 定义所有必需的环境变量
  const requiredEnvVars = {
    ETHEREUM_PROVIDER_AVALANCHEFUJI: process.env.ETHEREUM_PROVIDER_AVALANCHEFUJI,  // Avalanche Fuji 测试网RPC地址
    NOCODB_API_KEY: process.env.NOCODB_API_KEY,                                    // NocoDB数据库API密钥
    EVM_PRIVATE_KEY: process.env.EVM_PRIVATE_KEY                                   // 钱包私钥，用于签名交易
  };

  // 遍历检查每个环境变量是否存在
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      // 如果缺少任何必需的环境变量，输出详细的错误信息和解决方案
      console.error(`❌ ${key} not provided - check your environment variables`);
      console.log("Please create a .env.local file with the following variables:");
      console.log("ETHEREUM_PROVIDER_AVALANCHEFUJI=https://api.avax-test.network/ext/bc/C/rpc");
      console.log("EVM_PRIVATE_KEY=your_private_key_here");
      console.log("NOCODB_API_KEY=your_nocodb_api_key_here");
      throw new Error(`${key} not provided`);
    }
  }

  // 🌐 步骤2：网络配置 - 设置Avalanche Fuji测试网参数
  const routerAddress = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";  // Chainlink Functions路由器合约地址
  const donId = "fun-avalanche-fuji-1";                                 // DON标识符，指定目标Oracle网络
  const rpcUrl = process.env.ETHEREUM_PROVIDER_AVALANCHEFUJI;           // 区块链RPC节点URL

  console.log(`🔗 Using RPC URL: ${rpcUrl}`);

  // 🔍 步骤3：网络连接测试
  console.log("🔍 Testing network connection...");
  // 创建区块链提供者，用于与网络通信
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  
  try {
    // 获取网络信息以验证连接
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network: ${network.name} (chainId: ${network.chainId})`);
    
    // 验证是否连接到正确的网络（Avalanche Fuji chainId: 43113）
    if (network.chainId !== 43113) {
      console.warn(`⚠️  Warning: Expected Avalanche Fuji (chainId: 43113), but got chainId: ${network.chainId}`);
    }
  } catch (error) {
    // 网络连接失败时的错误处理和解决建议
    console.error("❌ Network connection failed:", error.message);
    console.log("💡 Try using a different RPC URL:");
    console.log("   - https://api.avax-test.network/ext/bc/C/rpc");
    console.log("   - https://rpc.ankr.com/avalanche_fuji");
    console.log("   - Get a free RPC from Alchemy or Infura");
    throw error;
  }

  // 🌐 步骤4：DON网关配置
  // Chainlink Functions测试网网关URL列表，用于上传加密密钥
  const gatewayUrls = [
    "https://01.functions-gateway.testnet.chain.link/",
    "https://02.functions-gateway.testnet.chain.link/",
  ];
  const slotIdNumber = 0;                    // 密钥存储插槽ID（0表示第一个插槽）
  const expirationTimeMinutes = 1440;       // 密钥过期时间（分钟）- 1440分钟 = 24小时

  // 📦 步骤5：准备要加密的密钥数据
  // 将需要保护的API密钥封装成对象
  const secrets = { apiKey: process.env.NOCODB_API_KEY };

  // 🔐 步骤6：创建区块链签名器
  // 从私钥创建钱包实例，用于签名交易
  const privateKey = process.env.EVM_PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey);
  const signer = wallet.connect(provider);  // 将钱包连接到区块链提供者
  
  console.log(`🔑 Using wallet address: ${await signer.getAddress()}`);

  //////// 🚀 核心业务逻辑开始 ////////

  console.log("\n📤 Uploading secrets to DON...");

  // 🔧 步骤7：初始化Chainlink密钥管理器
  // 创建SecretsManager实例，负责加密和上传密钥
  const secretsManager = new SecretsManager({
    signer: signer,                          // 用于签名的钱包
    functionsRouterAddress: routerAddress,   // Functions路由器合约地址
    donId: donId,                           // 目标DON标识符
  });
  
  try {
    // 初始化密钥管理器，建立与DON的连接
    await secretsManager.initialize();
    console.log("✅ SecretsManager initialized successfully");
  } catch (error) {
    // 初始化失败时的详细错误处理
    console.error("❌ Failed to initialize SecretsManager:", error.message);
    console.log("💡 Possible solutions:");
    console.log("   1. Check if the router address is correct for your network");
    console.log("   2. Ensure your RPC URL is working and accessible");
    console.log("   3. Verify you have a stable internet connection");
    throw error;
  }

  // 🔐 步骤8：加密密钥数据
  console.log("🔐 Encrypting secrets...");
  // 使用DON的公钥加密密钥，确保只有DON节点能解密
  const encryptedSecretsObj = await secretsManager.encryptSecrets(secrets);

  console.log(
    `📡 Uploading encrypted secrets to gateways. SlotId: ${slotIdNumber}, Expiration: ${expirationTimeMinutes} minutes`
  );

  // 📤 步骤9：上传加密密钥到DON网关
  // 将加密后的密钥上传到多个DON网关以确保可用性
  const uploadResult = await secretsManager.uploadEncryptedSecretsToDON({
    encryptedSecretsHexstring: encryptedSecretsObj.encryptedSecrets,  // 加密后的密钥数据（十六进制格式）
    gatewayUrls: gatewayUrls,                                        // 目标网关URL列表
    slotId: slotIdNumber,                                            // 存储插槽ID
    minutesUntilExpiration: expirationTimeMinutes,                   // 过期时间（分钟）
  });

  // 检查上传结果
  if (!uploadResult.success) {
    console.error(`❌ Failed to upload secrets to ${gatewayUrls}`);
    throw new Error(`Encrypted secrets not uploaded to ${gatewayUrls}`);
  }

  console.log(`✅ Secrets uploaded successfully!`);
  console.log("📊 Upload result:", uploadResult);

  // 📝 步骤10：解析并保存配置信息
  // 获取上传后的版本号，这个版本号将在智能合约中使用
  const donHostedSecretsVersion = parseInt(uploadResult.version);

  // 创建配置信息对象，包含智能合约所需的所有参数
  const configInfo = {
    donHostedSecretsVersion: donHostedSecretsVersion.toString(),  // DON密钥版本号
    slotId: slotIdNumber.toString(),                              // 插槽ID
    expirationTimeMinutes: expirationTimeMinutes.toString(),     // 过期时间
    uploadedAt: new Date().toISOString()                         // 上传时间戳
  };

  // 💾 将配置信息保存到本地文件，供后续使用
  fs.writeFileSync(
    "donSecretsInfo.txt",
    JSON.stringify(configInfo, null, 2)
  );

  // 🎉 步骤11：输出成功信息和后续操作指南
  console.log(`\n🎉 Success! Configuration saved to donSecretsInfo.txt`);
  console.log(`📋 DON Hosted Secrets Version: ${donHostedSecretsVersion}`);
  console.log(`📋 Slot ID: ${slotIdNumber}`);
  console.log("\n🔧 Next steps:");
  console.log(`   1. Deploy your contract`);
  console.log(`   2. Call setDonHostSecretConfig(${slotIdNumber}, ${donHostedSecretsVersion}, YOUR_SUBSCRIPTION_ID)`);
  console.log(`   3. Then you can call sendRequest()`);
};

/**
 * 🚀 脚本执行入口点
 * 
 * 执行主函数并处理可能的错误
 * 如果发生错误，输出错误信息并退出进程
 */
makeRequestSepolia().catch(e => {
  console.error(e);     // 输出详细错误信息
  process.exit(1);      // 以错误状态码退出进程
});