// apps/api-worker/src/index.ts

/**
 * API Worker: 处理 HTTP 请求
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import type { R2Bucket } from '@cloudflare/workers-types';

interface Env {
	IMG3_BUCKET: R2Bucket;
}

const app = new Hono<{ Bindings: Env }>();

// 中间件
app.use('*', logger());
app.use('*', cors());
app.use('*', prettyJSON());

// 健康检查
app.get('/', (c) => c.json({ status: 'ok', message: 'Img3 API Worker 运行正常 - 测试工作流' }));

// 上传文件
app.post('/upload', async (c) => {
	try {
		const formData = await c.req.formData();
		const file = formData.get('file');

		if (!file) {
			return c.json({ error: '未找到文件' }, 400);
		}

		// 验证文件类型
		if (!file.type?.startsWith('image/')) {
			return c.json({ error: '只支持图片文件' }, 400);
		}

		// 验证文件大小 (最大 10MB)
		if (file.size > 10 * 1024 * 1024) {
			return c.json({ error: '文件大小不能超过 10MB' }, 400);
		}

		// 生成唯一文件名
		const timestamp = Date.now();
		const extension = file.name.split('.').pop();
		const fileName = `${timestamp}.${extension}`;

		// 上传到 R2
		await c.env.IMG3_BUCKET.put(fileName, file);

		return c.json({
			success: true,
			message: '文件上传成功',
			fileName,
		});
	} catch (error) {
		console.error('上传错误:', error);
		return c.json({ error: '上传失败' }, 500);
	}
});

export default app;
