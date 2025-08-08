// NocoDB 客户端库
export interface BlackJackRecord {
  id?: number;
  score: number;
  created_at?: string;
  updated_at?: string;
}

export class NocoDBClient {
  private baseUrl: string;
  private apiToken: string;
  private tableName: string;

  constructor() {
    this.baseUrl = process.env.NOCODB_BASE_URL || 'https://app.nocodb.com';
    this.apiToken = process.env.NOCODB_API_TOKEN || '';
    this.tableName = 'm9tzsugscwperp5';
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'xc-token': this.apiToken,
    };
  }

  // 读取所有记录
  async getAllRecords(): Promise<BlackJackRecord[]> {
    try {
      const reqUrl =  `${this.baseUrl}/api/v2/tables/${this.tableName}/records?limit=100`;
      console.log('getAllRecords---reqUrl', reqUrl)
      const response = await fetch(reqUrl, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.list || [];
    } catch (error) {
      console.error('获取记录失败:', error);
      throw error;
    }
  }

  // 根据ID读取单个记录
  async getRecordById(id: number): Promise<BlackJackRecord | null> {
    try {
      const reqUrl =  `${this.baseUrl}/api/v2/tables/${this.tableName}/records/${id}`;
      console.log('getRecordById---reqUrl', reqUrl)
      const response = await fetch(reqUrl, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('获取记录失败:', error);
      throw error;
    }
  }

  // 创建新记录
  async createRecord(score: number): Promise<BlackJackRecord> {
    try {
      const reqUrl =  `${this.baseUrl}/api/v2/tables/${this.tableName}/records`;
      console.log('createRecord---reqUrl', reqUrl, score)
      const response = await fetch(reqUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          score: score,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('创建记录失败:', error);
      throw error;
    }
  }

  // 更新记录
  async updateRecord(id: number, score: number): Promise<BlackJackRecord> {
    try {
      const reqUrl =  `${this.baseUrl}/api/v2/tables/${this.tableName}/records/${id}`;
      console.log('updateRecord---reqUrl', reqUrl)
      const response = await fetch(reqUrl, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({
          score: score,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('更新记录失败:', error);
      throw error;
    }
  }

  // 删除记录
  async deleteRecord(id: number): Promise<boolean> {
    try {
      const reqUrl =  `${this.baseUrl}/api/v2/tables/${this.tableName}/records/${id}`;
      console.log('deleteRecord---reqUrl', reqUrl)
      const response = await fetch(reqUrl, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('删除记录失败:', error);
      throw error;
    }
  }

  // 获取最新的分数记录
  async getLatestScore(): Promise<number> {
    try {
      const records = await this.getAllRecords();
      if (records.length === 0) {
        return 0;
      }
      
      // 按创建时间排序，获取最新记录
      const sortedRecords = records.sort((a, b) => {
        const dateA = new Date(a.created_at || '').getTime();
        const dateB = new Date(b.created_at || '').getTime();
        return dateB - dateA;
      });
      console.log('sortedRecords----', sortedRecords)
      return sortedRecords[0].score;
    } catch (error) {
      console.error('获取最新分数失败:', error);
      return 0;
    }
  }

  // 保存当前分数（如果没有记录则创建，否则更新最新记录）
  async saveScore(score: number): Promise<BlackJackRecord> {
    try {
      const records = await this.getAllRecords();
      
      if (records.length === 0) {
        // 没有记录，创建新记录
        return await this.createRecord(score);
      } else {
        // 更新最新记录
        const sortedRecords = records.sort((a, b) => {
          const dateA = new Date(a.created_at || '').getTime();
          const dateB = new Date(b.created_at || '').getTime();
          return dateB - dateA;
        });
        
        const latestRecord = sortedRecords[0];
        if (latestRecord.id) {
          return await this.updateRecord(latestRecord.id, score);
        } else {
          return await this.createRecord(score);
        }
      }
    } catch (error) {
      console.error('保存分数失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const nocoDBClient = new NocoDBClient();