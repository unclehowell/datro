
import { defineConfig } from 'vitepress'
export default defineConfig({
  title: 'agent memory',
  outDir: '/home/ubuntu/datro/static/llmwiki/agent_memory/latest/build/html/en',
  base: '/llmwiki/agent_memory/latest/build/html/en/',
  themeConfig: {
    sidebar: [{ items: [{ text: 'CHANGELOG', link: '/CHANGELOG' },{ text: 'feedback-autonomy', link: '/feedback-autonomy' },{ text: 'mem0-memory-plugin', link: '/mem0-memory-plugin' }] }]
  }
})
