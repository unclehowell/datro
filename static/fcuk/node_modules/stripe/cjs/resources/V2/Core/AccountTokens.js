"use strict";
// File generated from our OpenAPI spec
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountTokenResource = void 0;
const StripeResource_js_1 = require("../../../StripeResource.js");
class AccountTokenResource extends StripeResource_js_1.StripeResource {
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
exports.AccountTokenResource = AccountTokenResource;
//# sourceMappingURL=AccountTokens.js.map