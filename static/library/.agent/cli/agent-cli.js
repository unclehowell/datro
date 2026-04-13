#!/usr/bin/env node

const API_BASE = process.env.DATRO_API || 'https://datro.xyz/.agent/api';
const TOKEN_FILE = process.env.DATRO_TOKEN || process.env.HOME + '/.config/datro/agent.token';

const fetch = require('fetch').fetch || require('node-fetch');

const fs = require('fs');
const path = require('path');

const commands = {
  projects: {
    list: async (args) => {
      const projects = await apiGet('/projects');
      console.log(JSON.stringify(projects, null, 2));
    },
    create: async (args) => {
      const project = await apiPost('/projects', {
        name: args.name,
        description: args.description || '',
        stage: args.stage || 'initiation'
      });
      console.log('Project created:', project.id);
    },
    show: async (args) => {
      const project = await apiGet('/projects/' + args.id);
      console.log(JSON.stringify(project, null, 2));
    }
  },
  cr: {
    list: async (args) => {
      const crs = await apiGet('/change_requests' + (args.project ? '?project=' + args.project : ''));
      console.log(JSON.stringify(crs, null, 2));
    },
    create: async (args) => {
      const cr = await apiPost('/change_requests', {
        project_id: args.project,
        type: args.type || 'enhancement',
        title: args.title,
        description: args.description,
        priority: args.priority || 'medium'
      });
      console.log('Change request created:', cr.id);
    },
    approve: async (args) => {
      const cr = await apiPut('/change_requests/' + args.id + '/approve');
      console.log('Approved:', cr.id);
    },
    reject: async (args) => {
      const cr = await apiPut('/change_requests/' + args.id + '/reject');
      console.log('Rejected:', cr.id);
    }
  },
  log: {
    list: async (args) => {
      const logs = await apiGet('/interactions' + (args.project ? '?project=' + args.project : ''));
      console.log(JSON.stringify(logs, null, 2));
    },
    create: async (args) => {
      const log = await apiPost('/interactions', {
        type: args.type || 'meeting',
        project_id: args.project || null,
        subject: args.subject || '',
        notes: args.notes || '',
        actions: args.actions ? args.actions.split(';').map(a => ({ description: a, status: 'pending' })) : []
      });
      console.log('Interaction logged:', log.id);
    }
  },
  auth: {
    login: async (args) => {
      const token = await apiPost('/auth/token', {
        agent: args.agent,
        secret: args.secret
      });
      fs.writeFileSync(TOKEN_FILE, token.access_token);
      console.log('Authenticated. Token saved.');
    }
  }
};

async function apiGet(endpoint) {
  const token = loadToken();
  const res = await fetch(API_BASE + endpoint, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  return res.json();
}

async function apiPost(endpoint, data) {
  const token = loadToken();
  const res = await fetch(API_BASE + endpoint, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function apiPut(endpoint, data) {
  const token = loadToken();
  const res = await fetch(API_BASE + endpoint, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data || {})
  });
  return res.json();
}

function loadToken() {
  try {
    return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
  } catch (e) {
    console.error('No token. Run: agent-cli auth login --agent NAME --secret SECRET');
    process.exit(1);
  }
}

function main() {
  const cmd = process.argv[2];
  const subcmd = process.argv[3];
  const args = {};

  for (let i = 4; i < process.argv.length; i += 2) {
    const key = process.argv[i].replace('--', '');
    args[key] = process.argv[i + 1];
  }

  if (commands[cmd] && commands[cmd][subcmd]) {
    commands[cmd][subcmd](args);
  } else if (commands[cmd] && typeof commands[cmd] === 'function') {
    commands[cmd](args);
  } else {
    console.log(`
DATRO Agent CLI

Usage:
  agent-cli projects list
  agent-cli projects create --name "Name" --description "..."
  agent-cli projects show --id UUID

  agent-cli cr list [--project UUID]
  agent-cli cr create --project UUID --title "..." --description "..." [--type enhancement|bug_fix]
  agent-cli cr approve --id UUID
  agent-cli cr reject --id UUID

  agent-cli log list [--project UUID]
  agent-cli log create --type meeting --notes "..." [--project UUID]

  agent-cli auth login --agent NAME --secret SECRET

Environment:
  DATRO_API - API base URL
  DATRO_TOKEN - Token file path
`);
  }
}

main();