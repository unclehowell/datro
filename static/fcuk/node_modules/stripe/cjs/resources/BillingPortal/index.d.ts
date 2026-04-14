import { Stripe } from '../../stripe.core.js';
import { BillingPortal as BillingPortalNamespace0, Configuration, ConfigurationResource } from './Configurations.js';
import { BillingPortal as BillingPortalNamespace1, Session, SessionResource } from './Sessions.js';
export { Configuration } from './Configurations.js';
export { Session } from './Sessions.js';
export declare class BillingPortal {
    private readonly stripe;
    configurations: ConfigurationResource;
    sessions: SessionResource;
    constructor(stripe: Stripe);
}
export declare namespace BillingPortal {
    export type ConfigurationListParams = BillingPortalNamespace0.ConfigurationListParams;
    export type ConfigurationCreateParams = BillingPortalNamespace0.ConfigurationCreateParams;
    export type ConfigurationRetrieveParams = BillingPortalNamespace0.ConfigurationRetrieveParams;
    export type ConfigurationUpdateParams = BillingPortalNamespace0.ConfigurationUpdateParams;
    export { Configuration };
    export type SessionCreateParams = BillingPortalNamespace1.SessionCreateParams;
    export { Session };
}
