import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const TIERS = {
  starter: { name: 'Starter Mint — ATS Resume Rewrite', amount: 2400 },
  pro: { name: 'Pro Mint — Resume + Cover Letter + LinkedIn', amount: 4900 },
  executive: { name: 'Executive Mint — Full Suite + 30-60-90 Day Pitch', amount: 8900 }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tierId, email } = req.body;
    const tier = TIERS[tierId] || TIERS.pro;
    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: tier.name },
            unit_amount: tier.amount,
          },
          quantity: 1,
        },
      ],
      metadata: { tierId },
      success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}&tier=${tierId}`,
      cancel_url: `${origin}/?canceled=true`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
