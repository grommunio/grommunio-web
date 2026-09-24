grommunio-web 5.1 (2026-09-24)
==============================

Fixes:

* Calendar items with broken recurrence data aborted the calendar; they are
  skipped and logged
* Hostname-style and fragment-only links opened relative to grommunio-web,
  in messages and in the editor
* Images are scaled to fit when printing from the viewer
* The preview returned to the top of a message the reader had scrolled into
* Divider between the mail list and the preview was invisible
* Timezone shift of an appointment was applied when either the client's or
  the appointment's timezone definition had no effective rule
* Appointment dialog: labels have room for their translations and line up on
  one column, the options row and the recurrence pattern and duration sit in
  their columns, the calendar icon scales into its box, tooltip icons take the
  header's colour
* Dark mode: editor font-size stepper, labels of buttons whose icon keeps its
  colour, row action icons and the count on the reminder bell are readable
* Toolbar resize no longer runs on a context that has been switched away
* Settings dropdown arrow stays at the right edge of the field
* Files: the preview has its own panel, opens at half the width, reaches the
  panel edges, and a split region keeps its share of a narrow window
* Damaged entries in the shipped catalogues (627 entries across 34 languages)

Enhancements:

* Profile picture: take it from a file, Gravatar or Libravatar, cut a square
  out of it in a pan-and-zoom dialog, stored bounded in size;
  index.php?action=profile opens the picture in the settings
* Send rights of the user shown on the top of the information store
* Target calendar of a new appointment shown, with the calendar's colour
* Scheduling view adapts to the attendee list
* All delegates shown in the settings
* Assembled sentences, the strings of the MAPI headers and the remaining form
  labels are translatable; catalogues refreshed, Norwegian, German and
  Indonesian updated, U+2026 for the ellipsis
* Shared MAPI helpers from mapi-header-php 2.3, which is now required:
  property streams, timezone definitions, codepage table, conversation tags,
  entryid comparison and gettext replace the local copies

Changes:

* Icon mask stylesheets dropped from the build, the built files stylesheet
  from the sources

grommunio-web 5.0 (2026-09-15)
==============================
grommunio Web 5.0 is the first release under the new major number. The
Zarafa namespace inherited from the WebApp fork gives way to grommunio in the
code, the plugin interfaces and the stored settings; the interface has been
redesigned and gained a dark mode; OpenPGP joins S/MIME; attachments open in a
document previewer for many more formats; and every release now ships SPDX
headers, a bill of materials and a published security policy, alongside a set
of security fixes.

Highlights:

* The Zarafa namespace inherited from the WebApp fork is gone: classes,
  xtypes, CSS classes, settings and the request envelope now say grommunio;
  stored settings are migrated on the first login and saved layouts survive
* Every source file carries an SPDX copyright and licence header, REUSE.toml
  and LICENSES/ cover the rest, and each release ships a CycloneDX and an SPDX
  bill of materials; SECURITY.md documents vulnerability reporting under the
  Cyber Resilience Act
* Redesigned interface built on shared design tokens, with a dark mode that
  the bundled plugins follow, larger controls and a new login screen
* OpenPGP plugin: sign, encrypt, decrypt and verify PGP/MIME mail in the
  browser and read inline OpenPGP messages; private keys are stored only as
  passphrase-protected armor in the mailbox
* Document preview for more formats: text, code, Markdown and JSON, more
  spreadsheet formats (.xls, CSV), RTF, legacy .doc, .pptx and .eml
* Undo and redo of delete, move, copy and create actions, flag, read-state and
  category changes and moved or resized appointments with Ctrl+Z / Ctrl+Y;
  opt-in via "Undo and redo" under Settings > General (reload required)
* Outlook-compatible categories stored per mailbox in the master category list
  with Outlook's palette; shared mailboxes show their own names and colours
* Sender lists: safe senders, safe recipients and blocked senders, stored in
  the Outlook Junk Email Rule and honoured by external content blocking
* BIMI sender logos in the reading pane for messages that passed DMARC
* Notes linked to a mail: "Create note" in the mail context menu and "Add
  note" in the reading pane; linked notes are shown with the message
* Command palette (Ctrl+K) to search folders, views, settings pages and
  new-item actions; the editor body keeps Ctrl+K for Insert link
* Attachments: select several with Ctrl- and Shift-click and drag them into a
  compose window in another tab or window, or to the desktop as one ZIP file
* Conversation view for shared mailboxes, including mailboxes whose Sent Items
  folder is not shared
* A tab's state lock is held only while its state is read and written back,
  and hierarchy, reminder, free/busy, name resolution, recipient suggestion
  and settings requests run without a lock, so a slow folder load does not
  hold up the rest of the interface
* Faster start-up with fewer requests: scripts, stylesheets and translations
  are cached by the browser and refetched only when they change
* Search works in public folders, including subfolders
* Search prefixes are accepted in the interface language (von:, an:, betreff:)
* Shared mailboxes can be reordered by dragging them in the folder tree; the
  order applies to every folder list, including the calendar list

Enhancements:

* Quick actions when hovering over a mail row: Mark Read/Unread, Follow up and
  Delete, switchable with "Show quick actions when hovering over a list item"
* Quick actions for task rows (Mark Complete/Incomplete, Delete) and contact
  rows (Email, Delete)
* "Compact list spacing" display option
* Follow-up flagged messages tint the whole row in the message list
* "Remove attachment" in the attachment context menu deletes an attachment
  from a stored message; the message keeps its text, sender and metadata
* "Save selection to folder" writes several selected attachments as individual
  files into a folder chosen in the browser, never overwriting existing files
* An attached .eml opens as a mail with its own attachments and inline images
  instead of only being offered for download
* Attachment previews can open in a grommunio Web tab or a browser window
  instead of a dialog ("Open a preview in a" setting and context menu entries)
* Files can be dropped anywhere on an item dialog to attach them
* Windows UNC paths, mapped-drive paths and file:// URLs typed or pasted into
  the editor become clickable links
* Copy/Move dialog offers the folders a sender's mail was moved to before as
  buttons above the folder tree; typing a folder name jumps to it in the tree
* The categories context menu shows selected categories first, then
  quick-access categories, then the rest, capped at 15 as in Outlook; fixed
  categories can be renamed
* Existing categories are migrated into the mailbox on login; "Migrate legacy
  categories" in the settings' About section adds categories found on items
