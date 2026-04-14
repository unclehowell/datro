import { Stripe } from '../../stripe.core.js';
import { Sigma as SigmaNamespace0, ScheduledQueryRun, ScheduledQueryRunResource } from './ScheduledQueryRuns.js';
export { ScheduledQueryRun } from './ScheduledQueryRuns.js';
export declare class Sigma {
    private readonly stripe;
    scheduledQueryRuns: ScheduledQueryRunResource;
    constructor(stripe: Stripe);
}
export declare namespace Sigma {
    export type ScheduledQueryRunListParams = SigmaNamespace0.ScheduledQueryRunListParams;
    export type ScheduledQueryRunRetrieveParams = SigmaNamespace0.ScheduledQueryRunRetrieveParams;
    export { ScheduledQueryRun };
}
