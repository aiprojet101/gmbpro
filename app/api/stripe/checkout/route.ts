import { NextRequest, NextResponse } from "next/server";

const PRICES: Record<string, { amount: number; mode: "payment" | "subscription"; label: string }> = {
  starter: {
    amount: parseInt(process.env.GMBPRO_STRIPE_STARTER_PRICE || "2900"),
    mode: "payment",
    label: "GmbPro Starter - Audit + Refonte",
  },
  pro: {
    amount: parseInt(process.env.GMBPRO_STRIPE_PRO_PRICE || "3900"),
    mode: "subscription",
    label: "GmbPro Pro - Suivi SEO + Posts IA",
  },
  premium: {
    amount: parseInt(process.env.GMBPRO_STRIPE_PREMIUM_PRICE || "5900"),
    mode: "subscription",
    label: "GmbPro Premium - Reputation",
  },
};

/* Simple rate limiter */
const rateLimitMap = new Map<string, number[]>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const window = 60_000; // 1 min
  const max = 5;
  const hits = (rateLimitMap.get(ip) || []).filter((t) => now - t < window);
  if (hits.length >= max) return true;
  hits.push(now);
  rateLimitMap.set(ip, hits);
  return false;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GMBPRO_STRIPE_SECRET_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Stripe API key not configured" }, { status: 500 });
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Trop de requetes, reessayez dans une minute" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { plan, email, businessName, city } = body as {
      plan: string; email: string; businessName: string; city: string;
    };

    if (!plan || !email || !businessName) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const config = PRICES[plan];
    if (!config) {
      return NextResponse.json({ error: "Forfait invalide" }, { status: 400 });
    }

    const origin = req.nextUrl.origin;
    const params = new URLSearchParams();
    params.append("mode", config.mode);
    params.append("customer_email", email);
    params.append("success_url", `${origin}/success?session_id={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${origin}/scanner/resultats`);
    params.append("metadata[businessName]", businessName);
    params.append("metadata[city]", city || "");
    params.append("metadata[plan]", plan);

    // Price data inline
    params.append("line_items[0][price_data][currency]", "eur");
    params.append("line_items[0][price_data][product_data][name]", config.label);
    params.append("line_items[0][price_data][unit_amount]", String(config.amount));
    params.append("line_items[0][quantity]", "1");

    if (config.mode === "subscription") {
      params.append("line_items[0][price_data][recurring][interval]", "month");
    }

    // Allow promo codes (champ "Code promo" sur la page checkout)
    params.append("allow_promotion_codes", "true");

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[Stripe checkout error]", data);
      return NextResponse.json({ error: data.error?.message || "Erreur Stripe" }, { status: 400 });
    }

    return NextResponse.json({ url: data.url });
  } catch (err) {
    console.error("[Checkout error]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