* The compact mail view offers a Categories column, hidden by default, to sort
  by category from the header menu
* The new mail notification names sender and subject of a single new message,
  or how many messages arrived, instead of the total unread count
* Choose which folders raise new mail notifications: "All folders", "Only my
  own mailbox" or "Only the folders I choose"
* "Disable sound" option for desktop notifications
* Ctrl+F jumps to the search box of the current view; a second press falls
  through to the browser's own find
* Warning toast when a search is performed without a content index (requires
  gromox 3.8-106 or later)
* A notice offers a reload when grommunio Web was updated on the server
* Compact appointment and task dialogs: notices collapse into one expandable
  line, Show as, Reminder and Create in share a row, and the form can scroll
* Appointment tooltip redesigned as a card in the calendar's colour: subject,
  date and time, location link, organizer, attendees, recurrence, note preview
* A URL in the appointment location can be opened in a new tab, also for
  read-only appointments
* Unread appointments are shown bold with "Mark Read" and "Mark Unread" in the
  context menu
* New calendar setting "Delete the meeting request from the inbox when
  answering from the calendar" (off by default, needs current mapi-header-php)
* Sign and Encrypt are shared split buttons for S/MIME and OpenPGP; only one
  protocol protects a message at a time
* OpenPGP settings: generate and import keys, pin verified fingerprints to
  addresses, export passphrase-protected backups, manage HTTPS keyservers
* OpenPGP: reply to and forward protected messages; decrypted content stays in
  the browser and is cleared when the key is locked
* S/MIME fetches missing intermediate certificates from the AIA "CA Issuers"
  URI, so signatures that embed only the end-entity certificate verify
* Files: "Preview" in the toolbar and context menu opens PDFs, Office and
  OpenDocument files, text, images and media in the attachment previewer
* Files: folder listings are fetched only when a folder is expanded
* Files: folders one may not enter open empty
* Files: the attachment state is not locked while files are transferred from
  a Files backend, so uploads and message saves in other tabs are not held up
* Upload glyph on the Files New button
* Empty list, preview and notes views follow the folder type
* File previewer follows the grommunio Web look: interface colours, a single
  toolbar and the theme including dark mode; the pdf.js viewer follows along
* Document previews open faster: renderer libraries load together with the
  document
* "Search settings" field in Settings
* A folder rail with favourites and default folders while the navigation panel
  is collapsed
* Favourites in every folder list: "Show favorites of the same type in every
  folder list" or "Show all favorites in every folder list" display setting
* Two-tone folder icons drawn from the theme colour
* A favourite shows the icon of the folder it points at
* Long folder names are cut off with an ellipsis (full name as tooltip)
  instead of a horizontal scrollbar
* A shared mailbox opened as a whole can be removed from a filtered folder
  list, such as the calendar folder list, with "Remove" in the context menu of
  its top-level folder
* Theme colours shown in the theme selector
* Keyboard navigation of the search dropdown
* Right-click on the row actions opens the mail context menu
* Wider note colour selector and custom flag dialogs
* Folder properties dialog resized and tidied
* Uniform styling for combo, date and spinner fields
* Keyboard focus rings are shown after keyboard navigation only
* Tooltips in the theme colour
* English names next to language names in other scripts
* The Snooze button grows with its label
* The context menu key and Shift+F10 open the context menu of the focused row
  or card in lists; submenus open immediately on the right arrow key
* Keyboard shortcuts on macOS use Cmd and Option (Ctrl in Safari, which
  reserves several Cmd combinations); tooltips and settings show the keys
* Screen readers: form labels point only at real form controls, the editor
  font-size field is named, and the page declares the full language tag
* Animations are switched off when the operating system asks for reduced
  motion
* Help opens the German manual for a German interface; help links follow the
  current manual layout, including folders, Chat, MDM, Meet and Files
* Faster calendar views and login: appointment lists and favourites are
  filtered while the table loads instead of row by row
* Faster folder creation and renaming: name conflicts are checked from the
  hierarchy table instead of opening every sibling folder
* Search progress polls do not read the whole result set of a large search
* Inline images are cached by the browser for an hour instead of being
  refetched on every preview of the same message

Fixes:

* Draft deleted although sending it failed; a failed send left an unsent copy
  in the Outbox
* Sending on behalf of another mailbox could turn an HTML draft into plain
  text
* A reply autosaved before sending lost its conversation threading
* Reply or forward quoted only the header and omitted the body of the original
  message
* Sending a reply or forward failed when the original message was no longer
  available
* Replying to or forwarding a mail with blocked external images loaded them in
  the editor and sent them along with the quote
* Inline images were dropped when replying to or forwarding a message received
  from another mail client or referenced by a percent-encoded Content-ID
* Reopened drafts lost their inline images
* Saving a message with freshly uploaded inline images failed
* Images embedded in the message body were also listed as attachments
* Images pasted from Microsoft Word were lost
* Messages, composed mails and signatures without a font of their own were
  shown and sent in the browser's serif default instead of the configured font
* Subject duplicated when saving a mail with the keyboard
* Save and Send gave no visible feedback and could be clicked twice
* Unreadable uploaded attachments were imported empty instead of reporting an
  error
* Check Names resolved legacy account names or Exchange DNs to unrelated
  address book entries
* Sends to address book users duplicated recipient history entries
* Tab could not reach the list of suggested names in the Check Names dialog
* Sending as an address that is also in the user's contacts failed
* Sending from one's own alias address, or as one's own identity with "Save
  emails sent by delegate" enabled, created a second copy in Sent Items
* Mail sent with send-as permission appeared as sent on behalf of the
  representee, with the delegate's address shown as an internal identifier
* Emails sent as or on behalf of another user appeared editable in that user's
  Sent Items
* Re-opening a message whose reply-to sender has no entryid raised an error
* Out of office replies were sent with an empty subject when none was entered
* Dropping a non-embeddable file onto the body of an appointment, task,
  contact or note did nothing after confirming to attach it
* Files dropped onto a compose dialog in its own browser window were attached
  with 0 bytes, and the "Add as attachment?" prompt opened in the main window
* Opening or previewing a message downloaded every attachment in the
  background and kept the payloads in memory for the whole session
* Received .eml, .vcf and .ics attachments were not recognised: an attached
  mail only offered a download and a received contact could not be imported
