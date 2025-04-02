import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig(async () => {
	const kit = await sveltekit();
	return {
		plugins: [kit]
	};
});
