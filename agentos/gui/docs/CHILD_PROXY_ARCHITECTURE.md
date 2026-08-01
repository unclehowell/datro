# Child Proxy Architecture Documentation

## Overview
The child proxy is a lightweight subsystem of the financecheque.uk parent proxy API, isolated for specific operational contexts. It runs on localhost:3000 and interfaces with the parent proxy through secured network boundaries.

## Key Components
1. **UI Layer**: Web GUI built with Next.js (src/app) handling user interactions
2. **Proxy Logic**: Isolated API handler for financecheque operations
3. **Network Bridge**: Secure tunnel connecting child to parent proxy
4. **Security Context**: Read-only access to parent functions

## Workflow
1. User initiates request through GUI
2. Request is marshalled to child proxy API
3. Child validates and routes through authenticated credentials
4. Parent proxy processes core financial operations
5. Results returned via reverse proxy

## Security Model
- No direct parent-proxy trust
- All financial data flows through encrypted channels
- Child operates in read-only mode for safety

## UI Integration
The web interface at localhost:3000 displaying financecheque operations should include this documentation in the admin section for transparency.