* Inline images saved from the reading pane were named download.png instead of
  their real filename
* Plain-text messages opened from the search results were cut off in the
  reading pane
* Follow-up flags set by Outlook or delivered over IMAP showed an additional
  "Red" colour category
* A follow-up flag completed in grommunio Web stayed an open task in Outlook
* Sorting a mail list by category returned a mail once per category and
  miscounted pages; sorting search results by category failed
* Quoted search phrases such as subject:"some thing" were split into several
  chips, and apostrophes in a search term (o'brien, it's) were read as quotes
* Stale search results stayed in the session and a still-running search was
  not stopped before a new one
* Conversation view settings were shown although conversation view is disabled
  in config.php
* Deleting items from a shared mailbox failed with "insufficient privileges"
  even with full delete rights
* ENABLE_DEFAULT_SOFT_DELETE overrode an explicit soft delete
* Items one is not allowed to delete vanished from the view until the next
  reload instead of being reported
* Deleting a folder from a shared mailbox's Deleted Items renamed it to
  "name (2)" instead of removing it
* Closing a shared mailbox failed with "Could not close shared folder" when a
  favourite pointed at an unreachable mailbox, and removed other favourites
* Owner of another user's mailbox could not see the other users' permissions
  on its top-level folder
* Wrong store and folder sizes, e.g. for stores larger than 2 GB
* Named property ids of one mailbox were reused for other mailboxes in the
  same request
* Folder pane stuck on the previous context when a listener failed during the
  context switch
* Dropping mail onto a folder row was refused on parts of the row (the name
  suffix and the row padding)
* "Remove From Calendar" flashed and disappeared again when selecting a
  meeting cancellation in the mail list
* Declining one occurrence of a recurring meeting marked another occurrence as
  removed
* The recurring-selection dialog could open the wrong occurrence
* Turning a recurring appointment into a single one left the recurrence
  behind, so attendees still received a series
* Reopening an appointment right after saving showed the note from before the
  edit for up to half a minute
* Text typed into the calendar quick-create box but not confirmed turned into
  a second appointment on the next relayout
* A shared or public calendar without read permission failed to load with "An
  invalid parameter was passed" instead of showing empty
* No suggested meeting times when no attendee was busy
* Attendees marked Working Elsewhere blocked suggested times and raised
  availability warnings
* Free/busy conflict check missed a conflict when another block of the same
  attendee came first
* Working Elsewhere hid busy and out-of-office blocks in the free/busy view
* A failed free/busy lookup was drawn as Working Elsewhere across the whole
  range
* Scheduling tab with many attendees: the attendee list did not scroll with
  the free/busy timeline and overlapped the legend
* Date picker marked a day of the newly shown month as selected when only
  browsing months
* AM/PM suffix cut off in the appointment time fields in 12-hour format
* "Delegate receives copies of meeting-related messages" came back unchecked,
  was applied to every delegate, and saving it reset the private-items flag
* A delegate with None or read-only calendar rights who was already in the
  meeting rule had the box ticked and greyed out with no way to clear it
* OK/Cancel buttons covered the text of the delegate permissions dialog in
  longer translations
* Long options in the delegate sent-items dropdown of the compose settings
  were cut off
* Rule dialog comboboxes too narrow to read the selected condition or action
* Settings, recipient history, rules and plugin state were overwritten when
  requests of one session or several clients on the same mailbox overlapped
* Favourites, saved searches and stored settings were wiped when the store's
  settings could not be read, and the welcome screen reappeared on every login
* Settings: the reload prompt appeared twice per apply, changes made during a
  save were dropped, and a refused "reset all settings" could wipe later saves
* Leaving Settings with unsaved changes could switch to the wrong folder
* Message boxes: duplicated Reload/Cancel buttons, the radio list or checkbox
  of one box rendered into the next, and a second question replaced the first
* Removed sidebar widgets kept polling the server
* Fresh logins over HTTPS with secure cookies enabled failed with
  MAPI_E_INVALID_PARAMETER
* A session cookie from a different browser left the client on a permanent
  error mask instead of the login page
* Interface unexpectedly shown in English: server-rendered strings used the
  server default language instead of the selected one
* A language stored without territory (de instead of de_DE) was rejected
* A corrupt or stale translation cache stayed untranslated until removed
* Translations failed on hosts without the PHP sysvshm extension
* Translated headings such as "Sign & Encrypt" showed "&amp;"
* Stale stylesheets, icons, themes, favicons, TinyMCE and viewer assets were
  served from the browser cache after an upgrade until a hard reload
* Silent failures and corrupt downloads when a MAPI operation failed
* A server error reported without request context crashed the client's error
  handler
* Desktop notifications remained the active notifier and sound setting after
  the plugin was disabled
* Routing the mail saving notifications to another notifier showed the
  configuration object instead of the message
* Desktop notifications showed the stock grommunio icon and a separate window
  the stock favicon instead of the theme's
* Unreadable links on the Legal Information page
* A theme shipping only a favicon and no style sheets made every page fail
  with an error 500
* Themes without a primary hover colour got a lightened shade even for light
  primary colours
* An unreadable or invalid iconset.json raised PHP errors instead of being
  logged and skipped
* Signed and encrypted S/MIME messages showed invalid@invalid as sender after
  decryption and replies had no recipient
* S/MIME signatures chaining to email-only root CAs failed on SUSE and RHEL
* S/MIME chain verification failures were reported as an unavailable
  revocation service instead of naming the untrusted CA or missing
  intermediate
* S/MIME certificate upload rejected valid private keys on PHP 8
* Files: editing an account kept its previous backend settings and credentials
* Files: labels in the account dialog wrapped into the input fields
* Files: OnlyOffice editing and new-document creation used URLs not derived
  from the account's backend, and new documents failed Nextcloud's CSRF check
* Files: malformed WebDAV, OCS and Seafile server responses are reported as
  errors instead of causing PHP failures
* Files: download with an unknown account id or a failing backend produced PHP
  errors, a broken ZIP archive and leftover temporary files
* Files: version information dialog cut off, Close button outside the dialog
* Files: copying a file over WebDAV failed because the request carried no
  destination
* Files: the share recipient lookup failed with a PHP error on Seafile
  accounts and on backends without recipient search
* Files: an expired version marker flushed the whole Redis cache database
  every 15 minutes
