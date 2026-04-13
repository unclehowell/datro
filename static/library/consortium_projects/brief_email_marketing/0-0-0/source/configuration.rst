Configuration
==============

Cron Schedule
~~~~~~~~~~~~~~

The sender is invoked every 2 minutes via the ubuntu user's crontab:

.. code-block:: bash

   */2 * * * * cd /home/ubuntu && \
     /home/ubuntu/.nvm/versions/node/v22.22.2/bin/node \
     /home/ubuntu/email_sender.cjs >> /home/ubuntu/email_send.log 2>&1

Each invocation sends exactly **one email** then exits. This keeps the system lightweight and avoids overlapping processes.

API Credentials
~~~~~~~~~~~~~~~~

The Resend API key is stored in a dedicated secrets file, not hardcoded:

.. code-block:: text

   Location: /home/ubuntu/.secrets/.env.resend
   Format:   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

The script reads this file at runtime using a ``loadApiKey()`` function with a fallback to the ``RESEND_API_KEY`` environment variable.

Send Logic
~~~~~~~~~~~

The script (``email_sender.cjs``) follows this logic on each invocation:

1. Load the API key from ``.secrets/.env.resend``
2. Read ``email_list.txt`` into memory, filtering invalid addresses
3. Read the current index from ``email_progress.txt``
4. If index ≥ list length, reset to 0 and log cycle completion
5. Send one email to ``emails[index]`` via the Resend SDK
6. Log result (SENT with message ID, or FAILED with error)
7. Increment and save index to ``email_progress.txt``
8. Exit

Progress Tracking
~~~~~~~~~~~~~~~~~~

Progress survives server reboots and script restarts. The file ``email_progress.txt`` stores a single integer — the zero-based index of the next email to send. On completion of the full list, it resets to 0 and begins cycling again.

Resend SDK Call
~~~~~~~~~~~~~~~~

The SDK invocation per email:

.. code-block:: javascript

   const result = await resend.emails.send({
     from: 'noreply@car.financecheque.uk',
     to: email,
     subject: 'Car Finance Cheque UK',
     html: HTML_BODY
   });

SSL / Domain
~~~~~~~~~~~~~

The campaign domain ``car.financecheque.uk`` has a custom SSL certificate provisioned on the server:

.. code-block:: text

   Certificate: /home/ubuntu/carfinancecheque.crt
   Private key: /home/ubuntu/carfinancecheque.key
