const https = require('https');
const path = require('path');
const fs = require('fs');

// Helper to make HTTPS requests
function makeRequest(url, method, headers, postData = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: headers
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }

    // Read request body
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', async () => {
        try {
            const data = req.body || JSON.parse(body || '{}');
            const orderId = data.orderId;
            const amount = data.amount;
            const redirectUrl = data.redirectUrl;

            if (!orderId || !amount || !redirectUrl) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, message: 'Missing required parameters: orderId, amount, redirectUrl' }));
                return;
            }

            // Read settings from settings.json
            let settings = {};
            try {
                const settingsPath = path.join(process.cwd(), 'settings.json');
                if (fs.existsSync(settingsPath)) {
                    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                }
            } catch (err) {
                console.error('Error reading settings.json:', err);
            }

            // Fallbacks to default credentials provided by user
            const merchantId = settings.phonepeMerchantId || 'M23P2N630SNVS';
            const clientId = settings.phonepeClientId || 'SU2605131450590093051231';
            const clientSecret = settings.phonepeClientSecret || 'cab34e32-8fb5-4d6d-94be-7bcccc16c8cb';
            const isLive = settings.phonepeMode === 'live';

            // PhonePe API endpoints
            const tokenUrl = isLive 
                ? 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token'
                : 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token';

            const payUrl = isLive
                ? 'https://api.phonepe.com/apis/pg/checkout/v2/pay'
                : 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay';

            // Step 1: Request Access Token
            const tokenParams = new URLSearchParams();
            tokenParams.append('client_id', clientId);
            tokenParams.append('client_version', '1');
            tokenParams.append('client_secret', clientSecret);
            tokenParams.append('grant_type', 'client_credentials');

            console.log(`[PhonePe] Requesting token from: ${tokenUrl}`);
            const tokenRes = await makeRequest(
                tokenUrl,
                'POST',
                { 'Content-Type': 'application/x-www-form-urlencoded' },
                tokenParams.toString()
            );

            if (tokenRes.statusCode !== 200) {
                console.error('[PhonePe] Token Error Response:', tokenRes.body);
                res.statusCode = tokenRes.statusCode;
                res.end(JSON.stringify({ success: false, message: 'Failed to retrieve access token from PhonePe', details: tokenRes.body }));
                return;
            }

            const tokenData = JSON.parse(tokenRes.body);
            const accessToken = tokenData.access_token;
            if (!accessToken) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, message: 'Access token not found in PhonePe response' }));
                return;
            }

            // Step 2: Create Payment Session
            const amountInPaise = Math.round(parseFloat(amount) * 100);
            const payPayload = JSON.stringify({
                merchantOrderId: orderId,
                amount: amountInPaise,
                expireAfter: 900, // 15 mins
                paymentFlow: {
                    type: 'PG_CHECKOUT',
                    merchantUrls: {
                        redirectUrl: redirectUrl,
                        redirectMode: 'REDIRECT'
                    }
                }
            });

            console.log(`[PhonePe] Initiating checkout pay request to: ${payUrl}`);
            const payRes = await makeRequest(
                payUrl,
                'POST',
                {
                    'Content-Type': 'application/json',
                    'Authorization': `O-Bearer ${accessToken}`,
                    'X-Merchant-Id': merchantId
                },
                payPayload
            );

            if (payRes.statusCode !== 200) {
                console.error('[PhonePe] Pay Error Response:', payRes.body);
                res.statusCode = payRes.statusCode;
                res.end(JSON.stringify({ success: false, message: 'Failed to initiate payment with PhonePe', details: payRes.body }));
                return;
            }

            const payData = JSON.parse(payRes.body);
            if (payData && payData.redirectUrl) {
                console.log(`[PhonePe] Payment session created successfully. Redirect URL: ${payData.redirectUrl}`);
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, redirectUrl: payData.redirectUrl }));
            } else {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, message: 'No redirect URL returned by PhonePe', response: payData }));
            }

        } catch (err) {
            console.error('[PhonePe] Internal server error:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, message: 'Internal server error: ' + err.message }));
        }
    });
};