* Deleting several assigned tasks at once failed
* MDM shared-folder actions report that the server does not support them
* MDM: a device the server refused to remove disappeared from the device list
  anyway
* AI plugin: long answers were cut off mid-sentence at the output token cap

Changes:

* TinyMCE was upgraded to 8.9.1
* pdf.js was upgraded to 6.3.289
* dompurify was upgraded to 3.4.15
* SheetJS was upgraded to 0.20.3
* Video.js was upgraded to 8.24.0
* sabre/dav was upgraded to 4.7.1, sabre/event to 5.1.9 and sabre/vobject to
  4.6.1 in the Files WebDAV backend
* OpenPGP.js 6.3.1, postal-mime 2.7.5 and fflate 0.8.3 are vendored for the
  OpenPGP plugin
* The Kendox plugin bundles only phpseclib 3.0.57 and symfony/polyfill-iconv
* Plugin status messages (Files, passwd, AI, Kendox, template snippets,
  S/MIME) appear as toasts instead of modal message boxes
* Out of office replies without a subject of their own use "Out of Office"
* AI plugin: the default output token cap is 4096
* Remaining animated gif loaders (tree nodes, loading texts) replaced by the
  spinner
* First and last page buttons use chevrons with a stop bar, matching the
  previous and next buttons
* Settings move from zarafa/v1 to grommunio/v1; a store still holding the old
  root is migrated while loading and written back once
* The client source tree moved from client/zarafa to client/grommunio
* Version 5.0 in package.json and the version file

Security:

* Login, token, fingerprint, logout and all action requests check the request
  Origin against CROSS_DOMAIN_AUTHENTICATION_ALLOWED_DOMAINS; X-Forwarded-Host
  and X-Forwarded-Proto are honoured behind a reverse proxy
* The client logs out with a POST request; a GET logout is accepted only from
  a same-origin navigation
* Action requests and the fingerprint service require a JSON POST body; plain
  form posts are rejected with 405/415 (plugins must send application/json)
* One-time OAuth state and a validated callback URL for Keycloak logins
* Attachment downloads are served with nosniff and a sandboxing
  Content-Security-Policy, inline display only for safe media types
* Control characters cannot reach response headers through the redirect path
  or through download filenames
* BIMI logos are fetched only from public, DNS-pinned HTTPS hosts
* Limit on messages a mailbox may submit per minute, MAX_SUBMITS_PER_MINUTE
  (default 20, 0 disables), so a replayed send request cannot flood recipients
* Attachment drag-out: the sender-supplied MIME type is sanitised, and the
  prefetch cache has a total size budget, real size checks and a fetch cap
* Autosave is paused while OpenPGP encryption is selected so no unencrypted
  draft is written; the compose setting "Also autosave while encryption is
  selected (drafts are stored unencrypted)" restores it
* S/MIME AIA, OCSP and CRL downloads resolve the URL before connecting, reach
  public addresses only and bound the response size
* S/MIME: CRLs are authenticated against their issuer and checked for
  freshness, and OCSP responses without a nextUpdate have a maximum age
* S/MIME: temporary key material is removed reliably, never through a symlink
* S/MIME: certificate import reports an unverifiable revocation status (and
  still imports unless PLUGIN_SMIME_REVOCATION_FAIL_CLOSED is set)
* S/MIME and BIMI cache directories whose permissions cannot be tightened are
  not used
* S/MIME LDAP lookups use only the configured PLUGIN_SMIME_LDAP_URI and
  PLUGIN_SMIME_LDAP_BASE_DN, so a request cannot redirect the bind credentials
* S/MIME: malformed certificates are rejected by the certificate, DER and
  NemID parsers instead of causing PHP errors
* Attachments handed over by OpenOffice are accepted only as regular files
  directly in the system staging directory
* The OnlyOffice panel accepts login messages only from its own same-origin
  frame
* One-time encryption-store tokens cannot be redeemed by two concurrent
  requests
* SECURITY.md: contact for vulnerability reports, the handling steps up to
  coordinated disclosure, the CRA reporting obligations grommunio GmbH meets,
  how security updates are delivered and the settings a secure installation
  depends on
* bom.json (CycloneDX 1.6) and bom.spdx.json (SPDX 2.3) list all 421 runtime
  and build-time components; ``make bom`` regenerates them and
  ``make bom-check`` fails when they are out of date, also in CI
* SPDX-FileCopyrightText and SPDX-License-Identifier headers on every source
  file we own, REUSE.toml for the vendored trees and files that cannot carry a
  header, the licence texts under LICENSES/; ``reuse lint`` passes

Administration:

* Plugins disabled for a user in the grommunio Admin API are not loaded; new
  ADMIN_API_ENDPOINT and ADMIN_API_DISABLEDPLUGINS_ENDPOINT options
* ADMIN_API_STATUS_ENDPOINT derives from ADMIN_API_ENDPOINT
* ADMIN_API_DISABLEDPLUGINS_CACHE_TIME, ADMIN_API_DISABLEDPLUGINS_RETRY_TIME:
  the disabled-plugins answer is cached per session (300 s, 30 s on failure)
* New ADMIN_API_TIMEOUT option (default 2 seconds) bounds the Admin API calls
  at page load
* ENABLE_BIMI (enabled by default) controls the BIMI sender logos; the server
  resolves and caches the logo
* OpenPGP plugin: off by default; PLUGIN_PGP_ENABLE makes it available and
  PLUGIN_PGP_USER_DEFAULT_ENABLE (default false) turns it on for users who
  have not chosen
* PLUGIN_PGP_MAX_MESSAGE_BYTES and PLUGIN_PGP_MAX_KEY_BYTES bound message and
  key sizes; PLUGIN_PGP_UNLOCK_TTL (seconds, default 300) how long an unlocked
  key stays in memory
* PLUGIN_PGP_KEYSERVER_ALLOWLIST restricts keyserver lookups to the listed
  HTTPS origins
* ENABLE_ATTACHMENT_REMOVAL (default TRUE) in config.php; FALSE removes the
  "Remove attachment" menu entry and the server action behind it
* ENABLE_ATTACHMENT_DRAG_OUT is documented to gate only the embedded
  attachment payload; dragging attachments to the desktop keeps working when
  it is off
* New PLUGIN_SMIME_AIA_ALLOW_PRIVATE permits AIA, OCSP and CRL downloads from
  private address ranges (internal PKIs)
