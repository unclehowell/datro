Annexures
==========

An annexure is a supplement or appendix to a written document — an addition, often specifically referring to an addition to an official document.

Script Source
~~~~~~~~~~~~~~

The complete ``email_sender.cjs`` Node.js script (abridged — API key and recipient addresses omitted):

.. code-block:: javascript

   const fs = require('fs');
   const { Resend } = require('resend');

   // API key loaded from /home/ubuntu/.secrets/.env.resend
   const resend = new Resend(RESEND_API_KEY);

   const SUBJECT = 'Car Finance Cheque UK';
   const HTML_BODY = `Sirs/Madam,<br><br>Following the FCA's recent
   press release...`;

   async function sendOne() {
     const emails = fs
