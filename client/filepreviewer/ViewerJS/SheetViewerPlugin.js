/**
 * Spreadsheet viewer plugin, using SheetJS Community Edition (Apache-2.0,
 * vendored under ./vendor/). Reads the OOXML, legacy and delimited formats.
 *
 * @author grommunio GmbH <dev@grommunio.com>
 */

/*global document, window, XLSX, ViewerSupport*/

function SheetViewerPlugin() {
    "use strict";

    var self       = this,
        workbook   = null,
        content    = null,
        sheetCache = {},
        // A sheet that declares a million rows is cut off rather than rendered.
        kMaxRows   = 5000,
        kMaxCols   = 256,
        kMaxCells  = 200000,
        kRowHeaderWidth = 44,
        kDefaultColumnWidth = 84,
        kMaxColumnWidth = 480;

    ViewerSupport.flow(self, {
        name: "SheetViewer",
        url:  "https://sheetjs.com"
    });

    function injectStyle() {
        ViewerSupport.style('sheet-viewer-style',
            // A document keeps its own colours, whichever theme is around it.
            '.sheet-wrapper{display:flex;flex-direction:column;height:100%;' +
                'background:#fff;color:#1d2939;text-align:left;' +
                'font-family:Arial,Helvetica,sans-serif;font-size:13px;}' +
            '.sheet-tabs{flex:none;background:#f3f3f3;border-bottom:1px solid #ccc;' +
                'padding:4px 8px 0;white-space:nowrap;overflow-x:auto;}' +
            '.sheet-tab{display:inline-block;padding:5px 14px;margin-right:4px;border:1px solid #ccc;' +
                'border-bottom:none;background:#e4e4e4;cursor:pointer;border-radius:4px 4px 0 0;}' +
            '.sheet-tab.active{background:#fff;font-weight:bold;}' +
            // The only thing that scrolls, which is what keeps the headers put.
            '.sheet-body{flex:1 1 auto;min-height:0;overflow:auto;}' +
            '.sheet-body table{border-collapse:separate;border-spacing:0;table-layout:fixed;}' +
            '.sheet-body td,.sheet-body th{border-right:1px solid #dcdcdc;border-bottom:1px solid #dcdcdc;' +
                'padding:2px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;vertical-align:bottom;}' +
            '.sheet-head{background:#f3f3f3;color:#555;font-weight:normal;text-align:center;' +
                'border-top:1px solid #dcdcdc;position:sticky;}' +
            // Where the frozen bands cross, the column headers win, the corner over both.
            '.sheet-body thead .sheet-head{top:0;z-index:3;}' +
            '.sheet-body .sheet-rowhead{left:0;z-index:2;border-left:1px solid #dcdcdc;' +
                'text-align:right;width:44px;background:#f3f3f3;}' +
            '.sheet-body thead .sheet-corner{top:0;left:0;z-index:4;}' +
            '.sheet-num{text-align:right;}' +
            '.sheet-bool{text-align:center;}' +
            '.sheet-error{text-align:center;color:#b00;}' +
            '.sheet-note{position:sticky;left:0;padding:6px 12px;background:#fff8e1;' +
                'border-bottom:1px solid #e0d9b0;color:#6b5900;font-size:12px;}' +
            '.sheet-empty{padding:24px;color:#888;}');
    }

    /**
     * The name of a column, the way a spreadsheet writes it: A, B, ... AA.
     */
    function columnName( index ) {
        return XLSX.utils.encode_col(index);
    }

    function isSheetVisible( index ) {
        var sheets = workbook.Workbook && workbook.Workbook.Sheets;

        return !(sheets && sheets[index] && sheets[index].Hidden);
    }

    function visibleSheetNames() {
        var names = workbook.SheetNames.filter(function ( name, index ) {
            return isSheetVisible(index);
        });

        // A workbook whose sheets are all hidden shows everything rather
        // than nothing.
        return names.length ? names : workbook.SheetNames.slice();
    }

    /**
     * The rectangle that actually holds cells. Declared ranges routinely
     * cover whole columns (A1:P1048576), which would be rendered as a
     * million empty rows.
     */
    function usedRange( sheet ) {
        var range  = XLSX.utils.decode_range(sheet['!ref']),
            endRow = range.s.r,
            endCol = range.s.c;

        Object.keys(sheet).forEach(function ( key ) {
            if ( key.charAt(0) === '!' ) {
                return;
            }
            var cell = XLSX.utils.decode_cell(key);
            if ( cell.r > endRow ) {
                endRow = cell.r;
            }
            if ( cell.c > endCol ) {
                endCol = cell.c;
            }
        });

        return { start: range.s, endRow: endRow, endCol: endCol };
    }

    /**
     * The cells covered by a merge, mapped to the merge they belong to, so a
     * covered cell can be left out and the anchor given its span.
     */
    function mergeMap( sheet ) {
        var map = {};

        (sheet['!merges'] || []).forEach(function ( merge ) {
            var r, c;
            for ( r = merge.s.r; r <= merge.e.r; r += 1 ) {
                for ( c = merge.s.c; c <= merge.e.c; c += 1 ) {
                    map[r + ':' + c] = {
                        anchor:  r === merge.s.r && c === merge.s.c,
                        rowSpan: merge.e.r - merge.s.r + 1,
                        colSpan: merge.e.c - merge.s.c + 1
                    };
                }
            }
        });

        return map;
    }

    /**
     * The class that right-aligns numbers and centres booleans, the way a
     * spreadsheet shows them.
     */
    function alignmentClass( cell ) {
        if ( cell.t === 'n' || cell.t === 'd' ) {
            return 'sheet-num';
        }
        if ( cell.t === 'b' ) {
            return 'sheet-bool';
        }
        if ( cell.t === 'e' ) {
            return 'sheet-error';
        }

        return '';
    }

    /**
     * The text of a cell: the formatted value the file carries, falling back
     * to the raw one for a cell that has none.
     */
    function cellText( cell ) {
        if ( cell.w !== undefined ) {
            return cell.w;
        }
        if ( cell.t === 'b' ) {
            return cell.v ? 'TRUE' : 'FALSE';
        }
        if ( cell.v === undefined || cell.v === null ) {
            return '';
        }

        return String(cell.v);
    }

    function renderSheet( name ) {
        var sheet = workbook.Sheets[name],
            used,
            merges,
            table,
            colgroup,
            widths,
            head,
            headRow,
            bodyElement,
            wrapper,
            lastRow,
            lastCol,
            truncated,
            row,
            tr,
            col,
            key,
            merge,
            cell,
            td,
            total,
            link;

        wrapper = document.createDocumentFragment();

        if ( !sheet || !sheet['!ref'] ) {
            var empty = document.createElement('div');
            empty.className   = 'sheet-empty';
            empty.textContent = ViewerSupport.t('This sheet is empty.');
            wrapper.appendChild(empty);

            return wrapper;
        }

        used    = usedRange(sheet);
        merges  = mergeMap(sheet);
        lastRow = Math.min(used.endRow, used.start.r + kMaxRows - 1);
        lastCol = Math.min(used.endCol, used.start.c + kMaxCols - 1);

        // Bound the total cell count as well, a wide sheet has fewer rows.
        lastRow = Math.min(lastRow, used.start.r +
            Math.max(1, Math.floor(kMaxCells / (lastCol - used.start.c + 1))) - 1);
        truncated = lastRow < used.endRow || lastCol < used.endCol;

        table    = document.createElement('table');
        colgroup = document.createElement('colgroup');
        widths   = sheet['!cols'] || [];

        // A fixed layout needs the table to carry the total, or it is
        // squeezed into the frame.
        total = kRowHeaderWidth;
        colgroup.appendChild(document.createElement('col'));
        for ( col = used.start.c; col <= lastCol; col += 1 ) {
            var colElement = document.createElement('col');
            var width      = widths[col];
            var pixels     = kDefaultColumnWidth;
            if ( width && (width.wpx || width.wch) ) {
                pixels = Math.round(width.wpx || width.wch * 7 + 5);
            }
            pixels = Math.max(24, Math.min(kMaxColumnWidth, pixels));
            colElement.style.width = pixels + 'px';
            total += pixels;
            colgroup.appendChild(colElement);
        }
        table.style.width = total + 'px';
        table.appendChild(colgroup);

        head    = document.createElement('thead');
        headRow = document.createElement('tr');
        headRow.appendChild(makeHeader('', 'sheet-head sheet-rowhead sheet-corner'));
        for ( col = used.start.c; col <= lastCol; col += 1 ) {
            headRow.appendChild(makeHeader(columnName(col), 'sheet-head'));
        }
        head.appendChild(headRow);
        table.appendChild(head);

        bodyElement = document.createElement('tbody');
        for ( row = used.start.r; row <= lastRow; row += 1 ) {
            tr = document.createElement('tr');
            tr.appendChild(makeHeader(String(row + 1), 'sheet-head sheet-rowhead'));

            for ( col = used.start.c; col <= lastCol; col += 1 ) {
                key   = row + ':' + col;
                merge = merges[key];
                if ( merge && !merge.anchor ) {
                    continue;
                }

                td   = document.createElement('td');
                cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
                if ( merge ) {
                    td.rowSpan = merge.rowSpan;
                    td.colSpan = merge.colSpan;
                }
                if ( cell ) {
                    td.className   = alignmentClass(cell);
                    td.textContent = cellText(cell);
                    link           = cell.l && cell.l.Target;
                    if ( link && /^(https?:|mailto:)/i.test(link) ) {
                        td.textContent = '';
                        var anchor = document.createElement('a');
                        anchor.href        = link;
                        anchor.target      = '_blank';
                        anchor.rel         = 'noopener noreferrer';
                        anchor.textContent = cellText(cell);
                        td.appendChild(anchor);
                    }
                }
                tr.appendChild(td);
            }
            bodyElement.appendChild(tr);
        }
        table.appendChild(bodyElement);

        if ( truncated ) {
            var note = document.createElement('div');
            note.className   = 'sheet-note';
            note.textContent = ViewerSupport.format('Showing the first {0} rows and {1} columns.',
                lastRow - used.start.r + 1, lastCol - used.start.c + 1);
            wrapper.appendChild(note);
        }
        wrapper.appendChild(table);

        return wrapper;
    }

    function makeHeader( text, className ) {
        var th = document.createElement('th');
        th.className   = className;
        th.textContent = text;

        return th;
    }

    function showSheet( name ) {
        if ( !sheetCache[name] ) {
            try {
                sheetCache[name] = renderSheet(name);
            } catch ( err ) {
                console.log('SheetViewerPlugin: failed to render sheet "' + name + '": ' + (err && err.stack || err));
                var failed = document.createElement('div');
                failed.className   = 'sheet-empty';
                failed.textContent = ViewerSupport.t('This document could not be previewed.');
                sheetCache[name]   = failed;
            }
        }

        content.innerHTML = '';
        content.appendChild(sheetCache[name].cloneNode(true));
        content.scrollTop  = 0;
        content.scrollLeft = 0;
    }

    function render( buffer ) {
        var canvas  = ViewerSupport.fillFrame(),
            wrapper = document.createElement('div'),
            names,
            tabs;

        workbook = XLSX.read(new Uint8Array(buffer), {
            type:       'array',
            cellDates:  true,
            cellStyles: true,
            cellHTML:   false
        });

        names   = visibleSheetNames();
        wrapper.className = 'sheet-wrapper';

        // A workbook with a single sheet needs no tab bar.
        if ( names.length > 1 ) {
            tabs = document.createElement('div');
            tabs.className = 'sheet-tabs';
            names.forEach(function ( name, index ) {
                var tab = document.createElement('span');
                tab.className   = 'sheet-tab' + (index === 0 ? ' active' : '');
                tab.textContent = name;
                tab.addEventListener('click', function () {
                    var active = tabs.querySelector('.sheet-tab.active');
                    if ( active ) {
                        active.classList.remove('active');
                    }
                    tab.classList.add('active');
                    showSheet(name);
                });
                tabs.appendChild(tab);
            });
            wrapper.appendChild(tabs);
        }

        content = document.createElement('div');
        content.className = 'sheet-body';
        wrapper.appendChild(content);

        // The document area clips its overflow, which would hide the right
        // hand columns of a wide sheet.
        canvas.style.overflow = 'visible';
        canvas.appendChild(wrapper);
        self.wrapper = wrapper;

        showSheet(names[0]);
    }

    this.initialize = function ( viewerElement, documentUrl ) {
        injectStyle();
        ViewerSupport.fetchDocument(documentUrl).then(function ( buffer ) {
            render(buffer);
            self.ready();
        }).catch(function ( err ) {
            console.log('SheetViewerPlugin: failed to render workbook: ' + (err && err.stack || err));
            ViewerSupport.showError(ViewerSupport.canvas());
            self.ready();
        });
    };

    // Widening a sheet stretches its cells rather than showing more.
    this.fitToWidth = function () {
    };

    this.fitSmart = function () {
    };
}