* New PLUGIN_SMIME_REVOCATION_FAIL_CLOSED (default false) fails verification
  when the revocation status of a chain certificate cannot be determined
* New S/MIME options PLUGIN_SMIME_OCSP_MAX_AGE, PLUGIN_SMIME_OCSP_CLOCK_SKEW,
  PLUGIN_SMIME_CRL_MAX_BYTES and PLUGIN_SMIME_CRL_CLOCK_SKEW
* PLUGIN_SMIME_CRL_CACHE_DIR defaults to TMP_PATH/smime/crl
* JSON themes colour the whole interface, not only the login screen:
  primary-color feeds all variables, gradient-start/gradient-end the top bar
* logo-small:dark provides a dark-mode logo
* The in-app spinner follows the theme
* Static assets ship pre-compressed as brotli and gzip siblings; the nginx
  snippet gains a gzip fallback, font caching and the web manifest media type
* DEBUG_LOADER = LOAD_DEBUG works on a packaged install (a debug bundle is
  shipped)
* ext-base, ext-all and ux-all are delivered as one Ext JS bundle
* grommunio-web-session-cleanup.timer removes session files unused for longer
  than the new SESSION_MAX_LIFETIME in config.php (default two weeks); on
  Debian/Ubuntu a session directory set in config.php is invisible to the
  distribution's session cleaner
* Translation directories drop the .UTF-8 suffix (server/language/de_DE
  instead of de_DE.UTF-8)
* LANG and ENABLED_LANGUAGES accept XPG locale identifiers with or without a
  charset; a bare language code falls back to its territory
* Category storage uses PR_ROAMING_XMLSTREAM as defined by php-mapi's
  mapi_load_mapidefs; a php-mapi that provides it is required
* Files: PLUGIN_FILES_CACHE_TTL sets how long a folder listing stays cached
  (default 900 seconds); the unused PLUGIN_FILES_CACHE_DIR is removed

For plugin developers:

* The ``Zarafa`` namespace is ``Grommunio``, ``zarafa.`` xtypes and ptypes
  are ``grommunio.``, ``zarafa-`` and ``x-zarafa-`` CSS classes are
  ``grommunio-`` and ``x-grommunio-``, plugin settings live under
  grommunio/v1/plugins/<name>, the JSON envelope key is grommunio, and PHP
  has GrommunioException, GrommunioErrorException and ERROR_GROMMUNIO; see
  doc/plugin-namespace-migration.rst
* Deprecated aliases for one release: window.Zarafa resolves to Grommunio and
  warns once, unregistered zarafa.* xtypes and ptypes fall through to
  grommunio.*, settings paths under zarafa/ are redirected, and the old PHP
  names remain as aliases; CSS classes are not aliased
* Unchanged on purpose: mapi_logon_zarafa, mapi_zarafa_getpermissionrules,
  mapi_zarafa_setpermissionrules, the ZARAFA_*_GUID constants and the ZARAFA
  address type, which belong to php_mapi, mapi-header-php and gromox
* The terser reserved-name lists in Makefile and plugins/shared.mk keep the
  global Grommunio instead of Zarafa
* Grommunio.common.ui.SecurityButtons: shared compose Sign/Encrypt split
  buttons fed by protocol providers; S/MIME registers as the first provider
* New server hook server.util.parse_secure.before lets a plugin claim a
  protected message before S/MIME parsing
* New <optional/> manifest element: an optional plugin's client files are only
  sent to users who enabled it, and plugins depending on it are withheld too
* All plugins with an enable switch declare <optional/>; withheld plugins stay
  listed in the plugin settings, and manifest titles match the display names
* The dropdown, popup, message box and toolbar notifier plugins and the slider
  base class they built on (the Grommunio.core.ui.notifier plugins) are
  removed; the names popup, dropdown, eventdropdown, persistentmessageplugin,
  dialognotifier, messagebox and toolbarnotifierplugin resolve to the toast;
  the pagination and live-scroll sliders stay
* Grommunio.core.Util.showMessageBox is removed;
  Grommunio.common.Actions.showMessageBox is unaffected

Internal:

* ESLint 9 flat config across the client: unused rules switched off,
  mechanical fixes with byte-identical minified output, last warnings fixed
* PHP static analysis and hardening: explicit MAPI handle, value and I/O
  failure contracts, docblock fixes, php-cs-fixer formatting, contract tests
* Scrutinizer CI configured for PHP 8.2 and MAPI, PHPCS wrapper pinned to
  3.13.6, MAPI analysis stub types normalized
* Build: one postcss run for all stylesheets, vendored trees mirrored on
  change, parallel and DESTDIR builds fixed, CSS targets in .browserslistrc
* npm run build:pgp-vendor vendors the OpenPGP plugin libraries and checks
  their versions against the pins
* Build and development dependency updates (svgo 3.3.5); plugin manifest
  version bumps
* Code cleanups: dead code in the settings model, message box and HTML editor,
  a shared ensureRecordObjectId helper, unreachable code and helpers removed
* Message wording tidied, wrong translations corrected; translation updates
* Tests for inline attachment copy and conversion
* Kendox reports an unreadable PFX file explicitly
* doc/theming.rst documents the theme.json format

grommunio-web 3.19 (2026-07-27)
==================================
Fixes:

* Not possible to configure multiple email addresses of the same user
* Various send-as related fixes
* Vendor docx-preview, JSZip and SheetJS
* All fields of contacts in distribution lists are empty
* Unable to expand distlist members
* Unable to grant free/busy permissions for calendar-type subfolders
* Saving reply/forward draft fails when the source message was moved
* "Assigned To" value for tasks is missing
* Opening or saving a private distlist fails
* Expanding nested private distlist fails
* Favourites scroll out of view
* Reply, Reply All, Forward buttons shifted to the right in search view
* sendas silently falls back to the user's own sender
* Wrong unread email counters
* Embedded attachment download fails
* Resource as location in meeting requests
* Moving folder on same hierarchy level
* Reset change tracker after accepting meeting request
* Recipients are silently dropped, e.g. when sending to distlists
* The search completely fails when the index is removed
* xlsx/odf related fixes in filepreviewer
* Subtree related issues
* Sending fails when the sent copy cannot be created

Enhancements:

* Conversation view: group the inbox by conversation, with a threaded
  reading pane that shows the whole conversation, conversation-aware
  search, and dark mode support. Opt-in per user.
