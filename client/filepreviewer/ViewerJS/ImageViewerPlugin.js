/**
 * Image viewer plugin. An SVG goes through an image element like every other
 * format, so the scripts it may carry never run.
 *
 * @author grommunio GmbH <dev@grommunio.com>
 */

/*global document, ViewerSupport*/

function ImageViewerPlugin() {
    "use strict";

    var imgElement  = undefined,
        self        = this,
        rotation    = 0,
        currentPage = 1;

    function initButtons() {
        var leftToolbar                                          = document.getElementById('toolbarLeft');
        // hide unused elements
        document.getElementById("navButtons").style.display      = 'none';
        document.getElementById("pageNumberLabel").style.display = 'none';
        document.getElementById("pageNumber").style.display      = 'none';
        document.getElementById("numPages").style.display        = 'none';
        leftToolbar.style.visibility                             = "visible";

        var buttonSeperator = document.createElement("div");
        buttonSeperator.setAttribute('class', 'splitToolbarButtonSeparator');

        var rotateLeft = document.createElement("button");
        rotateLeft.setAttribute('class', 'toolbarButton rotateLeft');
        rotateLeft.setAttribute('title', ViewerSupport.t('Rotate left'));

        var rotateRight = document.createElement("button");
        rotateRight.setAttribute('class', 'toolbarButton rotateRight');
        rotateRight.setAttribute('title', ViewerSupport.t('Rotate right'));

        leftToolbar.appendChild(rotateLeft);
        leftToolbar.appendChild(buttonSeperator);
        leftToolbar.appendChild(rotateRight);

        // Attach events to the above buttons
        rotateLeft.addEventListener('click', function () {
            imageRotateLeft();
        });
        rotateRight.addEventListener('click', function () {
            imageRotateRight();
        });
    }

    function imageRotateLeft() {
        if ( rotation <= 0 ) {
            rotation = 360;
        }
        rotation -= 90;

        document.getElementById("image").className = 'rotate' + rotation;
    }

    function imageRotateRight() {
        if ( rotation >= 360 ) {
            rotation = 0;
        }
        rotation += 90;

        document.getElementById("image").className = 'rotate' + rotation;
    }

    this.initialize = function ( viewerElement, documentUrl ) {
        imgElement = document.createElement("img");
        imgElement.setAttribute('id', 'image');

        // The viewer scales as soon as this renderer is ready, and can only
        // do that once the picture has a size.
        imgElement.addEventListener('load', function () {
            self.onLoad();
        });
        imgElement.addEventListener('error', function () {
            ViewerSupport.showError(viewerElement);
            self.onLoad();
        });
        imgElement.setAttribute('src', documentUrl);

        viewerElement.appendChild(imgElement);
        viewerElement.style.overflow = "auto";

        initButtons();
    };

    this.isSlideshow = function () {
        return false;
    };

    this.onLoad = function () {
    };

    this.fitToWidth = function ( width ) {
        imgElement.width = width;
    };

    this.fitToHeight = function ( height ) {
        imgElement.height = height;
    };

    this.fitToPage = function ( width ) {
        imgElement.width = width;
    };

    this.fitSmart = function ( width ) {
        // A picture smaller than the frame is shown at its own size rather
        // than blown up to fill it.
        imgElement.width = Math.min(width, imgElement.naturalWidth || width);
    };

    this.getZoomLevel = function () {
        return imgElement.width / imgElement.naturalWidth;
    };

    this.setZoomLevel = function ( value ) {
        imgElement.width = value * imgElement.naturalWidth;
    };

    // return a list of tuples (pagename, pagenode)
    this.getPages = function () {
        return [1, 2];
    };

    this.showPage = function ( n ) {
        if ( n === currentPage ) {
            imgElement.parentNode.scrollTop -= 100;
        } else {
            imgElement.parentNode.scrollTop += 100;
        }
    };

    this.getPluginName = function () {
        return "ImageViewerPlugin";
    };

    this.getPluginVersion = function () {
        return "From Source";
    };

    this.getPluginURL = function () {
        return "https://grommunio.com";
    };
}
