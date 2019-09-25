(function() {
	/*
	 * Override @class Ext.ux.Spinner class
	 * so that click event on trigger is actually fired after mousedown/mouseup has been called and
	 * focus has been shifted to the {@link Ext.form.TriggerField TriggerField}
	 */
	Ext.override(Ext.ux.Spinner, {
		doRender: function(ct, position){
			var el = this.el = this.field.getEl();
			var f = this.field;

			if (!f.wrap) {
				f.wrap = this.wrap = el.wrap({
					cls: "x-form-field-wrap"
				});
			}
			else {
				this.wrap = f.wrap.addClass('x-form-field-wrap');
			}

			this.trigger = this.wrap.createChild({
				tag: "img",
				src: Ext.BLANK_IMAGE_URL,
				cls: "x-form-trigger " + this.triggerClass
			});
			if (!f.width) {
				this.wrap.setWidth(el.getWidth() + this.trigger.getWidth());
			}

			this.splitter = this.wrap.createChild({
				tag: 'div',
				cls: this.splitterClass,
				style: 'width:13px; height:2px;'
			});
			this.splitter.setRight((Ext.isIE) ? 1 : 2).setTop(10).show();

			if(!Ext.isEmpty(f.boxLabel)){
				this.wrap.createChild({tag: 'label', htmlFor: this.el.id, cls: 'x-form-cb-label', html: f.boxLabel});
			}

			this.proxy = this.trigger.createProxy('', this.splitter, true);
			this.proxy.addClass("x-form-spinner-proxy");
			this.proxy.setStyle('left', '0px');
			this.proxy.setSize(14, 1);
			this.proxy.hide();
			this.dd = new Ext.dd.DDProxy(this.splitter.dom.id, "SpinnerDrag", {
				dragElId: this.proxy.id
			});

			this.initTrigger();
			this.initSpinner();
		},
		initSpinner: function(){
			this.field.addEvents({
				'spin': true,
				'spinup': true,
				'spindown': true
			});

			this.keyNav = new Ext.KeyNav(this.el, {
				"up": function(e){
					e.preventDefault();
					this.onSpinUp();
				},

				"down": function(e){
					e.preventDefault();
					this.onSpinDown();
				},

				"pageUp": function(e){
					e.preventDefault();
					this.onSpinUpAlternate();
				},

				"pageDown": function(e){
					e.preventDefault();
					this.onSpinDownAlternate();
				},

				scope: this
			});

			// this code has beenchanged to listen on click event of trigger instead of
			// listening on click event of Ext.util.ClickRepeater which is fired on mousedown event
			this.field.mon(this.trigger, 'click', this.onTriggerClick, this, {
				preventDefault: true
			});

			this.field.mon(this.trigger, {
				mouseover: this.onMouseOver,
				mouseout: this.onMouseOut,
				mousemove: this.onMouseMove,
				mousedown: this.onMouseDown,
				mouseup: this.onMouseUp,
				scope: this,
				preventDefault: true
			});

			this.field.mon(this.wrap, "mousewheel", this.handleMouseWheel, this);

			this.dd.setXConstraint(0, 0, 10)
			this.dd.setYConstraint(1500, 1500, 10);
			this.dd.endDrag = this.endDrag.createDelegate(this);
			this.dd.startDrag = this.startDrag.createDelegate(this);
			this.dd.onDrag = this.onDrag.createDelegate(this);
		}
	});
})();
