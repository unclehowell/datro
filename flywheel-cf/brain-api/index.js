// Open Brain API — External Scaffolding Endpoint
// Serves as unified memory layer for all agents/CLI/IDE
// Branch: cnei (persistent public memory)

import { Hono } from 'hono';
import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLList, GraphQLNonNull, GraphQLID, GraphQLFloat, GraphQLInt, GraphQLDateTime } from 'graphql';
import { createYoga } from 'graphql-yoga';

const app = new Hono();

// Memory source enum
const MemorySource = {
  HONCHO: 'honcho',
  MEM0: 'mem0', 
  VAULT: 'vault',
  CLI: 'cli',
  AGENT: 'agent'
};

// GraphQL Schema
const MemoryType = new GraphQLObjectType({
  name: 'Memory',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    key: { type: new GraphQLNonNull(GraphQLString) },
    branch: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    tags: { type: new GraphQLList(GraphQLString) },
    embedding: { type: new GraphQLList(GraphQLFloat) },
    createdAt: { type: GraphQLDateTime },
    updatedAt: { type: GraphQLDateTime },
    source: { type: new GraphQLNonNull(GraphQLString) }
  })
});

const AgentType = new GraphQLObjectType({
  name: 'Agent',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    branch: { type: new GraphQLNonNull(GraphQLString) },
    config: { type: new GraphQLNonNull(GraphQLJSON) },
    lastRun: { type: GraphQLDateTime },
    memoryKey: { type: new GraphQLNonNull(GraphQLString) }
  })
});

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    memory: {
      type: MemoryType,
      args: { key: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: async (_, { key }, ctx) => {
        const data = await ctx.env.FLYWHEEL_STATE.get(`memory_${key}`, 'json');
        return data || null;
      }
    },
    memories: {
      type: new GraphQLList(MemoryType),
      args: {
        branch: { type: GraphQLString },
        tags: { type: new GraphQLList(GraphQLString) },
        limit: { type: GraphQLInt, defaultValue: 50 }
      },
      resolve: async (_, { branch, limit }, ctx) => {
        const indexKey = branch ? `memory_index_${branch}` : 'memory_index_all';
        const keys = await ctx.env.FLYWHEEL_STATE.get(indexKey, 'json').catch(() => []);
        const memories = [];
        for (const key of (keys || []).slice(0, limit)) {
          const mem = await ctx.env.FLYWHEEL_STATE.get(`memory_${key}`, 'json').catch(() => null);
          if (mem) memories.push(mem);
        }
        return memories;
      }
    },
    agentConfig: {
      type: GraphQLJSON,
      args: { branch: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: async (_, { branch }, ctx) => {
        const config = await ctx.env.FLYWHEEL_STATE.get(`agent_config_${branch}`, 'json');
        return config || getDefaultAgentConfig(branch);
      }
    },
    branchState: {
      type: GraphQLJSON,
      args: { branch: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: async (_, { branch }, ctx) => {
        const card = await ctx.env.FLYWHEEL_STATE.get(`index_${branch}`, 'json').catch(() => null);
        const wallet = await ctx.env.FLYWHEEL_STATE.get(`wallet_${branch}`, 'json').catch(() => null);
        return {
          branch,
          wallet: wallet?.address || deriveBranchAddress(branch),
          quota: getBranchQuota(branch),
          lastRelease: card?.lastRelease,
          cycleCount: card?.cycleCount || 0,
          hypotheses: Object.values(card?.hypothesisTree?.nodes || {})
        };
      }
    }
  }
});

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    remember: {
      type: MemoryType,
      args: {
        key: { type: new GraphQLNonNull(GraphQLString) },
        content: { type: new GraphQLNonNull(GraphQLString) },
        branch: { type: new GraphQLNonNull(GraphQLString) },
        tags: { type: new GraphQLList(GraphQLString) }
      },
      resolve: async (_, { key, content, branch, tags = [] }, ctx) => {
        const memory = {
          id: `${branch}_${key}`,
          key,
          branch,
          content,
          tags,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: ctx.req.header('X-Memory-Source') || MemorySource.AGENT
        };
        await ctx.env.FLYWHEEL_STATE.put(`memory_${branch}_${key}`, JSON.stringify(memory));
        
        // Update index
        const indexKey = `memory_index_${branch}`;
        const index = await ctx.env.FLYWHEEL_STATE.get(indexKey, 'json').catch(() => []);
        if (!index.includes(key)) index.push(key);
        await ctx.env.FLYWHEEL_STATE.put(indexKey, JSON.stringify(index.slice(-200)));
        
        return memory;
      }
    },
    learnLesson: {
      type: MemoryType,
      args: {
        branch: { type: new GraphQLNonNull(GraphQLString) },
        text: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve: async (_, { branch, text }, ctx) => {
        const lessonsKey = `lessons_${branch}`;
        const lessons = await ctx.env.FLYWHEEL_STATE.get(lessonsKey, 'json').catch(() => []);
        lessons.push({ text, ts: Date.now(), branch });
        if (lessons.length > 50) lessons.splice(0, lessons.length - 50);
        await ctx.env.FLYWHEEL_STATE.put(lessonsKey, JSON.stringify(lessons));
        
        return {
          id: `${lessonsKey}_${lessons.length - 1}`,
          key: lessonsKey,
          branch,
          content: text,
          tags: ['lesson', 'learned'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: MemorySource.AGENT
        };
      }
    }
  }
});

