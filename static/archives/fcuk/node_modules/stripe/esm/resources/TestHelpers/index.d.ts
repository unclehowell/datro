import { Stripe } from '../../stripe.core.js';
import { ConfirmationTokenResource } from './ConfirmationTokens.js';
import { CustomerResource } from './Customers.js';
import { RefundResource } from './Refunds.js';
import { TestHelpers as TestHelpersNamespace3, TestClock, TestClockResource } from './TestClocks.js';
import { Issuing } from './Issuing/index.js';
import { Terminal } from './Terminal/index.js';
import { Treasury } from './Treasury/index.js';
export { TestClock } from './TestClocks.js';
export declare class TestHelpers {
    private readonly stripe;
    confirmationTokens: ConfirmationTokenResource;
    customers: CustomerResource;
    refunds: RefundResource;
    testClocks: TestClockResource;
    issuing: Issuing;
    terminal: Terminal;
    treasury: Treasury;
    constructor(stripe: Stripe);
}
export declare namespace TestHelpers {
    export type TestClockDeleteParams = TestHelpersNamespace3.TestClockDeleteParams;
    export type TestClockRetrieveParams = TestHelpersNamespace3.TestClockRetrieveParams;
    export type TestClockListParams = TestHelpersNamespace3.TestClockListParams;
    export type TestClockCreateParams = TestHelpersNamespace3.TestClockCreateParams;
    export type TestClockAdvanceParams = TestHelpersNamespace3.TestClockAdvanceParams;
    export { TestClock };
    export { Issuing };
    export { Terminal };
    export { Treasury };
}
