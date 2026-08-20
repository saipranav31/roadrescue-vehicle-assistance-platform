/**
 * Production Node.js Server for RoadRescue
 * Official MSG91 OTP Widget API Backend
 */

const http = require('http');
const https = require('https');
const crypto = require('crypto');

const PORT = process.env.PORT || 5000;

// Read credentials securely from environment variables
const MSG91_WIDGET_ID = process.env.MSG91_WIDGET_ID || '';
const MSG91_TOKEN_AUTH = process.env.MSG91_TOKEN_AUTH || process.env.MSG91_AUTH_KEY || '';

const db = {
  customers: new Map(),
  pending_registrations: new Map(),
  widget_req_ids: new Map() // phone -> reqId returned by MSG91 Widget
};

// --- MSG91 Widget sendOtp API Call ---
function msg91WidgetSendOtp(phoneNumber) {
  return new Promise((resolve) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '').slice(-10);
    const identifier = `91${cleanNumber}`;
    
    const postData = JSON.stringify({
      widgetId: MSG91_WIDGET_ID,
      tokenAuth: MSG91_TOKEN_AUTH,
      identifier: identifier
    });

    const options = {
      hostname: 'control.msg91.com',
      path: '/api/v5/widget/sendOtp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`\n==================================================`);
    console.log(`[MSG91 WIDGET OUTBOUND REQUEST] sendOtp`);
    console.log(`[EXACT URL CALLED]: https://${options.hostname}${options.path}`);
    console.log(`[METHOD]: ${options.method}`);
    console.log(`[HEADERS]:`, options.headers);
    console.log(`==================================================\n`);

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`\n==================================================`);
        console.log(`[MSG91 WIDGET RESPONSE RECEIVED]`);
        console.log(`[HTTP STATUS CODE]: ${res.statusCode}`);
        console.log(`==================================================\n`);

        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: body, rawText: true });
        }
      });
    });

    req.on('error', (err) => {
      console.error(`\n[MSG91 NETWORK ERROR]: ${err.message}\n`);
      resolve({ statusCode: 500, error: err.message });
    });

    req.write(postData);
    req.end();
  });
}

// --- MSG91 Widget verifyOtp API Call ---
function msg91WidgetVerifyOtp(phoneNumber, otpCode, reqId) {
  return new Promise((resolve) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '').slice(-10);
    const identifier = `91${cleanNumber}`;
    
    const payload = {
      widgetId: MSG91_WIDGET_ID,
      tokenAuth: MSG91_TOKEN_AUTH,
      identifier: identifier,
      otp: otpCode.trim()
    };
    if (reqId) payload.reqId = reqId;

    const postData = JSON.stringify(payload);

    const options = {
      hostname: 'control.msg91.com',
      path: '/api/v5/widget/verifyOtp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`\n==================================================`);
    console.log(`[MSG91 WIDGET OUTBOUND REQUEST] verifyOtp`);
    console.log(`[EXACT URL CALLED]: https://${options.hostname}${options.path}`);
    console.log(`==================================================\n`);

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`\n==================================================`);
        console.log(`[MSG91 WIDGET VERIFY RESPONSE]`);
        console.log(`[HTTP STATUS CODE]: ${res.statusCode}`);
        console.log(`==================================================\n`);

        try {
          const parsed = JSON.parse(body);
          if (parsed.status === 'success' || parsed.type === 'success' || (parsed.message && parsed.message.toLowerCase().includes('success'))) {
            resolve({ success: true, statusCode: res.statusCode, body: parsed });
          } else {
            resolve({ success: false, statusCode: res.statusCode, error: parsed.message || 'Invalid OTP', body: parsed });
          }
        } catch (e) {
          resolve({ success: false, statusCode: res.statusCode, error: 'Parse Error', rawBody: body });
        }
      });
    });

    req.on('error', (err) => {
      console.error(`\n[MSG91 NETWORK ERROR]: ${err.message}\n`);
      resolve({ success: false, statusCode: 500, error: err.message });
    });

    req.write(postData);
    req.end();
  });
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // Route 1: POST /api/auth/send-otp
  if (req.method === 'POST' && req.url === '/api/auth/send-otp') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { phone_number, full_name } = JSON.parse(body || '{}');
        if (!phone_number) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Mobile number is required' }));
        }

        const cleanPhone = phone_number.replace(/\D/g, '').slice(-10);
        db.pending_registrations.set(cleanPhone, full_name || 'Customer');

        // Call Official MSG91 Widget API
        const msg91Result = await msg91WidgetSendOtp(cleanPhone);

        if (msg91Result.body && (msg91Result.body.hasError || msg91Result.body.type === 'error')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            error: `MSG91 Widget Error: ${msg91Result.body.message || 'Failed to send OTP via Widget API'}`,
            msg91Response: msg91Result.body,
            httpStatus: msg91Result.statusCode
          }));
        }

        if (msg91Result.body && msg91Result.body.message) {
          db.widget_req_ids.set(cleanPhone, msg91Result.body.message); // Save reqId if returned
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: `Verification code sent via MSG91 OTP Widget.`,
          phone: cleanPhone,
          msg91Response: msg91Result.body
        }));
      } catch (err) {
        console.error('[SERVER ERROR]:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server Error: ' + err.message }));
      }
    });
    return;
  }

  // Route 2: POST /api/auth/verify-otp
  if (req.method === 'POST' && req.url === '/api/auth/verify-otp') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { phone_number, otp } = JSON.parse(body || '{}');
        if (!phone_number || !otp) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Phone number and OTP are required' }));
        }

        const cleanPhone = phone_number.replace(/\D/g, '').slice(-10);
        const savedReqId = db.widget_req_ids.get(cleanPhone);

        const verification = await msg91WidgetVerifyOtp(cleanPhone, otp, savedReqId);

        if (!verification.success) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            error: verification.error || 'Invalid OTP code.',
            msg91Response: verification.body,
            httpStatus: verification.statusCode
          }));
        }

        const fullName = db.pending_registrations.get(cleanPhone) || 'Customer';
        db.pending_registrations.delete(cleanPhone);

        let customer = Array.from(db.customers.values()).find(c => c.phone === cleanPhone);
        if (!customer) {
          customer = {
            id: 'cust-' + crypto.randomBytes(4).toString('hex'),
            name: fullName,
            phone: cleanPhone,
            created_at: new Date().toISOString()
          };
          db.customers.set(customer.id, customer);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'OTP verified successfully via MSG91 Widget.',
          customer: customer
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Verification Error: ' + err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint Not Found' }));
});

server.listen(PORT, () => {
  console.log(`RoadRescue MSG91 OTP Widget Server running on http://localhost:${PORT}`);
});
