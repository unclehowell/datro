export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/data') {
      const authHeader = request.headers.get('Authorization');
      
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const token = authHeader.replace('Bearer ', '');
      let validPhone = null;

      try {
        const [phone, ts] = atob(token).split(':');
        const validPhones = ['01463630144', '02031377118'];
        
        if (validPhones.includes(phone) && ts) {
          validPhone = phone;
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const balance = Math.floor(Math.random() * 150) + 10;
      
      return new Response(JSON.stringify({
        balance,
        recordings: [
          { from: '+447700900000', to: validPhone, date: '2026-04-21 14:30', duration: '2:34', url: '#' },
          { from: validPhone, to: '+447700900001', date: '2026-04-20 09:15', duration: '1:22', url: '#' },
          { from: '+447700900002', to: validPhone, date: '2026-04-19 16:45', duration: '3:01', url: '#' }
        ]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};