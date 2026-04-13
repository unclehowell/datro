import { defineConfig } from 'vitepress'
export default defineConfig({
  title: 'Agent Soul',
  base: '/agent_soul/latest/source/',
  themeConfig: { sidebar: [{ items: [{ text: 'CHANGELOG', link: '/CHANGELOG' },{ text: 'pi-agent', link: '/pi-agent' },{ text: 'pi-subagent', link: '/pi-subagent' },{ text: 'soul', link: '/soul' }] }] }
})