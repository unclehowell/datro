
import { defineConfig } from 'vitepress'
export default defineConfig({
  title: 'Agent Soul',
  outDir: '/home/ubuntu/datro/static/llmwiki/agent_soul/latest/build/html/en',
  base: '/agent_soul/latest/build/html/en/',
  markdown: { attrs: { disable: true } },
  themeConfig: {
    sidebar: [{ items: [{ text: 'CHANGELOG', link: '/CHANGELOG' },{ text: 'pi-agent', link: '/pi-agent' },{ text: 'pi-subagent', link: '/pi-subagent' },{ text: 'soul', link: '/soul' }] }]
  }
})