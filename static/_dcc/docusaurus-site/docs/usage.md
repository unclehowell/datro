# Usage

This section details how to use the main features of the Debt Cancellation Circle (DCC) application.

## Accessing the Application

After setting up and running the development server (see [Getting Started](./getting-started.md)), navigate to the root of the application in your browser. You should see a welcome page:

*   **Welcome Page:** `index.html`
    *   Features a single link: "Open Wallet/Ledger".

Clicking "Open Wallet/Ledger" will take you to the main functional page.

## Opening the Wallet/Ledger

On the welcome page, click the "Open Wallet/Ledger" link. This will load `wallet_ledger.html`.

### `wallet_ledger.html`

This page allows you to generate and manage IoU (I Owe You) and UoMe (You Owe Me) records.

#### Generating an IoU (I Owe You)

1.  **Enter Recipient Details:**
    *   **To:** The name or ID of the person you owe.
    *   **Recipient Email:** The email address of the person you owe (this is where the IoU request will be sent).
    *   **Amount:** The amount you owe (e.g., `100 USD`).
    *   **Description:** A brief reason for the debt.

2.  **Click "Generate IoU":**
    This action will:
    *   Create a structured data object with the IoU details.
    *   Base64 encode this data.
    *   Construct a `mailto:` link that, when clicked, will open your default email client (or Gmail in a new tab) with:
        *   The recipient's email in the 'To' field.
        *   `dcc@datro.xyz` in the BCC field.
        *   A subject line indicating the IoU request.
        *   The base64 encoded IoU details in the email body.
        *   Your email address (`my-email@example.com` - **remember to replace this placeholder!**) as the reply-to address.

    **Example Code Snippet (JavaScript):**
    ```javascript
    function prepareIoUMailto() {
        const to = document.getElementById('iou_to').value;
        const email = document.getElementById('iou_email').value;
        const amount = document.getElementById('iou_amount').value;
        const description = document.getElementById('iou_description').value;
        // ... (rest of the logic to construct data and mailto link)

        const iouData = {
            type: "iou",
            to: to,
            amount: amount,
            description: description,
            date: new Date().toISOString(),
            sender_reply_email: MY_EMAIL
        };
        const encodedData = btoa(JSON.stringify(iouData)); // Using btoa for Base64 encoding
        // ... construct mailtoLink ...
    }
    ```

#### Generating a UoMe (You Owe Me)

1.  **Enter Sender Details:**
    *   **From:** The name or ID of the person who owes you.
    *   **Recipient Email:** The email address of the person who owes you (this email will prompt them to confirm the debt).
    *   **Amount:** The amount they owe you (e.g., `50 EUR`).
    *   **Description:** A brief reason for the debt.

2.  **Click "Generate UoMe":**
    Similar to IoU generation, this will:
    *   Create a structured data object for the UoMe.
    *   Base64 encode this data.
    *   Construct a `mailto:` link to open your email client.
    *   The email will be addressed to the recipient, BCC'd to `dcc@datro.xyz`, and will contain the UoMe details and encoded confirmation data.

    **Example Code Snippet (JavaScript):**
    ```javascript
    function prepareUoMeMailto() {
        const from = document.getElementById('uome_from').value;
        const email = document.getElementById('uome_email').value;
        const amount = document.getElementById('uome_amount').value;
        const description = document.getElementById('uome_description').value;
        // ... (rest of the logic)

        const uomeData = {
            type: "uome",
            from: from,
            amount: amount,
            description: description,
            date: new Date().toISOString(),
            recipient_reply_email: MY_EMAIL
        };
        const encodedData = btoa(JSON.stringify(uomeData));
        // ... construct mailtoLink ...
    }
    ```

*Note: The recipient will need to manually process the email and potentially interact with a similar web application to confirm or reject the debt. The confirmation response mechanism is conceptual in this static HTML implementation.* 

## Client-Side Caching

This application conceptually uses client-side caching to store ledger data. In a full implementation, this would involve using browser `localStorage` or `sessionStorage` to persist data across sessions without needing a server.
