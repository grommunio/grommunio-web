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

    /**
     * There is nothing to page through, zoom or print, so the toolbar is put
     * away and the message gets the whole frame.
     */
    function initButtons() {
        document.getElementById('toolbarContainer').style.display = 'none';
        document.getElementById('canvasContainer').style.top      = '0';
        document.getElementById('canvas').style.display           = 'none';
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

        initButtons();
        self.onLoad();
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
