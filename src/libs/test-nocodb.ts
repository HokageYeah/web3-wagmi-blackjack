// NocoDB 测试示例
import { nocoDBClient } from './nocodb';

// 测试函数
export async function testNocoDBOperations() {
  console.log('开始测试 NocoDB 操作...');

  try {
    // 1. 创建新记录
    console.log('1. 创建新记录...');
    const newRecord = await nocoDBClient.createRecord(100);
    console.log('创建成功:', newRecord);

    // 2. 获取所有记录
    console.log('2. 获取所有记录...');
    const allRecords = await nocoDBClient.getAllRecords();
    console.log('所有记录:', allRecords);

    // 3. 获取最新分数
    console.log('3. 获取最新分数...');
    const latestScore = await nocoDBClient.getLatestScore('');
    console.log('最新分数:', latestScore);

    // 4. 更新分数
    if (newRecord.id) {
      console.log('4. 更新分数...');
      const updatedRecord = await nocoDBClient.updateRecord(newRecord.id, 200);
      console.log('更新成功:', updatedRecord);
    }

    // 5. 保存分数（智能创建或更新）
    console.log('5. 保存分数...');
    const savedRecord = await nocoDBClient.saveScore(300);
    console.log('保存成功:', savedRecord);

    console.log('所有测试完成！');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 在浏览器控制台中运行测试
// testNocoDBOperations();