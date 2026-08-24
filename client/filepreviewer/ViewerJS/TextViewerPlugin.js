/**
 * Plain text, source code and Markdown viewer plugin. Markup is shown as
 * source: the viewer shares its origin with grommunio Web.
 *
 * @author grommunio GmbH <dev@grommunio.com>
 */

/*global document, window, TextDecoder, ViewerSupport*/

function TextViewerPlugin() {
    "use strict";

    var self       = this,
        kMaxLength = 4 * 1024 * 1024,
        wrapped    = false,
        gutter     = null,
        body       = null;

    ViewerSupport.flow(self, {
        name: "TextViewer",
        url:  "https://grommunio.com"
    });

    function injectStyle() {
        ViewerSupport.style('text-viewer-style',
            '.text-wrapper{display:flex;align-items:flex-start;background:#fff;text-align:left;' +
                'font-family:Consolas,"Liberation Mono",Menlo,monospace;font-size:13px;line-height:1.5;}' +
            '.text-gutter{flex:none;padding:12px 8px 12px 12px;text-align:right;color:#999;' +
                'background:#f6f6f6;border-right:1px solid #e0e0e0;user-select:none;}' +
            '.text-body{flex:1 1 auto;min-width:0;padding:12px 16px;margin:0;' +
                'white-space:pre;overflow-wrap:normal;}' +
            '.text-body.wrapped{white-space:pre-wrap;overflow-wrap:anywhere;}' +
            '.text-toggle{margin-left:8px;color:#fff;background:transparent;border:1px solid #6b6b6b;' +
                'border-radius:3px;padding:2px 8px;font-size:12px;cursor:pointer;}' +
            '.text-toggle.on{background:#6b6b6b;}' +
            '.markdown-wrapper{background:#fff;padding:24px 32px;max-width:52em;margin:0 auto;text-align:left;' +
                'font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#222;}' +
            '.markdown-wrapper h1,.markdown-wrapper h2,.markdown-wrapper h3{line-height:1.25;margin:1.2em 0 .5em;}' +
            '.markdown-wrapper h1{font-size:1.8em;border-bottom:1px solid #eee;padding-bottom:.2em;}' +
            '.markdown-wrapper h2{font-size:1.4em;border-bottom:1px solid #eee;padding-bottom:.2em;}' +
            '.markdown-wrapper h3{font-size:1.15em;}' +
            '.markdown-wrapper code{font-family:Consolas,"Liberation Mono",Menlo,monospace;' +
                'background:#f3f3f3;border-radius:3px;padding:1px 4px;font-size:.9em;}' +
            '.markdown-wrapper pre{background:#f6f6f6;border:1px solid #e4e4e4;border-radius:4px;' +
                'padding:10px 12px;overflow:auto;}' +
            '.markdown-wrapper pre code{background:none;padding:0;}' +
            '.markdown-wrapper blockquote{margin:.8em 0;padding:.2em 1em;color:#555;border-left:4px solid #ddd;}' +
            '.markdown-wrapper table{border-collapse:collapse;margin:1em 0;}' +
            '.markdown-wrapper th,.markdown-wrapper td{border:1px solid #ddd;padding:5px 10px;}' +
            '.markdown-wrapper hr{border:none;border-top:1px solid #ddd;margin:1.5em 0;}');
    }

    /**
     * Decode the bytes of the file. A byte order mark decides on its own;
     * otherwise the text is read as UTF-8 and, where that does not hold,
     * as Windows-1252, which never fails and covers the Western European
     * text files that are not UTF-8.
     */
    function decode( buffer ) {
        var bytes = new Uint8Array(buffer);

        if ( bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE ) {
            return new TextDecoder('utf-16le').decode(bytes.subarray(2));
        }
        if ( bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF ) {
            return new TextDecoder('utf-16be').decode(bytes.subarray(2));
        }
        if ( bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF ) {
            bytes = bytes.subarray(3);
        }

        try {
            return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        } catch ( e ) {
            return new TextDecoder('windows-1252').decode(bytes);
        }
    }

    /**
     * Lay JSON out over several lines. A file that does not parse is left
     * exactly as it is, so that the error stays visible.
     */
    function prettyJson( text ) {
        try {
            return JSON.stringify(JSON.parse(text), null, 2);
        } catch ( e ) {
            return text;
        }
    }

    function isMarkdown( extension ) {
        return extension === 'md' || extension === 'markdown';
    }

    /**
     * The inline Markdown of one line, as DOM nodes: code spans, links,
     * bold and italic. Everything is built as text nodes and elements, so
     * nothing in the document can introduce markup of its own.
     */
    function inlineMarkdown( text, parent ) {
        var pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*\n]+\*)|(_[^_\n]+_)|(\[[^\]]+\]\([^)\s]+\))/,
            match,
            token,
            element,
            label,
            href;

        while ( text ) {
            match = pattern.exec(text);
            if ( !match ) {
                parent.appendChild(document.createTextNode(text));

                return;
            }
            if ( match.index > 0 ) {
                parent.appendChild(document.createTextNode(text.slice(0, match.index)));
            }
            token = match[0];
            if ( token.charAt(0) === '`' ) {
                element = document.createElement('code');
                element.textContent = token.slice(1, -1);
            } else if ( token.indexOf('**') === 0 || token.indexOf('__') === 0 ) {
                element = document.createElement('strong');
                inlineMarkdown(token.slice(2, -2), element);
            } else if ( token.charAt(0) === '[' ) {
                label   = token.slice(1, token.indexOf(']'));
                href    = token.slice(token.indexOf('](') + 2, -1);
                element = document.createElement('a');
                element.textContent = label;
                // Only http(s) and mail links are followed; anything else
                // stays as plain text.
                if ( /^(https?:|mailto:)/i.test(href) ) {
                    element.href   = href;
                    element.target = '_blank';
                    element.rel    = 'noopener noreferrer';
                }
            } else {
                element = document.createElement('em');
                inlineMarkdown(token.slice(1, -1), element);
            }
            parent.appendChild(element);
            text = text.slice(match.index + token.length);
        }
    }

    /**
     * Render Markdown: headings, lists, block quotes, fenced and indented
     * code, horizontal rules, tables and paragraphs.
     */
    function renderMarkdown( text, wrapper ) {
        var lines = text.split(/\r\n|\r|\n/),
            i     = 0,
            list  = null,
            paragraph = null,
            line,
            heading,
            element,
            fence,
            code,
            cells,
            row,
            table;

        function endBlocks() {
            list      = null;
            paragraph = null;
        }

        function tableRow( source, cellTag ) {
            var tr = document.createElement('tr');
            source.replace(/^\||\|$/g, '').split('|').forEach(function ( cell ) {
                var td = document.createElement(cellTag);
                inlineMarkdown(cell.trim(), td);
                tr.appendChild(td);
            });

            return tr;
        }

        while ( i < lines.length ) {
            line = lines[i];

            if ( /^```/.test(line) ) {
                endBlocks();
                fence = document.createElement('pre');
                code  = document.createElement('code');
                i += 1;
                while ( i < lines.length && !/^```/.test(lines[i]) ) {
                    code.appendChild(document.createTextNode(lines[i] + '\n'));
                    i += 1;
                }
                fence.appendChild(code);
                wrapper.appendChild(fence);
                i += 1;
                continue;
            }

            heading = /^(#{1,6})\s+(.*)$/.exec(line);
            if ( heading ) {
                endBlocks();
                element = document.createElement('h' + heading[1].length);
                inlineMarkdown(heading[2], element);
                wrapper.appendChild(element);
                i += 1;
                continue;
            }

            if ( /^(\s*)([-*_])(\s*\2){2,}\s*$/.test(line) ) {
                endBlocks();
                wrapper.appendChild(document.createElement('hr'));
                i += 1;
                continue;
            }

            // A table needs a delimiter row under its header.
            if ( line.indexOf('|') !== -1 && i + 1 < lines.length &&
                    /^\s*\|?[\s:-]*-[\s|:-]*\|?\s*$/.test(lines[i + 1]) && lines[i + 1].indexOf('-') !== -1 ) {
                endBlocks();
                table = document.createElement('table');
                table.appendChild(tableRow(line, 'th'));
                i += 2;
                while ( i < lines.length && lines[i].indexOf('|') !== -1 ) {
                    table.appendChild(tableRow(lines[i], 'td'));
                    i += 1;
                }
                wrapper.appendChild(table);
                continue;
            }

            row = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line);
            if ( row ) {
                paragraph = null;
                if ( !list ) {
                    list = document.createElement(/^\s*\d/.test(line) ? 'ol' : 'ul');
                    wrapper.appendChild(list);
                }
                element = document.createElement('li');
                inlineMarkdown(row[1], element);
                list.appendChild(element);
                i += 1;
                continue;
            }

            cells = /^>\s?(.*)$/.exec(line);
            if ( cells ) {
                endBlocks();
                element = document.createElement('blockquote');
                inlineMarkdown(cells[1], element);
                wrapper.appendChild(element);
                i += 1;
                continue;
            }

            if ( !line.trim() ) {
                endBlocks();
                i += 1;
                continue;
            }

            if ( !paragraph ) {
                paragraph = document.createElement('p');
                wrapper.appendChild(paragraph);
            } else {
                paragraph.appendChild(document.createTextNode(' '));
            }
            inlineMarkdown(line, paragraph);
            i += 1;
        }
    }

    /**
     * A switch in the toolbar for line wrapping, which long log lines and
     * unwrapped source need.
     */
    function addWrapToggle() {
        var button = document.createElement('button');
        button.className   = 'text-toggle';
        button.textContent = ViewerSupport.t('Wrap lines');
        button.addEventListener('click', function () {
            wrapped = !wrapped;
            button.classList.toggle('on', wrapped);
            body.classList.toggle('wrapped', wrapped);
            if ( gutter ) {
                // Wrapped lines no longer line up with the gutter.
                gutter.style.display = wrapped ? 'none' : '';
            }
        });
        document.getElementById('toolbarRight').appendChild(button);
    }

    function render( text, extension ) {
        var canvas  = ViewerSupport.canvas(),
            wrapper = document.createElement('div'),
            numbers,
            count,
            i;

        if ( text.length > kMaxLength ) {
            text = text.slice(0, kMaxLength);
        }

        if ( isMarkdown(extension) ) {
            wrapper.className = 'markdown-wrapper';
            renderMarkdown(text, wrapper);
            canvas.appendChild(wrapper);
            self.wrapper = wrapper;

            return;
        }

        if ( extension === 'json' ) {
            text = prettyJson(text);
        }

        wrapper.className = 'text-wrapper';

        // Trailing newlines would otherwise add an empty numbered line.
        count   = text.replace(/\n$/, '').split('\n').length;
        numbers = [];
        for ( i = 1; i <= count; i += 1 ) {
            numbers.push(i);
        }

        gutter = document.createElement('div');
        gutter.className   = 'text-gutter';
        gutter.textContent = numbers.join('\n');
        gutter.style.whiteSpace = 'pre';

        body = document.createElement('pre');
        body.className   = 'text-body';
        body.textContent = text;

        wrapper.appendChild(gutter);
        wrapper.appendChild(body);
        canvas.appendChild(wrapper);
        self.wrapper = wrapper;

        addWrapToggle();
    }

    this.initialize = function ( viewerElement, documentUrl ) {
        var extension = (window.viewerParameters && window.viewerParameters.extension) || '';

        injectStyle();
        ViewerSupport.fetchDocument(documentUrl).then(function ( buffer ) {
            render(decode(buffer), extension);
            self.ready();
        }).catch(function ( err ) {
            console.log('TextViewerPlugin: failed to read document: ' + err);
            ViewerSupport.showError(ViewerSupport.canvas());
            self.ready();
        });
    };

    // Text has no page width of its own; it is read at its natural size.
    this.fitToWidth = function () {
    };

    this.fitSmart = function () {
    };
}
