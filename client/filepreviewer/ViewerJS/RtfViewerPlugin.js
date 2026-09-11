/**
 * Rich Text Format viewer plugin: walks the group and control word stream and
 * builds the document from it.
 *
 * @author grommunio GmbH <dev@grommunio.com>
 */

/*global document, window, TextDecoder, ViewerSupport*/

function RtfViewerPlugin() {
    "use strict";

    var self = this;

    ViewerSupport.flow(self, {
        name: "RtfViewer",
        url:  "https://grommunio.com"
    });

    function injectStyle() {
        ViewerSupport.style('rtf-viewer-style',
            '.rtf-wrapper{background:#fff;text-align:left;color:#000;margin:16px auto;padding:48px 60px;' +
                'max-width:820px;border-radius:4px;box-shadow:var(--page-shadow);' +
                'font-family:"Times New Roman",Times,serif;font-size:12pt;line-height:1.35;}' +
            '.rtf-wrapper p{margin:0 0 .35em;min-height:1em;}' +
            '.rtf-wrapper table{border-collapse:collapse;margin:.5em 0;}' +
            '.rtf-wrapper td{border:1px solid #b5b5b5;padding:2px 6px;vertical-align:top;}' +
            '.rtf-wrapper img{max-width:100%;}');
    }

    // The control words that open a destination whose text is not part of the
    // document body.
    var skippedDestinations = {
        fonttbl: 1, colortbl: 1, stylesheet: 1, info: 1, pntext: 1, pntxta: 1,
        pntxtb: 1, listtable: 1, listoverridetable: 1, rsidtbl: 1, generator: 1,
        themedata: 1, colorschememapping: 1, latentstyles: 1, datastore: 1,
        mmathPr: 1, wgrffmtfilter: 1, xmlnstbl: 1, filetbl: 1, revtbl: 1,
        footnote: 1, header: 1, headerl: 1, headerr: 1, headerf: 1, footer: 1,
        footerl: 1, footerr: 1, footerf: 1, comment: 1, atnid: 1, atnauthor: 1,
        annotation: 1, nonshppict: 1, objdata: 1, upr: 1, do: 1, bkmkstart: 1,
        bkmkend: 1, fldinst: 1, shpinst: 1, template: 1
    };

    // The control words that stand for one character.
    var symbols = {
        emdash: '\u2014', endash: '\u2013',
        emspace: '\u2003', enspace: '\u2002', qmspace: '\u2005',
        bullet: '\u2022', lquote: '\u2018', rquote: '\u2019',
        ldblquote: '\u201C', rdblquote: '\u201D', nonbreakingspace: '\u00A0',
        '~': '\u00A0', '-': '\u00AD', '_': '\u2011'
    };

    /**
     * The name of a code page, for the TextDecoder that turns the raw bytes
     * of a \'xx escape into characters.
     */
    function codePageName( page ) {
        var known = {
            437: 'ibm866', 850: 'windows-1252', 852: 'windows-1250',
            1250: 'windows-1250', 1251: 'windows-1251', 1252: 'windows-1252',
            1253: 'windows-1253', 1254: 'windows-1254', 1255: 'windows-1255',
            1256: 'windows-1256', 1257: 'windows-1257', 1258: 'windows-1258',
            874: 'windows-874', 932: 'shift_jis', 936: 'gbk', 949: 'euc-kr',
            950: 'big5', 10000: 'macintosh', 65001: 'utf-8'
        };

        return known[page] || 'windows-1252';
    }

    /**
     * Walk the document and hand every piece of text and every state change
     * to the builder.
     */
    function parse( source, builder ) {
        var length   = source.length,
            i        = 0,
            stack    = [],
            state    = {
                bold: false, italic: false, underline: false, strike: false,
                superscript: false, subscript: false, hidden: false,
                size: 0, color: 0, align: 'left', indent: 0, firstLine: 0,
                inTable: false, skip: 0, uc: 1
            },
            codepage = 1252,
            bytes    = [],
            character,
            word,
            parameter,
            match,
            start;

        /**
         * The bytes of \'xx escapes are gathered so that a code page needing
         * more than one byte per character decodes correctly.
         */
        function flushBytes() {
            if ( !bytes.length ) {
                return;
            }
            if ( !state.skip ) {
                builder.text(new TextDecoder(codePageName(codepage))
                    .decode(new Uint8Array(bytes)), state);
            }
            bytes = [];
        }

        function emit( text ) {
            flushBytes();
            if ( !state.skip && text ) {
                builder.text(text, state);
            }
        }

        function copyState() {
            var copy = {}, key;
            for ( key in state ) {
                if ( Object.prototype.hasOwnProperty.call(state, key) ) {
                    copy[key] = state[key];
                }
            }

            return copy;
        }

        while ( i < length ) {
            character = source.charAt(i);

            if ( character === '{' ) {
                flushBytes();
                stack.push(state);
                state = copyState();
                i += 1;
                continue;
            }

            if ( character === '}' ) {
                flushBytes();
                state = stack.pop() || state;
                i += 1;
                continue;
            }

            if ( character === '\\' ) {
                flushBytes();
                i += 1;
                character = source.charAt(i);

                // \'xx is a raw byte in the current code page.
                if ( character === "'" ) {
                    bytes.push(parseInt(source.substr(i + 1, 2), 16) || 0);
                    i += 3;
                    continue;
                }

                // An escaped brace or backslash is literal text.
                if ( character === '\\' || character === '{' || character === '}' ) {
                    emit(character);
                    i += 1;
                    continue;
                }

                // \* marks a destination a reader may ignore whole. A
                // picture is wrapped in one, and is worth showing.
                if ( character === '*' ) {
                    i += 1;
                    match = /^\\([a-zA-Z]+)/.exec(source.substr(i, 40));
                    if ( !match || (match[1] !== 'shppict' && match[1] !== 'pict') ) {
                        state.skip = 1;
                    }
                    continue;
                }

                match = /^([a-zA-Z]+)(-?\d+)? ?/.exec(source.substr(i));
                if ( !match ) {
                    // A control symbol that is not a letter.
                    emit(symbols[character] || '');
                    i += 1;
                    continue;
                }

                word      = match[1];
                parameter = match[2] === undefined ? null : parseInt(match[2], 10);
                i        += match[0].length;

                if ( word === 'bin' && parameter > 0 ) {
                    // Binary data follows, which is not text.
                    i += parameter;
                    continue;
                }

                if ( word === 'u' ) {
                    if ( !state.skip ) {
                        // Surrogates arrive as two negative values.
                        builder.text(String.fromCharCode(parameter < 0 ? parameter + 65536 : parameter), state);
                    }
                    // What follows is the fallback for a reader that cannot
                    // show the character, and is skipped here.
                    i = skipFallback(source, i, state.uc);
                    continue;
                }

                if ( skippedDestinations[word] ) {
                    state.skip = 1;
                    continue;
                }

                switch ( word ) {
                    case 'ansicpg':
                        codepage = parameter || 1252;
                        break;
                    case 'uc':
                        state.uc = parameter === null ? 1 : parameter;
                        break;
                    case 'b':
                        state.bold = parameter !== 0;
                        break;
                    case 'i':
                        state.italic = parameter !== 0;
                        break;
                    case 'ul':
                        state.underline = parameter !== 0;
                        break;
                    case 'ulnone':
                        state.underline = false;
                        break;
                    case 'strike':
                        state.strike = parameter !== 0;
                        break;
                    case 'super':
                        state.superscript = parameter !== 0;
                        break;
                    case 'sub':
                        state.subscript = parameter !== 0;
                        break;
                    case 'nosupersub':
                        state.superscript = false;
                        state.subscript   = false;
                        break;
                    case 'v':
                        state.hidden = parameter !== 0;
                        break;
                    case 'fs':
                        // Half points.
                        state.size = parameter ? parameter / 2 : 0;
                        break;
                    case 'cf':
                        state.color = parameter || 0;
                        break;
                    case 'plain':
                        state.bold        = false;
                        state.italic      = false;
                        state.underline   = false;
                        state.strike      = false;
                        state.superscript = false;
                        state.subscript   = false;
                        state.hidden      = false;
                        state.size        = 0;
                        state.color       = 0;
                        break;
                    case 'pard':
                        state.align     = 'left';
                        state.indent    = 0;
                        state.firstLine = 0;
                        state.inTable   = false;
                        break;
                    case 'ql':
                        state.align = 'left';
                        break;
                    case 'qc':
                        state.align = 'center';
                        break;
                    case 'qr':
                        state.align = 'right';
                        break;
                    case 'qj':
                        state.align = 'justify';
                        break;
                    case 'li':
                        state.indent = parameter || 0;
                        break;
                    case 'fi':
                        state.firstLine = parameter || 0;
                        break;
                    case 'intbl':
                        state.inTable = true;
                        break;
                    case 'trowd':
                        builder.rowStart();
                        break;
                    case 'cell':
                        builder.cell(state);
                        break;
                    case 'nestcell':
                        builder.cell(state);
                        break;
                    case 'row':
                    case 'nestrow':
                        builder.rowEnd();
                        break;
                    case 'par':
                        builder.paragraph(state);
                        break;
                    case 'line':
                        builder.lineBreak();
                        break;
                    case 'tab':
                        emit('\t');
                        break;
                    case 'pict':
                        state.skip = 1;
                        readPicture(source, i, matchingBrace(source, i));
                        break;
                    default:
                        if ( symbols[word] !== undefined && word !== 'par' && word !== 'line' && word !== 'tab' ) {
                            emit(symbols[word]);
                        }
                        break;
                }
                continue;
            }

            if ( character === '\r' || character === '\n' ) {
                i += 1;
                continue;
            }

            // Plain text runs to the next control character.
            start = i;
            while ( i < length && '\\{}\r\n'.indexOf(source.charAt(i)) === -1 ) {
                i += 1;
            }
            emit(source.slice(start, i));
        }

        flushBytes();

        /**
         * Step over the substitute characters that follow a \u escape. Each
         * of them counts as one, whether it is written as a plain character,
         * as a \'xx escape or as a control word.
         */
        function skipFallback( text, from, count ) {
            var j = from,
                escape;

            while ( count > 0 && j < text.length ) {
                if ( text.charAt(j) === '{' || text.charAt(j) === '}' ) {
                    break;
                }
                if ( text.charAt(j) !== '\\' ) {
                    j += 1;
                } else if ( text.charAt(j + 1) === "'" ) {
                    j += 4;
                } else {
                    escape = /^\\([a-zA-Z]+-?\d* ?|.)/.exec(text.substr(j));
                    j += escape ? escape[0].length : 2;
                }
                count -= 1;
            }

            return j;
        }

        /**
         * The position of the brace that closes the group the picture sits
         * in, counted from inside it.
         */
        function matchingBrace( text, from ) {
            var depth = 1,
                j;

            for ( j = from; j < text.length; j += 1 ) {
                if ( text.charAt(j) === '\\' ) {
                    j += 1;
                } else if ( text.charAt(j) === '{' ) {
                    depth += 1;
                } else if ( text.charAt(j) === '}' ) {
                    depth -= 1;
                    if ( depth === 0 ) {
                        return j;
                    }
                }
            }

            return text.length;
        }

        /**
         * Read a picture group: the control words describing it, then the
         * hexadecimal data, and hand the result to the builder.
         */
        function readPicture( text, from, to ) {
            var header = text.slice(from, Math.min(to, from + 400)),
                type   = null,
                data;

            if ( /\\pngblip/.test(header) ) {
                type = 'image/png';
            } else if ( /\\jpegblip/.test(header) ) {
                type = 'image/jpeg';
            }
            if ( !type ) {
                return;
            }

            data = text.slice(from, to).replace(/\\[a-zA-Z]+-?\d* ?/g, '').replace(/[^0-9a-fA-F]/g, '');
            if ( data.length > 1 ) {
                builder.picture(type, data);
            }
        }
    }

    /**
     * Turns what the parser reports into elements. Paragraphs collect runs,
     * and a paragraph that belongs to a table is held back until the row is
     * complete.
     */
    function createBuilder( root ) {
        var colorTable = [],
            paragraph  = null,
            table      = null,
            row        = null,
            // What has been written since the last cell ended, waiting for
            // the cell that will hold it.
            cellContent = null;

        function inTable( state ) {
            return !!(state && state.inTable);
        }

        function container( state ) {
            if ( inTable(state) ) {
                if ( !cellContent ) {
                    cellContent = document.createDocumentFragment();
                }

                return cellContent;
            }

            // Anything outside a table ends it.
            if ( table ) {
                table = null;
                row   = null;
            }

            return root;
        }

        function startParagraph( state ) {
            paragraph = document.createElement('p');
            if ( state ) {
                if ( state.align !== 'left' ) {
                    paragraph.style.textAlign = state.align;
                }
                // Twips, 1440 to the inch.
                if ( state.indent ) {
                    paragraph.style.marginLeft = (state.indent / 1440) + 'in';
                }
                if ( state.firstLine ) {
                    paragraph.style.textIndent = (state.firstLine / 1440) + 'in';
                }
            }
            container(state).appendChild(paragraph);

            return paragraph;
        }

        function currentParagraph( state ) {
            return paragraph || startParagraph(state);
        }

        return {
            /**
             * The colour table of the document, filled before the body is
             * walked; \cfN indexes into it.
             */
            colors: colorTable,

            text: function ( text, state ) {
                if ( !text || state.hidden ) {
                    return;
                }

                var span = document.createElement('span'),
                    node = span;

                if ( state.bold ) {
                    span.style.fontWeight = 'bold';
                }
                if ( state.italic ) {
                    span.style.fontStyle = 'italic';
                }
                if ( state.underline && state.strike ) {
                    span.style.textDecoration = 'underline line-through';
                } else if ( state.underline ) {
                    span.style.textDecoration = 'underline';
                } else if ( state.strike ) {
                    span.style.textDecoration = 'line-through';
                }
                if ( state.size ) {
                    span.style.fontSize = state.size + 'pt';
                }
                if ( state.color && colorTable[state.color] ) {
                    span.style.color = colorTable[state.color];
                }
                if ( state.superscript || state.subscript ) {
                    node = document.createElement(state.superscript ? 'sup' : 'sub');
                    node.appendChild(span);
                }

                // A tab has no meaning of its own in HTML.
                span.textContent = text.replace(/\t/g, '\u00A0\u00A0\u00A0\u00A0');
                currentParagraph(state).appendChild(node);
            },

            paragraph: function ( state ) {
                if ( !paragraph ) {
                    startParagraph(state);
                }
                paragraph = null;
            },

            lineBreak: function () {
                if ( paragraph ) {
                    paragraph.appendChild(document.createElement('br'));
                }
            },

            rowStart: function () {
                if ( !table ) {
                    table = document.createElement('table');
                    root.appendChild(table);
                }
                if ( !row ) {
                    row = document.createElement('tr');
                }
            },

            cell: function () {
                var td = document.createElement('td');

                if ( !row ) {
                    this.rowStart();
                }
                if ( cellContent ) {
                    td.appendChild(cellContent);
                }
                cellContent = null;
                paragraph   = null;
                row.appendChild(td);
            },

            rowEnd: function () {
                if ( table && row && row.childNodes.length ) {
                    table.appendChild(row);
                }
                row         = null;
                cellContent = null;
                paragraph   = null;
            },

            picture: function ( type, hex ) {
                var image = document.createElement('img');
                image.src = 'data:' + type + ';base64,' + hexToBase64(hex);
                currentParagraph(null).appendChild(image);
            }
        };
    }

    function hexToBase64( hex ) {
        var binary = '',
            i;

        for ( i = 0; i + 1 < hex.length; i += 2 ) {
            binary += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }

        return window.btoa(binary);
    }

    function render( buffer ) {
        var canvas  = ViewerSupport.canvas(true),
            wrapper = document.createElement('div'),
            // RTF is ASCII with escapes for everything else, so the bytes
            // map one to one onto characters here.
            source  = new TextDecoder('windows-1252').decode(new Uint8Array(buffer)),
            builder;

        wrapper.className = 'rtf-wrapper';
        builder = createBuilder(wrapper);
        collectColors(source, builder.colors);
        parse(source, builder);

        if ( !wrapper.textContent.trim() && !wrapper.querySelector('img') ) {
            ViewerSupport.showError(canvas, ViewerSupport.t('The document is empty.'));

            return;
        }

        canvas.appendChild(wrapper);
        self.wrapper = wrapper;
    }

    /**
     * The colour table, which is a flat list of red, green and blue values
     * in its own group near the top of the document.
     */
    function collectColors( source, colors ) {
        var group = /\{\\colortbl([^}]*)\}/.exec(source),
            entry;

        if ( !group ) {
            return;
        }

        group[1].split(';').forEach(function ( definition ) {
            entry = /\\red(\d+)\\green(\d+)\\blue(\d+)/.exec(definition);
            colors.push(entry ?
                'rgb(' + entry[1] + ',' + entry[2] + ',' + entry[3] + ')' : '');
        });
    }

    this.initialize = function ( viewerElement, documentUrl ) {
        injectStyle();
        ViewerSupport.fetchDocument(documentUrl).then(function ( buffer ) {
            render(buffer);
            self.ready();
        }).catch(function ( err ) {
            console.log('RtfViewerPlugin: failed to render document: ' + (err && err.stack || err));
            ViewerSupport.showError(ViewerSupport.canvas());
            self.ready();
        });
    };
}
