/**
 * Spreadsheet (OOXML .xlsx) viewer plugin for ViewerJS.
 *
 * Renders a spreadsheet attachment to HTML tables entirely in the browser
 * using the SheetJS Community Edition library (https://sheetjs.com,
 * Apache-2.0), vendored under ./vendor/xlsx.full.min.js and loaded on demand.
 * A small tab bar lets the user switch between worksheets.
 *
 * @author grommunio GmbH <dev@grommunio.com>
 */

/*global document, fetch, XLSX, console*/

function XlsxViewerPlugin() {
    "use strict";

    var self         = this,
        pluginName   = "XlsxViewer",
        pluginURL    = "https://sheetjs.com",
        workbook     = null,
        content      = null,
        sheetCache   = {},
        zoomLevel    = 1,
        initialized  = false;

    function loadLib( callback ) {
        var script   = document.createElement('script');
        script.async = false;
        script.src   = './vendor/xlsx.full.min.js';
        script.type  = 'text/javascript';
        script.onload = callback;
        document.head.appendChild(script);
    }

    function injectStyle() {
        if ( document.getElementById('xlsx-viewer-style') ) {
            return;
        }
        var style = document.createElement('style');
        style.id  = 'xlsx-viewer-style';
        style.textContent =
            '.xlsx-wrapper{background:#fff;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;}' +
            '.xlsx-tabs{position:sticky;top:0;background:#f3f3f3;border-bottom:1px solid #ccc;padding:4px 8px;white-space:nowrap;overflow-x:auto;z-index:2;}' +
            '.xlsx-tab{display:inline-block;padding:4px 12px;margin-right:4px;border:1px solid #ccc;border-bottom:none;background:#e4e4e4;cursor:pointer;border-radius:4px 4px 0 0;}' +
            '.xlsx-tab.active{background:#fff;font-weight:bold;}' +
            '.xlsx-sheet{padding:12px;overflow:auto;}' +
            '.xlsx-sheet table{border-collapse:collapse;}' +
            '.xlsx-sheet td,.xlsx-sheet th{border:1px solid #d0d0d0;padding:2px 6px;min-width:32px;white-space:nowrap;}';
        document.head.appendChild(style);
    }

    function isSheetVisible( index ) {
        var props = workbook.Workbook && workbook.Workbook.Sheets;
        return !(props && props[index] && props[index].Hidden);
    }

    function visibleSheetNames() {
        var names = workbook.SheetNames.filter(function ( name, index ) {
            return isSheetVisible(index);
        });
        // All sheets hidden: show everything rather than nothing.
        return names.length ? names : workbook.SheetNames.slice();
    }

    function renderSheet( name ) {
        if ( !sheetCache[name] ) {
            sheetCache[name] = XLSX.utils.sheet_to_html(workbook.Sheets[name], { editable: false, header: '', footer: '' });
        }
        content.innerHTML = sheetCache[name];
        content.style.zoom = zoomLevel;
    }

    function buildUI( container ) {
        injectStyle();

        var wrapper = document.createElement('div');
        wrapper.className = 'xlsx-wrapper';

        var tabs = document.createElement('div');
        tabs.className = 'xlsx-tabs';

        content = document.createElement('div');
        content.className = 'xlsx-sheet';

        var sheetNames = visibleSheetNames();
        sheetNames.forEach(function ( name ) {
            var tab = document.createElement('span');
            tab.className   = 'xlsx-tab';
            tab.textContent = name;
            tab.addEventListener('click', function () {
                var active = tabs.querySelector('.xlsx-tab.active');
                if ( active ) {
                    active.classList.remove('active');
                }
                tab.classList.add('active');
                renderSheet(name);
            });
            tabs.appendChild(tab);
        });

        wrapper.appendChild(tabs);
        wrapper.appendChild(content);
        container.innerHTML = '';
        container.appendChild(wrapper);

        // Show the first sheet, or hide the tab bar for a single-sheet workbook.
        if ( sheetNames.length <= 1 ) {
            tabs.style.display = 'none';
        }
        var firstTab = tabs.querySelector('.xlsx-tab');
        if ( firstTab ) {
            firstTab.classList.add('active');
        }
        renderSheet(sheetNames[0]);
    }

    function showError( container ) {
        container.innerHTML = '<div class="unknown-file">This spreadsheet could not be previewed.</div>';
    }

    this.initialize = function ( viewerElement, documentUrl ) {
        loadLib(function () {
            var container = document.getElementById('canvas');

            fetch(documentUrl, { credentials: 'same-origin' })
                .then(function ( response ) {
                    if ( !response.ok ) {
                        throw new Error('HTTP ' + response.status);
                    }
                    return response.arrayBuffer();
                })
                .then(function ( buffer ) {
                    workbook    = XLSX.read(new Uint8Array(buffer), { type: 'array' });
                    if ( !workbook.SheetNames || workbook.SheetNames.length === 0 ) {
                        throw new Error('no sheets');
                    }
                    buildUI(container);
                    initialized = true;
                    self.onLoad();
                })
                .catch(function ( err ) {
                    console.log('XlsxViewerPlugin: failed to render spreadsheet: ' + (err && err.stack ? err.stack : err));
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

    // Spreadsheets have no intrinsic page width; the sheet area scrolls in both
    // directions, so the fit modes only drive the zoom factor.
    this.fitToWidth = function ( width ) {
    };

    this.fitToHeight = function ( height ) {
    };

    this.fitToPage = function ( width, height ) {
    };

    this.fitSmart = function ( width ) {
    };

    this.getZoomLevel = function () {
        return zoomLevel;
    };

    this.setZoomLevel = function ( value ) {
        zoomLevel = value;
        if ( content ) {
            content.style.zoom = value;
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
