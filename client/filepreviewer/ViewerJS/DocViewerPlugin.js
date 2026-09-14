/**
 * Word 97-2003 (.doc) viewer plugin, reading the binary format per [MS-DOC].
 *
 * @author grommunio GmbH <dev@grommunio.com>
 */

/*global document, window, TextDecoder, CompoundFile, ViewerSupport*/

function DocViewerPlugin() {
    "use strict";

    var self = this;

    ViewerSupport.flow(self, {
        name:         "DocViewer",
        url:          "https://grommunio.com",
        pageSelector: null
    });

    function injectStyle() {
        ViewerSupport.style('doc-viewer-style',
            '.doc-wrapper{background:#fff;text-align:left;color:#000;margin:16px auto;padding:56px 72px;' +
                'max-width:860px;border-radius:4px;box-shadow:var(--page-shadow);' +
                'font-family:"Times New Roman",Times,serif;font-size:12pt;line-height:1.35;}' +
            '.doc-wrapper p{margin:0 0 .35em;min-height:1em;}' +
            '.doc-wrapper h1,.doc-wrapper h2,.doc-wrapper h3,.doc-wrapper h4,' +
                '.doc-wrapper h5,.doc-wrapper h6{font-family:Arial,Helvetica,sans-serif;' +
                'margin:1em 0 .4em;line-height:1.2;}' +
            '.doc-wrapper h1{font-size:1.7em;}' +
            '.doc-wrapper h2{font-size:1.4em;}' +
            '.doc-wrapper h3{font-size:1.2em;}' +
            '.doc-wrapper table{border-collapse:collapse;margin:.6em 0;}' +
            '.doc-wrapper td{border:1px solid #b5b5b5;padding:3px 7px;vertical-align:top;}' +
            '.doc-wrapper td p:last-child{margin-bottom:0;}' +
            '.doc-wrapper img{max-width:100%;}' +
            '.doc-marker{display:inline-block;min-width:1.4em;}');
    }


    // The property modifiers that are worth reading for a preview. The
    // others are stepped over by their operand size.
    var sprmCFBold        = 0x0835,
        sprmCFItalic      = 0x0836,
        sprmCFStrike      = 0x0837,
        sprmCFVanish      = 0x083C,
        sprmCFSpec        = 0x0855,
        sprmCKul          = 0x2A3E,
        sprmCIco          = 0x2A42,
        sprmCIss          = 0x2A48,
        sprmCHps          = 0x4A43,
        sprmCPicLocation  = 0x6A03,
        sprmCCv           = 0x6870,
        sprmPJc           = 0x2403,
        sprmPFInTable     = 0x2416,
        sprmPFTtp         = 0x2417,
        sprmPIlvl         = 0x260A,
        sprmPDxaLeft      = 0x840F,
        sprmPDxaLeft1     = 0x8411,
        sprmPIlfo         = 0x460B;

    // Word writes a bullet as a symbol-font character, which lands in the
    // private use area where no fallback font has a glyph.
    var bullets = {
        '\uF0B7': '\u2022', '\uF0A7': '\u25AA', '\uF06C': '\u25CF',
        '\uF06E': '\u25A0', '\uF075': '\u2756', '\uF09F': '\u2666',
        '\uF0A8': '\u25D8', '\uF0D8': '\u27A2', '\uF0FC': '\u2714',
        '\uF0E0': '\u27A8', '\uF04A': '\u263A', '\uF06F': '\u25CB'
    };

    function bulletCharacter( character ) {
        if ( bullets[character] ) {
            return bullets[character];
        }

        return character >= '\uE000' && character <= '\uF8FF' ? '\u2022' : character;
    }

    // The colour table Word indexes with sprmCIco.
    var icoColors = ['', '#000000', '#0000FF', '#00FFFF', '#00FF00', '#FF00FF',
        '#FF0000', '#FFFF00', '#FFFFFF', '#000080', '#008080', '#008000',
        '#800080', '#800000', '#808000', '#808080', '#C0C0C0'];

    /**
     * The size of the operand of a property modifier, from the three bits
     * that say how it is stored.
     */
    function operandSize( opcode, bytes, at ) {
        switch ( opcode >> 13 ) {
            case 0:
            case 1:
                return 1;
            case 2:
            case 4:
            case 5:
                return 2;
            case 3:
                return 4;
            case 7:
                return 3;
            default:
                // Variable length, counted by the byte that follows. Two of
                // them count with a word instead.
                if ( opcode === 0xD608 || opcode === 0xC615 ) {
                    return 2 + (bytes[at] | (bytes[at + 1] << 8));
                }

                return 1 + bytes[at];
        }
    }

    /**
     * Read the property modifiers of one run and fold them into properties.
     *
     * @param {Uint8Array} bytes The stream the modifiers live in
     * @param {Number} from First byte of the list
     * @param {Number} to One past its last byte
     * @param {Object} properties The properties to change
     */
    function applySprms( bytes, from, to, properties ) {
        var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength),
            at   = from,
            opcode,
            size,
            operand;

        function toggle( value, previous ) {
            // 0 and 1 say so outright, 0x80 keeps what the style says and
            // 0x81 turns it around.
            if ( value === 0 || value === 1 ) {
                return value === 1;
            }
            if ( value === 0x81 ) {
                return !previous;
            }

            return previous;
        }

        while ( at + 2 <= to ) {
            opcode  = view.getUint16(at, true);
            at     += 2;
            size    = operandSize(opcode, bytes, at);
            if ( at + size > to ) {
                break;
            }
            operand = at;

            switch ( opcode ) {
                case sprmCFBold:
                    properties.bold = toggle(bytes[operand], properties.bold);
                    break;
                case sprmCFItalic:
                    properties.italic = toggle(bytes[operand], properties.italic);
                    break;
                case sprmCFStrike:
                    properties.strike = toggle(bytes[operand], properties.strike);
                    break;
                case sprmCFVanish:
                    properties.hidden = toggle(bytes[operand], properties.hidden);
                    break;
                case sprmCFSpec:
                    properties.special = toggle(bytes[operand], properties.special);
                    break;
                case sprmCKul:
                    properties.underline = bytes[operand] !== 0;
                    break;
                case sprmCIco:
                    properties.color = icoColors[bytes[operand]] || '';
                    break;
                case sprmCCv:
                    // A COLORREF, red first.
                    properties.color = 'rgb(' + bytes[operand] + ',' +
                        bytes[operand + 1] + ',' + bytes[operand + 2] + ')';
                    break;
                case sprmCIss:
                    properties.superscript = bytes[operand] === 1;
                    properties.subscript   = bytes[operand] === 2;
                    break;
                case sprmCHps:
                    // Half points.
                    properties.size = view.getUint16(operand, true) / 2;
                    break;
                case sprmCPicLocation:
                    properties.picture = view.getUint32(operand, true);
                    break;
                case sprmPJc:
                    properties.align = ['left', 'center', 'right', 'justify'][bytes[operand]] || 'left';
                    break;
                case sprmPFInTable:
                    properties.inTable = bytes[operand] !== 0;
                    break;
                case sprmPFTtp:
                    properties.rowEnd = bytes[operand] !== 0;
                    break;
                case sprmPIlvl:
                    properties.level = bytes[operand];
                    break;
                case sprmPIlfo:
                    properties.list = view.getUint16(operand, true);
                    break;
                case sprmPDxaLeft:
                    properties.indent = view.getInt16(operand, true);
                    break;
                case sprmPDxaLeft1:
                    properties.firstLine = view.getInt16(operand, true);
                    break;
                default:
                    break;
            }
            at += size;
        }
    }


    /**
     * The parts of the File Information Block a previewer needs: which table
     * stream the document uses, and where the piece table and the property
     * pages are.
     */
    function readFib( stream ) {
        var view = new DataView(stream.buffer, stream.byteOffset, stream.byteLength),
            fib  = {},
            at;

        if ( view.getUint16(0, true) !== 0xA5EC ) {
            throw new Error('not a Word document');
        }

        fib.nFib      = view.getUint16(2, true);
        fib.tableName = (view.getUint16(10, true) & 0x0200) ? '1Table' : '0Table';

        // Word 6 and 95 keep the text in one run, without a piece table.
        if ( fib.nFib < 193 ) {
            fib.legacy = true;
            fib.fcMin  = view.getUint32(24, true);
            fib.fcMac  = view.getUint32(28, true);

            return fib;
        }

        at         = 32;
        at        += 2 + view.getUint16(at, true) * 2;
        fib.ccpText = view.getInt32(at + 2 + 3 * 4, true);
        at        += 2 + view.getUint16(at, true) * 4;
        at        += 2;

        // Pairs of offset and length into the table stream.
        function pair( index ) {
            return {
                fc:  view.getUint32(at + index * 8, true),
                lcb: view.getUint32(at + index * 8 + 4, true)
            };
        }

        fib.stsh    = pair(1);
        fib.lists   = pair(73);
        fib.listRef = pair(74);
        fib.chpxBte = pair(12);
        fib.papxBte = pair(13);
        fib.clx     = pair(33);

        return fib;
    }

    /**
     * The numbering of lists. A Word document does not write the bullet or
     * the number of a list item into the text; it keeps one description per
     * list level and leaves the reader to count. The descriptions are read
     * here and the counting is done while the document is walked.
     */
    function readLists( table, plfLst, plfLfo ) {
        var view    = new DataView(table.buffer, table.byteOffset, table.byteLength),
            lists   = {},
            order   = [],
            byIndex = [],
            at,
            count,
            levels,
            simple,
            lsid,
            level,
            chpx,
            papx,
            length,
            i,
            j;

        if ( plfLst.lcb ) {
            count = view.getUint16(plfLst.fc, true);
            at    = plfLst.fc + 2;
            for ( i = 0; i < count; i += 1 ) {
                lsid   = view.getUint32(at, true);
                simple = !!(table[at + 26] & 0x01);
                order.push({ lsid: lsid, levels: simple ? 1 : 9 });
                lists[lsid] = [];
                at += 28;
            }

            // The levels follow the list of lists, beyond the length the file gives
            // for this structure - which counts the list of lists alone.
            for ( i = 0; i < order.length; i += 1 ) {
                levels = order[i].levels;
                for ( j = 0; j < levels; j += 1 ) {
                    if ( at + 30 > table.length ) {
                        break;
                    }
                    chpx  = table[at + 24];
                    papx  = table[at + 25];
                    level = {
                        startAt: view.getUint32(at, true),
                        format:  table[at + 4],
                        text:    ''
                    };
                    at += 28 + papx + chpx;
                    length = view.getUint16(at, true);
                    at    += 2;
                    level.text = new TextDecoder('utf-16le')
                        .decode(table.subarray(at, at + length * 2));
                    at += length * 2;
                    lists[order[i].lsid].push(level);
                }
            }
        }

        // A paragraph names a list by an index into the second table, which
        // says which list it really means.
        if ( plfLfo.lcb ) {
            count = view.getUint32(plfLfo.fc, true);
            for ( i = 0; i < count; i += 1 ) {
                byIndex.push(view.getUint32(plfLfo.fc + 4 + i * 16, true));
            }
        }

        return {
            /**
             * The description of one level of the list a paragraph uses.
             *
             * @param {Number} index The list index of the paragraph, counted from one
             * @param {Number} level The level within the list
             */
            level: function ( index, level ) {
                var list = lists[byIndex[index - 1]];

                return list && list[Math.min(level, list.length - 1)];
            },

            /**
             * Which list a paragraph belongs to, so that its numbering is
             * counted separately from every other list.
             */
            listOf: function ( index ) {
                return byIndex[index - 1];
            }
        };
    }

    /**
     * The number of a list item, written the way its level asks for.
     */
    function formatNumber( value, format ) {
        var romanValues = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1],
            romanDigits = ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i'],
            out = '',
            i;

        switch ( format ) {
            case 1:
            case 2:
                for ( i = 0; i < romanValues.length; i += 1 ) {
                    while ( value >= romanValues[i] ) {
                        out   += romanDigits[i];
                        value -= romanValues[i];
                    }
                }

                return format === 1 ? out.toUpperCase() : out;
            case 3:
            case 4:
                while ( value > 0 ) {
                    value -= 1;
                    out    = String.fromCharCode(97 + (value % 26)) + out;
                    value  = Math.floor(value / 26);
                }

                return format === 3 ? out.toUpperCase() : out;
            default:
                return String(value);
        }
    }

    /**
     * The style sheet. Formatting a document leans on it heavily - the bold
     * of a table heading or the size of a heading is usually not written on
     * the run at all, only on the style it uses - so the properties of every
     * style are resolved here, following the style each one is based on.
     *
     * @return {Array} For every style index, its paragraph and character properties
     */
    function readStyleSheet( table, stsh ) {
        var view    = new DataView(table.buffer, table.byteOffset, table.byteLength),
            cbStshi = view.getUint16(stsh.fc, true),
            count   = view.getUint16(stsh.fc + 2, true),
            baseSize = view.getUint16(stsh.fc + 4, true),
            end     = stsh.fc + stsh.lcb,
            styles  = [],
            at      = stsh.fc + 2 + cbStshi,
            entry,
            size,
            start,
            names,
            upx,
            length,
            j,
            i;

        for ( i = 0; i < count && at + 2 <= end; i += 1 ) {
            size = view.getUint16(at, true);
            at  += 2;
            if ( size === 0 ) {
                styles.push(null);
                continue;
            }

            start = at;
            entry = {
                // The built-in style this one is, 1 to 9 being the headings.
                sti:      view.getUint16(start, true) & 0x0FFF,
                kind:     view.getUint16(start + 2, true) & 0x000F,
                base:     view.getUint16(start + 2, true) >> 4,
                paragraph: null,
                character: null
            };

            // The name, then one property list per kind the style carries.
            names  = start + baseSize;
            upx    = names + 2 + view.getUint16(names, true) * 2 + 2;
            for ( j = 0; j < (view.getUint16(start + 4, true) & 0x000F); j += 1 ) {
                if ( (upx - start) % 2 ) {
                    upx += 1;
                }
                length = view.getUint16(upx, true);
                upx   += 2;
                if ( upx + length > at + size ) {
                    break;
                }
                if ( entry.kind === 1 && j === 0 ) {
                    // A paragraph style names its own index first.
                    entry.paragraph = { start: upx + 2, end: upx + length };
                } else {
                    entry.character = { start: upx, end: upx + length };
                }
                upx += length;
            }

            styles.push(entry);
            at += size;
        }

        /**
         * The properties of a style, with those of the style it is based on
         * underneath. The result is kept, styles being asked for often.
         */
        function resolve( index, which, depth ) {
            var style = styles[index],
                cache = which + 'Properties',
                properties;

            if ( !style || depth > 16 ) {
                return null;
            }
            if ( style[cache] ) {
                return style[cache];
            }

            properties = {};
            // The base is applied first, so the style itself wins.
            if ( style.base !== index && style.base < styles.length ) {
                Object.assign(properties, resolve(style.base, which, depth + 1) || {});
            }
            if ( style[which] ) {
                applySprms(table, style[which].start, style[which].end, properties);
            }
            style[cache] = properties;

            return properties;
        }

        return {
            /**
             * The built-in style number, which says whether a paragraph is
             * one of the nine headings.
             */
            builtIn: function ( index ) {
                return styles[index] ? styles[index].sti : -1;
            },

            paragraph: function ( index ) {
                return resolve(index, 'paragraph', 0) || {};
            },

            character: function ( index ) {
                return resolve(index, 'character', 0) || {};
            }
        };
    }

    /**
     * The piece table: where in the stream every stretch of text is, and
     * whether it is stored as one byte or as two per character.
     */
    function readPieceTable( table, clx ) {
        var view = new DataView(table.buffer, table.byteOffset, table.byteLength),
            at   = clx.fc,
            end  = clx.fc + clx.lcb,
            pieces = [],
            count,
            size = undefined,
            cpAt,
            pcdAt,
            value,
            i;

        // The piece table is the last structure of the complex part; what
        // comes before it is property storage that is stepped over.
        while ( at < end ) {
            if ( table[at] === 0x01 ) {
                at += 1 + 2 + view.getUint16(at + 1, true);
                continue;
            }
            if ( table[at] !== 0x02 ) {
                throw new Error('unexpected piece table entry');
            }
            size = view.getUint32(at + 1, true);
            at  += 5;
            break;
        }

        if ( size === undefined ) {
            throw new Error('no piece table');
        }

        count = Math.floor((size - 4) / 12);
        cpAt  = at;
        pcdAt = at + (count + 1) * 4;

        for ( i = 0; i < count; i += 1 ) {
            value = view.getUint32(pcdAt + i * 8 + 2, true);
            pieces.push({
                cpStart:    view.getUint32(cpAt + i * 4, true),
                cpEnd:      view.getUint32(cpAt + (i + 1) * 4, true),
                // Bit 30 says the text is stored one byte per character, and
                // the offset is then twice what the field holds.
                compressed: !!(value & 0x40000000),
                fc:         (value & 0x40000000) ? (value & 0x3FFFFFFF) / 2 : (value & 0x3FFFFFFF)
            });
        }

        return pieces;
    }

    /**
     * The property pages of the document: for every stretch of the stream,
     * the modifiers that apply to it. Character and paragraph properties are
     * stored the same way, in 512 byte pages the bin table points at.
     */
    function readFkps( stream, table, bte, paragraph ) {
        var view  = new DataView(table.buffer, table.byteOffset, table.byteLength),
            count = Math.floor((bte.lcb - 4) / 8),
            runs  = [],
            page,
            pageAt,
            pageView,
            crun,
            offset,
            length,
            i,
            j;

        for ( i = 0; i < count; i += 1 ) {
            // The entry holds a page number in its low bits.
            page   = view.getUint32(bte.fc + (count + 1) * 4 + i * 4, true) & 0x003FFFFF;
            pageAt = page * 512;
            if ( pageAt + 512 > stream.length ) {
                continue;
            }
            pageView = new DataView(stream.buffer, stream.byteOffset + pageAt, 512);
            crun     = stream[pageAt + 511];

            for ( j = 0; j < crun; j += 1 ) {
                offset = paragraph ?
                    stream[pageAt + (crun + 1) * 4 + j * 13] :
                    stream[pageAt + (crun + 1) * 4 + j];
                if ( offset === 0 ) {
                    // No modifiers, the run keeps the style defaults.
                    continue;
                }
                offset *= 2;

                if ( paragraph ) {
                    // A byte count of zero means the real count is in the
                    // next byte and the run starts one byte further on.
                    length = stream[pageAt + offset];
                    if ( length === 0 ) {
                        length = stream[pageAt + offset + 1] * 2;
                        offset += 2;
                    } else {
                        length = length * 2 - 1;
                        offset += 1;
                    }
                    // The first two bytes name the style.
                    runs.push({
                        from:  pageView.getUint32(j * 4, true),
                        to:    pageView.getUint32((j + 1) * 4, true),
                        istd:  stream[pageAt + offset] | (stream[pageAt + offset + 1] << 8),
                        start: pageAt + offset + 2,
                        end:   pageAt + offset + length
                    });
                } else {
                    length = stream[pageAt + offset];
                    runs.push({
                        from:  pageView.getUint32(j * 4, true),
                        to:    pageView.getUint32((j + 1) * 4, true),
                        start: pageAt + offset + 1,
                        end:   pageAt + offset + 1 + length
                    });
                }
            }
        }

        runs.sort(function ( a, b ) {
            return a.from - b.from;
        });

        return runs;
    }

    /**
     * The run covering a position in the stream. Positions are asked for in
     * order, so the previous answer is tried first.
     */
    function runFinder( runs ) {
        var last = 0;

        return function ( position ) {
            var low = 0,
                high = runs.length - 1,
                middle;

            if ( last < runs.length && runs[last].from <= position && position < runs[last].to ) {
                return runs[last];
            }
            while ( low <= high ) {
                middle = (low + high) >> 1;
                if ( position < runs[middle].from ) {
                    high = middle - 1;
                } else if ( position >= runs[middle].to ) {
                    low = middle + 1;
                } else {
                    last = middle;

                    return runs[middle];
                }
            }

            return null;
        };
    }

    /**
     * A picture stored in the data stream, if it is in a format a browser
     * can show. Word wraps it in a header and a drawing record, neither of
     * which carries the image type where it can be read directly, so the
     * data is searched for the signature of a PNG or a JPEG.
     */
    function readPicture( data, offset ) {
        var limit = Math.min(data.length, offset + 4096),
            i;

        if ( !data || offset + 8 >= data.length ) {
            return null;
        }

        for ( i = offset; i < limit; i += 1 ) {
            if ( data[i] === 0x89 && data[i + 1] === 0x50 && data[i + 2] === 0x4E && data[i + 3] === 0x47 ) {
                return { type: 'image/png', from: i };
            }
            if ( data[i] === 0xFF && data[i + 1] === 0xD8 && data[i + 2] === 0xFF ) {
                return { type: 'image/jpeg', from: i };
            }
        }

        return null;
    }

    function toDataUrl( data, found ) {
        var binary = '',
            chunk  = 8192,
            end    = data.length,
            i;

        // The record does not say where the image ends; a decoder stops itself.
        for ( i = found.from; i < end; i += chunk ) {
            binary += String.fromCharCode.apply(null, data.subarray(i, Math.min(i + chunk, end)));
        }

        return 'data:' + found.type + ';base64,' + window.btoa(binary);
    }


    function render( buffer ) {
        var streams  = CompoundFile.read(buffer),
            stream   = streams.WordDocument,
            fib,
            table,
            pieces,
            chpxRuns,
            papxRuns,
            styles,
            lists,
            data;

        if ( !stream ) {
            throw new Error('no document stream');
        }

        fib   = readFib(stream);
        table = streams[fib.tableName];
        data  = streams.Data;

        if ( fib.legacy || !table ) {
            return renderPlain(new TextDecoder('windows-1252')
                .decode(stream.subarray(fib.fcMin || 0, fib.fcMac || stream.length)));
        }

        pieces   = readPieceTable(table, fib.clx);
        chpxRuns = readFkps(stream, table, fib.chpxBte, false);
        papxRuns = readFkps(stream, table, fib.papxBte, true);

        try {
            lists = readLists(table, fib.lists, fib.listRef);
        } catch ( err ) {
            console.log('DocViewerPlugin: could not read the list tables: ' + err);
            lists = null;
        }

        try {
            styles = readStyleSheet(table, fib.stsh);
        } catch ( err ) {
            // A style sheet that cannot be read costs the formatting the
            // styles carry, not the document.
            console.log('DocViewerPlugin: could not read the style sheet: ' + err);
            styles = null;
        }

        return renderDocument(stream, data, pieces, chpxRuns, papxRuns, fib.ccpText, styles, lists);
    }

    /**
     * Everything the document says, as one paragraph per line; the fallback
     * for a file whose structure cannot be followed.
     */
    function renderPlain( text ) {
        var wrapper = document.createElement('div');

        wrapper.className = 'doc-wrapper';
        text.split(/\r|\n/).forEach(function ( line ) {
            var paragraph = document.createElement('p');
            paragraph.textContent = line.replace(/[\x00-\x08\x0B-\x1F]/g, '');
            wrapper.appendChild(paragraph);
        });

        return wrapper;
    }

    function renderDocument( stream, data, pieces, chpxRuns, papxRuns, ccpText, styles, lists ) {
        var wrapper     = document.createElement('div'),
            findChpx    = runFinder(chpxRuns),
            findPapx    = runFinder(papxRuns),
            ansi        = new TextDecoder('windows-1252'),
            utf16       = new TextDecoder('utf-16le'),
            builder     = createBuilder(wrapper, lists),
            fieldDepth  = 0,
            inResult    = false,
            fieldText   = '',
            hyperlink   = null,
            characters,
            properties,
            paragraph,
            paragraphRun,
            istd,
            run,
            piece,
            text,
            step,
            fc,
            code,
            i,
            j;

        wrapper.className = 'doc-wrapper';

        for ( i = 0; i < pieces.length; i += 1 ) {
            piece = pieces[i];
            step  = piece.compressed ? 1 : 2;
            characters = piece.cpEnd - piece.cpStart;
            if ( piece.cpStart >= ccpText ) {
                // Footnotes, headers and the rest follow the body text and
                // are not part of what is shown.
                break;
            }
            characters = Math.min(characters, ccpText - piece.cpStart);

            text = piece.compressed ?
                ansi.decode(stream.subarray(piece.fc, piece.fc + characters)) :
                utf16.decode(stream.subarray(piece.fc, piece.fc + characters * 2));

            for ( j = 0; j < characters; j += 1 ) {
                fc   = piece.fc + j * step;
                code = text.charCodeAt(j);

                // The paragraph decides which style the run starts from.
                paragraphRun = findPapx(fc);
                istd         = paragraphRun ? paragraphRun.istd : 0;

                run        = findChpx(fc);
                properties = { bold: false, italic: false, underline: false,
                    strike: false, hidden: false, special: false,
                    superscript: false, subscript: false, size: 0, color: '',
                    picture: -1 };
                if ( styles ) {
                    Object.assign(properties, styles.character(istd));
                }
                if ( run ) {
                    applySprms(stream, run.start, run.end, properties);
                }

                // A field is its instruction, a separator, then the result to show.
                if ( code === 0x13 ) {
                    fieldDepth += 1;
                    inResult    = false;
                    fieldText   = '';
                    continue;
                }
                if ( code === 0x14 ) {
                    inResult  = true;
                    hyperlink = /^\s*HYPERLINK\s+"([^"]+)"/i.exec(fieldText);
                    builder.link(hyperlink ? hyperlink[1] : null);
                    continue;
                }
                if ( code === 0x15 ) {
                    fieldDepth = Math.max(0, fieldDepth - 1);
                    inResult   = false;
                    builder.link(null);
                    continue;
                }
                if ( fieldDepth > 0 && !inResult ) {
                    fieldText += text.charAt(j);
                    continue;
                }

                if ( properties.hidden ) {
                    continue;
                }

                if ( code === 0x0D || code === 0x07 ) {
                    paragraph = { align: 'left', indent: 0, firstLine: 0,
                        inTable: false, rowEnd: false, level: 0, list: 0,
                        heading: styles ? styles.builtIn(istd) : istd };
                    if ( styles ) {
                        Object.assign(paragraph, styles.paragraph(istd));
                    }
                    if ( paragraphRun ) {
                        applySprms(stream, paragraphRun.start, paragraphRun.end, paragraph);
                    }
                    if ( code === 0x07 ) {
                        builder.cell(paragraph);
                    } else {
                        builder.paragraph(paragraph);
                    }
                    continue;
                }

                if ( code === 0x01 && properties.special && properties.picture >= 0 ) {
                    var found = readPicture(data, properties.picture);
                    if ( found ) {
                        builder.picture(toDataUrl(data, found));
                    }
                    continue;
                }

                // Marks, drawn objects and the rest are not text.
                if ( code === 0x0B ) {
                    builder.lineBreak();
                    continue;
                }
                if ( code < 0x20 && code !== 0x09 ) {
                    continue;
                }

                builder.text(text.charAt(j), properties);
            }
        }

        builder.finish();

        return wrapper;
    }

    /**
     * Collects characters into runs, runs into paragraphs, and the
     * paragraphs that say they are in a table into rows and cells.
     */
    function createBuilder( root, lists ) {
        var counters  = {},
            content   = [],
            table     = null,
            row       = null,
            cells     = [],
            cellParts = [],
            linkUrl   = null;

        function styleOf( properties ) {
            var style = '';

            if ( properties.bold ) {
                style += 'font-weight:bold;';
            }
            if ( properties.italic ) {
                style += 'font-style:italic;';
            }
            if ( properties.underline && properties.strike ) {
                style += 'text-decoration:underline line-through;';
            } else if ( properties.underline ) {
                style += 'text-decoration:underline;';
            } else if ( properties.strike ) {
                style += 'text-decoration:line-through;';
            }
            if ( properties.size ) {
                style += 'font-size:' + properties.size + 'pt;';
            }
            if ( properties.color && properties.color !== '#000000' ) {
                style += 'color:' + properties.color + ';';
            }

            return style;
        }

        /**
         * The marker of a list item: the bullet its level asks for, or the
         * number it has reached, written out the way the level says.
         */
        function marker( properties ) {
            var level = lists && properties.list ? lists.level(properties.list, properties.level) : null,
                key,
                counter,
                i;

            if ( !level || level.format === 255 || !level.text ) {
                return null;
            }
            if ( level.format === 23 ) {
                // A bullet, written as a character of a symbol font.
                return bulletCharacter(level.text.charAt(0));
            }

            key     = lists.listOf(properties.list) + ':';
            counter = counters[key] || (counters[key] = []);
            counter[properties.level] = (counter[properties.level] === undefined ?
                level.startAt : counter[properties.level] + 1);
            // A deeper level starts again under every new item above it.
            for ( i = properties.level + 1; i < counter.length; i += 1 ) {
                counter[i] = undefined;
            }

            // The text of a level is written with the number of each level
            // standing in for itself.
            return level.text.replace(/[\u0000-\u0008]/g, function ( placeholder ) {
                var which = placeholder.charCodeAt(0),
                    value = counter[which],
                    other = lists.level(properties.list, which);

                if ( value === undefined ) {
                    value = other ? other.startAt : 1;
                }

                return formatNumber(value, other ? other.format : 0);
            });
        }

        function flushParagraph( properties ) {
            var element,
                // Styles 1 to 9 are the nine built-in headings.
                level = properties.heading >= 1 && properties.heading <= 9 ? properties.heading : 0,
                label = level ? null : marker(properties),
                bullet,
                node;

            element = document.createElement(level ? 'h' + Math.min(level, 6) : 'p');
            if ( properties.align !== 'left' ) {
                element.style.textAlign = properties.align;
            }
            // Twips, 1440 to the inch. A list keeps its level as indent.
            if ( properties.indent ) {
                element.style.marginLeft = (properties.indent / 1440) + 'in';
            } else if ( properties.level ) {
                element.style.marginLeft = (properties.level * 0.25) + 'in';
            }
            if ( properties.firstLine ) {
                element.style.textIndent = (properties.firstLine / 1440) + 'in';
            }

            if ( label ) {
                bullet = document.createElement('span');
                bullet.className   = 'doc-marker';
                bullet.textContent = label;
                element.appendChild(bullet);
            }

            while ( content.length ) {
                node = content.shift();
                element.appendChild(node);
            }

            return element;
        }

        function appendTo( element, properties ) {
            if ( properties.inTable ) {
                cellParts.push(element);

                return;
            }
            // Anything outside a table ends it.
            table = null;
            row   = null;
            root.appendChild(element);
        }

        return {
            text: function ( character, properties ) {
                var last  = content[content.length - 1],
                    style = styleOf(properties),
                    span;

                if ( properties.superscript || properties.subscript ) {
                    style += 'vertical-align:' + (properties.superscript ? 'super' : 'sub') +
                        ';font-size:.8em;';
                }

                // A tab has no meaning of its own in HTML.
                if ( character === '\t' ) {
                    character = '\u00A0\u00A0\u00A0\u00A0';
                }

                if ( last && last.nodeName === (linkUrl ? 'A' : 'SPAN') &&
                        last.getAttribute('style') === style &&
                        last.dataset.link === (linkUrl || '') ) {
                    last.appendChild(document.createTextNode(character));

                    return;
                }

                span = document.createElement(linkUrl ? 'a' : 'span');
                if ( style ) {
                    span.setAttribute('style', style);
                }
                span.dataset.link = linkUrl || '';
                if ( linkUrl ) {
                    span.href   = linkUrl;
                    span.target = '_blank';
                    span.rel    = 'noopener noreferrer';
                }
                span.appendChild(document.createTextNode(character));
                content.push(span);
            },

            lineBreak: function () {
                content.push(document.createElement('br'));
            },

            picture: function ( url ) {
                var image = document.createElement('img');
                image.src = url;
                content.push(image);
            },

            /**
             * Follow a hyperlink field, or stop following one.
             */
            link: function ( url ) {
                linkUrl = url && /^(https?:|mailto:|ftp:)/i.test(url) ? url : null;
            },

            paragraph: function ( properties ) {
                appendTo(flushParagraph(properties), properties);
            },

            /**
             * The mark that ends a cell. The mark that ends a row follows
             * the last cell of it and closes the row rather than opening
             * another cell.
             */
            cell: function ( properties ) {
                var cell,
                    j;

                if ( !properties.rowEnd ) {
                    cell = document.createElement('td');
                    cellParts.push(flushParagraph(properties));
                    for ( j = 0; j < cellParts.length; j += 1 ) {
                        cell.appendChild(cellParts[j]);
                    }
                    cellParts = [];
                    cells.push(cell);

                    return;
                }

                content   = [];
                cellParts = [];
                if ( !cells.length ) {
                    return;
                }

                if ( !table ) {
                    table = document.createElement('table');
                    root.appendChild(table);
                }
                row = document.createElement('tr');
                for ( j = 0; j < cells.length; j += 1 ) {
                    row.appendChild(cells[j]);
                }
                cells = [];
                table.appendChild(row);
            },

            /**
             * A document that does not end with a paragraph mark still has
             * that last run of text.
             */
            finish: function () {
                if ( content.length ) {
                    root.appendChild(flushParagraph({ align: 'left', indent: 0,
                        firstLine: 0, inTable: false, level: 0, heading: 0 }));
                }
            }
        };
    }

    this.initialize = function ( viewerElement, documentUrl ) {
        injectStyle();
        ViewerSupport.fetchDocument(documentUrl).then(function ( buffer ) {
            var wrapper = render(buffer);

            ViewerSupport.canvas(true).appendChild(wrapper);
            self.wrapper = wrapper;
            self.ready();
        }).catch(function ( err ) {
            console.log('DocViewerPlugin: failed to render document: ' + (err && err.stack || err));
            ViewerSupport.showError(ViewerSupport.canvas());
            self.ready();
        });
    };
}
