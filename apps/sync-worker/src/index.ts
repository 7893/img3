// apps/sync-worker/src/index.ts

/**
 * Sync Worker: Handles background tasks triggered by Queue or Cron.
 */

// 定义环境绑定接口
interface Env {
	IMAGE_BUCKET: R2Bucket;
	DB: D1Database;
	// SYNC_COORDINATOR_DO: DurableObjectNamespace; // 暂时不绑定 DO
	// KV_CACHE: KVNamespace; // 如果需要访问 KV，也要在这里和 wrangler.jsonc 定义
	// Secrets...
}

export default {
	// Worker 的主入口，通常响应 HTTP 请求，对于后台 Worker 可能不是主要功能
	// 但保留一个基础的 fetch 处理程序通常是好的做法
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		console.log('Sync Worker fetch handler invoked (likely health check or direct trigger)');
		return new Response('Sync Worker is running OK!');
	},

	// 【新增】处理来自 Queue 的消息
	// 这个函数必须被导出，以响应 wrangler.jsonc 中的 consumers 配置
	async queue(
		batch: MessageBatch<any>, // <any> 可以替换为更具体的类型，如果消息有固定结构
		env: Env,
		ctx: ExecutionContext,
	): Promise<void> {
		console.log(`Sync Worker queue handler invoked. Batch size: ${batch.messages.length}`);

		// 遍历处理批次中的每条消息
		for (const message of batch.messages) {
			console.log(`Processing message ${message.id}`);
			// TODO: 在这里添加处理单个同步任务的逻辑
			// 1. 解析 message.body 获取任务信息 (例如，要处理的页码)
			// 2. 调用 Unsplash API
			// 3. 下载图片到 env.IMAGE_BUCKET
			// 4. 写入元数据到 env.DB
			// 5. 处理成功或失败

			// 示例：简单地确认消息已被处理
			// 实际应用中，应该在任务成功处理后调用 ack()
			// 如果处理失败，可以调用 retry() (会根据 wrangler.jsonc 配置重试) 或让它超时
			message.ack();
			console.log(`Acknowledged message ${message.id}`);
		}

		// 或者，如果想一次性确认/重试整个批次 (根据业务逻辑决定)
		// batch.ackAll();
		// batch.retryAll();
	},

	// 【可选】处理 Cron 触发器 (如果 Terraform 中定义了 Cron)
	// async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
	//   console.log("Sync Worker scheduled handler invoked.");
	//   // TODO: 添加 Cron 触发的逻辑 (例如，检查 D1 状态，决定是否处理下一页)
	// }
};
