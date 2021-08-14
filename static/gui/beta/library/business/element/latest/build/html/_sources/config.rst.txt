config
------------------------------------------------------------------------
.. role:: raw-html-m2r(raw)
   :format: html


Configuration
=============

You can configure the app by copying ``config.sample.json`` to
``config.json`` and customising it:

For a good example, see https://develop.element.io/config.json.


#. ``default_server_config`` sets the default homeserver and identity server URL for
   Element to use. The object is the same as returned by `https://\ :raw-html-m2r:`<server_name>`\ /.well-known/matrix/client <https://matrix.org/docs/spec/client_server/latest.html#get-well-known-matrix-client>`_\ ,
   with added support for a ``server_name`` under the ``m.homeserver`` section to display
   a custom homeserver name. Alternatively, the config can contain a ``default_server_name``
   instead which is where Element will go to get that same object, although this option is
   deprecated - see the ``.well-known`` link above for more information on using this option.
   Note that the ``default_server_name`` is used to get a complete server configuration
   whereas the ``server_name`` in the ``default_server_config`` is for display purposes only.

   * *Note*\ : The URLs can also be individually specified as ``default_hs_url`` and
     ``default_is_url``\ , however these are deprecated. They are maintained for backwards
     compatibility with older configurations. ``default_is_url`` is respected only
     if ``default_hs_url`` is used.
   * Element will fail to load if a mix of ``default_server_config``\ , ``default_server_name``\ , or
     ``default_hs_url`` is specified. When multiple sources are specified, it is unclear
     which should take priority and therefore the application cannot continue.
   * As of Element 1.4.0, identity servers are optional. See `Identity servers <#identity-servers>`_ below.

