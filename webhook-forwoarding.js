import SmeeClient from 'smee-client';

import 'dotenv/config';

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

if (!process.env.SMEE_CLIENT_URL || !process.env.WEBHOOK_FORWARD_PROTOCOL) {
  console.log(
    'Missing SMEE_CLIENT_URL and/or WEBHOOK_FORWARD_PROTOCOL env vars',
  );
  process.exit();
}

// Smee client FW
const smee = new SmeeClient({
  source: process.env.SMEE_CLIENT_URL,
  target: process.env.WEBHOOK_FORWARD_PROTOCOL,
  logger: console,
});

smee.start();
