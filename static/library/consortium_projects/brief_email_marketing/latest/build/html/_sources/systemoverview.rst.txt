System Overview
================

Architecture
~~~~~~~~~~~~~

The email marketing system is a lightweight, self-contained pipeline running entirely on a single AWS EC2 instance. There are no external services beyond the Resend.com API.

.. code-block:: text

   ┌─────────────────────────────────────────────┐
   │           AWS EC2 (Ubuntu 24.04)            │
   │                                             │
   │  cron (*/2 * * * *)                         │
   │       │                                     │
   │       ▼                                     │
   │  email_sender.cjs  (Node.js v22)            │
   │       │                                     │
   │       ├── reads  email_list.txt             │
   │       ├── reads  email_progress.txt         │
   │       ├── reads  .secrets/.env.resend       │
   │       │                                     │
   │       ▼                                     │
   │  Resend SDK  ──────────────────────────────►│ api.resend.com
   │       │                                     │
   │       ▼                                     │
   │  email_send.log  (appended per send)        │
   │  email_progress.txt  (index updated)        │
   └─────────────────────────────────────────────┘

File Dependencies
~~~~~~~~~~~~~~~~~~

The following files are non-standard (not part of a base Ubuntu install) and constitute the complete system:

.. code-block:: text

   /home/ubuntu/
   ├── email_sender.cjs          # Main Node.js sender script
   ├── email_list.txt            # Recipient list (6,369 addresses)
   ├── email_progress.txt        # Current send index (integer)
   ├── email_send.log            # Per-send audit log
   ├── .secrets/
   │   └── .env.resend           # Resend API key (RESEND_API_KEY=...)
   └── node_modules/
       └── resend/               # Resend Node.js SDK

Email Body
~~~~~~~~~~~

The HTML email body sent to each recipient is as follows:

.. code-block:: html

   Sirs/Madam,<br><br>
   Following the FCA's recent press release, many individuals may now
   be eligible to make a claim relating to car finance agreements.
   <br><br>
   You can quickly check your eligibility here:<br>
   <a href="https://car.financecheque.uk">https://car.financecheque.uk</a>
   <br><br>
   Kind regards,<br>
   Sion Buckler<br>
   Founder &amp; CEO<br>
   DATRO Consortium Ltd<br>
   +44 203 137 7118

Node.js Runtime
~~~~~~~~~~~~~~~~

The system uses Node.js v22.22.2, managed via ``nvm`` (Node Version Manager):

.. code-block:: text

   Runtime:  Node.js v22.22.2
   Manager:  nvm (Node Version Manager)
   Binary:   /home/ubuntu/.nvm/versions/node/v22.22.2/bin/node
   Package:  resend (npm SDK)
