grommunio-web 3.17.x (development)
==================================

Fixes:

* Settings auto-save is now debounced to batch HTTP requests
* UI update handlers now guard against undefined records
* S/MIME signing was fixed by removing the ``PKCS7_TEXT`` flag
* Shared store operations now provide improved error handling
* Opening shared items no longer fails on RTF decompression errors
* Folder bold styling is now decoupled from counter type
* Hierarchy now treats Junk as a special folder for total item count
* Closing grommunio-web is no longer blocked when there are no unsaved changes

Enhancements:

* Non-critical services are now deferred until after hierarchy load
* Spam mails can now be un-flagged directly from the Junk folder
* Shared stores can now be opened for rooms and equipment
* A reminder for missing attachments is now shown before sending
* Kendox now supports uploading e-mails without attachments
* Kendox now supports archiving embedded images

Changes:

* Translation catalogs were updated
* Swedish translation was added


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
* Introduce object preloading, noticably enhancing performance by preloading
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
