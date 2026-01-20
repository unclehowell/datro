# API Reference

This project primarily uses client-side JavaScript and the `mailto:` protocol for external communication. There are no traditional server-side API endpoints exposed or consumed by this application as currently implemented.

## `mailto:` Protocol

The application utilizes the `mailto:` URL scheme to generate pre-filled emails for initiating IoU and UoMe transactions. This protocol relies on the user's default email client to send the email.

### IoU Generation (`wallet_ledger.html`)

When an IoU is generated, a `mailto:` link is created that includes:

*   **To:** Recipient's email address.
*   **BCC:** `dcc@datro.xyz`.
*   **Subject:** Automatically generated (e.g., `IoU Request - [Amount]`).
*   **Body:** Contains the transaction details (to, amount, description, date) base64 encoded, and your designated reply-to email address.

**Example `mailto:` URL structure:**

```
mailto:<recipient_email>?bcc=dcc@datro.xyz&subject=<encoded_subject>&body=<encoded_body_with_base64_data>
```

### UoMe Generation (`wallet_ledger.html`)

Similarly, for UoMe generation, a `mailto:` link is constructed with:

*   **To:** The email address of the person who owes you.
*   **BCC:** `dcc@datro.xyz`.
*   **Subject:** Automatically generated (e.g., `UoMe Request - [Amount]`).
*   **Body:** Contains the UoMe details (from, amount, description, date) base64 encoded, and your designated reply-to email address.

## Client-Side Data Handling

All data processing for IoU/UoMe generation and encoding occurs within the browser using JavaScript. The `btoa()` function is used for Base64 encoding. In a more robust implementation, this data would be used to trigger actions within a web application running on the recipient's side, or a server would process confirmation emails.