* AI plugin
* Show impersonation information in MDM
* Log the authenticated user into nginx access logs
* Optimize SVG resources
* Custom PHP session config params
* Include exception message in MAPIException error logs
* Print email addresses of distribution list members
* Gather skipped appointments' information
* Wrap lines for plain-text messages
* Use mapi_linkmessages for the search folders to improve performance
* Use a fresh search folder for every search
* Prefer stored html_body over stale isHTML
* Web manifest to support PWA features
* Make the appointment editor read-only for read-only items
* Content-based cache control with conditional request support for translations endpoint
* Span full row folder highlight
* Update unread item counter for shared and public folders when a new email arrives
* Support "Working Elsewhere" busy status (4)
* Drag and drop attachments onto email body when composing an email
* Configure Deleted Items folder for mails deleted in shared stores

Changes:

* pdf.js was upgraded to 6.1.200
* dompurify was upgraded to 3.4.12
* ODF renderer was updated
* Rename one of the "About" entries to "Legal Information"

grommunio-web 3.18 (2026-05-29)
===============================

Fixes:

* Sending from drafts and reliability of the send path (copy errors,
  recipient copying, missing draft guards, accurate MAPI error reporting,
  SMTP address-type conversion)
* Login loop with Keycloak on Firefox
* Preview pane size preserved across context switches
* Shared store handling: error reporting, opening for rooms and equipment,
  contact subfolder lookups, OOF settings, hierarchy notifier
* Rules on shared/delegated mailboxes, including entryid canonicalization
  and save path corrections
* Meeting requests: duplicate When/Where, organizer hidden from
  recipients, all-day times on first open, recurrence removal propagated
  to attendees, ``PR_PROCESSED`` cleared on accept, reply-all entryid
  comparison, RTF decompression on shared items
* Search correctness for multi-word and KQL queries (AND/OR precedence,
  NOT in parenthesized expressions, ``sent_representing_*`` matching,
  FTS5 ``NOT`` as binary operator)
* S/MIME: signing (``PKCS7_TEXT`` flag), chain verification with
  intermediates, OCSP per RFC 2560, opaque-signed handling, temp file
  and cert lookup hardening, sanitized detail popup, multi-value SAN
  parsing, status constants and badge layout
* Dark mode rendering in pop-out windows, month view, high-contrast
  theme, and mail preview (CSS filter inversion preserves images)
* Toast notifications use ``textContent`` with CSS line breaks; HTML
  stripped from missing-folder, missing-store and connection-loss toasts
* Task dialog reminder toggle and layout; redundant layout passes removed
* Column resize restricted to the right edge with a wider grab zone;
  recurrence dialog spacing widened
* Empty folder no longer silently fails with 500+ messages
* Notification permissions and audio on Safari
* Many smaller UI corrections across address book, contact, calendar,
  settings, advance search, files and MDM plugins

Enhancements:

* Integrated dark mode with light/dark/system support, top-menu switcher,
  and consistent application across settings, editor, templates,
  pop-out windows and TinyMCE
* Broad accessibility pass: ARIA landmarks, labels, roles and attributes
  across PHP templates, ExtJS overrides, core shell, grids, trees,
  dialogs, forms, calendar, mail, contact, task, settings and plugins,
  plus a global accessibility foundation stylesheet
* New Template Snippets plugin (registered on all editors) and new Toast
  Notification plugin
* Meeting request forward (server and client) and meeting-aware forward
  in the mail UI; reply / reply-all in the appointment toolbar and
  calendar context menu
* Calendar list view shows times; icon column reordered before all-day
* Search dropdown with history and quick filters
* Scheduled emails can be edited and display their scheduled send time
* Configurable name display format in the address book
* ``SHOW_LOGOUT_BUTTON`` option to hide the logout button
* Significant performance work: deferred non-critical services, earlier
  release of PHP session and state file locks, shared module session
  state, prefetched hierarchy, piggybacked mark-as-read and shared store
  checks, batched mail-grid selection, batched server-side settings
  mutations, batched icon recoloring (eliminates the multi-second
  freeze on login), chunked empty-folder with progress notification,
  optimized recurring appointment expansion and single-pass calendar
  overlap calculation, debounced search preview loading
* UI refresh: redesigned grid column headers, unified scrollbar styling,
  calendar view gradients and inactive state, scrollable tab panel,
  centered welcome viewport, improved reminder dialog, tighter tree
  node line height
* Spam mails can be un-flagged directly from the Junk folder
* Attachment reminder before sending
* Meeting responses exportable as eml/zip like regular mails
* Email ``<style>`` blocks preserved in HTML preview
* Print-to-PDF default filename derived from email metadata
* S/MIME plugin migrated to CMS (RFC 5652) with AES-GCM encryption,
  per-message cipher/digest selection, RSASSA-PSS signing, algorithm
  introspection and DANE/SMIMEA certificate lookup
* Kendox: upload e-mails without attachments; archive embedded images
* FTS search filters (date, message class, unread, attachments) pushed
  into the SQL query so the result limit no longer silently discards
  valid matches
* FTS queries that could exhaust PHP-FPM CPU are guarded: terms shorter
  than 3 characters skipped with the trigram tokenizer, term count
  capped at ``MAX_FTS_QUERY_TERMS``, and a per-search execution time
  limit (``MAX_FTS_EXECUTION_TIME``) aborts runaway queries
* ``importEMLFile`` reconstructs a receive timestamp from
  ``PR_CLIENT_SUBMIT_TIME`` or the ``Date`` header so imported EMLs sort
  correctly
* PHP 8.5 compatibility cleanups
* JFont Checker replaced by the CSS Font Loading API; obsolete
  fingerprint data sources removed
* SVG resources optimized; monochrome icons now use ``currentColor`` via
  mask-image so they adapt to light and dark themes automatically

Changes:

* Default S/MIME cipher changed from 3DES to AES-256-CBC
* New ``DISABLE_FINGERPRINT_CHECK`` option for automated tooling
* SHA-256 replaces MD5 as the default certificate fingerprint
* Legacy dark theme stylesheet removed in favour of the integrated dark
  mode; loader and legacy assets cleaned up
* Recipient history matching is now case-insensitive and deduplicated by
  SMTP address
