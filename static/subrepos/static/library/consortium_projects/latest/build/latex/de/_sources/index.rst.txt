.. DATRO Consortium documentation master file

Welcome to Consortium Projects Documentation
=============================================

.. toctree::
   :maxdepth: 2
   :caption: Contents:

Overview
---------

The DATRO Consortium operates various projects focused on decentralized infrastructure,
community computing, and open collaboration. This document provides an overview of the
consortium projects including email marketing infrastructure.

Email Marketing Configuration
-----------------------------

This section documents the email marketing configuration used by the DATRO Consortium
for internal and external communications.

Service Configuration
~~~~~~~~~~~~~~~~~~~~~~

The consortium utilizes self-hosted email solutions for marketing campaigns:

- **Mail Server**: Self-hosted MTA (Mail Transfer Agent)
- **Campaign Management**: Custom dashboard for email campaign creation
- **Analytics**: Open source tracking for email open rates and engagement

Technical Setup
~~~~~~~~~~~~~~~

The email marketing infrastructure consists of:

1. **SMTP Configuration**
   - Primary MX servers
   - Backup MX servers  
   - SPF/DKIM/DMARC records

2. **Campaign Dashboard**
   - Template management
   - Recipient list handling
   - Scheduling capabilities

3. **Tracking & Analytics**
   - Open rate monitoring
   - Click-through tracking
   - Bounce handling

API Integration
~~~~~~~~~~~~~~~

The email marketing system exposes RESTful APIs for integration:

- ``POST /api/campaigns`` - Create new campaign
- ``GET /api/campaigns/{id}`` - Get campaign details
- ``POST /api/send`` - Send single email
- ``GET /api/analytics`` - Fetch analytics data

Best Practices
~~~~~~~~~~~~~~

- Always include unsubscribe links
- Use descriptive subject lines
- Test emails across multiple clients
- Monitor engagement metrics regularly
- Comply with CAN-SPAM and GDPR requirements

Consortium Projects
--------------------

Other key consortium projects include:

1. **HBNB** - Community vacation rental platform
2. **TechHouse** - Shared workspace infrastructure  
3. **Bloculus** - Decentralized social network
4. **Campus** - Educational resource sharing

License
-------

Copyright (c) 2026 DATRO Consortium. All rights reserved.
