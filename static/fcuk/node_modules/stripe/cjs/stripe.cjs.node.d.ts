import { Stripe } from './stripe.core.js';
type StripeCallableConstructor = typeof Stripe & {
    (key: string, config?: Record<string, unknown>): Stripe;
};
declare const StripeConstructor: StripeCallableConstructor;
declare namespace StripeConstructor {
    type Stripe = import('./stripe.core.js').Stripe;
}
export = StripeConstructor;
