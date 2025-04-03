// apps/api-worker/src/index.ts

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 * Learn more at https://developers.cloudflare.com/workers/
 */

// 定义环境变量和绑定的接口，增强类型安全
interface Env {
	// 来自 wrangler.jsonc 的绑定
	IMAGE_BUCKET: R2Bucket;
	DB: D1Database;
	KV_CACHE: KVNamespace;
	SYNC_TASK_QUEUE: Queue;
	SYNC_COORDINATOR_DO: DurableObjectNamespace; // 注意 DO 绑定类型是 Namespace

	// 未来可能从 wrangler.jsonc [vars] 或 Secrets 添加
	// ENVIRONMENT: string;
	// UNSPLASH_ACCESS_KEY: string;
}

// --- 【新增】Durable Object 类定义与导出 ---
// 类名 "SyncCoordinatorDO" 必须与 wrangler.jsonc 中 durable_objects.bindings.class_name 一致
export class SyncCoordinatorDO implements DurableObject {
	state: DurableObjectState;
	env: Env; // 可以访问绑定到 Worker 的环境变量和资源

	constructor(state: DurableObjectState, env: Env) {
		this.state = state;
		this.env = env;
		// 可以在此进行初始化，例如从 state.storage 加载持久化状态
	}

	// Durable Object 必须实现 fetch 方法，用于响应直接对 DO 的请求或 Worker 通过 stub.fetch() 的调用
	async fetch(_request: Request): Promise<Response> {
		// 这里是 DO 处理请求的入口
		// 暂时返回一个简单的响应，表明 DO 正常工作
		// 后续我们会在这里添加管理同步状态的核心逻辑
		console.log('SyncCoordinatorDO received fetch request');
		return new Response('Hello from SyncCoordinatorDO!');
	}

	// --- 后续在此添加 DO 的具体方法 ---
	// 例如:
	// async startSync(options: { startPage?: number }) { ... }
	// async stopSync() { ... }
	// async getStatus() { ... }
	// async reportProgress(page: number) { ... }
	// 这些方法可以通过 Worker 获取 DO stub 后使用 RPC 调用 (stub.startSync({}))
}

// --- Worker 的默认导出 (Fetch 处理程序) ---
export default {
	async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
		// 使用 Env 接口访问绑定，获得类型提示
		const url = new URL(request.url);

		// 1. 基础健康检查路由
		if (url.pathname === '/' || url.pathname === '/health') {
			console.log('API Worker: Health check OK');
			return new Response('API Worker is running OK!', {
				status: 200,
				headers: { 'Content-Type': 'text/plain;charset=utf-8' },
			});
		}

		// 2. (示例) 与 Durable Object 交互的路由
		if (url.pathname === '/do-test') {
			try {
				// 获取 DO 实例的唯一 ID (通常用固定名称获取单例)
				const doId = env.SYNC_COORDINATOR_DO.idFromName('global-sync-state');
				// 获取 DO 的存根 (stub)
				const stub = env.SYNC_COORDINATOR_DO.get(doId);
				// 将请求转发给 DO 的 fetch 处理程序 (或者构造新请求)
				console.log(`API Worker: Forwarding request to DO for path: ${url.pathname}`);
				const doResponse = await stub.fetch(request);
				return doResponse;
			} catch (error: unknown) {
				console.error('API Worker: Error interacting with DO:', error);
				return new Response(`Error interacting with DO: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
			}
		}

		// --- 3. TODO: 在这里添加其他的 API 路由 ---
		// 例如：
		// if (url.pathname === '/images') { /* 处理获取图片列表请求, 查询 env.DB */ }
		// if (url.pathname === '/sync-status') { /* 处理获取状态请求, 调用 DO 的 getStatus 方法 */ }
		// if (request.method === 'POST' && url.pathname === '/start-sync') { /* 处理开始同步请求, 调用 DO 的 startSync 方法 */ }
		// if (request.method === 'POST' && url.pathname === '/stop-sync') { /* 处理停止同步请求, 调用 DO 的 stopSync 方法 */ }

		// 4. 默认返回 404
		console.log(`API Worker: Path not found: ${url.pathname}`);
		return new Response('Not Found', { status: 404 });
	},

	// --- 其他可能的 Worker 处理程序 ---
	// 例如，如果 API Worker 也需要处理 Queue 消息或 Cron 事件 (虽然目前计划主要由 sync-worker 做)
	// async queue(batch: MessageBatch<any>, env: Env, ctx: ExecutionContext): Promise<void> {
	//   console.log("API Worker queue handler invoked.");
	// }
	// async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
	//   console.log("API Worker scheduled handler invoked.");
	// }
};
