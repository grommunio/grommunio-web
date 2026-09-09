/**
 * Word (OOXML .docx) viewer plugin, using docx-preview (Apache-2.0) and JSZip
 * (MIT), both vendored under ./vendor/.
 *
 * @author grommunio GmbH <dev@grommunio.com>
 */

/*global document, fetch, docx, console, ViewerSupport*/

function DocxViewerPlugin() {
    "use strict";

    var self = this;

    ViewerSupport.flow(self, {
        name:         "DocxViewer",
        url:          "https://github.com/VolodymyrBaydalka/docxjs",
        // Pages are laid out as sections, which is what the page switcher
        // of the viewer steps through.
        pageSelector: 'section.docx'
    });

    // Word writes a bullet as a Symbol or Wingdings character, which lands
    // in the private use area where no fallback font has a glyph.
    var bullets = {
        '\uF0B7': '\u2022', '\uF0A7': '\u25AA', '\uF06C': '\u25CF',
        '\uF06E': '\u25A0', '\uF075': '\u2756', '\uF09F': '\u2666',
        '\uF0A8': '\u25D8', '\uF0D8': '\u27A2', '\uF0FC': '\u2714',
        '\uF0E0': '\u27A8', '\uF04A': '\u263A', '\uF06F': '\u25CB'
    };

    /**
     * Put a bullet the reader can actually see in front of every list item.
     * The marker is written into the stylesheet docx-preview produces, so
     * that is where it is corrected, font and all.
     */
    function replaceBullets( container ) {
        Array.prototype.forEach.call(container.querySelectorAll('style'), function ( element ) {
            var css = element.textContent;

            if ( !/[\uF000-\uF0FF]/.test(css) ) {
                return;
            }
            css = css.replace(/[\uF000-\uF0FF]/g, function ( character ) {
                return bullets[character] || '\u2022';
            });
            // The marker font would only be substituted at random now.
            css = css.replace(/font-family:\s*(Symbol|Wingdings[^;"]*|Webdings|Marlett)\s*;/gi, '');
            element.textContent = css;
        });
    }

    /**
     * A picture in a format the browser cannot show - a metafile, say - is
     * left without a source and would render broken.
     */
    function dropBrokenImages( container ) {
        Array.prototype.forEach.call(container.querySelectorAll('img'), function ( image ) {
            var source = image.getAttribute('src');

            if ( !source || source === 'null' || source === 'undefined' ) {
                image.parentNode.removeChild(image);
            }
        });
    }

    this.initialize = function ( viewerElement, documentUrl ) {
        var container = ViewerSupport.canvas();

        ViewerSupport.fetchDocument(documentUrl, 'blob').then(function ( blob ) {
            return docx.renderAsync(blob, container, null, {
                className:                   'docx',
                inWrapper:                   true,
                ignoreWidth:                 false,
                ignoreHeight:                false,
                breakPages:                  true,
                ignoreLastRenderedPageBreak: true,
                useBase64URL:                true
            });
        }).then(function () {
            replaceBullets(container);
            dropBrokenImages(container);
            self.wrapper = container.querySelector('.docx-wrapper') || container;
            self.ready();
        }).catch(function ( err ) {
            console.log('DocxViewerPlugin: failed to render document: ' + (err && err.stack || err));
            ViewerSupport.showError(container);
            self.ready();
        });
    };
}
