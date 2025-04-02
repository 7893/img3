<script lang="ts">
	import { onMount } from 'svelte';

	// 用于显示 API Worker 状态的变量
	let apiStatus = '正在检查 API Worker 状态...';
	// 【注意！】暂时硬编码 API Worker 的 URL (来自 Terraform output)
	// 请将其替换为你实际的 API Worker URL (例如 https://img3-api-worker-20250401.53.workers.dev)
	// 后续我们会用环境变量来配置这个 URL
	const apiUrl = 'https://img3-api-worker-20250401.53.workers.dev'; // <--- 【务必替换!】

	onMount(async () => {
		try {
			// 尝试访问 API Worker 的根路径或 /health 路径
			const response = await fetch(`${apiUrl}/health`); // 或者直接访问 apiUrl+'/'
			if (response.ok) {
				const text = await response.text();
				apiStatus = `连接成功！ (${response.status}): ${text}`;
			} else {
				apiStatus = `连接失败！ 状态码: ${response.status}`;
			}
		} catch (error) {
			console.error('无法连接到 API Worker:', error);
			apiStatus = `连接错误: ${error instanceof Error ? error.message : String(error)}`;
		}
	});
</script>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-sky-100 to-indigo-200 p-8"
>
	<h1 class="mb-6 text-4xl font-bold text-indigo-800 shadow-sm">
		欢迎来到 img3 (Cloudflare 版本)!
	</h1>

	<p class="mb-4 text-lg text-gray-700">
		前端应用 (SvelteKit + Tailwind CSS) 已成功部署到 Cloudflare Pages。
	</p>

	<div class="mt-4 rounded-md bg-white p-4 shadow">
		<p class="text-md text-gray-600">{apiStatus}</p>
	</div>

	<p class="mt-8 text-sm text-gray-500">下一步: 实现图片加载和后台交互功能。</p>
</div>

<style lang="postcss">
	/* 如果需要，可以在这里添加额外的 PostCSS/Tailwind @apply 规则 */
	/* 或者直接在模板中使用 Tailwind 工具类 */
</style>
