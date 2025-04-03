// apps/api-worker/src/index.ts

/**
 * API Worker: 处理 HTTP 请求
 */

interface Env {
	IMAGE_BUCKET: R2Bucket;
	DB: D1Database;
	KV_CACHE: KVNamespace;
	SYNC_TASK_QUEUE: Queue;
}

export default {
	async fetch(request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		
		// 简单的路由处理
		if (url.pathname === '/') {
			return new Response('API Worker is running');
		}
		
		return new Response('Not found', { status: 404 });
	},
};
