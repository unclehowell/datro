
import { defineConfig } from 'vitepress'
export default defineConfig({
  title: 'agent soul',
  outDir: '/home/unclehowell/datro/static/llmwiki/agent_soul/latest/build/html/en',
  base: '/llmwiki/agent_soul/latest/build/html/en/',
  themeConfig: {
    sidebar: [{ items: [{ text: 'CHANGELOG', link: '/CHANGELOG' },{ text: 'pi-agent', link: '/pi-agent' },{ text: 'pi-subagent', link: '/pi-subagent' },{ text: 'soul', link: '/soul' }] }]
  }
})
