(function() {
	/*
	 * Override @class Ext.ux.Spinner class
	 * so that click event on trigger is actually fired after mousedown/mouseup has been called and
	 * focus has been shifted to the {@link Ext.form.TriggerField TriggerField}
	 */
	Ext.override(Ext.ux.Spinner, {
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
