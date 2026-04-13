
import { defineConfig } from 'vitepress'
export default defineConfig({
  title: 'agent skills communication',
  outDir: '/home/unclehowell/datro/static/llmwiki/agent_skills_communication/latest/build/html/en',
  base: '/llmwiki/agent_skills_communication/latest/build/html/en/',
  themeConfig: {
    sidebar: [{ items: [{ text: 'CHANGELOG', link: '/CHANGELOG' },{ text: 'DESCRIPTION', link: '/apple/DESCRIPTION' },{ text: 'SKILL', link: '/apple/apple-notes/SKILL' },{ text: 'SKILL', link: '/apple/apple-reminders/SKILL' },{ text: 'SKILL', link: '/apple/findmy/SKILL' },{ text: 'SKILL', link: '/apple/imessage/SKILL' },{ text: 'DESCRIPTION', link: '/email/DESCRIPTION' },{ text: 'SKILL', link: '/email/himalaya/SKILL' },{ text: 'configuration', link: '/email/himalaya/references/configuration' },{ text: 'message-composition', link: '/email/himalaya/references/message-composition' },{ text: 'DESCRIPTION', link: '/mcp/DESCRIPTION' },{ text: 'SKILL', link: '/mcp/mcporter/SKILL' },{ text: 'SKILL', link: '/mcp/native-mcp/SKILL' },{ text: 'DESCRIPTION', link: '/social-media/DESCRIPTION' },{ text: 'SKILL', link: '/social-media/xitter/SKILL' }] }]
  }
})
