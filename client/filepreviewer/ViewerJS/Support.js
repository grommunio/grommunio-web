/**
 * Shared helpers for the viewer plugins.
 *
 * @author grommunio GmbH <dev@grommunio.com>
 */

/*global window, document, fetch*/

var ViewerSupport = (function () {
    "use strict";

    var strings = null;

    /**
     * The window grommunio Web runs in, seen from inside the viewer frame. A
     * preview opened in a tab or a dialog sits in the main window, one opened
     * in a browser window sits in that window, and a viewer opened on its own
     * has no such window at all.
     */
    function hostWindow() {
        var candidates = [window.parent, window.top],
            i,
            candidate;

        if ( window.parent && window.parent !== window ) {
            candidates.push(window.parent.opener);
        }

        for ( i = 0; i < candidates.length; i += 1 ) {
            candidate = candidates[i];
            try {
                // Reading across an origin boundary throws.
                if ( candidate && candidate !== window && candidate.Zarafa &&
                        candidate.Zarafa.common && candidate.Zarafa.common.previewer ) {
                    return candidate;
                }
            } catch ( e ) {
                // Not reachable from here, try the next one.
            }
        }

        return null;
    }

    /**
     * The translated strings of the viewer chrome, taken from grommunio Web,
     * which has the user's language and the message catalogue. An English
     * fallback is used where the viewer runs on its own.
     */
    function translations() {
        var host;

        if ( strings === null ) {
            strings = {};
            host = hostWindow();
            if ( host ) {
                try {
                    strings = host.Zarafa.common.previewer.data.ViewerStrings.get();
                } catch ( e ) {
                    strings = {};
                }
            }
        }

        return strings;
    }

    /**
     * Translate a string of the viewer chrome. The English text is the key,
     * so an untranslated string still reads correctly.
     *
     * @param {String} text The English text
     * @return {String} The translation, or the English text
     */
    function t( text ) {
        return translations()[text] || text;
    }

    /**
     * Substitute {0}, {1}, ... in a translated string with the remaining
     * arguments.
     *
     * @param {String} text The English text
     * @return {String} The formatted translation
     */
    function format( text ) {
        var values = Array.prototype.slice.call(arguments, 1);

        return t(text).replace(/\{(\d+)\}/g, function ( match, index ) {
            return values[index] === undefined ? match : values[index];
        });
    }

    /**
     * Load scripts one after the other; a library that reads a global another
     * one exports has to see it defined already.
     *
     * @param {String[]} sources The script URLs
     * @param {Function} callback Called once they have all been evaluated
     */
    function loadScripts( sources, callback ) {
        function next( index ) {
            if ( index >= sources.length ) {
                callback();

                return;
            }
            var script    = document.createElement('script');
            script.async  = false;
            script.type   = 'text/javascript';
            script.src    = sources[index];
            script.onload = function () {
                next(index + 1);
            };
            script.onerror = function () {
                throw new Error('failed to load ' + sources[index]);
            };
            document.head.appendChild(script);
        }

        next(0);
    }

    /**
     * Add a stylesheet to the viewer page, once.
     *
     * @param {String} id The identifier of the stylesheet
     * @param {String} css The rules
     */
    function style( id, css ) {
        if ( document.getElementById(id) ) {
            return;
        }
        var element = document.createElement('style');
        element.id  = id;
        element.appendChild(document.createTextNode(css));
        document.head.appendChild(element);
    }

    /**
     * Fetch the document. The request carries the session cookies, the
     * previewer and the document being same origin.
     *
     * @param {String} url The document URL
     * @param {String} as 'arraybuffer', 'blob' or 'text'
     * @return {Promise} The document
     */
    function fetchDocument( url, as ) {
        return fetch(url, { credentials: 'same-origin' }).then(function ( response ) {
            if ( !response.ok ) {
                throw new Error('HTTP ' + response.status);
            }
            if ( as === 'blob' ) {
                return response.blob();
            }
            if ( as === 'text' ) {
                return response.arrayBuffer();
            }

            return response.arrayBuffer();
        });
    }

    /**
     * Replace the content of a container with a message, for a document that
     * could not be rendered.
     *
     * @param {HTMLElement} container The element the renderer draws into
     * @param {String} message The message to show
     */
    function showError( container, message ) {
        var box = document.createElement('div');
        box.className = 'unknown-file';
        box.appendChild(document.createTextNode(message || t('This document could not be previewed.')));
        container.innerHTML = '';
        container.appendChild(box);
    }

    /**
     * The element the renderers draw into.
     *
     * @return {HTMLElement} The canvas element of the viewer page
     */
    function canvas() {
        return document.getElementById('canvas');
    }

    /**
     * A base for the renderers that produce a flow of pages in the document
     * area: it carries the zoom and the page navigation, and leaves the
     * rendering itself to the renderer.
     *
     * The renderer sets this.wrapper to the element it rendered into and
     * this.pageSelector to the selector matching one page of it, then calls
     * this.ready().
     *
     * @param {Object} plugin The renderer
     * @param {Object} options name, url and pageSelector of the renderer
     */
    function flow( plugin, options ) {
        var zoomLevel = 1;

        plugin.wrapper      = null;
        plugin.pageSelector = options.pageSelector || null;

        /**
         * The pages of the rendered document, one element each.
         */
        function pageElements() {
            if ( !plugin.wrapper || !plugin.pageSelector ) {
                return [];
            }

            return Array.prototype.slice.call(plugin.wrapper.querySelectorAll(plugin.pageSelector));
        }

        /**
         * The width one page takes at zoom level 1.
         */
        function naturalWidth() {
            var pages = pageElements();

            if ( pages.length ) {
                return pages[0].offsetWidth;
            }

            return plugin.wrapper ? plugin.wrapper.scrollWidth : 0;
        }

        plugin.isSlideshow = function () {
            return !!options.slideshow;
        };

        plugin.onLoad = function () {
        };

        plugin.ready = function () {
            plugin.onLoad();
        };

        // A height fit means nothing for content that flows downwards.
        plugin.fitToWidth = function ( width ) {
            var natural = naturalWidth();
            if ( natural > 0 && width > 0 ) {
                plugin.setZoomLevel(width / natural);
            }
        };

        plugin.fitToHeight = function () {
        };

        plugin.fitToPage = function ( width ) {
            plugin.fitToWidth(width);
        };

        plugin.fitSmart = function ( width ) {
            // Never blow a page up past its own size.
            var natural = naturalWidth();
            if ( natural > 0 && width > 0 ) {
                plugin.setZoomLevel(Math.min(1, width / natural));
            }
        };

        plugin.getZoomLevel = function () {
            return zoomLevel;
        };

        plugin.setZoomLevel = function ( value ) {
            zoomLevel = value;
            if ( plugin.wrapper ) {
                // Zooming reflows the content, which keeps the scrollbars right.
                plugin.wrapper.style.zoom = value;
            }
        };

        plugin.getPages = function () {
            var pages = pageElements();

            return pages.length ? pages : [1];
        };

        plugin.showPage = function ( n ) {
            var pages = pageElements();
            if ( pages.length >= n && n > 0 ) {
                pages[n - 1].scrollIntoView({ block: 'start' });
            }
        };

        plugin.getPluginName = function () {
            return options.name;
        };

        plugin.getPluginVersion = function () {
            return "From Source";
        };

        plugin.getPluginURL = function () {
            return options.url || "https://grommunio.com";
        };

        // The page switcher of the viewer appears for a renderer that can say
        // which page is in view, so only offer it for a paged document.
        if ( options.pageSelector ) {
            plugin.getPageInView = function () {
                var pages     = pageElements(),
                    container = document.getElementById('canvasContainer'),
                    middle,
                    i,
                    box;

                if ( pages.length < 2 || !container ) {
                    return pages.length ? 1 : null;
                }

                middle = container.getBoundingClientRect().top + container.clientHeight / 3;
                for ( i = pages.length - 1; i >= 0; i -= 1 ) {
                    box = pages[i].getBoundingClientRect();
                    if ( box.top <= middle ) {
                        return i + 1;
                    }
                }

                return 1;
            };
        }

        return plugin;
    }

    return {
        t:             t,
        format:        format,
        loadScripts:   loadScripts,
        style:         style,
        fetchDocument: fetchDocument,
        showError:     showError,
        canvas:        canvas,
        flow:          flow
    };
}());
