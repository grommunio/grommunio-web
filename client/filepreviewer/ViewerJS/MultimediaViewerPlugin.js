/**
 * Multimedia Viewer Plugin using Video.js
 * @author Christoph Haas <christoph.h@sprinternet.at>
 * @author grommunio GmbH <dev@grommunio.com>
 */
function MultimediaViewerPlugin() {
    "use strict";

    var videoElement = undefined,
        videoSource  = undefined,
        self         = this;

    this.initialize = function ( viewerElement, documentUrl ) {
        if ( window.mimetype.indexOf("audio/") === 0 ) {
            videoElement = document.createElement("audio");
            videoElement.setAttribute('poster', 'data:image/png;base64,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');
        } else {
            videoElement = document.createElement("video");
        }
        videoElement.setAttribute('preload', 'auto');
        videoElement.setAttribute('id', 'multimedia_viewer');
        videoElement.setAttribute('controls', 'controls');
        videoElement.setAttribute('class', 'video-js vjs-theme-sea');

        videoSource = document.createElement("source");
        videoSource.setAttribute('src', documentUrl);
        videoSource.setAttribute('type', window.mimetype);
        videoElement.appendChild(videoSource);

        viewerElement.appendChild(videoElement);
        viewerElement.style.overflow = "auto";

        // init viewerjs
        videojs(document.getElementById('multimedia_viewer'), {
            controls:  'enabled',
            techOrder: ['html5']
        }, function () {
            // This is functionally the same as the previous example.
        });

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

    // return a list of tuples (pagename, pagenode)
    this.getPages = function () {
        return [videoElement];
    };

    this.showPage = function ( n ) {
        // hide middle toolbar
        document.getElementById('toolbarMiddleContainer').style.visibility = "hidden";
    };

    this.getPluginName = function () {
        return "MultimediaViewerPlugin";
    };

    this.getPluginVersion = function () {
        return "From Source";
    };

    this.getPluginURL = function () {
        return "https://grommunio.com";
    };
}
