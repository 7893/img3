import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		vite: {
			test: {
				workspace: [
					{
						extends: './vite.config.ts',
						plugins: [svelteTesting()],
						test: {
							name: 'client',
							environment: 'jsdom',
							clearMocks: true,
							include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
							exclude: ['src/lib/server/**'],
							setupFiles: ['./vitest-setup-client.ts']
						}
					},
					{
						extends: './vite.config.ts',
						test: {
							name: 'server',
							environment: 'node',
							include: ['src/**/*.{test,spec}.{js,ts}'],
							exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
						}
					}
				]
			}
		}
	}
};

export default config;
