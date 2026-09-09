/**
 * Message (.eml) viewer plugin, for a stored message outside a mailbox.
 *
 * The body is not trusted: it goes through DOMPurify, and remote content is
 * left unloaded.
 *
 * @author grommunio GmbH <dev@grommunio.com>
 */

/*global document, window, TextDecoder, DOMPurify, ViewerSupport*/

function MessageViewerPlugin() {
    "use strict";

    var self = this;

    ViewerSupport.flow(self, {
        name: "MessageViewer",
        url:  "https://grommunio.com"
    });

    function injectStyle() {
        ViewerSupport.style('message-viewer-style',
            '.eml-wrapper{background:#fff;text-align:left;color:#222;margin:0 auto;padding:24px 32px;' +
                'max-width:900px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;}' +
            '.eml-subject{font-size:20px;font-weight:bold;margin:0 0 12px;}' +
            '.eml-headers{display:grid;grid-template-columns:max-content 1fr;gap:2px 12px;' +
                'margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #e0e0e0;}' +
            '.eml-name{color:#666;}' +
            '.eml-value{word-break:break-word;}' +
            '.eml-attachments{margin:0 0 16px;padding:8px 12px;background:#f6f6f6;' +
                'border:1px solid #e4e4e4;border-radius:4px;}' +
            '.eml-attachments h4{margin:0 0 6px;font-size:12px;text-transform:uppercase;color:#666;}' +
            '.eml-attachment{display:block;padding:2px 0;}' +
            '.eml-body{word-wrap:break-word;}' +
            '.eml-body img{max-width:100%;height:auto;}' +
            '.eml-body blockquote{margin:.5em 0;padding-left:1em;border-left:3px solid #ddd;color:#555;}' +
            '.eml-plain{white-space:pre-wrap;font-family:inherit;margin:0;}' +
            // Remote content is left unloaded, and marked rather than broken.
            '.eml-body img.eml-blocked{min-width:16px;min-height:16px;' +
                'border:1px dashed #c8c8c8;background:#fafafa;}');
    }


    /**
     * The character set a part declares, as a name TextDecoder knows. An
     * unknown one is read as Windows-1252, which never fails.
     */
    function decodeBytes( bytes, charset ) {
        try {
            return new TextDecoder(charset || 'utf-8', { fatal: false }).decode(bytes);
        } catch ( e ) {
            return new TextDecoder('windows-1252').decode(bytes);
        }
    }

    function decodeBase64( text ) {
        var clean  = text.replace(/[^A-Za-z0-9+/=]/g, ''),
            binary,
            out,
            i;

        try {
            binary = window.atob(clean);
        } catch ( e ) {
            return new Uint8Array(0);
        }
        out = new Uint8Array(binary.length);
        for ( i = 0; i < binary.length; i += 1 ) {
            out[i] = binary.charCodeAt(i);
        }

        return out;
    }

    /**
     * The bytes of a part that carries no transfer encoding. The message was
     * read one character per byte, so the characters are the bytes.
     */
    function rawBytes( text ) {
        var out = new Uint8Array(text.length),
            i;

        for ( i = 0; i < text.length; i += 1 ) {
            out[i] = text.charCodeAt(i) & 0xFF;
        }

        return out;
    }

    function decodeQuotedPrintable( text ) {
        var joined = text.replace(/=\r?\n/g, ''),
            out    = [],
            i      = 0,
            code;

        while ( i < joined.length ) {
            if ( joined.charAt(i) === '=' && i + 2 < joined.length ) {
                code = parseInt(joined.substr(i + 1, 2), 16);
                if ( !isNaN(code) ) {
                    out.push(code);
                    i += 3;
                    continue;
                }
            }
            out.push(joined.charCodeAt(i) & 0xFF);
            i += 1;
        }

        return new Uint8Array(out);
    }

    /**
     * A header written with encoded words, as in
     * =?utf-8?Q?Gr=C3=BC=C3=9Fe?=, read back into text.
     */
    function decodeHeader( value ) {
        if ( !value ) {
            return '';
        }

        // The space between two encoded words is not part of the text; the
        // space between an encoded word and anything else is.
        return value.replace(/\?=[ \t]+(?:\r?\n[ \t]+)?=\?/g, '?==?')
            .replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g,
                function ( match, charset, encoding, text ) {
                    var bytes = encoding.toUpperCase() === 'B' ?
                        decodeBase64(text) :
                        decodeQuotedPrintable(text.replace(/_/g, ' '));

                    return decodeBytes(bytes, charset);
                });
    }

    /**
     * The value and the parameters of a structured header, such as
     * text/html; charset="utf-8".
     */
    function parseHeaderValue( value ) {
        var parts = (value || '').split(';'),
            out   = { value: (parts.shift() || '').trim().toLowerCase(), parameters: {} },
            match;

        parts.forEach(function ( part ) {
            match = /^\s*([^=*]+)\*?\s*=\s*(.*)$/.exec(part);
            if ( !match ) {
                return;
            }
            out.parameters[match[1].trim().toLowerCase()] =
                match[2].trim().replace(/^"|"$/g, '');
        });

        return out;
    }

    /**
     * Split a part into its headers and its body, and unfold the headers.
     */
    function splitPart( text ) {
        var separator = text.search(/\r?\n\r?\n/),
            head      = separator === -1 ? text : text.slice(0, separator),
            body      = separator === -1 ? '' : text.slice(separator).replace(/^\r?\n\r?\n/, ''),
            headers   = {};

        head.replace(/\r?\n[ \t]+/g, ' ').split(/\r?\n/).forEach(function ( line ) {
            var colon = line.indexOf(':');

            if ( colon > 0 ) {
                headers[line.slice(0, colon).trim().toLowerCase()] = line.slice(colon + 1).trim();
            }
        });

        return { headers: headers, body: body };
    }

    /**
     * Read one part of a message, and the parts inside it.
     */
    function parsePart( text ) {
        var part     = splitPart(text),
            type     = parseHeaderValue(part.headers['content-type'] || 'text/plain'),
            encoding = (part.headers['content-transfer-encoding'] || '').trim().toLowerCase(),
            disposition = parseHeaderValue(part.headers['content-disposition'] || ''),
            boundary,
            pieces;

        part.type        = type.value;
        part.charset     = type.parameters.charset;
        part.disposition = disposition.value;
        part.filename    = decodeHeader(disposition.parameters.filename || type.parameters.name || '');
        part.contentId   = (part.headers['content-id'] || '').replace(/^<|>$/g, '');
        part.parts       = [];

        if ( part.type.indexOf('multipart/') === 0 && type.parameters.boundary ) {
            boundary = type.parameters.boundary;
            pieces   = part.body.split(new RegExp('\r?\n?--' +
                boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(--)?[ \t]*\r?\n?'));
            // The text before the first boundary and after the last are not
            // parts of the message.
            pieces.slice(1, -1).forEach(function ( piece ) {
                if ( piece !== undefined && piece !== '--' && piece.trim() ) {
                    part.parts.push(parsePart(piece));
                }
            });

            return part;
        }

        if ( encoding === 'base64' ) {
            part.bytes = decodeBase64(part.body);
        } else if ( encoding === 'quoted-printable' ) {
            part.bytes = decodeQuotedPrintable(part.body);
        } else {
            part.bytes = rawBytes(part.body);
        }

        return part;
    }

    /**
     * Walk every part of the message, deepest last.
     */
    function eachPart( part, visit ) {
        visit(part);
        part.parts.forEach(function ( nested ) {
            eachPart(nested, visit);
        });
    }

    /**
     * The part that is the message itself: the richest alternative offered.
     */
    function chooseBody( root ) {
        var html  = null,
            plain = null;

        eachPart(root, function ( part ) {
            if ( part.disposition === 'attachment' || part.parts.length ) {
                return;
            }
            if ( part.type === 'text/html' && !html ) {
                html = part;
            }
            if ( part.type === 'text/plain' && !plain ) {
                plain = part;
            }
        });

        return html || plain;
    }


    function addHeader( list, name, value ) {
        var label,
            text;

        if ( !value ) {
            return;
        }
        label = document.createElement('div');
        label.className   = 'eml-name';
        label.textContent = ViewerSupport.t(name);
        text  = document.createElement('div');
        text.className    = 'eml-value';
        text.textContent  = value;
        list.appendChild(label);
        list.appendChild(text);
    }

    function formatSize( bytes ) {
        var units = ['B', 'KB', 'MB', 'GB'],
            value = bytes,
            unit  = 0;

        while ( value >= 1024 && unit < units.length - 1 ) {
            value /= 1024;
            unit  += 1;
        }

        return (unit === 0 ? value : value.toFixed(1)) + ' ' + units[unit];
    }

    /**
     * Put the pictures the message carries with it in place of the
     * references to them, and leave everything else it wants to load alone.
     */
    function resolveInlineImages( element, byContentId ) {
        Array.prototype.forEach.call(element.querySelectorAll('img'), function ( image ) {
            var source = image.getAttribute('src') || '',
                id     = /^cid:(.*)$/i.exec(source),
                part;

            if ( !id ) {
                // Remote content stays unloaded: fetching it would tell the
                // sender the message has been read.
                if ( /^https?:/i.test(source) ) {
                    image.removeAttribute('src');
                    image.removeAttribute('alt');
                    image.className = 'eml-blocked';
                    image.title     = source;
                }

                return;
            }
            part = byContentId[decodeURIComponent(id[1])];
            if ( part ) {
                image.src = 'data:' + part.type + ';base64,' + bytesToBase64(part.bytes);
            } else {
                image.removeAttribute('src');
            }
        });
    }

    function bytesToBase64( bytes ) {
        var binary = '',
            chunk  = 8192,
            i;

        for ( i = 0; i < bytes.length; i += chunk ) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }

        return window.btoa(binary);
    }

    function render( buffer ) {
        var canvas   = ViewerSupport.canvas(),
            wrapper  = document.createElement('div'),
            message  = parsePart(decodeBytes(new Uint8Array(buffer), 'windows-1252')),
            headers  = message.headers,
            list     = document.createElement('div'),
            subject  = document.createElement('div'),
            body     = document.createElement('div'),
            attachments = [],
            byContentId = {},
            chosen   = chooseBody(message),
            box,
            title;

        wrapper.className = 'eml-wrapper';

        subject.className   = 'eml-subject';
        subject.textContent = decodeHeader(headers.subject) || '(' + ViewerSupport.t('Subject') + ')';
        wrapper.appendChild(subject);

        list.className = 'eml-headers';
        addHeader(list, 'From', decodeHeader(headers.from));
        addHeader(list, 'To', decodeHeader(headers.to));
        addHeader(list, 'Cc', decodeHeader(headers.cc));
        addHeader(list, 'Date', decodeHeader(headers.date));
        wrapper.appendChild(list);

        eachPart(message, function ( part ) {
            if ( part.parts.length || part === chosen ) {
                return;
            }
            if ( part.contentId ) {
                byContentId[part.contentId] = part;
            }
            if ( part.filename || part.disposition === 'attachment' ) {
                attachments.push(part);
            }
        });

        if ( attachments.length ) {
            box   = document.createElement('div');
            title = document.createElement('h4');
            box.className   = 'eml-attachments';
            title.textContent = ViewerSupport.t('Attachments');
            box.appendChild(title);
            attachments.forEach(function ( part ) {
                var entry = document.createElement('span');
                entry.className   = 'eml-attachment';
                entry.textContent = (part.filename || part.type) +
                    ' — ' + formatSize(part.bytes.length);
                box.appendChild(entry);
            });
            wrapper.appendChild(box);
        }

        body.className = 'eml-body';
        if ( !chosen ) {
            body.textContent = ViewerSupport.t('This message has no content.');
        } else if ( chosen.type === 'text/html' ) {
            // DOMPurify keeps the markup and drops everything that could act.
            body.innerHTML = DOMPurify.sanitize(decodeBytes(chosen.bytes, chosen.charset), {
                FORBID_TAGS:  ['style', 'form', 'input', 'button'],
                FORBID_ATTR:  ['srcset'],
                ADD_ATTR:     ['target']
            });
            resolveInlineImages(body, byContentId);
            Array.prototype.forEach.call(body.querySelectorAll('a[href]'), function ( link ) {
                link.target = '_blank';
                link.rel    = 'noopener noreferrer';
            });
        } else {
            var plain = document.createElement('pre');
            plain.className   = 'eml-plain';
            plain.textContent = decodeBytes(chosen.bytes, chosen.charset).replace(/\r\n?/g, '\n');
            body.appendChild(plain);
        }
        wrapper.appendChild(body);

        canvas.appendChild(wrapper);
        self.wrapper = wrapper;
    }

    this.initialize = function ( viewerElement, documentUrl ) {
        injectStyle();
        ViewerSupport.fetchDocument(documentUrl).then(function ( buffer ) {
            render(buffer);
            self.ready();
        }).catch(function ( err ) {
            console.log('MessageViewerPlugin: failed to render message: ' + (err && err.stack || err));
            ViewerSupport.showError(ViewerSupport.canvas());
            self.ready();
        });
    };

    // A message is read at its natural size.
    this.fitToWidth = function () {
    };

    this.fitSmart = function () {
    };
}
