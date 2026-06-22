const https = require('https');
const crypto = require('crypto');

module.exports = (req, res) => {
    // Set headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');

    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }

    // Read the body (works for both raw Node server and Vercel)
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        try {
            // Support pre-parsed body (Vercel) or raw parsed JSON
            const data = req.body || JSON.parse(body || '{}');
            
            if (data.gateway === 'sabpaisa') {
                // SabPaisa PG 3.0 Integration
                const merchantId = data.clientCode;
                const merchantTxnId = data.client_txn_id;
                const amountInPaise = Math.round(parseFloat(data.amount) * 100);
                const currency = 'INR';
                const timestamp = Math.floor(Date.now() / 1000);
                
                // Generate HMAC-SHA256 checksum
                const checksumInput = `${merchantId}|${merchantTxnId}|${amountInPaise}|${currency}|${timestamp}`;
                const checksum = crypto.createHmac('sha256', data.secretKey)
                                       .update(checksumInput)
                                       .digest('hex')
                                       .toLowerCase();
                
                const payload = JSON.stringify({
                    merchantId: merchantId,
                    merchantTxnId: merchantTxnId,
                    amount: amountInPaise,
                    currency: currency,
                    returnUrl: data.redirect_url,
                    customerName: data.customer_name,
                    customerEmail: data.customer_email || 'customer@ikkodigital.com',
                    customerPhone: data.customer_mobile,
                    description: `Order ${merchantTxnId}`,
                    timestamp: timestamp,
                    checksum: checksum
                });
                
                const isLive = data.mode === 'live';
                const hostname = isLive ? 'merchant-api.sabpaisa.in' : 'staging-sb-merchant-api.sabpaisa.in';
                const path = '/api/v2/payments';
                
                const options = {
                    hostname: hostname,
                    path: path,
                    method: 'POST',
                    headers: {
                        'X-Api-Key': data.apiKey,
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(payload)
                    }
                };
                
                console.log(`[SabPaisa Request] Host: ${hostname}, MID: ${merchantId}, TxnId: ${merchantTxnId}, Payload: ${payload}`);
                
                const apiReq = https.request(options, (apiRes) => {
                    let apiData = '';
                    apiRes.on('data', (chunk) => {
                        apiData += chunk;
                    });
                    apiRes.on('end', () => {
                        console.log(`[SabPaisa Response] Status: ${apiRes.statusCode}, Body: ${apiData}`);
                        res.statusCode = apiRes.statusCode;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(apiData);
                    });
                });
                
                apiReq.on('error', (e) => {
                    console.error('SabPaisa Request Error:', e);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, message: 'Internal SabPaisa Communication Error: ' + e.message }));
                });
                
                apiReq.write(payload);
                apiReq.end();
                
            } else {
                // Legacy UPIGateway Proxy Flow
                const payload = JSON.stringify({
                    key: data.key,
                    client_txn_id: data.client_txn_id,
                    amount: data.amount,
                    p_info: data.p_info || 'IKKO DIGITAL Order',
                    customer_name: data.customer_name,
                    customer_email: data.customer_email || 'customer@ikkodigital.com',
                    customer_mobile: data.customer_mobile,
                    redirect_url: data.redirect_url
                });

                const options = {
                    hostname: 'merchant.upigateway.com',
                    path: '/api/create_order',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(payload)
                    }
                };

                const apiReq = https.request(options, (apiRes) => {
                    let apiData = '';
                    apiRes.on('data', (chunk) => {
                        apiData += chunk;
                    });
                    apiRes.on('end', () => {
                        res.statusCode = apiRes.statusCode;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(apiData);
                    });
                });

                apiReq.on('error', (e) => {
                    console.error('UPIGateway Request Error:', e);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ status: false, msg: 'Internal Gateway Communication Error: ' + e.message }));
                });

                apiReq.write(payload);
                apiReq.end();
            }
        } catch (err) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: false, msg: 'Invalid request payload: ' + err.message }));
        }
    });
};
