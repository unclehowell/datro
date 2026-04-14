// File generated from our OpenAPI spec
import { StripeResource } from '../StripeResource.js';
export class BalanceTransactionResource extends StripeResource {
    /**
     * Returns a list of transactions that have contributed to the Stripe account balance (e.g., charges, transfers, and so forth). The transactions are returned in sorted order, with the most recent transactions appearing first.
     *
     * Note that this endpoint was previously called “Balance history” and used the path /v1/balance/history.
     */
    list(params, options) {
        return this._makeRequest('GET', '/v1/balance_transactions', params, options, {
            methodType: 'list',
        });
    }
    /**
     * Retrieves the balance transaction with the given ID.
     *
     * Note that this endpoint previously used the path /v1/balance/history/:id.
     */
    retrieve(id, params, options) {
        return this._makeRequest('GET', `/v1/balance_transactions/${id}`, params, options);
    }
}
//# sourceMappingURL=BalanceTransactions.js.map