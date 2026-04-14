// File generated from our OpenAPI spec
import { StripeResource } from '../../StripeResource.js';
export class CreditGrantResource extends StripeResource {
    /**
     * Retrieve a list of credit grants.
     */
    list(params, options) {
        return this._makeRequest('GET', '/v1/billing/credit_grants', params, options, {
            methodType: 'list',
        });
    }
    /**
     * Creates a credit grant.
     */
    create(params, options) {
        return this._makeRequest('POST', '/v1/billing/credit_grants', params, options);
    }
    /**
     * Retrieves a credit grant.
     */
    retrieve(id, params, options) {
        return this._makeRequest('GET', `/v1/billing/credit_grants/${id}`, params, options);
    }
    /**
     * Updates a credit grant.
     */
    update(id, params, options) {
        return this._makeRequest('POST', `/v1/billing/credit_grants/${id}`, params, options);
    }
    /**
     * Expires a credit grant.
     */
    expire(id, params, options) {
        return this._makeRequest('POST', `/v1/billing/credit_grants/${id}/expire`, params, options);
    }
    /**
     * Voids a credit grant.
     */
    voidGrant(id, params, options) {
        return this._makeRequest('POST', `/v1/billing/credit_grants/${id}/void`, params, options);
    }
}
//# sourceMappingURL=CreditGrants.js.map