import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = 'your-jwt-secret-change-in-production';

interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { action, email, password, firstName, lastName, token, newPassword } = body;

    switch (action) {
      case 'register':
        return await handleRegister(email, password, firstName, lastName, env);
      case 'login':
        return await handleLogin(email, password, env);
      case 'request-reset':
        return await handleRequestReset(email, env);
      case 'reset-password':
        return await handleResetPassword(token, newPassword, env);
      case 'me':
        return await handleMe(request, env);
      case 'logout':
        return await handleLogout(request, env);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}

async function handleRegister(email: string, password: string, firstName: string, lastName: string, env: Env) {
  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password required' }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) {
    return new Response(JSON.stringify({ error: 'Email already registered' }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await env.DB.prepare(
    'INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)'
  ).bind(email, passwordHash, firstName || null, lastName || null).run();

  const userId = result.meta?.last_row_id;
  const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
  const sessionToken = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  await env.DB.prepare(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).bind(userId, sessionToken, expiresAt).run();

  const user = await env.DB.prepare(
    'SELECT id, email, first_name as firstName, last_name as lastName, wallet_balance as walletBalance, seller_balance as sellerBalance FROM users WHERE id = ?'
  ).bind(userId).first();

  return new Response(JSON.stringify({ token, user }), { 
    headers: { 'Content-Type': 'application/json' } 
  });
}

async function handleLogin(email: string, password: string, env: Env) {
  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password required' }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const user = await env.DB.prepare(
    'SELECT id, email, password_hash, first_name as firstName, last_name as lastName, wallet_balance as walletBalance, seller_balance as sellerBalance FROM users WHERE email = ?'
  ).bind(email).first() as any;

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  const sessionToken = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  await env.DB.prepare(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).bind(user.id, sessionToken, expiresAt).run();

  const { password_hash, ...userData } = user;
  return new Response(JSON.stringify({ token, user: userData }), { 
    headers: { 'Content-Type': 'application/json' } 
  });
}

async function handleRequestReset(email: string, env: Env) {
  const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  
  if (user) {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString();
    await env.DB.prepare(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
    ).bind((user as any).id, token, expiresAt).run();
    
    console.log(`Password reset token for ${email}: ${token}`);
  }

  return new Response(JSON.stringify({ 
    success: true, 
    message: 'If the email exists, a reset link has been sent' 
  }), { 
    headers: { 'Content-Type': 'application/json' } 
  });
}

async function handleResetPassword(token: string, newPassword: string, env: Env) {
  const resetRecord = await env.DB.prepare(
    `SELECT user_id FROM password_reset_tokens 
     WHERE token = ? AND expires_at > datetime('now') AND used = 0`
  ).bind(token).first() as any;

  if (!resetRecord) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Invalid or expired reset token' 
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .bind(passwordHash, resetRecord.user_id).run();
  await env.DB.prepare('UPDATE password_reset_tokens SET used = 1 WHERE token = ?')
    .bind(token).run();

  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Password reset successful' 
  }), { 
    headers: { 'Content-Type': 'application/json' } 
  });
}

async function handleMe(request: Request, env: Env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const token = authHeader.substring(7);
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await env.DB.prepare(
      'SELECT id, email, first_name as firstName, last_name as lastName, wallet_balance as walletBalance, seller_balance as sellerBalance FROM users WHERE id = ?'
    ).bind(decoded.id).first();

    if (!user) throw new Error('User not found');
    return new Response(JSON.stringify(user), { 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}

async function handleLogout(request: Request, env: Env) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded: any = jwt.verify(token, JWT_SECRET);
      await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(decoded.id).run();
    } catch (e) {}
  }

  return new Response(JSON.stringify({ success: true }), { 
    headers: { 'Content-Type': 'application/json' } 
  });
}
