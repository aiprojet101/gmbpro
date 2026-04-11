import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.GMBPRO_STRIPE_SECRET_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Stripe API key not configured" }, { status: 500 });
  }

  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id requis" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    const session = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: session.error?.message || "Session invalide" }, { status: 400 });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({ ok: false, error: "Paiement non confirme" }, { status: 402 });
    }

    return NextResponse.json({
      ok: true,
      plan: session.metadata?.plan,
      email: session.customer_email,
      businessName: session.metadata?.businessName,
      mode: session.mode,
    });
  } catch (err) {
    console.error("[Verify error]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
