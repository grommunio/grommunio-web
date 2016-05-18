(function() {
	var orig_createToolbar = Ext.form.HtmlEditor.prototype.createToolbar;
	var orig_initEditor = Ext.form.HtmlEditor.prototype.initEditor;
	var orig_initFrame = Ext.form.HtmlEditor.prototype.initFrame;

	Ext.override(Ext.form.HtmlEditor, {

		/*
		 * Fix createToolbar, the font-selection combobox doesn't get a tabindex applied
		 * like any of the other buttons in the toolbar. So fix this behavior to match
		 * the rest of the toolbar buttons.
		 */
		createToolbar : function(editor)
		{
			orig_createToolbar.apply(this, arguments);

			// Make the 'more' button of the toolbar not selectable by tab
			this.getToolbar().layout.overflowTabIndex = -1;
			if (this.enableFont && !Ext.isSafari2) {
				 var btn = Ext.DomQuery.select('.x-font-select', this.tb.getEl().dom);
				 if (!Ext.isEmpty(btn)) {
					btn[0].setAttribute('tabindex', '-1');
				 }
			}
		},

		// private
		onFirstFocus : function()
		{
			this.activated = true;
			this.disableItems(this.readOnly);
			//removed the Gecko/Firefox, as things seems to work fine
			this.fireEvent('activate', this);
		},

		/*
		 * Override Ext.form.HtmlEditor, in htmleditor in chrome when user presses
		 * enter it should add only one <br /> but for some weird reason code was adding
		 * two <br /> which is really annoying for users.
		 * so this function is overriden to add only one <br />.
		 */
		fixKeys : function() // load time branching for fastest keydown performance
		{
			if (Ext.isIE) {
				return function(e) {
					var k = e.getKey(),
						doc = this.getDoc(),
						sel,
						r;

					if (k == e.TAB) {
						e.stopEvent();
						// DOM 2 alternative to old IE pasteHTML method
						sel = this.win.getSelection();

						if (sel.getRangeAt && sel.rangeCount) {
							r = sel.getRangeAt(0);
							r.deleteContents();
							var el = doc.createElement('div');
							el.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;';
							var frag = doc.createDocumentFragment(), node, lastNode;
							while ((node = el.firstChild)) {
								lastNode = frag.appendChild(node);
							}
							r.insertNode(frag);

							if (lastNode) {
								r = r.cloneRange();
								r.setStartAfter(lastNode);
								r.collapse(true);
								sel.removeAllRanges();
								sel.addRange(r);
							}
						}
						this.deferFocus();

					} else if(k == e.ENTER) {
						// DOM 2 alternative to old IE pasteHTML method
						sel = this.win.getSelection();
						if (sel.getRangeAt && sel.rangeCount) {
							r = sel.getRangeAt(0);
							r.deleteContents();
							var target = r.commonAncestorContainer;

							if (!target || target.nodeName.toLowerCase() != 'li' && target.parentNode.nodeName.toLowerCase() != 'li') {
								e.stopEvent();
								var el = doc.createElement('div');
								el.innerHTML = '<br />';
								var frag = doc.createDocumentFragment(), node, lastNode;
								while ((node = el.firstChild)) {
									lastNode = frag.appendChild(node);
								}
								r.insertNode(frag);

								if (lastNode) {
									r = r.cloneRange();
									r.setStartAfter(lastNode);
									r.collapse(false);
									sel.removeAllRanges();
									sel.addRange(r);
								}
							}
						}
					}
				};
			} else if(Ext.isOpera) {
				return function(e) {
					var k = e.getKey();
					if (k == e.TAB) {
						e.stopEvent();
						this.win.focus();
						this.execCmd('InsertHTML','&nbsp;&nbsp;&nbsp;&nbsp;');
						this.deferFocus();
					}
				};
			} else if(Ext.isWebKit) {
				return function(e) {
					var k = e.getKey();
					if (k == e.TAB) {
						e.stopEvent();
						this.execCmd('InsertText','\t');
						this.deferFocus();
					}
					//here removed the check for Enter keypress as it seems the Chrome is working well with this event
				};
			}
		}(),

		/**
		 * initialize editor body
		 * overriden in order to disable default drag&drop behaviour
		 * which loads a file in the current window when dropped into the editor body
		 * @override
		 * @private
		 */
		initEditor : function()
		{
			orig_initEditor.apply(this, arguments);

			this.getWin().addEventListener('dragover', Zarafa.onWindowDragDrop, false);
			this.getWin().addEventListener('drop', Zarafa.onWindowDragDrop, false);
		},

		/**
		 * initialize iframe and writes contents to it
		 * overriden in order to fix a nasty bug in chrome where scrolling is stuck at bottom
		 * and user will not be able to scroll upwards when url contains # (that is added when any anchor
		 * element with href="#" is clicked in webapp)
		 * https://code.google.com/p/chromium/issues/detail?id=102816
		 * @override
		 * @private
		 */
		initFrame : function()
		{
			orig_initFrame.apply(this, arguments);

			// Bug is only in chrome and when url contains hash
			if(Ext.isChrome && window.location.href.search(/#$/) !== -1) {
				// find out parent container which is scrollable
				var scrollEl = this.findParentBy(function(cmp) {
					var el = cmp.getEl();
					return el.isScrollable();
				});

				// this will fix actuall bug and re-enable scrolling in the parent scrollable container
				// although position of the scrollbar is still at bottom
				var body = this.getEditorBody();
				body.scrollTop = 0;

				if(scrollEl !== null) {
					// now set scroll position to top
					scrollEl.getEl().scrollTo('top', 0);
				}
			}
		}
	});
})();