// Helper functions
function getDefaultAgentConfig(branch) {
  return {
    model: 'openrouter/anthropic/claude-sonnet',
    maxTokens: 45000,
    temperature: 0.7,
    scaffolding: {
      brainEndpoint: 'https://cnei.datro.xyz/api/brain',
      honchoWorkspace: getHonchoWorkspace(branch),
      memoryPrefix: `memory_${branch}`,
      tools: getBranchTools(branch)
    }
  };
}

function deriveBranchAddress(branch) {
  const hash = Array.from(new TextEncoder().encode(branch))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('').slice(0, 40);
  return `0x${hash}`;
}

function getHonchoWorkspace(branch) {
  const workspaces = {
    bpvsbuckler: '0lCBWsZN-CS-DyY8THX7H',
    datro: 'Q-sPB_HUr__vWcP1cc-UQ',
    financecheque: 'oSx32NCcWFHT7gRXWtrGo',
    cnei: 'datro-flywheel-brain'
  };
  return workspaces[branch] || 'datro';
}

function getBranchTools(branch) {
  const baseTools = ['read_file', 'write_file', 'search_code', 'brain_recall', 'brain_remember'];
  const extendedTools = {
    cnei: [...baseTools, 'honcho_memory', 'list_memories', 'flywheel_config'],
    datro: [...baseTools, 'seo_audit', 'wcag_check'],
    financecheque: [...baseTools, 'web3_check', 'transaction_analyze']
  };
  return extendedTools[branch] || baseTools;
}

// REST endpoints (for CLI/IDE integration)
app.get('/api/brain/config/:branch', async (c) => {
  const branch = c.req.param('branch');
  const config = await c.env.FLYWHEEL_STATE.get(`agent_config_${branch}`, 'json')
    .catch(() => getDefaultAgentConfig(branch));
  return c.json(config);
});

app.get('/api/brain/memory/:branch/:key', async (c) => {
  const branch = c.req.param('branch');
  const key = c.req.param('key');
  const memory = await c.env.FLYWHEEL_STATE.get(`memory_${branch}_${key}`, 'json')
    .catch(() => null);
  return c.json(memory || { error: 'Not found' });
});

app.post('/api/brain/remember/:branch/:key', async (c) => {
  const branch = c.req.param('branch');
  const key = c.req.param('key');
  const body = await c.req.json();
  
  const memory = {
    id: `${branch}_${key}`,
    key,
    branch,
    content: body.content || '',
    tags: body.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: body.source || MemorySource.CLI
  };
  
  await c.env.FLYWHEEL_STATE.put(`memory_${branch}_${key}`, JSON.stringify(memory));
  
  // Update index
  const indexKey = `memory_index_${branch}`;
  const index = await c.env.FLYWHEEL_STATE.get(indexKey, 'json').catch(() => []);
  if (!index.includes(key)) index.push(key);
  await c.env.FLYWHEEL_STATE.put(indexKey, JSON.stringify(index.slice(-200)));
  
  return c.json(memory);
});

app.get('/api/brain/lessons/:branch', async (c) => {
  const branch = c.req.param('branch');
  const lessons = await c.env.FLYWHEEL_STATE.get(`lessons_${branch}`, 'json')
    .catch(() => []);
  return c.json(lessons.slice(-20));
});

export default app;