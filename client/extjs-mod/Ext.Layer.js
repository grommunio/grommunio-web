/**
 * Override Ext.Layer when parentEl is not specified in config.
 * Consider body of active browser window as a parent element instead of main browser window.
 *
 * @class Ext.Layer
 * @extends Ext.Element
 * An extended {@link Ext.Element} object that supports a shadow and shim, constrain to viewport and
 * automatic maintaining of shadow/shim positions.
 * @cfg {Boolean} shim False to disable the iframe shim in browsers which need one (defaults to true)
 * @cfg {String/Boolean} shadow True to automatically create an {@link Ext.Shadow}, or a string indicating the
 * shadow's display {@link Ext.Shadow#mode}. False to disable the shadow. (defaults to false)
 * @cfg {Object} dh DomHelper object config to create element with (defaults to {tag: 'div', cls: 'x-layer'}).
 * @cfg {Boolean} constrain False to disable constrain to viewport (defaults to true)
 * @cfg {String} cls CSS class to add to the element
 * @cfg {Number} zindex Starting z-index (defaults to 11000)
 * @cfg {Number} shadowOffset Number of pixels to offset the shadow (defaults to 4)
 * @cfg {Boolean} useDisplay
 * Defaults to use css offsets to hide the Layer. Specify <tt>true</tt>
 * to use css style <tt>'display:none;'</tt> to hide the Layer.
 * @constructor
 * @param {Object} config An object with config options.
 * @param {String/HTMLElement} existingEl (optional) Uses an existing DOM element. If the element is not found it creates it.
 */
