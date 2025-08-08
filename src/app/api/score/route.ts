import { nocoDBClient } from '@/app/api/lib/nocodb';
import { NextRequest } from 'next/server';

// GET /api/score - 获取当前分数
export async function GET() {
  try {
    const score = await nocoDBClient.getLatestScore();
    return new Response(JSON.stringify({ score }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('获取分数失败:', error);
    return new Response(JSON.stringify({ error: '获取分数失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST /api/score - 保存分数
export async function POST(request: NextRequest) {
  try {
    const { score } = await request.json();
    
    if (typeof score !== 'number') {
      return new Response(JSON.stringify({ error: '分数必须是数字' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const savedRecord = await nocoDBClient.saveScore(score);
    return new Response(JSON.stringify({ 
      success: true, 
      record: savedRecord 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('保存分数失败:', error);
    return new Response(JSON.stringify({ error: '保存分数失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// PUT /api/score - 更新指定ID的分数
export async function PUT(request: NextRequest) {
  try {
    const { id, score } = await request.json();
    
    if (typeof id !== 'number' || typeof score !== 'number') {
      return new Response(JSON.stringify({ error: 'ID和分数必须是数字' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updatedRecord = await nocoDBClient.updateRecord(id, score);
    return new Response(JSON.stringify({ 
      success: true, 
      record: updatedRecord 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('更新分数失败:', error);
    return new Response(JSON.stringify({ error: '更新分数失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}