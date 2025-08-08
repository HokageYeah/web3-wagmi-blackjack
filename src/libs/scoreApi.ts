// 前端分数 API 客户端
export class ScoreAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/score';
  }

  // 获取当前分数
  async getCurrentScore(): Promise<number> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.score;
    } catch (error) {
      console.error('获取分数失败:', error);
      return 0;
    }
  }

  // 保存分数
  async saveScore(score: number): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('保存分数失败:', error);
      return false;
    }
  }

  // 更新指定ID的分数
  async updateScore(id: number, score: number): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, score }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('更新分数失败:', error);
      return false;
    }
  }
}

// 导出单例实例
export const scoreAPI = new ScoreAPI();