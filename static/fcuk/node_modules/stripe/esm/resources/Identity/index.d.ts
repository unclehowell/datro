import { Stripe } from '../../stripe.core.js';
import { Identity as IdentityNamespace0, VerificationReport, VerificationReportResource } from './VerificationReports.js';
import { Identity as IdentityNamespace1, VerificationSession, VerificationSessionResource } from './VerificationSessions.js';
export { VerificationReport } from './VerificationReports.js';
export { VerificationSession } from './VerificationSessions.js';
export declare class Identity {
    private readonly stripe;
    verificationReports: VerificationReportResource;
    verificationSessions: VerificationSessionResource;
    constructor(stripe: Stripe);
}
export declare namespace Identity {
    export type VerificationReportListParams = IdentityNamespace0.VerificationReportListParams;
    export type VerificationReportRetrieveParams = IdentityNamespace0.VerificationReportRetrieveParams;
    export { VerificationReport };
    export type VerificationSessionListParams = IdentityNamespace1.VerificationSessionListParams;
    export type VerificationSessionCreateParams = IdentityNamespace1.VerificationSessionCreateParams;
    export type VerificationSessionRetrieveParams = IdentityNamespace1.VerificationSessionRetrieveParams;
    export type VerificationSessionUpdateParams = IdentityNamespace1.VerificationSessionUpdateParams;
    export type VerificationSessionCancelParams = IdentityNamespace1.VerificationSessionCancelParams;
    export type VerificationSessionRedactParams = IdentityNamespace1.VerificationSessionRedactParams;
    export { VerificationSession };
}