* Search folder cleanup uses date-based naming
* Swedish translation added; translation catalogs refreshed


grommunio-web 3.17 (2025-02-17)
===============================

Fixes:

* Address book contact folders are now loaded from store hierarchy with proper
  properties, hidden-folder filtering, and reliable item type detection
* Opening contact-folder entries now validates distribution-list item types
* Recurring occurrence tabs now close correctly under rare circumstances
* Shared-user resolution by display name has been repaired and stabilized,
  including a resolver regression fix
* X500 resolution (sent items) no longer causes mail preview flicker
* Reply bodies are preserved during compose initialization, and TinyMCE value
  initialization races were fixed
* Message actions now guard against unavailable stores
* HTML preview rendering is stabilized while switching records, and short
  load-mask flashes are avoided
* External resource blocking in mail preview was hardened, including correct
  block-state recalculation and sanitized-body cache handling
* BaseRecurrence handling no longer fails on reminder lists with null starts
* Meeting request time info no longer receives spurious ``pre`` tags
* Empty lines in mail bodies are preserved
* EML import/upload no longer rejects messages due to header prechecks
* Yearly recurrence interval handling was corrected (including every-N-year
  patterns), and contact birthday/anniversary intervals were fixed
* Contact timezone data is refreshed before saving
* Private meetings now hide attendees as expected
* UI click handling now guards DOM access to avoid runtime errors
* S/MIME read-flag updates are now restricted to S/MIME messages only
* Deprecated implicit class-member declarations in the S/MIME plugin were
  fixed

Enhancements:

* Address book UI now uses the GAB column model across views, reloads hierarchy
  when dialogs open, synchronizes dropdown stores on hierarchy changes, and
  refreshes grids after contact edits
* Address book item rows now omit redundant icon captions
* Mail list and panel split sizes are persisted, with a minimum mail list
  width enforced
* Header subjects in non-wrapping mail preview now use ellipsis
* ``From`` handling now preserves aliases and consistently sets SMTP/email
  address properties when sending from aliases
* TinyMCE default formatting no longer uses a stale phantom-record check
* Appointment creation from emails now populates fields more completely
* A configuration option ``SHOW_LOGOUT_BUTTON`` allows hiding the logout
  button
* Files plugin activation now honors ``ALWAYS_ENABLED_PLUGINS_LIST``
* Object ID panels are now available for calendar, contact, note, and task
  records
* Tab focus behavior and tab-space cursor movement were improved in the client
* S/MIME tooltip texts were improved

Changes:

* Default configuration now disables shared/public contact-folder providers
* TinyMCE was upgraded to 8.3.2
* pdf.js was upgraded to 5.4.624
* DOMPurify was updated to 3.3.1 and alternative HTML handling paths were
  hardened
* Legacy ``dgettext`` wrappers were removed in favor of ``_``
* Unused SCSS assets and several unused helper functions were removed
* Security headers are now included directly in web
* Image delivery sizes were optimized
* Legacy mail prefetch logic was removed


grommunio-web 3.16 (2025-12-16)
===============================

Fixes:

* HTML tags in meeting requests' bodies
* Search in shared stores
* Open read-only embedded messages
* Use correct Reply-To email address
* Handle mapi_getuserfreebusy exceptions
* Delete an occurrence from a series
* Fallback to email_address if smtp_address is not set
* Do not over-extend body to second page when printing
* The OOF widget marks settings dirty with dates
* Inconsistent storing of the OOF settings
* Attachment display and preview with ampersand

Enhancements:

* Proper PR_MESSAGE_CLASS matching
* Enlarge Contact notes textarea
* Enlarge size of permissions dialog by default
* Add more breeze-icons (importance, private, exception, ...)
* Importance column in calendar list view
* "No information" option in busy status
* Various style improvements
* Live themes (no application reload required)
* New themes amber, blue, green, indigo, red, and teal
* Crypto handling for seafile backends
* Improve prefetch and eliminate race conditions
* Better error reporting on openmsgstore failure
* Show last connect time of a mobile device in MDM
* ObjectID field in draft mail options panel
* Consistently apply category detection (and restriction)
* KQL/advanced search term handling
* Index FTS diagnostics and respect search filters
* SMIME verification flow and temp handling
* Recipient history update path

Behavioral changes:

* Display folder rights for granted users only
* Find hidden user in GAB if search is a exact match


grommunio-web 3.15 (2025-09-26)
===============================

Additions:

* The new Seafile backend can be used as files backend

Enhancements:

* TinyMCE 8.1.2 has received a major upgrade with better performance and
  compatibility
* Full HTML support for appointments and contacts as well
* Calendar coalescing improves performance with large calendar setups
  (>= 5 calendars in store)
* Introduce object preloading, noticeably enhancing performance by preloading
  objects in the users visibility area
* Calendar objects can now be copied with CTRL+drag (OL-like behavior)
* Updated pdf.js enhances the pdf handling experience with better
  performance and compatibility
* Various performance improvements (e.g. skip processing over S/MIME where
  applicable and deferring of certain actions to non-block the user)
* Various search improvements

Fixes:

* Spurious blank pages with Firefox have been addressed
* The main focus does not switch to the editor, instead jumps naturally to
  the first elements position
* The mailbox position/counters have been restored
* Avoid erroneously hiding attachments with inline attachments in the object
  with S/MIME based mails

Changes:

* From 3.15 on, no php<=8.1 installations are supported anymore
* grommunio Web does not use any more deprecated web listeners

grommunio-web 3.14 (2025-07-26)
===============================

Enhancements:

* Emails written by a delegate can now be copied into the
  representee's Sent Items.
* Support password change (via Settings) even if an altname was used to log in
  to the mailbox.
* Add a config setting to select the email preview style (plaintext or HTML).

Fixes:

* Deletion of a recurrent appointment series's instance did not mark the
  instance as deleted for Outlook; this was repaired.
* When composing/sending a mail, the value in the  From: field was ignored,
  even if the user had Send-As permission.
* In the Out Of Settings configuration view, the "Apply" button now actually
  does save changes even if only radio buttons were changed.

Changes:

* g-web clamped message dates on the low side to year 1753 to workaround a PHP5
  bug. The workaround was removed, and the full MAPI time range (from year 1601
  to 30827) can now be handled.
* The print rendering of the calendar overview has been improved and fills the
  entire paper page.


grommunio-web 3.13 (2025-04-16)
===============================

