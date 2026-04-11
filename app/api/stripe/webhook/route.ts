import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHmac } from "crypto";

function verifyStripeSignature(payload: string, sigHeader: string, secret: string): boolean {
  const parts = sigHeader.split(",").reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split("=");
    acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts["t"];
  const sig = parts["v1"];
  if (!timestamp || !sig) return false;

  // Reject if older than 5 minutes
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp);
  if (age > 300) return false;

  const expected = createHmac("sha256", secret.trim())
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.GMBPRO_STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Webhook] GMBPRO_STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  if (!verifyStripeSignature(rawBody, sig, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.log("[Webhook] Nouveau client:", {
        email: session.customer_email,
        plan: session.metadata?.plan,
        business: session.metadata?.businessName,
        city: session.metadata?.city,
      });
      // TODO: send welcome email via Resend
      // TODO: create customer record in DB
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      console.log("[Webhook] Annulation abonnement:", sub.id);
      // TODO: update customer record
      break;
    }
    default:
      console.log("[Webhook] Event ignore:", event.type);
  }

  return NextResponse.json({ received: true });
}
