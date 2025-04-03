// apps/sync-worker/src/index.ts

/**
 * Sync Worker: 处理后台任务
 */

// 定义环境绑定接口
interface Env {
	IMAGE_BUCKET: R2Bucket;
	DB: D1Database;
	// SYNC_COORDINATOR_DO: DurableObjectNamespace; // 暂时不绑定 DO
	// KV_CACHE: KVNamespace; // 如果需要访问 KV，也要在这里和 wrangler.jsonc 定义
	// Secrets...
}

// 定义消息类型
interface SyncMessage {
	page: number;
	perPage: number;
	timestamp: string;
}

export default {
	// Worker 的主入口，通常响应 HTTP 请求，对于后台 Worker 可能不是主要功能
	// 但保留一个基础的 fetch 处理程序通常是好的做法
	async fetch(_request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
		return new Response('Sync Worker is running');
	},

	// 【新增】处理来自 Queue 的消息
	// 这个函数必须被导出，以响应 wrangler.jsonc 中的 consumers 配置
	async queue(batch: MessageBatch<SyncMessage>, _env: Env, _ctx: ExecutionContext): Promise<void> {
		console.log(`Processing ${batch.messages.length} messages`);
		for (const message of batch.messages) {
			message.ack();
		}
	},

	// 【可选】处理 Cron 触发器 (如果 Terraform 中定义了 Cron)
	// async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
	//   console.log("Sync Worker scheduled handler invoked.");
	//   // TODO: 添加 Cron 触发的逻辑 (例如，检查 D1 状态，决定是否处理下一页)
	// }
};
