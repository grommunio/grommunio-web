/**
 * PowerPoint (OOXML .pptx) viewer plugin: lays the slides out as HTML with
 * JSZip, one at a time.
 *
 * @author grommunio GmbH <dev@grommunio.com>
 */

/*global document, window, DOMParser, Promise, JSZip, ViewerSupport*/

function PptxViewerPlugin() {
    "use strict";

    var self        = this,
        // English Metric Units, 914400 to the inch.
        kEmuPerInch = 914400,
        slideWidth  = 960,
        slideHeight = 540,
        slides      = [],
        deck        = null,
        current     = 1,
        zoomLevel   = 1;

    ViewerSupport.flow(self, {
        name:      "PptxViewer",
        url:       "https://grommunio.com",
        slideshow: true
    });

    function injectStyle() {
        ViewerSupport.style('pptx-viewer-style',
            '.pptx-deck{position:relative;margin:0 auto;}' +
            '.pptx-slide{position:absolute;top:0;left:0;background:#fff;overflow:hidden;' +
                'text-align:left;font-family:Arial,Helvetica,sans-serif;color:#000;' +
                'transform-origin:top left;box-shadow:0 0 12px rgba(0,0,0,.5);}' +
            '.pptx-shape{position:absolute;box-sizing:border-box;}' +
            '.pptx-text{position:absolute;box-sizing:border-box;overflow:hidden;' +
                'display:flex;flex-direction:column;}' +
            '.pptx-text p{margin:0;}' +
            '.pptx-marker{display:inline-block;}' +
            '.pptx-image{position:absolute;object-fit:contain;}' +
            '.pptx-table{position:absolute;border-collapse:collapse;table-layout:fixed;}' +
            '.pptx-table td{border:1px solid #9a9a9a;padding:4px 6px;vertical-align:middle;}');
    }


    function children( element, name ) {
        var out = [],
            node;

        if ( !element ) {
            return out;
        }
        for ( node = element.firstElementChild; node; node = node.nextElementSibling ) {
            if ( node.localName === name ) {
                out.push(node);
            }
        }

        return out;
    }

    function child( element, name ) {
        return children(element, name)[0];
    }

    /**
     * The first descendant with a given local name, whatever namespace
     * prefix the file happens to use.
     */
    function find( element, name ) {
        return element ? element.getElementsByTagNameNS('*', name)[0] : undefined;
    }

    function attribute( element, name ) {
        return element && element.hasAttribute(name) ? element.getAttribute(name) : null;
    }

    /**
     * An attribute that carries a namespace prefix the file chooses, such as
     * the relationship identifiers written as r:id and r:embed.
     */
    function reference( element, name ) {
        var found = null;

        if ( !element ) {
            return null;
        }
        Array.prototype.forEach.call(element.attributes, function ( item ) {
            if ( item.localName === name ) {
                found = item.value;
            }
        });

        return found;
    }

    function number( value, fallback ) {
        var parsed = parseInt(value, 10);

        return isNaN(parsed) ? fallback : parsed;
    }

    /**
     * The part a relative reference points at, resolved against the part it
     * was written in.
     */
    function resolvePath( base, target ) {
        var parts = base.split('/').slice(0, -1);

        target.split('/').forEach(function ( piece ) {
            if ( piece === '..' ) {
                parts.pop();
            } else if ( piece !== '.' && piece !== '' ) {
                parts.push(piece);
            }
        });

        return parts.join('/');
    }


    /**
     * The parts of the package, parsed once and kept.
     */
    function createPackage( zip ) {
        var parts = {},
            rels  = {},
            media = {};

        return {
            xml: function ( path ) {
                var file;

                if ( !parts[path] ) {
                    file = zip.file(path);
                    parts[path] = !file ? Promise.resolve(null) :
                        file.async('string').then(function ( content ) {
                            return new DOMParser().parseFromString(content, 'application/xml');
                        });
                }

                return parts[path];
            },

            /**
             * The relationships of a part: the identifier a reference uses,
             * mapped to what it names.
             */
            relations: function ( path ) {
                var relPath = resolvePath(path, '_rels/' + path.split('/').pop() + '.rels'),
                    self_   = this;

                if ( !rels[relPath] ) {
                    rels[relPath] = self_.xml(relPath).then(function ( document ) {
                        var map = {};

                        if ( document ) {
                            Array.prototype.forEach.call(document.getElementsByTagNameNS('*', 'Relationship'), function ( relation ) {
                                map[relation.getAttribute('Id')] = {
                                    target:   relation.getAttribute('Target'),
                                    type:     relation.getAttribute('Type'),
                                    external: relation.getAttribute('TargetMode') === 'External'
                                };
                            });
                        }

                        return map;
                    });
                }

                return rels[relPath];
            },

            /**
             * A media file of the package, as a URL the page can use.
             */
            media: function ( path ) {
                var file;

                if ( !media[path] ) {
                    file = zip.file(path);
                    media[path] = !file ? Promise.resolve(null) :
                        file.async('blob').then(function ( blob ) {
                            return window.URL.createObjectURL(blob);
                        });
                }

                return media[path];
            }
        };
    }


    /**
     * The colours of the presentation. Most of them are named through the
     * theme, so the scheme of the theme and the map of the master are both
     * needed to arrive at a value.
     */
    function createColors( theme, colorMap ) {
        var scheme = {},
            clrScheme = theme ? find(theme, 'clrScheme') : null;

        if ( clrScheme ) {
            Array.prototype.forEach.call(clrScheme.children, function ( entry ) {
                var srgb = child(entry, 'srgbClr'),
                    sys  = child(entry, 'sysClr');

                scheme[entry.localName] = srgb ? attribute(srgb, 'val') :
                    (sys ? attribute(sys, 'lastClr') : null);
            });
        }

        /**
         * Lighten or darken a colour the way the modulation asks.
         */
        function modulate( hex, element ) {
            var lumMod = child(element, 'lumMod'),
                lumOff = child(element, 'lumOff'),
                shade  = child(element, 'shade'),
                tint   = child(element, 'tint'),
                factor = 1,
                offset = 0;

            if ( !hex || (!lumMod && !lumOff && !shade && !tint) ) {
                return hex;
            }
            if ( lumMod ) {
                factor = number(attribute(lumMod, 'val'), 100000) / 100000;
            }
            if ( shade ) {
                factor = number(attribute(shade, 'val'), 100000) / 100000;
            }
            if ( tint ) {
                factor = number(attribute(tint, 'val'), 100000) / 100000;
                offset = 255 * (1 - factor);
            }
            if ( lumOff ) {
                offset = 255 * (number(attribute(lumOff, 'val'), 0) / 100000);
            }

            return [0, 2, 4].map(function ( at ) {
                var value = Math.max(0, Math.min(255,
                    Math.round(parseInt(hex.substr(at, 2), 16) * factor + offset)));

                return ('0' + value.toString(16)).slice(-2);
            }).join('');
        }

        return {
            /**
             * The colour an element holding one of the colour choices means.
             *
             * @param {Element} holder An element such as a solidFill
             * @return {String} A CSS colour, or null
             */
            of: function ( holder ) {
                var srgb  = child(holder, 'srgbClr'),
                    named = child(holder, 'schemeClr'),
                    sys   = child(holder, 'sysClr'),
                    slot,
                    hex;

                if ( srgb ) {
                    return '#' + modulate(attribute(srgb, 'val'), srgb);
                }
                if ( sys ) {
                    return '#' + (attribute(sys, 'lastClr') || '000000');
                }
                if ( !named ) {
                    return null;
                }

                // The master maps the slots a slide names onto the theme, which calls
                // the first two pairs something else again.
                slot = attribute(named, 'val');
                slot = (colorMap && colorMap[slot]) || slot;
                hex  = scheme[slot] || scheme[{ tx1: 'dk1', tx2: 'dk2', bg1: 'lt1', bg2: 'lt2' }[slot]];

                return hex ? '#' + modulate(hex, named) : null;
            }
        };
    }


    function toPixels( emu ) {
        return (number(emu, 0) / kEmuPerInch) * 96;
    }

    /**
     * The position and size a shape gives itself, and the inner coordinate
     * system it gives its children if it is a group.
     */
    function readTransform( element ) {
        var properties = child(element, 'spPr') || child(element, 'grpSpPr') || element,
            xfrm       = child(properties, 'xfrm'),
            off,
            ext,
            childOff,
            childExt;

        if ( !xfrm ) {
            return null;
        }
        off      = child(xfrm, 'off');
        ext      = child(xfrm, 'ext');
        childOff = child(xfrm, 'chOff');
        childExt = child(xfrm, 'chExt');

        return {
            x:           toPixels(attribute(off, 'x')),
            y:           toPixels(attribute(off, 'y')),
            width:       toPixels(attribute(ext, 'cx')),
            height:      toPixels(attribute(ext, 'cy')),
            rotation:    number(attribute(xfrm, 'rot'), 0) / 60000,
            childX:      childOff ? toPixels(attribute(childOff, 'x')) : null,
            childY:      childOff ? toPixels(attribute(childOff, 'y')) : null,
            childWidth:  childExt ? toPixels(attribute(childExt, 'cx')) : null,
            childHeight: childExt ? toPixels(attribute(childExt, 'cy')) : null
        };
    }

    /**
     * The coordinate system a group gives the shapes inside it.
     */
    function groupFrame( box, frame ) {
        var placed = transform(box, frame);

        if ( box.childWidth === null || !box.childWidth || !box.childHeight ) {
            return { x: placed.x, y: placed.y, childX: 0, childY: 0, scaleX: 1, scaleY: 1 };
        }

        return {
            x:      placed.x,
            y:      placed.y,
            childX: box.childX,
            childY: box.childY,
            scaleX: placed.width / box.childWidth,
            scaleY: placed.height / box.childHeight
        };
    }

    /**
     * Where a shape ends up, through the transforms of the groups it is
     * nested in.
     */
    function transform( box, frame ) {
        if ( !frame ) {
            return { x: box.x, y: box.y, width: box.width, height: box.height };
        }

        return {
            x:      frame.x + (box.x - frame.childX) * frame.scaleX,
            y:      frame.y + (box.y - frame.childY) * frame.scaleY,
            width:  box.width * frame.scaleX,
            height: box.height * frame.scaleY
        };
    }

    function position( element, box, frame ) {
        var placed = transform(box, frame);

        element.style.left   = placed.x + 'px';
        element.style.top    = placed.y + 'px';
        element.style.width  = placed.width + 'px';
        element.style.height = placed.height + 'px';
        if ( box.rotation ) {
            element.style.transform = 'rotate(' + box.rotation + 'deg)';
        }

        return placed;
    }


    /**
     * The bullet a list level of a text body asks for.
     */
    function bulletOf( properties, context ) {
        var buChar = child(properties, 'buChar'),
            buNone = child(properties, 'buNone'),
            buAuto = child(properties, 'buAutoNum'),
            character;

        if ( buNone ) {
            return null;
        }
        if ( buChar ) {
            character = attribute(buChar, 'char') || '\u2022';

            // The bullet fonts put their glyphs in the private use area.
            return character >= '\uE000' && character <= '\uF8FF' ? '\u2022' : character;
        }
        if ( buAuto ) {
            context.number += 1;

            return context.number + '.';
        }

        return undefined;
    }

    /**
     * One paragraph of a text body, with the formatting of every run in it.
     */
    function renderParagraph( paragraph, context ) {
        var element    = document.createElement('p'),
            properties = child(paragraph, 'pPr'),
            level      = number(attribute(properties, 'lvl'), 0),
            align      = attribute(properties, 'algn'),
            marker     = bulletOf(properties, context),
            aligns     = { l: 'left', ctr: 'center', r: 'right', just: 'justify' },
            indent     = toPixels(attribute(properties, 'marL')),
            empty      = true,
            size,
            label;

        if ( align && aligns[align] ) {
            element.style.textAlign = aligns[align];
        }
        if ( indent || level ) {
            element.style.marginLeft = (indent || level * 36) + 'px';
        }

        children(paragraph, 'r').forEach(function () {
            empty = false;
        });

        // A placeholder that carries a bullet style shows one for every
        // paragraph that does not turn it off.
        if ( marker === undefined ) {
            marker = context.bulleted && !empty ? '\u2022' : null;
        }
        if ( marker ) {
            label = document.createElement('span');
            label.className   = 'pptx-marker';
            label.textContent = marker + '\u00A0\u00A0';
            // The marker belongs to the text, so it takes the size of the
            // run it stands in front of.
            size = number(attribute(child(child(paragraph, 'r'), 'rPr'), 'sz'), 0);
            if ( size ) {
                label.style.fontSize = (size / 100) + 'pt';
            }
            element.appendChild(label);
        }

        Array.prototype.forEach.call(paragraph.children, function ( node ) {
            var run,
                text,
                properties_,
                size,
                color,
                link;

            if ( node.localName === 'br' ) {
                element.appendChild(document.createElement('br'));

                return;
            }
            if ( node.localName !== 'r' && node.localName !== 'fld' ) {
                return;
            }

            text = child(node, 't');
            if ( !text ) {
                return;
            }

            properties_ = child(node, 'rPr');
            link        = child(properties_, 'hlinkClick');
            run         = document.createElement(link ? 'a' : 'span');

            if ( attribute(properties_, 'b') === '1' ) {
                run.style.fontWeight = 'bold';
            }
            if ( attribute(properties_, 'i') === '1' ) {
                run.style.fontStyle = 'italic';
            }
            if ( attribute(properties_, 'u') && attribute(properties_, 'u') !== 'none' ) {
                run.style.textDecoration = 'underline';
            }
            if ( attribute(properties_, 'strike') === 'sngStrike' ) {
                run.style.textDecoration = 'line-through';
            }
            // Hundredths of a point.
            size = number(attribute(properties_, 'sz'), 0);
            if ( size ) {
                run.style.fontSize = (size / 100) + 'pt';
            }
            color = context.colors.of(child(properties_, 'solidFill'));
            if ( color ) {
                run.style.color = color;
            }
            if ( link ) {
                run.style.textDecoration = 'underline';
                run.target = '_blank';
                run.rel    = 'noopener noreferrer';
                if ( context.links && context.links[reference(link, 'id')] ) {
                    run.href = context.links[reference(link, 'id')];
                }
            }

            run.textContent = text.textContent;
            element.appendChild(run);
        });

        if ( !element.textContent ) {
            element.appendChild(document.createElement('br'));
        }

        return element;
    }

    /**
     * The text of a shape, laid out inside its box.
     */
    function renderTextBody( body, context ) {
        var element = document.createElement('div'),
            anchor  = attribute(child(body, 'bodyPr'), 'anchor'),
            anchors = { t: 'flex-start', ctr: 'center', b: 'flex-end' },
            numbering = { number: 0, colors: context.colors, links: context.links,
                bulleted: context.bulleted };

        element.className = 'pptx-text';
        element.style.justifyContent = anchors[anchor] || 'flex-start';
        // The default inset of a text box, four sides.
        element.style.padding = '0.05in 0.1in';

        children(body, 'p').forEach(function ( paragraph ) {
            element.appendChild(renderParagraph(paragraph, numbering));
        });

        return element;
    }


    /**
     * The fill and the outline of a shape.
     */
    function applyShapeStyle( element, shape, colors ) {
        var properties = child(shape, 'spPr'),
            fill       = child(properties, 'solidFill'),
            line       = child(properties, 'ln'),
            lineFill   = line ? child(line, 'solidFill') : null,
            geometry   = child(properties, 'prstGeom'),
            preset     = attribute(geometry, 'prst'),
            color;

        if ( child(properties, 'noFill') ) {
            element.style.background = 'none';
        } else if ( fill ) {
            color = colors.of(fill);
            if ( color ) {
                element.style.background = color;
            }
        }

        if ( line && !child(line, 'noFill') ) {
            color = lineFill ? colors.of(lineFill) : null;
            if ( color ) {
                element.style.border = Math.max(1, toPixels(attribute(line, 'w'))) + 'px solid ' + color;
            }
        }

        if ( preset === 'ellipse' ) {
            element.style.borderRadius = '50%';
        } else if ( preset === 'roundRect' ) {
            element.style.borderRadius = '12px';
        }
    }

    /**
     * A table, which a slide keeps inside a graphic frame.
     */
    function renderTable( table, colors ) {
        var element = document.createElement('table'),
            widths  = [];

        element.className = 'pptx-table';

        children(find(table, 'tblGrid'), 'gridCol').forEach(function ( column ) {
            widths.push(toPixels(attribute(column, 'w')));
        });

        children(table, 'tr').forEach(function ( row ) {
            var tr = document.createElement('tr'),
                height = toPixels(attribute(row, 'h'));

            if ( height ) {
                tr.style.height = height + 'px';
            }
            children(row, 'tc').forEach(function ( cell, index ) {
                var td   = document.createElement('td'),
                    body = child(cell, 'txBody'),
                    fill = child(child(cell, 'tcPr'), 'solidFill'),
                    color;

                if ( widths[index] ) {
                    td.style.width = widths[index] + 'px';
                }
                if ( attribute(cell, 'gridSpan') ) {
                    td.colSpan = number(attribute(cell, 'gridSpan'), 1);
                }
                if ( attribute(cell, 'rowSpan') ) {
                    td.rowSpan = number(attribute(cell, 'rowSpan'), 1);
                }
                if ( attribute(cell, 'hMerge') === '1' || attribute(cell, 'vMerge') === '1' ) {
                    return;
                }
                color = fill ? colors.of(fill) : null;
                if ( color ) {
                    td.style.background = color;
                }
                if ( body ) {
                    children(body, 'p').forEach(function ( paragraph ) {
                        td.appendChild(renderParagraph(paragraph,
                            { number: 0, colors: colors, bulleted: false }));
                    });
                }
                tr.appendChild(td);
            });
            element.appendChild(tr);
        });

        return element;
    }


    /**
     * The placeholder a shape stands in for, so that a shape which leaves
     * its position or its text to the layout can be given them.
     */
    function placeholderOf( shape ) {
        var ph = find(child(shape, 'nvSpPr'), 'ph');

        if ( !ph ) {
            return null;
        }

        return {
            type: attribute(ph, 'type') || 'body',
            idx:  attribute(ph, 'idx') || ''
        };
    }

    /**
     * Index the placeholders of a layout or master, so that a slide can look
     * up the one it is standing in for.
     */
    function indexPlaceholders( tree ) {
        var index = {};

        if ( !tree ) {
            return index;
        }
        children(tree, 'sp').forEach(function ( shape ) {
            var ph = placeholderOf(shape);

            if ( !ph ) {
                return;
            }
            index[ph.type + ':' + ph.idx] = shape;
            if ( index[ph.type] === undefined ) {
                index[ph.type] = shape;
            }
            if ( ph.idx && index['#' + ph.idx] === undefined ) {
                index['#' + ph.idx] = shape;
            }
        });

        return index;
    }

    /**
     * The shape a placeholder stands in for. A slide leaves its geometry to
     * the layout, which in turn may leave it to the master, so both are
     * asked in that order.
     */
    function inheritedShape( placeholder, inherited ) {
        var found = null;

        if ( !placeholder ) {
            return null;
        }
        inherited.some(function ( index ) {
            found = index[placeholder.type + ':' + placeholder.idx] ||
                index['#' + placeholder.idx] ||
                index[placeholder.type] || null;

            return !!found;
        });

        return found;
    }

    /**
     * The geometry of a placeholder, taken from the first of the shapes
     * behind it that carries one.
     */
    function inheritedTransform( placeholder, inherited ) {
        var box = null;

        if ( !placeholder ) {
            return null;
        }
        inherited.some(function ( index ) {
            var shape = index[placeholder.type + ':' + placeholder.idx] ||
                index['#' + placeholder.idx] ||
                index[placeholder.type];

            box = shape ? readTransform(shape) : null;

            return !!box;
        });

        return box;
    }

    /**
     * Lay out one shape tree onto the slide.
     */
    function renderTree( tree, target, context, frame ) {
        Array.prototype.forEach.call(tree.children, function ( node ) {
            var box,
                element,
                placeholder,
                body,
                shape,
                graphic,
                blip,
                relation,
                image;

            switch ( node.localName ) {
                case 'sp':
                    placeholder = placeholderOf(node);
                    box         = readTransform(node) ||
                        inheritedTransform(placeholder, context.inherited);
                    if ( !box ) {
                        return;
                    }

                    shape = document.createElement('div');
                    shape.className = 'pptx-shape';
                    applyShapeStyle(shape, node, context.colors);
                    position(shape, box, frame);
                    target.appendChild(shape);

                    body = child(node, 'txBody');
                    if ( body && body.textContent.trim() ) {
                        element = renderTextBody(body, {
                            colors:   context.colors,
                            links:    context.links,
                            // A title is not bulleted; a body placeholder is.
                            bulleted: !!placeholder && placeholder.type !== 'title' &&
                                placeholder.type !== 'ctrTitle' && placeholder.type !== 'subTitle'
                        });
                        position(element, box, frame);
                        target.appendChild(element);
                    }
                    break;

                case 'pic':
                    box = readTransform(node);
                    if ( !box ) {
                        return;
                    }
                    blip     = find(node, 'blip');
                    relation = blip ? context.links['@' + reference(blip, 'embed')] : null;
                    if ( !relation ) {
                        return;
                    }
                    image = document.createElement('img');
                    image.className = 'pptx-image';
                    image.src = relation;
                    position(image, box, frame);
                    target.appendChild(image);
                    break;

                case 'graphicFrame':
                    box     = readTransform(node);
                    graphic = find(node, 'tbl');
                    if ( !box || !graphic ) {
                        return;
                    }
                    element = renderTable(graphic, context.colors);
                    position(element, box, frame);
                    element.style.height = 'auto';
                    target.appendChild(element);
                    break;

                case 'grpSp':
                    box = readTransform(node);
                    if ( !box ) {
                        return;
                    }
                    renderTree(node, target, context, groupFrame(box, frame));
                    break;

                default:
                    break;
            }
        });
    }

    /**
     * The background of a slide, which it may leave to its layout or the
     * master.
     */
    function backgroundOf( sources, colors ) {
        var i,
            background,
            fill;

        for ( i = 0; i < sources.length; i += 1 ) {
            background = sources[i] ? find(sources[i], 'bg') : null;
            fill       = background ? find(background, 'solidFill') : null;
            if ( fill ) {
                return colors.of(fill);
            }
        }

        return null;
    }


    /**
     * Read one slide and everything behind it, and build its element.
     */
    function buildSlide( pkg, path, theme ) {
        var slide,
            layout,
            master,
            relations,
            links = {};

        return pkg.xml(path).then(function ( document ) {
            slide = document;

            return pkg.relations(path);
        }).then(function ( map ) {
            var layoutPath;

            relations = map;
            Object.keys(map).forEach(function ( id ) {
                if ( /slideLayout/.test(map[id].type) ) {
                    layoutPath = resolvePath(path, map[id].target);
                }
            });

            return layoutPath ? pkg.xml(layoutPath).then(function ( document ) {
                layout = document;

                return pkg.relations(layoutPath).then(function ( layoutMap ) {
                    var masterPath;

                    Object.keys(layoutMap).forEach(function ( id ) {
                        if ( /slideMaster/.test(layoutMap[id].type) ) {
                            masterPath = resolvePath(layoutPath, layoutMap[id].target);
                        }
                    });

                    return masterPath ? pkg.xml(masterPath).then(function ( document ) {
                        master = document;
                    }) : null;
                });
            }) : null;
        }).then(function () {
            // The pictures of the slide, as URLs, and the targets of its
            // hyperlinks.
            var pending = [];

            Object.keys(relations).forEach(function ( id ) {
                var target = relations[id].target;

                if ( relations[id].external ) {
                    links[id] = target;

                    return;
                }
                if ( !/image|media/i.test(relations[id].type) ) {
                    return;
                }
                pending.push(pkg.media(resolvePath(path, target)).then(function ( url ) {
                    links['@' + id] = url;
                }));
            });

            return Promise.all(pending);
        }).then(function () {
            var element  = document.createElement('div'),
                colors   = createColors(theme, master ? readColorMap(master) : null),
                cSld     = find(slide, 'cSld'),
                context  = {
                    colors:    colors,
                    links:     links,
                    inherited: [
                        indexPlaceholders(find(layout, 'spTree')),
                        indexPlaceholders(find(master, 'spTree'))
                    ]
                },
                background = backgroundOf([cSld, find(layout, 'cSld'), find(master, 'cSld')], colors);

            element.className    = 'pptx-slide';
            element.style.width  = slideWidth + 'px';
            element.style.height = slideHeight + 'px';
            if ( background ) {
                element.style.background = background;
            }

            // The decoration of the master and the layout sits behind the slide.
            [find(master, 'spTree'), find(layout, 'spTree')].forEach(function ( tree ) {
                if ( tree ) {
                    renderTree(decorations(tree), element, {
                        colors:    colors,
                        links:     {},
                        inherited: []
                    }, null);
                }
            });

            renderTree(find(cSld, 'spTree'), element, context, null);

            return element;
        });
    }

    /**
     * The shapes of a layout or master that are not placeholders: the
     * decoration a slide inherits rather than fills in.
     */
    function decorations( tree ) {
        var copy = tree.cloneNode(true);

        Array.prototype.slice.call(copy.children).forEach(function ( node ) {
            if ( node.localName === 'sp' && placeholderOf(node) ) {
                copy.removeChild(node);
            }
        });

        return copy;
    }

    /**
     * The map the master keeps from the slots a slide names to the entries
     * of the theme.
     */
    function readColorMap( master ) {
        var element = find(master, 'clrMap'),
            map     = {};

        if ( element ) {
            Array.prototype.forEach.call(element.attributes, function ( item ) {
                map[item.name] = item.value;
            });
        }

        return map;
    }

    function render( buffer ) {
        return JSZip.loadAsync(buffer).then(function ( zip ) {
            var pkg = createPackage(zip);

            return pkg.xml('ppt/presentation.xml').then(function ( presentation ) {
                var size = presentation ? find(presentation, 'sldSz') : null,
                    width,
                    height;

                if ( !presentation ) {
                    throw new Error('no presentation part');
                }

                width  = toPixels(attribute(size, 'cx')) || 960;
                height = toPixels(attribute(size, 'cy')) || 540;
                // Laid out at a fixed width and scaled afterwards, which keeps text crisp.
                slideWidth  = 960;
                slideHeight = Math.round(960 * height / width);

                return pkg.relations('ppt/presentation.xml').then(function ( relations ) {
                    var order = [],
                        themePath;

                    children(find(presentation, 'sldIdLst'), 'sldId').forEach(function ( entry ) {
                        var relation = relations[reference(entry, 'id')];

                        if ( relation ) {
                            order.push(resolvePath('ppt/presentation.xml', relation.target));
                        }
                    });

                    Object.keys(relations).forEach(function ( id ) {
                        if ( /theme/.test(relations[id].type) ) {
                            themePath = resolvePath('ppt/presentation.xml', relations[id].target);
                        }
                    });

                    return (themePath ? pkg.xml(themePath) : Promise.resolve(null))
                        .then(function ( theme ) {
                            return order.reduce(function ( chain, path ) {
                                return chain.then(function ( built ) {
                                    return buildSlide(pkg, path, theme).then(function ( element ) {
                                        built.push(element);

                                        return built;
                                    });
                                });
                            }, Promise.resolve([]));
                        });
                });
            });
        });
    }


    /**
     * Fit the slide that is showing into the frame.
     */
    function layout() {
        var box = ViewerSupport.contentBox(),
            available;

        if ( !deck ) {
            return;
        }
        // Without the padding, or the slide overflows the frame by a few pixels.
        available = Math.min(box.width / slideWidth, box.height / slideHeight);
        scaleTo(available * zoomLevel);
    }

    function scaleTo( factor ) {
        slides.forEach(function ( slide ) {
            slide.style.transform = 'scale(' + factor + ')';
        });
        deck.style.width  = (slideWidth * factor) + 'px';
        deck.style.height = (slideHeight * factor) + 'px';
    }

    this.initialize = function ( viewerElement, documentUrl ) {
        injectStyle();
        ViewerSupport.fetchDocument(documentUrl).then(render).then(function ( built ) {
            var canvas = ViewerSupport.canvas(true);

            if ( !built.length ) {
                throw new Error('no slides');
            }

            deck = document.createElement('div');
            deck.className = 'pptx-deck';
            built.forEach(function ( slide, index ) {
                slide.style.display = index === 0 ? '' : 'none';
                deck.appendChild(slide);
            });
            slides       = built;
            self.wrapper = deck;
            canvas.style.overflow = 'visible';
            canvas.appendChild(deck);

            layout();
            window.addEventListener('resize', layout);
            self.ready();
        }).catch(function ( err ) {
            console.log('PptxViewerPlugin: failed to render presentation: ' + (err && err.stack || err));
            ViewerSupport.showError(ViewerSupport.canvas());
            self.ready();
        });
    };

    this.getPages = function () {
        return slides.length ? slides : [1];
    };

    this.showPage = function ( n ) {
        current = Math.max(1, Math.min(n, slides.length));
        slides.forEach(function ( slide, index ) {
            slide.style.display = index === current - 1 ? '' : 'none';
        });
    };

    this.getPageInView = function () {
        return current;
    };

    this.getZoomLevel = function () {
        return zoomLevel;
    };

    this.setZoomLevel = function ( value ) {
        zoomLevel = value;
        layout();
    };

    this.fitToWidth = function () {
        zoomLevel = 1;
        layout();
    };

    this.fitToHeight = this.fitToWidth;
    this.fitToPage   = this.fitToWidth;
    this.fitSmart    = this.fitToWidth;
}
