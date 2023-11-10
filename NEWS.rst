v3.6 (2023-11-10)
=================
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

v3.5 (2023-10-31)
=================
* Modern authentication system using keycloak open-ID connect workflow
  (requires php-mapi-header 1.3)
* Style updates
* Update Video.js to 8.6.1
* Update phpfastcache to 8.1.4
* Update sabredev dependencies

v3.4 (2023-10-13)
=================
* ViewerJS uses correct CSS class
* Update dompurify (XSS protection) to 3.0.6
* Update tokenizr to 1.6.10
* Remove incorrect filtering of PNG ressources
* Update maps plugin with newer libraries (leaflet 1.9.4, geosearch 3.10.0)
* Update PDF viewer (pdf.js) to 3.11.174
* optimize SVG ressources
* Modernized build process (no java components anymore)

v3.3 (2023-09-23)
=================

* Freebusy is determined using mapi_getuserfreebusy PHP function
  (requires Gromox-2.11)
* The Menu key is now usable to call up thecontext menu in the content table
* Enable zend.exception_ignore_args PHP knob so passwords do not end up in logs
* Copy-to-trash had erroneously moved the mail
* Rules dialog no longer hides shared stores
* Resolve "TypeError: g.isMeetingSent is not a function" dialog

(v3.2 2023-02-27)
