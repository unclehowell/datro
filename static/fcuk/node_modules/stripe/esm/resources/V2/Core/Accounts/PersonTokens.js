// File generated from our OpenAPI spec
import { StripeResource } from '../../../../StripeResource.js';
export class PersonTokenResource extends StripeResource {
    /**
     * Creates a Person Token associated with an Account.
     * @throws Stripe.RateLimitError
     */
    create(id, params, options) {
        return this._makeRequest('POST', `/v2/core/accounts/${id}/person_tokens`, params, options, {
            requestSchema: {
                kind: 'object',
                fields: {
                    relationship: {
                        kind: 'object',
                        fields: { percent_ownership: { kind: 'decimal_string' } },
                    },
                },
            },
        });
    }
    /**
     * Retrieves a Person Token associated with an Account.
     * @throws Stripe.RateLimitError
     */
    retrieve(accountId, id, params, options) {
        return this._makeRequest('GET', `/v2/core/accounts/${accountId}/person_tokens/${id}`, params, options);
    }
}
//# sourceMappingURL=PersonTokens.js.map