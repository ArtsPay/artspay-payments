import { NextResponse } from 'next/server';
import { handleWebhook } from '../../../lib/webhook';

// Optional: see lib/webhook.js. Adjust this route's folder name to whatever
// your own webhook URL should be, or delete it entirely if you don't need
// webhooks.
export async function POST(request) {
  const body = await request.json();
  handleWebhook(body);
  return NextResponse.json({ received: true });
}
