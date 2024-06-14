grommunio-web 3.10 (unreleased)
===============================

Fixes:

* Fix delegate permissions which have not been saved

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
* Reenable X11 middle mouse pasting

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
* Remove incorrect filtering of PNG ressources
* Update maps plugin with newer libraries (leaflet 1.9.4, geosearch 3.10.0)
* Update PDF viewer (pdf.js) to 3.11.174
* optimize SVG ressources
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