#. ``sso_immediate_redirect``\ : When ``true``\ , Element will assume the default server supports SSO
   and attempt to send the user there to continue (if they aren't already logged in). Default
   ``false``. Note that this disables all usage of the welcome page.
#. ``features``\ : Lookup of optional features that may be force-enabled (\ ``true``\ ) or force-disabled (\ ``false``\ ).
   When features are not listed here, their defaults will be used, and users can turn them on/off if ``showLabsSettings``
   allows them to. The available optional experimental features vary from release to release and are
   `documented <labs.md>`_. The feature flag process is `documented <feature-flags.md>`_ as well.
#. ``showLabsSettings``\ : Shows the "labs" tab of user settings. Useful to allow users to turn on experimental features
   they might not otherwise have access to.
#. ``brand``\ : String to pass to your homeserver when configuring email notifications, to let the
   homeserver know what email template to use when talking to you.
#. `branding`: Configures various branding and logo details, such as:

   #. ``welcomeBackgroundUrl``\ : An image to use as a wallpaper outside the app
      during authentication flows. If an array is passed, an image is chosen randomly for each visit.
   #. ``authHeaderLogoUrl``\ : An logo image that is shown in the header during
      authentication flows
   #. `authFooterLinks`: a list of links to show in the authentication page footer:
      ``[{"text": "Link text", "url": "https://link.target"}, {"text": "Other link", ...}]``

#. ``reportEvent``\ : Configures the dialog for reporting content to the homeserver
   admin.

   #. ``adminMessageMD``\ : An extra message to show on the reporting dialog to
      mention homeserver-specific policies. Accepts Markdown.

#. ``integrations_ui_url``\ : URL to the web interface for the integrations server. The integrations
   server is not Element and normally not your homeserver either. The integration server settings
   may be left blank to disable integrations.
#. ``integrations_rest_url``\ : URL to the REST interface for the integrations server.
#. ``integrations_widgets_urls``\ : list of URLs to the REST interface for the widget integrations server.
#. ``bug_report_endpoint_url``\ : endpoint to send bug reports to (must be running a
   https://github.com/matrix-org/rageshake server). Bug reports are sent when a user clicks
   "Send Logs" within the application. Bug reports can be disabled/hidden by leaving the
   ``bug_report_endpoint_url`` out of your config file.
#. ``roomDirectory``\ : config for the public room directory. This section is optional.
#. ``roomDirectory.servers``\ : List of other homeservers' directories to include in the drop
   down list. Optional.
#. ``default_theme``\ : name of theme to use by default (e.g. 'light')
#. ``update_base_url`` (electron app only): HTTPS URL to a web server to download
   updates from. This should be the path to the directory containing ``macos``
   and ``win32`` (for update packages, not installer packages).
#. `piwik`: Analytics can be disabled by setting `piwik: false\ ``or by leaving the piwik config
   option out of your config file. If you want to enable analytics, set``\ piwik` to be an object
   containing the following properties:

   #. ``url``\ : The URL of the Piwik instance to use for collecting analytics
   #. ``whitelistedHSUrls``\ : a list of HS URLs to not redact from the analytics
   #. ``whitelistedISUrls``\ : a list of IS URLs to not redact from the analytics
   #. ``siteId``\ : The Piwik Site ID to use when sending analytics to the Piwik server configured above

#. ``welcomeUserId``\ : the user ID of a bot to invite whenever users register that can give them a tour
#. ``embeddedPages``\ : Configures the pages displayed in portions of Element that
   embed static files, such as:

   #. ``welcomeUrl``\ : Initial content shown on the outside of the app when not
      logged in. Defaults to ``welcome.html`` supplied with Element.
   #. ``homeUrl``\ : Content shown on the inside of the app when a specific room is
      not selected. By default, no home page is configured. If one is set, a
      button to access it will be shown in the top left menu.
   #. ``loginForWelcome``\ : Overrides ``welcomeUrl`` to make the welcome page be the
      same page as the login page when ``true``. This effectively disables the
      welcome page.

#. ``defaultCountryCode``\ : The ISO 3166 alpha2 country code to use when showing
   country selectors, like the phone number input on the registration page.
   Defaults to ``GB`` if the given code is unknown or not provided.
#. ``settingDefaults``\ :  Defaults for settings that support the ``config`` level,
   as an object mapping setting name to value (note that the "theme" setting
   is special cased to the ``default_theme`` in the config file).
#. ``disable_custom_urls``\ : disallow the user to change the
   default homeserver when signing up or logging in.
#. ``permalinkPrefix``\ : Used to change the URL that Element generates permalinks with.
   By default, this is "https://matrix.to" to generate matrix.to (spec) permalinks.
   Set this to your Element instance URL if you run an unfederated server (eg:
   "https://element.example.org").
#. ``jitsi``\ : Used to change the default conference options. Learn more about the
   Jitsi options at `jitsi.md <./jitsi.md>`_.

   #. ``preferredDomain``\ : The domain name of the preferred Jitsi instance. Defaults
      to ``jitsi.riot.im``. This is used whenever a user clicks on the voice/video
      call buttons - integration managers may use a different domain.

#. ``enable_presence_by_hs_url``\ : The property key should be the URL of the homeserver
    and its value defines whether to enable/disable the presence status display
    from that homeserver. If no options are configured, presence is shown for all
    homeservers.
#. ``disable_guests``\ : Disables guest access tokens and auto-guest registrations.
    Defaults to false (guests are allowed).
#. ``disable_login_language_selector``\ : Disables the login language selector. Defaults
    to false (language selector is shown).
#. ``disable_3pid_login``\ : Disables 3rd party identity options on login and registration form
    Defaults to false (3rd party identity options are shown).
#. ``default_federate``\ : Default option for room federation when creating a room
    Defaults to true (room federation enabled).
#. ``desktopBuilds``\ : Used to alter promotional links to the desktop app. By default
   the builds are considered available and accessible from https://element.io. This
   config option is typically used in the context of encouraging encrypted message
   search capabilities (Seshat). All the options listed below are required if this
   option is specified.

   #. ``available``\ : When false, the desktop app will not be promoted to the user.
   #. ``logo``\ : An HTTP URL to the avatar for the desktop build. Should be 24x24, ideally
      an SVG.
   #. ``url``\ : An HTTP URL for where to send the user to download the desktop build.

#. ``mobileBuilds``\ : Used to alter promotional links to the mobile app. By default the
   builds are considered available and accessible from https://element.io. This config
   option is typically used in a context of encouraging the user to try the mobile app
   instead of a mobile/incompatible browser.

   #. ``ios``\ : The URL to the iOS build. If ``null``\ , it will be assumed to be not available.
       If not set, the default element.io builds will be used.
   #. ``android``\ : The URL to the Android build. If ``null``\ , it will be assumed to be not available.
       If not set, the default element.io builds will be used.
   #. ``fdroid``\ : The URL to the FDroid build. If ``null``\ , it will be assumed to be not available.
      If not set, the default element.io builds will be used.

#. ``mobileGuideToast``\ : Whether to show a toast a startup which nudges users on
   iOS and Android towards the native mobile apps. The toast redirects to the
   mobile guide if they accept. Defaults to false.
#. ``audioStreamUrl``\ : If supplied, show an option on Jitsi widgets to stream
   audio using Jitsi's live streaming feature. This option is experimental and
   may be removed at any time without notice.
#. ``voip``\ : Behaviour related to calls

   #. ``obeyAssertedIdentity``\ : If set, MSC3086 asserted identity messages sent
      on VoIP calls will cause the call to appear in the room corresponding to the
      asserted identity. This *must* only be set in trusted environments.

#. `posthog`: [Posthog](https://posthog.com/) integration config. If not set, Posthog analytics are disabled.

   #. ``projectApiKey``\ : The Posthog project API key
   #. ``apiHost``\ : The Posthog API host

Note that ``index.html`` also has an og:image meta tag that is set to an image
hosted on riot.im. This is the image used if links to your copy of Element
appear in some websites like Facebook, and indeed Element itself. This has to be
static in the HTML and an absolute URL (and HTTP rather than HTTPS), so it's
not possible for this to be an option in config.json. If you'd like to change
it, you can build Element, but run
``RIOT_OG_IMAGE_URL="http://example.com/logo.png" yarn build``.
Alternatively, you can edit the ``og:image`` meta tag in ``index.html`` directly
each time you download a new version of Element.

Identity servers
================

The identity server is used for inviting other users to a room via third party
identifiers like emails and phone numbers. It is not used to store your password
or account information.

As of Element 1.4.0, all identity server functions are optional and you are
prompted to agree to terms before data is sent to the identity server.

Element will check multiple sources when looking for an identity server to use in
the following order of preference:


#. The identity server set in the user's account data

   * For a new user, no value is present in their account data. It is only set
     if the user visits Settings and manually changes their identity server.

#. The identity server provided by the ``.well-known`` lookup that occurred at
   login
#. The identity server provided by the Riot config file

If none of these sources have an identity server set, then Element will prompt the
user to set an identity server first when attempting to use features that
require one.

Currently, the only two public identity servers are https://vector.im and
https://matrix.org, however in the future identity servers will be
decentralised.

Desktop app configuration
=========================

See https://github.com/vector-im/element-desktop#user-specified-configjson

UI Features
===========

Parts of the UI can be disabled using UI features. These are settings which appear
under ``settingDefaults`` and can only be ``true`` (default) or ``false``. When ``false``\ ,
parts of the UI relating to that feature will be disabled regardless of the user's
preferences.

Currently, the following UI feature flags are supported:


* ``UIFeature.urlPreviews`` - Whether URL previews are enabled across the entire application.
* ``UIFeature.feedback`` - Whether prompts to supply feedback are shown.
* ``UIFeature.voip`` - Whether or not VoIP is shown readily to the user. When disabled,
  Jitsi widgets will still work though they cannot easily be added.
* ``UIFeature.widgets`` - Whether or not widgets will be shown.
* ``UIFeature.flair`` - Whether or not community flair is shown in rooms.
* ``UIFeature.communities`` - Whether or not to show any UI related to communities. Implicitly
  disables ``UIFeature.flair`` when disabled.
* ``UIFeature.advancedSettings`` - Whether or not sections titled "advanced" in room and
  user settings are shown to the user.
* ``UIFeature.shareQrCode`` - Whether or not the QR code on the share room/event dialog
  is shown.
* ``UIFeature.shareSocial`` - Whether or not the social icons on the share room/event dialog
  are shown.
* ``UIFeature.identityServer`` - Whether or not functionality requiring an identity server
  is shown. When disabled, the user will not be able to interact with the identity
  server (sharing email addresses, 3PID invites, etc).
* ``UIFeature.thirdPartyId`` - Whether or not UI relating to third party identifiers (3PIDs)
  is shown. Typically this is considered "contact information" on the homeserver, and is
  not directly related to the identity server.
* ``UIFeature.registration`` - Whether or not the registration page is accessible. Typically
  useful if accounts are managed externally.
* ``UIFeature.passwordReset`` - Whether or not the password reset page is accessible. Typically
  useful if accounts are managed externally.
* ``UIFeature.deactivate`` - Whether or not the deactivate account button is accessible. Typically
  useful if accounts are managed externally.
* ``UIFeature.advancedEncryption`` - Whether or not advanced encryption options are shown to the
  user.
* ``UIFeature.roomHistorySettings`` - Whether or not the room history settings are shown to the user.
  This should only be used if the room history visibility options are managed by the server.
