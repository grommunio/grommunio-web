Ext.namespace('Zarafa.plugins.smime.ui');

// Adding some functionality to the the Ext.EventManager so our viewport can handle the resizing of the iframe
Ext.apply(Ext.EventManager, function(){
	var resizeEvent;
	var resizeTask;
	var curHeight, curWidth;

	return {
		// private
		doIframeResizeEvent: function(iframeWindow){
			var doc = iframeWindow.document;
			var body = Ext.get(doc.body);

			var h = body.getHeight(),
				w = body.getWidth();

			//whacky problem in IE where the resize event will fire even though the w/h are the same.
			if(curHeight != h || curWidth != w){
				resizeEvent.fire(curWidth = w, curHeight = h);
			}
		},

		/**
		 * Adds a listener to be notified when the iframe window is resized and provides resize event buffering (100 milliseconds),
		 * passes new viewport width and height to handlers.
		 * @param {Function} fn	  The handler function the window resize event invokes.
		 * @param {Object}scopeThe scope (<code>this</code> reference) in which the handler function executes. Defaults to the browser window.
		 * @param {boolean}  options Options object as passed to {@link Ext.Element#addListener}
		 */
		onIframeResize : function(fn, scope, options){
			if( resizeEvent ){
				resizeEvent.clearListeners();
			}

			resizeEvent = new Ext.util.Event();
			resizeTask = new Ext.util.DelayedTask(this.doIframeResizeEvent, this, [options.window]);
			Ext.EventManager.on(options.window, "resize", this.fireIframeResize, this);
			resizeEvent.addListener(fn, scope, options);
		},

		// exposed only to allow manual firing
		fireIframeResize : function(){
			if(resizeEvent){
				resizeTask.delay(100);
			}
		}
	};
}());

/**
 * @class Zarafa.plugins.smime.ui.Viewport
 * @extends Ext.Viewport
 *
 * The viewport we can use inside an iframe window. The original {@link Ext.Viewport}
 * needs some modifications to work on the correct document
 */
Zarafa.plugins.smime.ui.Viewport = Ext.extend(Ext.Viewport, {
	/**
	 * @cfg {Mixed} body The body element that this viewport will be attached to.
	 * Can be an HTML element or an {@link Ext.Element}
	 */
	body : null,

	initComponent : function() {
		Ext.Viewport.superclass.initComponent.call(this);

		if ( !(this.body instanceof Ext.Element) ){
			this.body = Ext.get(this.body);
		}
		var doc = this.body.dom.ownerDocument;
		var win = doc.defaultView;

		doc.getElementsByTagName('html')[0].className += ' x-viewport';
		this.el = this.body;
		this.el.setHeight = Ext.emptyFn;
		this.el.setWidth = Ext.emptyFn;
		this.el.setSize = Ext.emptyFn;
		this.el.dom.scroll = 'no';
		this.allowDomMove = false;
		this.autoWidth = true;
		this.autoHeight = true;
		Ext.EventManager.onIframeResize(this.fireResize, this, {window: win});
		this.renderTo = this.el;
	}
});
