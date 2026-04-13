
import { defineConfig } from 'vitepress'
export default defineConfig({
  title: 'agent skills autonomous',
  outDir: '/home/ubuntu/datro/static/llmwiki/agent_skills_autonomous/latest/build/html/en',
  base: '/llmwiki/agent_skills_autonomous/latest/build/html/en/',
  themeConfig: {
    sidebar: [{ items: [{ text: 'CHANGELOG', link: '/CHANGELOG' },{ text: 'DESCRIPTION', link: '/autonomous-ai-agents/DESCRIPTION' },{ text: 'SKILL', link: '/autonomous-ai-agents/claude-code/SKILL' },{ text: 'SKILL', link: '/autonomous-ai-agents/codex/SKILL' },{ text: 'SKILL', link: '/autonomous-ai-agents/hermes-agent/SKILL' },{ text: 'SKILL', link: '/autonomous-ai-agents/opencode/SKILL' },{ text: 'SKILL', link: '/dogfood/SKILL' },{ text: 'issue-taxonomy', link: '/dogfood/references/issue-taxonomy' },{ text: 'dogfood-report-template', link: '/dogfood/templates/dogfood-report-template' },{ text: 'SKILL', link: '/red-teaming/godmode/SKILL' },{ text: 'jailbreak-templates', link: '/red-teaming/godmode/references/jailbreak-templates' },{ text: 'refusal-detection', link: '/red-teaming/godmode/references/refusal-detection' }] }]
  }
})
