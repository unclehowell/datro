// File generated from our OpenAPI spec
import { StripeResource } from '../../../StripeResource.js';
export class AccountTokenResource extends StripeResource {
    /**
     * Creates an Account Token.
     * @throws Stripe.RateLimitError
     */
    create(params, options) {
        return this._makeRequest('POST', '/v2/core/account_tokens', params, options, {
            requestSchema: {
                kind: 'object',
                fields: {
                    identity: {
                        kind: 'object',
                        fields: {
                            individual: {
                                kind: 'object',
                                fields: {
                                    relationship: {
                                        kind: 'object',
                                        fields: { percent_ownership: { kind: 'decimal_string' } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }
    /**
     * Retrieves an Account Token.
     * @throws Stripe.RateLimitError
     */
    retrieve(id, params, options) {
        return this._makeRequest('GET', `/v2/core/account_tokens/${id}`, params, options);
    }
}
//# sourceMappingURL=AccountTokens.js.map