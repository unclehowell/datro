export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/login' || url.pathname === '/api/login/') {
      try {
        const body = await request.json();
        const { phone, password } = body;

        if (!phone || !password) {
          return new Response(JSON.stringify({ error: 'Missing phone or password' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const normalizedPhone = phone.replace(/^0/, '').replace(/^44/, '');

        let userValid = false;
        let userPhone = '';

        if (normalizedPhone === '1463630144' && password === env.USER1_PASSWORD) {
          userValid = true;
          userPhone = '01463630144';
        } else if (normalizedPhone === '2031377118' && password === env.USER2_PASSWORD) {
          userValid = true;
          userPhone = '02031377118';
        }

        if (!userValid) {
          return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const token = btoa(userPhone + ':' + Date.now());
        
        return new Response(JSON.stringify({ 
          success: true, 
          token,
          phone: userPhone 
        }), {
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: 'Server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};