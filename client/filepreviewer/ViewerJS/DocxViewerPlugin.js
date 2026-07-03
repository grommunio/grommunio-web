/**
 * Word (OOXML .docx) viewer plugin for ViewerJS.
 *
 * Renders a .docx attachment to HTML entirely in the browser using the
 * docx-preview library (https://github.com/VolodymyrBaydalka/docxjs,
 * Apache-2.0), which in turn depends on JSZip (MIT). Both libraries are
 * vendored under ./vendor/ and loaded on demand, mirroring the way
 * ODFViewerPlugin loads webodf.js.
 *
 * @author grommunio GmbH <dev@grommunio.com>
 */

/*global document, fetch, docx, console*/

function DocxViewerPlugin() {
    "use strict";

    var self         = this,
        pluginName   = "DocxViewer",
        pluginURL    = "https://github.com/VolodymyrBaydalka/docxjs",
        wrapper      = null,
        zoomLevel    = 1,
        initialized  = false;

    // Sequentially load the vendored libraries. docx-preview reads the global
    // JSZip at load time, so JSZip must be present before it is evaluated.
    function loadLibs( callback ) {
        var libs = ['./vendor/jszip.min.js', './vendor/docx-preview.min.js'];

        function loadNext( index ) {
            if ( index >= libs.length ) {
                callback();
                return;
            }
            var script  = document.createElement('script');
            script.async = false;
            script.src   = libs[index];
            script.type  = 'text/javascript';
            script.onload = function () {
                loadNext(index + 1);
            };
            document.head.appendChild(script);
        }

        loadNext(0);
    }

    function showError( container ) {
        container.innerHTML = '<div class="unknown-file">This document could not be previewed.</div>';
    }

    this.initialize = function ( viewerElement, documentUrl ) {
        loadLibs(function () {
            var container = document.getElementById('canvas');

            // Fetch the attachment as a Blob (same-origin request, so the
            // session cookies are sent) and hand it to docx-preview.
            fetch(documentUrl, { credentials: 'same-origin' })
                .then(function ( response ) {
                    if ( !response.ok ) {
                        throw new Error('HTTP ' + response.status);
                    }
                    return response.blob();
                })
                .then(function ( blob ) {
                    return docx.renderAsync(blob, container, null, {
                        className:              'docx',
                        inWrapper:              true,
                        ignoreWidth:            false,
                        ignoreHeight:           false,
                        breakPages:             true,
                        ignoreLastRenderedPageBreak: true,
                        useBase64URL:           true
                    });
                })
                .then(function () {
                    wrapper     = container.querySelector('.docx-wrapper') || container;
                    initialized = true;
                    self.onLoad();
                })
                .catch(function ( err ) {
                    console.log('DocxViewerPlugin: failed to render document: ' + err);
                    showError(container);
                    self.onLoad();
                });
        });
    };

    this.isSlideshow = function () {
        return false;
    };

    this.onLoad = function () {
    };

    // Documents read best fitted to the available width. All fit modes map to
    // a width fit; the container scrolls vertically.
    function naturalWidth() {
        if ( !wrapper ) {
            return 0;
        }
        var page = wrapper.querySelector('section.docx');
        return (page && page.offsetWidth) || wrapper.scrollWidth || 0;
    }

    this.fitToWidth = function ( width ) {
        var natural = naturalWidth();
        if ( natural > 0 && width > 0 ) {
            self.setZoomLevel(width / natural);
        }
    };

    this.fitToHeight = function ( height ) {
        // Height-fit is not meaningful for a flowing, multi-page document;
        // keep the current width-based zoom.
    };

    this.fitToPage = function ( width, height ) {
        self.fitToWidth(width);
    };

    this.fitSmart = function ( width ) {
        // Never upscale past 100% when the page already fits.
        var natural = naturalWidth();
        if ( natural > 0 && width > 0 ) {
            self.setZoomLevel(Math.min(1, width / natural));
        }
    };

    this.getZoomLevel = function () {
        return zoomLevel;
    };

    this.setZoomLevel = function ( value ) {
        zoomLevel = value;
        if ( wrapper ) {
            // CSS zoom reflows the content so the scrollbars stay correct.
            wrapper.style.zoom = value;
        }
    };

    this.getPages = function () {
        return [1];
    };

    this.showPage = function ( n ) {
    };

    this.getPluginName = function () {
        return pluginName;
    };

    this.getPluginVersion = function () {
        return "From Source";
    };

    this.getPluginURL = function () {
        return pluginURL;
    };
}