Fixes:

* Enable sending to distribution lists from shared stores

Enhancements:

* Build optimizations

Changes:

* Update TinyMCE to 7.8.0
* Update pdf.js to 5.1.91
* Update dompurify to 3.2.5

grommunio-web 3.12 (2025-04-05)
===============================

Fixes:

* Allow using distribution lists stored in IPF.Contact folders in public stores

grommunio-web 3.11 (2025-03-19)
===============================

Fixes:

* Fix contact details for OneOff recipients, traditionally objects from local
  addressbook
* Do not detect changes in Out Of Office settings pane where there are none
* Do not remove inline embedded images with reply/forward actions
* Fix multi day event view not visible in ranged views
* Properly detect end-of-search in shared mailboxes

Enhancements:

* Do not collapse the mail list view to invisibility, instead now mail preview
* Enhance detection of translation modifications to reload to cache (also in
  non-packaged environments)
* Correct all day event on wrong day for non-proper MAPI elements without TZ
  (Kopano migrations)
* Introduce new plugin for integration with Kendox InfoShare

Behavorial changes:

* Opening Links in PDF viewer now open new windows instead of replacing
  current window
* Remove any requests to non-existing archive stores, reducing login time
* Shared store searches fallback to query search if store permissions are not
  given

Changes:

* Update TinyMCE to 7.7.1
* Update pdf.js to 5.0.375
* Update dompurify to 3.2.4
* Translation updates

grommunio-web 3.10 (2025-01-28)
===============================

Fixes:

* Delegate permissions were not saved, which has been fixed.
* The Business Card view of the Contacts tab used the wrong MAPI property and
  did not show any cards when selecting a letter group from the right hand
  pane, which has been fixed.
* When looking at meeting requests in e.g. inbox, the "When" line was empty,
  which has been fixed.
* Retain recipients during S/MIME unwrapping
* Removal of all categories from a message did nothing, which is fixed.

Enhancements:

* Use (and depend on) new Fulltext Search index structure (cf. grommunio-index)
* Implement copy-to-delegate on message submission
* Address book: allow sorting contacts by icon
* Address book: offer selecting contacts from shared stores
* TinyMCE edit widget updated to v7.6
* The "Entry ID" field in "Message Options" has been replaced by the
  more user-friendly Gromox object ID

Behavioral changes:

* The default search result cutoff is now 1000 elements.
* In "Message Options", show both outer and inner headers for S/MIME messages.
  (Messages need to be decrypted first to see the inner ones, obviously.)
* Respect the USER_PRIVILEGE_WEB flag of the user account on login.


grommunio-web 3.9 (2024-06-04)
==============================

Fixes:

* Fix saving permissions when a new permission user was added
* Fix unwanted permission removal
* Extend date picker widget width for full 7 day view on widechar months

Enhancements:

* Handle the case that the OCSP URL is empty, supporting rfc6960-violating CAs
* Support for inline SVG and MathML in mail contents

Changes:

* JsonException constructor now handles exceptions correctly
* Update domurify to 3.1.5
* Update pdf.js to 4.3.136
* Update tokenizr to 1.7.0
* Update video.js to 8.12.0
* Translation updates

grommunio-web 3.8 (2024-04-29)
==============================

Fixes:

* Allow expired or revoked S/MIME certificates for decryption of older messages
* Larger translation update, major updates in uk_UA, pt_BR, nb_NO, ko_KR and
  et_EE
* Correction of S/MIME attachment icon handling (matches OL 2019)
* Files related fixes (Sabre/DAV, Sabre/XML)
* Various smaller fixes, for example with inline attachment handling
* Update dumpurify to 3.1.1
* Update Video.js to 8.10.0

Enhancements:

* Introduced availability of default/anonymous ACLs
* Support for Non-read receipts
* Support for application/pkcs7-mime content type S/MIME mails

Changes:

* Natural folder sort based on used language
* Reminders do only popup where it should (e.g. not Trash folder)

grommunio-web 3.7 (2024-02-25)
==============================

* When a message draft is saved, recipients' icons erroneously switched,
  which was fixed.
* Avoid setting a bogus PR_MESSAGE_CLASS on message drafts where
  the user has already selected SMIME-sign/encrypt options for later.
* Eliminate inheriting old PR_SENDER_SMTP_ADDRESS when forwarding messages
  from a non-default store used with send-on-behalf mode.
* The encryption icon was missing in the folder view and put back.
* The calendar widget (left pane) was missing the right arrow icon, which has
  been restored.
* Re-enable X11 middle mouse pasting

grommunio-web 3.6 (2023-11-10)
==============================

* Nav-Model following WCAG 2.1, style adoption for enhanced accessibility
* Navigation-pane redesign
* New default modern iconset, overwriting default breeze (based on FluentUI)
* Design overhaul (including dark mode)
* Navigation pane fixes (static positioning in tasks)
* Default settings validation (width)
* Replacement of mixed fontsets (now Roboto)
* Furthering of flat design principle (removing over-bordering)
* Spacing adaptions with languages such as spanish, french and german
* Display fixes for files (previewer and nav)
* Cleaning of unused content from repo

grommunio-web 3.5 (2023-10-31)
==============================

* Modern authentication system using keycloak open-ID connect workflow
  (requires php-mapi-header 1.3)
* Style updates
* Update Video.js to 8.6.1
* Update phpfastcache to 8.1.4
* Update sabredev dependencies

grommunio-web 3.4 (2023-10-13)
==============================

* ViewerJS uses correct CSS class
* Update dompurify (XSS protection) to 3.0.6
* Update tokenizr to 1.6.10
* Remove incorrect filtering of PNG resources
* Update maps plugin with newer libraries (leaflet 1.9.4, geosearch 3.10.0)
* Update PDF viewer (pdf.js) to 3.11.174
* optimize SVG resources
* Modernized build process (no java components anymore)

grommunio-web 3.3 (2023-09-23)
==============================

* Freebusy is determined using mapi_getuserfreebusy PHP function
  (requires Gromox-2.11)
* The Menu key is now usable to call up thecontext menu in the content table
* Enable zend.exception_ignore_args PHP knob so passwords do not end up in logs
* Copy-to-trash had erroneously moved the mail
* Rules dialog no longer hides shared stores
* Resolve "TypeError: g.isMeetingSent is not a function" dialog
