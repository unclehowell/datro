"use strict";
// File generated from our OpenAPI spec
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonTokenResource = void 0;
const StripeResource_js_1 = require("../../../../StripeResource.js");
class PersonTokenResource extends StripeResource_js_1.StripeResource {
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
exports.PersonTokenResource = PersonTokenResource;
//# sourceMappingURL=PersonTokens.js.map