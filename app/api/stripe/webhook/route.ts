import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHmac } from "crypto";
import { Resend } from "resend";
import { generateWelcomeEmail } from "../../../lib/welcome-email";

const FROM = "GmbPro <contact@gmbpro.fr>";

function planAmount(plan: string | undefined): string {
  if (plan === "starter") return "29€";
  if (plan === "pro") return "39€/mois";
  if (plan === "premium") return "59€/mois";
  return "";
}

async function sendWelcomeEmail(opts: {
  email: string;
  business_name: string;
  plan: string;
}): Promise<void> {
  const apiKey = process.env.GMBPRO_RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Webhook] GMBPRO_RESEND_API_KEY missing — welcome email skipped");
    return;
  }
  const planNorm = (["starter", "pro", "premium"].includes(opts.plan)
    ? opts.plan
    : "starter") as "starter" | "pro" | "premium";
  const { subject, html, text } = generateWelcomeEmail({
    business_name: opts.business_name || "votre etablissement",
    email: opts.email,
    plan: planNorm,
    amount: planAmount(planNorm),
  });
  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: FROM,
      to: [opts.email],
      subject,
      html,
      text,
    });
    if (result.error) {
      console.error("[Webhook] Welcome email Resend error:", result.error.message);
    } else {
      console.log("[Webhook] Welcome email sent:", result.data?.id);
    }
  } catch (e) {
    console.error("[Webhook] Welcome email exception:", e instanceof Error ? e.message : e);
  }
}

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
      const email: string | undefined =
        session.customer_email || session.customer_details?.email || session.metadata?.email;
      const plan: string = session.metadata?.plan || "starter";
      const business_name: string =
        session.metadata?.businessName || session.metadata?.business_name || "";
      console.log("[Webhook] Nouveau client:", {
        email,
        plan,
        business: business_name,
        city: session.metadata?.city,
      });
      if (email) {
        // Don't fail the webhook if email fails — log and continue
        await sendWelcomeEmail({ email, business_name, plan });
      }
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
