/**
 * The renderer for a file with no renderer: says so, and offers the download.
 *
 * @author grommunio GmbH <dev@grommunio.com>
 */

/*global document, ViewerSupport*/

function UnknownFilePlugin() {
    "use strict";

    var divElement = undefined,
        self       = this;

    function initCSS() {
    }

    function initButtons() {
        var leftToolbar                                          = document.getElementById('toolbarLeft');
        // hide unused elements
        document.getElementById("navButtons").style.display      = 'none';
        document.getElementById("pageNumberLabel").style.display = 'none';
        document.getElementById("pageNumber").style.display      = 'none';
        document.getElementById("numPages").style.display        = 'none';
        document.getElementById("toolbar").style.display         = 'none';
        document.getElementById("titlebarRight").style.display   = 'none';
        leftToolbar.style.visibility                             = "visible";

    }

    this.initialize = function ( viewerElement, documentUrl ) {
        var message = document.createElement('p'),
            link    = document.createElement('a');

        divElement = document.createElement("div");
        divElement.setAttribute('class', 'unknown-file');
        message.textContent = ViewerSupport.t('This file cannot be previewed.');
        link.className      = 'download-button';
        link.href           = documentUrl;
        link.textContent    = ViewerSupport.t('Download');
        divElement.appendChild(message);
        divElement.appendChild(link);

        viewerElement.appendChild(divElement);
        viewerElement.style.overflow = "auto";

        self.onLoad();

        initCSS();
        initButtons();
    };

    this.isSlideshow = function () {
        return false;
    };

    this.onLoad = function () {
    };

    this.fitToWidth = function ( width ) {
    };

    this.fitToHeight = function ( height ) {
    };

    this.fitToPage = function ( width, height ) {
    };

    this.fitSmart = function ( width ) {
    };

    this.getZoomLevel = function () {
    };

    this.setZoomLevel = function ( value ) {
    };

    this.getPages = function () {
        return [1];
    };

    this.showPage = function ( n ) {
    };

    this.getPluginName = function () {
        return "UnknownFilePlugin";
    };

    this.getPluginVersion = function () {
        return "From Source";
    };

    this.getPluginURL = function () {
        return "https://grommunio.com";
    };
}
