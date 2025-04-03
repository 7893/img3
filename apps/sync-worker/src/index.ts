// apps/sync-worker/src/index.ts

/**
 * Sync Worker: 处理后台任务
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import type { Queue } from '@cloudflare/workers-types';

interface Env {
	SYNC_TASK_QUEUE: Queue;
}

const app = new Hono<{ Bindings: Env }>();

// 中间件
app.use('*', logger());
app.use('*', cors());
app.use('*', prettyJSON());

// 健康检查
app.get('/', (c) => c.json({ status: 'ok', message: 'Img3 Sync Worker 运行正常 - 测试工作流' }));

// 同步文件
app.post('/sync', async (c) => {
	try {
		const { bucket } = await c.req.json();

		if (!bucket) {
			return c.json({ error: '未指定存储桶' }, 400);
		}

		// 发送同步任务到队列
		await c.env.SYNC_TASK_QUEUE.send({
			bucket,
			timestamp: Date.now(),
		});

		return c.json({
			success: true,
			message: '同步任务已加入队列',
		});
	} catch (error) {
		console.error('同步错误:', error);
		return c.json({ error: '同步失败' }, 500);
	}
});

export default app;