(function() {
    Ext.Layer = function(config, existingEl) {
        config = config || {};
        var dh = Ext.DomHelper,
            activeBrowserObject = Zarafa.core.BrowserWindowMgr.getActive(),
            cp = config.parentEl, pel = cp ? Ext.getDom(cp) : activeBrowserObject.document.body;

        if (existingEl) {
            this.dom = Ext.getDom(existingEl);
        }
        if(!this.dom) {
            var o = config.dh || {tag: 'div', cls: 'x-layer'};
            this.dom = dh.append(pel, o);
        }
        if(config.cls) {
            this.addClass(config.cls);
        }
        this.constrain = config.constrain !== false;
        this.setVisibilityMode(Ext.Element.VISIBILITY);
        if(config.id) {
            this.id = this.dom.id = config.id;
        } else {
            this.id = Ext.id(this.dom);
        }
        this.zindex = config.zindex || this.getZIndex();
        this.position('absolute', this.zindex);
        if(config.shadow) {
            this.shadowOffset = config.shadowOffset || 4;
            this.shadow = new Ext.Shadow({
                offset: this.shadowOffset,
                mode: config.shadow
            });
        } else {
            this.shadowOffset = 0;
        }
        this.useShim = config.shim !== false && Ext.useShims;
        this.useDisplay = config.useDisplay;
        this.hide();
    };

    var supr = Ext.Element.prototype;

// shims are shared among layer to keep from having 100 iframes
    var shims = [];

    Ext.extend(Ext.Layer, Ext.Element, {

        getZIndex: function() {
            return this.zindex || parseInt((this.getShim() || this).getStyle('z-index'), 10) || 11000;
        },

        getShim: function() {
            if(!this.useShim) {
                return null;
            }
            if(this.shim) {
                return this.shim;
            }
            var shim = shims.shift();
            if(!shim) {
                shim = this.createShim();
                shim.enableDisplayMode('block');
                shim.dom.style.display = 'none';
                shim.dom.style.visibility = 'visible';
            }
            var pn = this.dom.parentNode;
            if(shim.dom.parentNode != pn) {
                pn.insertBefore(shim.dom, this.dom);
            }
            shim.setStyle('z-index', this.getZIndex()-2);
            this.shim = shim;
            return shim;
        },

        hideShim: function() {
            if(this.shim) {
                this.shim.setDisplayed(false);
                shims.push(this.shim);
                delete this.shim;
            }
        },

        disableShadow: function() {
            if(this.shadow) {
                this.shadowDisabled = true;
                this.shadow.hide();
                this.lastShadowOffset = this.shadowOffset;
                this.shadowOffset = 0;
            }
        },

        enableShadow: function(show) {
            if(this.shadow) {
                this.shadowDisabled = false;
                if(Ext.isDefined(this.lastShadowOffset)) {
                    this.shadowOffset = this.lastShadowOffset;
                    delete this.lastShadowOffset;
                }
                if(show) {
                    this.sync(true);
                }
            }
        },

        // private
        // this code can execute repeatedly in milliseconds (i.e. during a drag) so
        // code size was sacrificed for efficiency (e.g. no getBox/setBox, no XY calls)
        sync: function(doShow) {
            var shadow = this.shadow;
            if(!this.updating && this.isVisible() && (shadow || this.useShim)) {
                var shim = this.getShim(),
                    w = this.getWidth(),
                    h = this.getHeight(),
                    l = this.getLeft(true),
                    t = this.getTop(true);

                if(shadow && !this.shadowDisabled) {
                    if(doShow && !shadow.isVisible()) {
                        shadow.show(this);
                    } else {
                        shadow.realign(l, t, w, h);
                    }
                    if(shim) {
                        if(doShow) {
                            shim.show();
                        }
                        // fit the shim behind the shadow, so it is shimmed too
                        var shadowAdj = shadow.el.getXY(), shimStyle = shim.dom.style,
                            shadowSize = shadow.el.getSize();
                        shimStyle.left = (shadowAdj[0])+'px';
                        shimStyle.top = (shadowAdj[1])+'px';
                        shimStyle.width = (shadowSize.width)+'px';
                        shimStyle.height = (shadowSize.height)+'px';
                    }
                } else if(shim) {
                    if(doShow) {
                        shim.show();
                    }
                    shim.setSize(w, h);
                    shim.setLeftTop(l, t);
                }
            }
        },

        // private
        destroy: function() {
            this.hideShim();
            if(this.shadow) {
                this.shadow.hide();
            }
            this.removeAllListeners();
            Ext.removeNode(this.dom);
            delete this.dom;
        },

        remove: function() {
            this.destroy();
        },

        // private
        beginUpdate: function() {
            this.updating = true;
        },

        // private
        endUpdate: function() {
            this.updating = false;
            this.sync(true);
        },

        // private
        hideUnders: function(negOffset) {
            if(this.shadow) {
                this.shadow.hide();
            }
            this.hideShim();
        },

        // private
        constrainXY: function() {
            if(this.constrain) {
                var vw = Ext.lib.Dom.getViewWidth(),
                    vh = Ext.lib.Dom.getViewHeight();
                var s = Ext.getDoc().getScroll();

                var xy = this.getXY();
                var x = xy[0], y = xy[1];
                var so = this.shadowOffset;
                var w = this.dom.offsetWidth+so, h = this.dom.offsetHeight+so;
                // only move it if it needs it
                var moved = false;
                // first validate right/bottom
                if((x + w) > vw+s.left) {
                    x = vw - w - so;
                    moved = true;
                }
                if((y + h) > vh+s.top) {
                    y = vh - h - so;
                    moved = true;
                }
                // then make sure top/left isn't negative
                if(x < s.left) {
                    x = s.left;
                    moved = true;
                }
                if(y < s.top) {
                    y = s.top;
                    moved = true;
                }
                if(moved) {
                    if(this.avoidY) {
                        var ay = this.avoidY;
                        if(y <= ay && (y+h) >= ay) {
                            y = ay-h-5;
                        }
                    }
                    xy = [x, y];
                    this.storeXY(xy);
                    supr.setXY.call(this, xy);
                    this.sync();
                }
            }
            return this;
        },

        getConstrainOffset: function() {
            return this.shadowOffset;
        },

        isVisible: function() {
            return this.visible;
        },

        // private
        showAction: function() {
            this.visible = true; // track visibility to prevent getStyle calls
            if(this.useDisplay === true) {
                this.setDisplayed('');
            } else if(this.lastXY) {
                supr.setXY.call(this, this.lastXY);
            } else if(this.lastLT) {
                supr.setLeftTop.call(this, this.lastLT[0], this.lastLT[1]);
            }
        },

        // private
        hideAction: function() {
            this.visible = false;
            if(this.useDisplay === true) {
                this.setDisplayed(false);
            } else {
                this.setLeftTop(-10000,-10000);
            }
        },

        // overridden Element method
        setVisible: function(v, a, d, c, e) {
            if(v) {
                this.showAction();
            }
            if(a && v) {
                var cb = function() {
                    this.sync(true);
                    if(c) {
                        c();
                    }
                }.createDelegate(this);
                supr.setVisible.call(this, true, true, d, cb, e);
            } else {
                if(!v) {
                    this.hideUnders(true);
                }
                var cb = c;
                if(a) {
                    cb = function() {
                        this.hideAction();
                        if(c) {
                            c();
                        }
                    }.createDelegate(this);
                }
                supr.setVisible.call(this, v, a, d, cb, e);
                if(v) {
                    this.sync(true);
                } else if(!a) {
                    this.hideAction();
                }
            }
            return this;
        },

        storeXY: function(xy) {
            delete this.lastLT;
            this.lastXY = xy;
        },

        storeLeftTop: function(left, top) {
            delete this.lastXY;
            this.lastLT = [left, top];
        },

        // private
        beforeFx: function() {
            this.beforeAction();
            return Ext.Layer.superclass.beforeFx.apply(this, arguments);
        },

        // private
        afterFx: function() {
            Ext.Layer.superclass.afterFx.apply(this, arguments);
            this.sync(this.isVisible());
        },

        // private
        beforeAction: function() {
            if(!this.updating && this.shadow) {
                this.shadow.hide();
            }
        },

        // overridden Element method
        setLeft: function(left) {
            this.storeLeftTop(left, this.getTop(true));
            supr.setLeft.apply(this, arguments);
            this.sync();
            return this;
        },

        setTop: function(top) {
            this.storeLeftTop(this.getLeft(true), top);
            supr.setTop.apply(this, arguments);
            this.sync();
            return this;
        },

        setLeftTop: function(left, top) {
            this.storeLeftTop(left, top);
            supr.setLeftTop.apply(this, arguments);
            this.sync();
            return this;
        },

        setXY: function(xy, a, d, c, e) {
            this.fixDisplay();
            this.beforeAction();
            this.storeXY(xy);
            var cb = this.createCB(c);
            supr.setXY.call(this, xy, a, d, cb, e);
            if(!a) {
                cb();
            }
            return this;
        },

        // private
        createCB: function(c) {
            var el = this;
            return function() {
                el.constrainXY();
                el.sync(true);
                if(c) {
                    c();
                }
            };
        },

        // overridden Element method
        setX: function(x, a, d, c, e) {
            this.setXY([x, this.getY()], a, d, c, e);
            return this;
        },

        // overridden Element method
        setY: function(y, a, d, c, e) {
            this.setXY([this.getX(), y], a, d, c, e);
            return this;
        },

        // overridden Element method
        setSize: function(w, h, a, d, c, e) {
            this.beforeAction();
            var cb = this.createCB(c);
            supr.setSize.call(this, w, h, a, d, cb, e);
            if(!a) {
                cb();
            }
            return this;
        },

        // overridden Element method
        setWidth: function(w, a, d, c, e) {
            this.beforeAction();
            var cb = this.createCB(c);
            supr.setWidth.call(this, w, a, d, cb, e);
            if(!a) {
                cb();
            }
            return this;
        },

        // overridden Element method
        setHeight: function(h, a, d, c, e) {
            this.beforeAction();
            var cb = this.createCB(c);
            supr.setHeight.call(this, h, a, d, cb, e);
            if(!a) {
                cb();
            }
            return this;
        },

        // overridden Element method
        setBounds: function(x, y, w, h, a, d, c, e) {
            this.beforeAction();
            var cb = this.createCB(c);
            if(!a) {
                this.storeXY([x, y]);
                supr.setXY.call(this, [x, y]);
                supr.setSize.call(this, w, h, a, d, cb, e);
                cb();
            } else {
                supr.setBounds.call(this, x, y, w, h, a, d, cb, e);
            }
            return this;
        },

        /**
         * Sets the z-index of this layer and adjusts any shadow and shim z-indexes. The layer z-index is automatically
         * incremented by two more than the value passed in so that it always shows above any shadow or shim (the shadow
         * element, if any, will be assigned z-index + 1, and the shim element, if any, will be assigned the unmodified z-index).
         * @param {Number} zindex The new z-index to set
         * @return {this} The Layer
         */
        setZIndex: function(zindex) {
            this.zindex = zindex;
            this.setStyle('z-index', zindex + 2);
            if(this.shadow) {
                this.shadow.setZIndex(zindex + 1);
            }
            if(this.shim) {
                this.shim.setStyle('z-index', zindex);
            }
            return this;
        }
    });
})();
