/*
 * #dependsFile client/zarafa/mail/data/ActionTypes.js
 */
Ext.namespace("Zarafa.common.ui");

/**
 * @class Zarafa.common.ui.HtmlEditor
 * @extends Ext.ux.form.TinyMCETextArea
 * @xtype zarafa.htmleditor
 *
 * Our HtmlEditor is a simple override of the TinyMCE provided HtmlEditor.
 * It automatically enables all buttons which are needed within Zarafa, and adds
 * plugins to extend the HtmlEditor with additional features.
 * The toolbar is extended with the overflow option, which moves all buttons
 * which do not fit within the length of the toolbar to a new popup menu at
 * the right position of the toolbar.
 */
Zarafa.common.ui.HtmlEditor = Ext.extend(Ext.ux.form.TinyMCETextArea, {
	/**
	 * defaultFontFamily The default font family set by the user.
	 * @property
	 * @type String
	 */
	defaultFontFamily: undefined,

	/**
	 * defaultFontSize The default font size set by the user.
	 * @property
	 * @type String
	 */
	defaultFontSize: undefined,

	/**
	 * Reference to the document inside the TinyMCE iframe for event cleanup.
	 * @property
	 * @type Document
	 */
	editorDoc: null,

	/**
	 * @constructor
	 * @param config configuration object
	 * @cfg enableOverflow set {@link Ext.Toolbar.enableOverflow enableOverflow} on the toolbar.
	 */
	constructor: function(config)
	{
		config = config || {};
		// Captured here because inside the TinyMCE `setup` callback below, `this` is
		// bound by TinyMCE itself (not the HtmlEditor instance), so a plain `this`
		// reference there would not point to this component.
		var self = this;
		// Get supported font families
		var fontFamilies = Zarafa.common.ui.htmleditor.Fonts.getFontFamilies();

		var baseUrl = container.getServerConfig().getBaseUrl();
		const cacheBuster = "8.1.2.369";

		var themeIsDark = Zarafa.core.DarkMode.isDark();

		this.defaultFontFamily = container.getSettingsModel().get("zarafa/v1/main/default_font");
		this.defaultFontSize = Zarafa.common.ui.htmleditor.Fonts.getDefaultFontSize();
		config = Ext.applyIf(config, {
			xtype: "zarafa.tinymcetextarea",
			hideLabel: true,
			hideMode: "offsets",
			readOnly: false,
			tinyMCEConfig: {
				delta_height: 1,
				plugins: "autolink directionality image link emoticons media charmap anchor lists advlist quickbars searchreplace visualchars table officepaste",
				quickbars_insert_toolbar: false,
				cache_suffix: "?version=" + cacheBuster,
				link_assume_external_targets: true,
				toolbar: "undo redo | fontfamily fontsizeinput bold italic underline strikethrough | backcolor forecolor removeformat | bullist numlist outdent indent align lineheight | ltr rtl | subscript superscript | link anchor image media table | charmap emoticons | searchreplace",
				quickbars_selection_toolbar: "fontsizeinput | bold italic underline strikethrough | backcolor forecolor removeformat | quicklink blockquote quickimage quicktable",
				toolbar_mode: "sliding",
				paste_data_images: true,
				automatic_uploads: false,
				remove_trailing_brs: false,
				font_family_formats: fontFamilies,
				font_size_input_default_unit: "pt",
				browser_spellcheck: true,
				valid_elements: '*[*]',
				extended_valid_elements: 'img[src|data-mce-src|alt|width|height],p[class|style],span[class|style],a[href|style],*[*]',
				valid_children: '+body[p],+p[span|a|b|strong|i|em|u|#text]',
				paste_as_text: false,
				width: "100%",
				menubar: false,
				contextmenu: false,
				statusbar: false,
				skin: themeIsDark ? "oxide-dark" : "oxide",
				content_css: themeIsDark ? "dark" : "default",
				branding: false,
				relative_urls: false,
				remove_script_host: false,
				forced_root_block: 'P',
				forced_root_block_attrs: {
					'style': 'padding: 0; margin: 0; '
				},
				content_style: "body{ word-wrap: break-word; margin: 1rem !important;" +
					(themeIsDark ? " background-color: #1e1e1e !important; color: #e0e0e0 !important; color-scheme: dark;" : "") +
					"}" +
					(themeIsDark ? " ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #2a2a2a; } ::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; } ::-webkit-scrollbar-thumb:hover { background: #777; }" : ""),
				setup: function(editor) {
					editor.on("PostProcess", function (e) {
						if (e.get) {
							e.content = inlineCSS(e.content);
						}
					});
					// Add accessible title to TinyMCE iframe
					editor.on("init", function() {
						var iframe = editor.iframeElement;
						if (iframe) {
							iframe.setAttribute('title', _('Message body editor'));
						}
					});
					// When a file is dropped into the editor body, TinyMCE embeds
					// images inline but blocks all other file types with an error.
					// Instead, offer to add non-embeddable files as attachments.
					editor.on("drop", function(e) {
						var dt = e.dataTransfer;
						if (!dt) {
							return;
						}

						// Defensive: if another plugin already handled this drop and
						// prevented the default, leave it alone.
						if (e.isDefaultPrevented()) {
							return;
						}

						var files = dt.files;
						if (!files || files.length === 0) {
							return;
						}

						// Image extensions that TinyMCE can embed inline.
						var imageExts = (editor.options.get('images_file_types') || 'jpeg,jpg,jpe,jfi,jif,jfif,png,gif,bmp,webp').split(',');

						var nonEmbeddable = [];
						var hasEmbeddable = false;
						for (var i = 0; i < files.length; i++) {
							var ext = (files[i].name.split('.').pop() || '').toLowerCase();
							if (imageExts.indexOf(ext) < 0) {
								nonEmbeddable.push(files[i]);
							} else {
								hasEmbeddable = true;
							}
						}

						if (nonEmbeddable.length === 0) {
							return;
						}

						// Suppress TinyMCE's own "Dropped file type is not supported" error
						// only when there is nothing for TinyMCE to embed. When the same drop
						// also contains images, TinyMCE's paste handler (which runs after this
						// one) embeds them and calls preventDefault() itself -- which also
						// suppresses that error. Calling preventDefault() here in that case
						// would make TinyMCE's handler bail on isDefaultPrevented() and the
						// images would be silently discarded.
						if (!hasEmbeddable) {
							e.preventDefault();
						}

						// HTML-encode each name individually so that the '<br>' separators
						// used to join them remain real line breaks instead of being
						// escaped as literal text.
						var names = nonEmbeddable.map(function(f) { return '\u2022 ' + Ext.util.Format.htmlEncode(f.name); });

						// Capture the record reference before the async callback.
						var record = self.record;

						// Zarafa.core.data.IPMAttachmentStore#uploadFiles() only treats its
						// argument as "real" files (with size/type/contents) if it is a
						// genuine FileList (it does a strict `instanceof FileList` check).
						// A plain Array -- which is what our filtering above produces --
						// fails that check and would silently be handled as a list of bare
						// filenames, so the actual file contents would never be uploaded
						// and the resulting attachment would be broken (0 bytes, no type).
						// Rebuild a real FileList containing only the non-embeddable files
						// so it is uploaded/attached exactly like a drop on the Attachments
						// field would be.
						var uploadFileList = nonEmbeddable;
						if (typeof DataTransfer !== 'undefined') {
							var fileListBuilder = new DataTransfer();
							nonEmbeddable.forEach(function(f) {
								fileListBuilder.items.add(f);
							});
							uploadFileList = fileListBuilder.files;
						}

						Ext.MessageBox.confirm(
							_('Add as attachment?'),
							_('The following files cannot be embedded in the message body. Add them as attachments instead?') +
								'<br><br>' + names.join('<br>'),
							function(btn) {
								if (btn !== 'yes' || !record) {
									return;
								}

								var store = record.getSubStore('attachments');
								// Run the same validation (max attachment count/size limits)
								// that a direct drop on the Attachments field would perform.
								if (store && store.canUploadFiles(uploadFileList, { container: this.getEl() })) {
									store.uploadFiles(uploadFileList);
								}
							}.createDelegate(self)
						);
					});
				}
			}
		});

		// Set the correct language for tinymce
		var lang = container.getSettingsModel().get("zarafa/v1/main/language", true);
		var tinyLanguageCode = Zarafa.common.ui.htmleditor.LanguageMap.getTinyLanguageCode(lang);
		if (!Ext.isEmpty(tinyLanguageCode) && tinyLanguageCode !== "en_GB" && tinyLanguageCode !== "en_US") {
			config.tinyMCEConfig.language = tinyLanguageCode;
			config.tinyMCEConfig.language_url = baseUrl + "client/tinymce-languages/" + tinyLanguageCode + ".js";
		}

		// Give plugins the option to change the tinyMCE configuration
		container.populateInsertionPoint("common.htmleditor.tinymceconfig", {
			scope: this,
			config: config.tinyMCEConfig
		});

		this.addEvents(
		/**
		 * @event valuecorrection
		 * Fires after {@link #setValue} has been called, and the given value has been
		 * formatted by the browser or tinymce. This allows the user of this component
		 * to better determine what the user-made changes were.
		 * @param {Zarafa.common.ui.HtmlEditor} this The component which fired the event
		 * @param {String} correctedValue The new (by browser corrected) value
		 * @param {String} originalValue The value as set by the caller of setValue
		 */
		"valuecorrection",
		/**
		 * @event dblclick
		 * Fired when the user double clicks inside the editor content.
		 */
		"dblclick");

		Zarafa.common.ui.HtmlEditor.superclass.constructor.call(this, config);

		this.on("initialized", this.onEditorInitialized, this);
		this.on("beforedestroy", this.onBeforeDestroy, this);
	},

	/**
	 * Function is called when the tinymce editor is initialized.
	 * @param {Zarafa.common.ui.HtmlEditor} htmlEditor The editor which is initialized.
	 * @param {tinymce.Editor} tinymceEditor The tinymce editor instance
	 * @private
	 */
	onEditorInitialized: function(htmlEditor, tinymceEditor)
	{
		var server = container.getServerConfig();
		var clientTimeout = server.getClientTimeout();

		if (clientTimeout) {
			this.setIdleTimeEventListeners();
		}

		tinymceEditor.on("keydown", this.onKeyDown.createDelegate(this), this);
		tinymceEditor.on("mousedown", this.relayIframeEvent.createDelegate(this), this);

		// Auto-linkify Windows file paths (UNC \\server\share, file:// URLs and mapped drives
		// like Z:\folder). TinyMCE's 'autolink' plugin only recognizes scheme://, www. and e-mail, so
		// these stay plain text otherwise. We handle both pasted content and typed-then-space/enter.
		// Note: the bundled 'officepaste' plugin cancels PastePreProcess (preventDefault) and inserts
		// the content itself, so PastePostProcess never fires. We hook PastePreProcess with prepend=true
		// to run *before* officepaste and linkify the content string it is about to insert.
		tinymceEditor.on("PastePreProcess", this.onPasteFileLink.createDelegate(this), true);
		tinymceEditor.on("keyup", this.onKeyUpFileLink.createDelegate(this));

		var doc = tinymceEditor.getDoc();
		Ext.EventManager.on(doc, 'click', this.onEditorClick, this);
		Ext.EventManager.on(doc, 'dblclick', this.onEditorDocDblClick, this);
		this.editorDoc = doc;

		if (Ext.isGecko) {
			tinymceEditor.on("dblclick", this.onDBLClick.createDelegate(this));
			if (container.mainPanel) {
				var contentPanel = container.getTabPanel();
				this.mon(contentPanel, "beforetabchange", this.onBeforeTabChange, this);
			}
		}

		var listeners = {
			blur: this.onBlur,
			focus: this.onFocus,
			scope: this
		};

		Ext.EventManager.on(this.getEditor().getWin(), listeners);
		tinymceEditor.on("focus", this.onFocus.createDelegate(this), this);
		tinymceEditor.on("blur", this.onBlur.createDelegate(this), this);

		// Apply default formatting after initialization
		this.applyFontStyles();
		this.addDefaultFormatting();
	},

	isHtmlEditor: function()
	{
		return true;
	},

	/**
	 * Check whether the given action type belongs to reply/forward style compose actions.
	 * @param {String} actionType The message action type.
	 * @return {Boolean}
	 * @private
	 */
	isResponseAction: function(actionType)
	{
		return actionType === Zarafa.mail.data.ActionTypes.REPLY ||
			actionType === Zarafa.mail.data.ActionTypes.REPLYALL ||
			actionType === Zarafa.mail.data.ActionTypes.FORWARD ||
			actionType === Zarafa.mail.data.ActionTypes.FORWARD_ATTACH ||
			actionType === Zarafa.mail.data.ActionTypes.EDIT_AS_NEW;
	},

	/**
	 * Set event listeners on the iframe that will reset the
	 * {@link Zarafa#idleTime idle time} when the user performs
	 * an action in the iframe (i.e. click, mousemove, keydown)
	 * @private
	 */
	setIdleTimeEventListeners: function()
	{
		var doc = this.getEditorDocument();
		if (!doc.addEventListener) {
			/**
			 * Client timeout will still be handled by the backend though,
			 * but the message will only be shown to the user when he tries to
			 * connect to the backend after the session has timed out.
			*/
			return;
		}
		var clickHandler = (function() {
			Zarafa.idleTime = 0;
		});
		var mouseMoveHandler = (function() {
			Zarafa.idleTime = 0;
		});

		try {
			doc.addEventListener("click", clickHandler, { capture: true, passive: true });
			doc.addEventListener("mousemove", mouseMoveHandler, { capture: true, passive: true });
		} catch (ex) {
			doc.addEventListener("click", clickHandler, true);
			doc.addEventListener("mousemove", mouseMoveHandler, true);
		}

		doc.addEventListener("keydown", (function() {
			Zarafa.idleTime = 0;
		}), true);
	},

	/**
	 * Event handler for the beforedestroy event
	 * The handler will call the remove function the tinyMCE editor, so it can clean up properly.
	 */
	onBeforeDestroy: function()
	{
		var editor = this.getEditor();

		if (this.editorDoc) {
			Ext.EventManager.removeListener(this.editorDoc, 'click', this.onEditorClick, this);
			Ext.EventManager.removeListener(this.editorDoc, 'dblclick', this.onEditorDocDblClick, this);
			this.editorDoc = null;
		}

		// Check if the editor was activated
		if (editor) {
			editor.remove();
		}
	},

	/**
	 * Event handler is called when fonct family combobox gets change the font type.
	 * @param {object} event the event object
	 */
	onFontFamilyChange: function(event)
	{
		this.defaultFontFamily = event.control.settings.value;
	},

	/**
	 * Event handler is called when fonct size combobox gets change the font size.
	 * @param {object} event the event object
	 */
	onFontSizeChange: function(event)
	{
		this.defaultFontSize = event.control.settings.value;
	},

	/**
	 * Function is used to execute a tinymce command to compose
	 * default formatting as a style attribute of currently selected node.
	 * @param {tinymce.Editor} editor The tinymce editor instance
	 * @private
	 */
	composeDefaultFormatting: function(editor)
	{
		editor.execCommand("FontSize", false, this.defaultFontSize, {
			skip_focus: true
		});
		editor.execCommand("FontName", false, this.defaultFontFamily, {
			skip_focus: true
		});
		this.repositionBrTag(editor);
	},

	/**
	 * Function is used to add the BR tag to inner SPAN tag of P tag and remove BR tag from P tag.
	 * it required because BR tag is used to identify the cursor location as wall as after pressing
	 * enter or pasting content in editor default formatting gets repeated in next line , to make cursor
	 * position ideal it required that BR tag must be in SPAN tag.
	 * @param {tinymce.Editor} editor The tinymce editor instance
	 */
	repositionBrTag: function(editor)
	{
		var node = editor.selection.getNode();
		editor.dom.add(node, "br");
		var parentNode = editor.dom.getParent(node, "P");
		if (parentNode && parentNode.lastChild.nodeName === "BR") {
			parentNode.removeChild(parentNode.lastChild);
		}
	},

	/**
	 * Function will set value in the editor and will call {@link #checkValueCorrection}
	 * to update tinymce's editor value into record. for more information check code/comments
	 * of {@link #checkValueCorrection}.
	 * @param {String} value The value which was being set on the editor
	 */
	setValue: function(value)
	{
		var self = this;
		this.withEd((function() {
			var setValue = Ext.isDefined(value) ? value : '';
			var editor = self.getEditor();
			if (editor) {
				var currentValue = editor.getContent();
				if (currentValue === setValue) {
					// No changes, so we don't need to update
					return;
				}
			}
			Zarafa.common.ui.HtmlEditor.superclass.setValue.call(this, setValue);
			if (self.rendered) {
				// checkValueCorrection function will be only called when editor is created and
				// initialized. Otherwise, it will it wait for that.
				self.checkValueCorrection(this, setValue);
			}
		}));
	},

	/**
	 * Add the default formatting before composing a new mail.
	 * @private
	 */
	addDefaultFormatting: function()
	{
		var tinymceEditor = this.getEditor();
		if (tinymceEditor.getContent({
			format: "text"
		}).trim()) {
			// Only add default formatting when there is no content
			// Otherwise is has already been added
			return;
		}
		tinymceEditor.selection.setCursorLocation(tinymceEditor.getBody().firstChild, 0);
		this.composeDefaultFormatting(tinymceEditor);
		// HTML styles will be applied while selecting default values from comboboxes.
		// We need to set those styles into the record to avoid change detection in record.
		// For reply/forward records, don't push this temporary default formatting into
		// the bound record as it can race with quoted body initialization.
		var actionType = this.record && Ext.isFunction(this.record.getMessageAction) ? this.record.getMessageAction('action_type') : null;
		if (!this.isResponseAction(actionType)) {
			this.checkValueCorrection(this, "");
		}
		// Remove all the undo level from tinymce, so that user can't rollback the default HTML styles.
		tinymceEditor.undoManager.clear();
	},

	/**
	* Toggle read only mode for the underlying TinyMCE editor without
	* disabling the component.
	* @param {Boolean} readOnly True to make the editor read-only
	*/
	setReadOnly: function(readOnly)
	{
		this.readOnly = readOnly;
		this.withEd((function() {
			var ed = this.getEditor();
			if (ed && ed.mode && ed.mode.set) {
				ed.mode.set(readOnly ? 'readonly' : 'design');
			}
		}), this);
	},

	/**
	 * Enable this component by calling parent class {@link Ext.ux.form.TinyMCETextArea.enable enable} function.
	 * It also call the {@link #addDefaultFormatting} function to add the default formatting.
	 */
	enable: function()
	{
		if (this.disabled) {
			Zarafa.common.ui.HtmlEditor.superclass.enable.apply(this, arguments);
			var editor = this.getEditor();
			// Reset the remembered selection value to its default value, because the single instance of
			// tinymce editor is being used by composing multiple signatures. it just enabled/disabled
			// with new/updated content.
			editor.selection.lastFocusBookmark = null;
			// Apply default formatting for the signature editor.
			if (Ext.isEmpty(editor.getContent())) {
				this.addDefaultFormatting(editor);
			}
		}
	},

	/**
	 * This is called after {@link #setValue} and determines if the value has been adjusted by the tinymce.
	 * Normally the value is applied to the <iframe> element where it is being rendered, tinymce will
	 * however also apply extra formatting, and change the ordering of some attributes. Because we only
	 * want to detect when the user made changes rather then the browser, we will check here what
	 * {@link #getValue} returns and check if that is different then the value which was being set.
	 * If a difference was found, the {@link #valuecorrection} event will be fired to inform the
	 * component user that he might need to implement some workaround.
	 *
	 * @param {Zarafa.common.ui.htmleditor.HtmlEditor} editor The HTML editor
	 * @param {String} value The value which was being set on the <iframe>
	 * @private
	 */
	checkValueCorrection: function(editor, value)
	{
		var correctedValue = editor.getValue();
		if (value !== correctedValue) {
			editor.fireEvent("valuecorrection", editor, correctedValue, value);
		}
	},

	/**
	 * Function is called when double clicked in the editor.
	 * While body is empty and double click in editor then firefox consider current selection on P tag instead of Span
	 * and P tag doesn't have formatting that's way default formatting will remove.
	 * Handle above situation by setting up selection on Span tag then after fire nodechange event of editor.
	 */
	onDBLClick: function()
	{
		var editor = this.getEditor();
		var element = editor.selection.getStart();
		// tinymce used zero width space characters as character container in empty line,
		// So needs to verify body is empty or not.
		var isEmptyBody = editor.selection.getContent({
			format: "text"
		}) === "";
		if (element === editor.getBody().firstChild && isEmptyBody) {
			editor.selection.setCursorLocation(element.firstChild.firstChild, 0);
		}
	},

	/**
	 * Handle click events inside the editor and open hyperlinks while in read-only mode.
	 * @param {Object} event The click event fired by TinyMCE
	 */
	onEditorClick: function(event)
	{
		if (!event.target) {
			return;
		}

		var node = event.target;
		while (node && node.nodeName !== 'A') {
			node = node.parentNode;
		}

		if (node && node.nodeName === 'A') {
			var href = node.getAttribute('href');
			if (href) {
				if (event.preventDefault) {
					event.preventDefault();
				}
				window.open(href, '_blank');
			}
		}
	},

	/**
	* Relay double click events from the iframe document to the component.
	* @param {Object} event The DOM event
	*/
	onEditorDocDblClick: function(event)
	{
		this.fireEvent('dblclick', this, event);
	},

	/**
	 * Function is called when mouse is clicked in the editor.
	 * Editor mousedown event needs to be relayed for the document element of grommunio Web page,
	 * to hide the context-menu.
	 * wheel event propagated from underlying iframe needs to be relayed to grommunio Web document
	 * to perform zoom functionality in DeskApp.
	 * @param {Object} event The event object
	 */
	relayIframeEvent: function(event)
	{
		Ext.getDoc().fireEvent(event.type, event);
	},

	/**
	 * Function is called when any key is pressed in the editor.
	 * @param {Object} event The event object
	 */
	onKeyDown: function(event)
	{
		var editor = this.getEditor();
		if (!Zarafa.core.BrowserWindowMgr.isMainWindowActive()) {
			switch (event.keyCode) {
			  case 116:
				//F5 button
				event.returnValue = false;
				event.keyCode = 0;
				return false;

			  case 82:
				//R button
				if (event.ctrlKey) {
					event.returnValue = false;
					event.keyCode = 0;
					return false;
				}
			}
		}

		if (event.keyCode === Ext.EventObject.ENTER) {
			// Ctrl + ENTER (and CMD + ENTER on a Mac) is the shortcut for sending an item. Because
			// we do not want to add the ENTER to the content then, we stop processing the event.
			if (event.ctrlKey || Ext.isMac && event.metaKey) {
				event.preventDefault();
				return false;
			}

			// Check if we are in a blockquote, and if so break the blockquote,
			// so the user can add his comments between the blockquotes.
			var blockquote = this.inBlockquote(editor);
			if (blockquote) {
				// Prevent normal enter-behaviour as we will handle it
				event.preventDefault();
				this.handleEnterInBlockquote();
				return false;
			}

			// We will do this in a deferred function to make sure that tiny first adds the bogus BR element to empty paragraphs
			(function() {
				var node = editor.selection.getNode();
				// When we created an empty P tag by pressing ENTER we must apply default formatting to it.
				// When we already have an empty SPAN with formatting in the P tag tiny adds a BR node with the attribute
				// 'data-mce-bogus' because otherwise it is not possible to move the cursor there. Tiny will remove those
				// bogus nodes when we get the content value. But we have removed the padding and margin of P-tags,
				// resulting in empty P nodes not being visible to the user. That's why we will remove the attribute
				// 'data-mce-bogus' of the BR nodes, so tiny will not remove them.
				if (node.nodeName === "P") {
					if (!node.hasChildNodes() || node.firstChild.nodeName === "BR") {
						this.composeDefaultFormatting(editor);
					}
				} else if (node.nodeName === "SPAN" && node.hasChildNodes() && node.firstChild.nodeName === "BR") {
					// This one is for when we created an empty paragraph by pressing ENTER while on the cursor was on end of a line
					node.firstChild.removeAttribute("data-mce-bogus");
				}
				// This one is for when we created an empty paragraph by pressing ENTER while the cursor was on the begin of a
				// line that already contained text
				var pNode = node.nodeName === "P" ? node : editor.dom.getParent(node, "p");
				var prevPNode = editor.dom.getPrev(pNode, "p");
				if (prevPNode && prevPNode.hasChildNodes()) {
					if (prevPNode.firstChild.nodeName === "SPAN" && prevPNode.firstChild.hasChildNodes() && prevPNode.firstChild.firstChild.nodeName === "BR") {
						// When we have a paragraph on which we added our default formatting, there will be a SPAN
						prevPNode.firstChild.firstChild.removeAttribute("data-mce-bogus");
					} else if (prevPNode.firstChild.nodeName === "BR") {
						// When we have a plain paragraph without our crappy default formatting there will only be a BR
						prevPNode.firstChild.removeAttribute("data-mce-bogus");
					}
				}
			}).createDelegate(this).defer(1);
		}

		/*
		 * HACK: Prevent the tab event to stop moving focus out of the editor.
		 * Instead of that, Insert four spaces while user presses TAB key.
		 */
		if (event.keyCode === Ext.EventObject.TAB && !event.shiftKey) {
			var listElement = editor.dom.getParent(editor.selection.getStart(), "LI,DT,DD");
			// check if cursor is not pointing to any list element to allow increase/decrease
			// indent of UL/OL instead of adding four white spaces.
			if (!listElement) {
				event.preventDefault();
				editor.execCommand("mceInsertContent", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
				editor.selection.collapse(false);
			}
			return;
		}
		this.fireEvent("keypress", this, Ext.EventObject);
	},

	/**
	 * Returns a fresh global {RegExp} matching Windows file paths. A new object is
	 * returned on every call so callers never share the stateful {@link RegExp#lastIndex}.
	 * @return {RegExp}
	 * @private
	 */
	getFileLinkRegExp: function()
	{
		return new RegExp(Zarafa.common.ui.HtmlEditor.FILE_LINK_RE.source, "gi");
	},

	/**
	 * Build an href for a Windows file path. UNC and mapped-drive paths are turned into
	 * a file:// URL; existing file: URLs only get their backslashes normalized. The original
	 * text (with backslashes) is kept as the visible link label by the callers.
	 * @param {String} raw The matched path text
	 * @return {String} The href to use
	 * @private
	 */
	buildFileHref: function(raw)
	{
		var s = String(raw).replace(Zarafa.common.ui.HtmlEditor.FILE_LINK_TRAILING_RE, "");
		if ((/^file:/i).test(s)) {
			// Trust the user's file: form, only fix Windows backslashes.
			return s.replace(/\\/g, "/");
		}
		if (s.substring(0, 2) === "\\\\" || s.substring(0, 2) === "//") {
			// UNC path: \\server\share\x -> file://server/share/x
			return "file:" + s.replace(/\\/g, "/");
		}
		// Mapped-drive path: Z:\folder\file -> file:///Z:/folder/file
		return "file:///" + s.replace(/\\/g, "/");
	},

	/**
	 * Replace every Windows file path inside a single text node with anchor nodes,
	 * leaving surrounding text (and any trailing punctuation) intact. Nodes already inside an
	 * anchor are never passed here.
	 * @param {Node} textNode The DOM text node to process
	 * @private
	 */
	linkifyFileLinkTextNode: function(textNode)
	{
		var text = textNode.nodeValue;
		var doc = textNode.ownerDocument;
		var re = this.getFileLinkRegExp();
		var frag = doc.createDocumentFragment();
		var lastIndex = 0;
		var match;
		while ((match = re.exec(text)) !== null) {
			var raw = match[0];
			var trailing = raw.match(Zarafa.common.ui.HtmlEditor.FILE_LINK_TRAILING_RE);
			var linkText = trailing ? raw.slice(0, raw.length - trailing[0].length) : raw;
			// Guard against a zero-length match to avoid an endless loop.
			if (linkText.length === 0) {
				re.lastIndex = match.index + 1;
				continue;
			}
			if (match.index > lastIndex) {
				frag.appendChild(doc.createTextNode(text.slice(lastIndex, match.index)));
			}
			var href = this.buildFileHref(linkText);
			var anchor = doc.createElement("a");
			anchor.setAttribute("href", href);
			anchor.setAttribute("data-mce-href", href);
			anchor.setAttribute("target", "_blank");
			anchor.appendChild(doc.createTextNode(linkText));
			frag.appendChild(anchor);
			if (trailing) {
				frag.appendChild(doc.createTextNode(trailing[0]));
			}
			lastIndex = match.index + raw.length;
		}
		if (lastIndex === 0) {
			return;
		}
		if (lastIndex < text.length) {
			frag.appendChild(doc.createTextNode(text.slice(lastIndex)));
		}
		if (textNode.parentNode) {
			textNode.parentNode.replaceChild(frag, textNode);
		}
	},

	/**
	 * Recursively walk a DOM subtree and linkify Windows file paths in its text nodes,
	 * skipping any content that is already inside an anchor.
	 * @param {Node} node The root node to scan
	 * @private
	 */
	linkifyFileLinksInNode: function(node)
	{
		if (!node) {
			return;
		}
		var child = node.firstChild;
		while (child) {
			// Grab the next sibling now because linkifyFileLinkTextNode may replace 'child'.
			var next = child.nextSibling;
			if (child.nodeType === 1) {
				if (child.nodeName !== "A") {
					this.linkifyFileLinksInNode(child);
				}
			} else if (child.nodeType === 3 && child.nodeValue &&
				this.getFileLinkRegExp().test(child.nodeValue)) {
				this.linkifyFileLinkTextNode(child);
			}
			child = next;
		}
	},

	/**
	 * Handler for TinyMCE's PastePreProcess event: linkify Windows file paths in the
	 * HTML string that is about to be inserted. Runs before the 'officepaste' plugin (which
	 * cancels the event and inserts the content itself), so we edit event.content in place.
	 * @param {Object} event The TinyMCE paste event; event.content holds the HTML string
	 * @private
	 */
	onPasteFileLink: function(event)
	{
		if (!event || typeof event.content !== "string" || event.content === "") {
			return;
		}
		// Cheap guard: only parse the fragment when it may contain a Windows file path.
		if (!this.getFileLinkRegExp().test(event.content)) {
			return;
		}
		var container = document.createElement("div");
		container.innerHTML = event.content;
		this.linkifyFileLinksInNode(container);
		event.content = container.innerHTML;
	},

	/**
	 * Handler for keyup in the editor: when the user completes a Windows file path with
	 * a space or Enter, linkify the just-typed path (parity with how http:// auto-links).
	 * TinyMCE calls the listener with a single event argument, so the editor is fetched via
	 * {@link #getEditor}.
	 * @param {Object} event The DOM keyup event
	 * @private
	 */
	onKeyUpFileLink: function(event)
	{
		if (!event || (event.keyCode !== 32 && event.keyCode !== 13)) {
			return;
		}
		var editor = this.getEditor();
		if (!editor) {
			return;
		}
		var dom = editor.dom;
		var selection = editor.selection;
		if (editor.mode && editor.mode.isReadOnly && editor.mode.isReadOnly()) {
			return;
		}
		// Never create a link when the caret is already inside one.
		if (dom.getParent(selection.getNode(), "a[href]") !== null) {
			return;
		}

		var target = this.findFileTokenBeforeCaret(editor, event.keyCode === 13);
		if (!target) {
			return;
		}

		var href = this.buildFileHref(target.token);
		var bookmark = selection.getBookmark();
		var linkRange = dom.createRng();
		linkRange.setStart(target.node, target.start);
		linkRange.setEnd(target.node, target.end);
		try {
			var anchor = dom.create("a", { href: href, "data-mce-href": href, target: "_blank" });
			linkRange.surroundContents(anchor);
		} catch (ignore) {
			// Range could not be wrapped cleanly (e.g. spanning boundaries); leave text as-is.
			selection.moveToBookmark(bookmark);
			return;
		}
		selection.moveToBookmark(bookmark);
		editor.nodeChanged();
	},

	/**
	 * Find a Windows file path that ends right at the caret (for the space case) or at
	 * the end of the previous block (for the Enter case).
	 * @param {tinymce.Editor} editor The editor instance
	 * @param {Boolean} afterEnter True when triggered by Enter (path is in the previous block)
	 * @return {Object|null} {node, start, end, token} describing the path range, or null
	 * @private
	 */
	findFileTokenBeforeCaret: function(editor, afterEnter)
	{
		var dom = editor.dom;
		var node;
		var upto;
		if (afterEnter) {
			// After Enter the caret sits in the freshly created block; the completed path is at
			// the end of the previous block's last text node.
			var block = dom.getParent(editor.selection.getNode(), dom.isBlock);
			var prevBlock = block ? dom.getPrev(block, dom.isBlock) : null;
			node = prevBlock ? this.getLastTextNode(prevBlock) : null;
			upto = node ? node.nodeValue.length : 0;
		} else {
			var rng = editor.selection.getRng();
			node = rng.endContainer;
			upto = rng.endOffset;
			if (!node || node.nodeType !== 3) {
				return null;
			}
		}
		if (!node) {
			return null;
		}

		// Consider the text up to the caret, ignoring the trailing space/newline just typed.
		var considered = node.nodeValue.substring(0, upto).replace(/\s+$/, "");
		var match = considered.match(Zarafa.common.ui.HtmlEditor.FILE_LINK_TAIL_RE);
		if (!match) {
			return null;
		}
		var trailing = match[0].match(Zarafa.common.ui.HtmlEditor.FILE_LINK_TRAILING_RE);
		var token = trailing ? match[0].slice(0, match[0].length - trailing[0].length) : match[0];
		if (token.length === 0) {
			return null;
		}
		var start = considered.length - match[0].length;
		return { node: node, start: start, end: start + token.length, token: token };
	},

	/**
	 * Return the deepest last text node inside the given node, or null when there is none.
	 * @param {Node} node The root node
	 * @return {Node|null}
	 * @private
	 */
	getLastTextNode: function(node)
	{
		var current = node;
		while (current && current.nodeType === 1) {
			current = current.lastChild;
		}
		return current && current.nodeType === 3 ? current : null;
	},

	/**
	 * Checks if the cursor is positioned inside a blockquote
	 * @param {tinymce.Editor} editor The editor we will check
	 * @return {DOMElement} The blockquote element if found or false otherwise
	 */
	inBlockquote: function(editor)
	{
		var blockquoteElement = null;
		var node = editor.selection.getNode();
		if (node.nodeName === "BLOCKQUOTE") {
			blockquoteElement = node;
		} else {
			blockquoteElement = editor.dom.getParent(node, "BLOCKQUOTE", editor.getBody());
		}
		return blockquoteElement !== null ? blockquoteElement : false;
	},

	/**
	 * Splits a blockquote DOM element at the position of the cursor
	 * @param {tinymce.Editor} editor The editor we will work in
	 * @param {DOMElement} blockquote The blockquote element that must be split.
	 */
	splitBlockquote: function(editor, blockquote)
	{
		// Save the current selection
		const selection = editor.selection;
		const range = selection.getRng(true);
		// Create a marker element to preserve the cursor's location
				const marker = editor.dom.create("span", {
			id: "split-marker"
		}, "");
		range.insertNode(marker);
		// Split the blockquote at the marker
				const newBlockquote = editor.dom.split(blockquote, marker);
		// Create a new paragraph with custom margin for the content after the split
				const newParagraph = editor.dom.create("p", {
			style: "margin: 10px 0 10px 0;"
		}, '<br data-mce-bogus="1" />');
		editor.dom.insertAfter(newParagraph, newBlockquote);
		// Move the cursor to the new paragraph (between the split)
				const newRange = editor.dom.createRng();
		newRange.setStartAfter(marker);
		newRange.setEndAfter(marker);
		// Remove the marker after setting the range
				editor.dom.remove(marker);
		// Apply the new range
				selection.setRng(newRange);
		// Focus the editor to ensure the cursor is active
				editor.focus();
	},

	/**
	 * Handles the event when the user presses ENTER when the cursor is positioned
	 * in a blockquote
	 */
	handleEnterInBlockquote: function()
	{
		var editor = this.getEditor();
		var blockquote = this.inBlockquote(editor);
		// Add an undo level and wrap the split operation in a transaction
				editor.undoManager.transact((() => {
			if (blockquote) {
				this.splitBlockquote(editor, blockquote);
			}
		}));
		editor.focus();
	},

	/**
	 * Event handler which is raised when the component looses the focus
	 * of the user. This will determine if the typed in value has changed
	 * since the moment it gained focus, and will raise the 'change' event
	 * in that case.
	 * @private
	 */
	onBlur: function()
	{
		// if container of HtmlEditor, i.e. dialog, is closed then component is
		// also destroyed or removed and we won't be able to get value/content.
		if (this.isDestroyed === true || this.getEditor().removed) {
			return;
		}
		// This event can be triggered multiple times, so we don't need to check
		// for changed when we blur without being focused. However, we do want to
		// invoke the 'blur' event since that will produce a consistent behavior
		// with other UI components from ExtJs.
				if (this.hasFocus === true) {
			var v = this.getRawValue();
			if (v.length !== this.originalValue.length || v !== this.originalValue) {
				this.fireEvent("change", this, v, this.originalValue);
			}
		}
		this.hasFocus = false;
		this.fireEvent("blur", this);
	},

	/**
	 * Event handler which is raised when the component gains the focus
	 * of the user. This will update the originalValue field so later,
	 * when the component looses focus, it can be determined if the
	 * value has been changed.
	 * @private
	 */
	onFocus: function()
	{
		// This event can be triggered multiple times,
		// even when it looses focus the onFocus will
		// be raised twice before the onBlur is called.
		if (this.hasFocus === true) {
			return;
		}
		this.originalValue = this.getRawValue();
		this.hasFocus = true;
		this.fireEvent("focus", this);
		// While body is empty and switching a focus in editor after tab change then
		// some how firefox consider current selection on P tag instead of span and
		// P tag doesn't have formatting that's way default formatting will remove.
		if (this.isTabChanged) {
			this.getEditor().selection.setCursorLocation();
			this.isTabChanged = false;
		}
	},

	/**
	 * Function is used to set the cursor within editor while mail replay/forward.
	 * It fires the 'focusin' event of editor.
	 */
	setCursorLocation: function()
	{
		var editor = this.getEditor();
		// check If editor instance is available or not
		if (editor) {
			this.withEd((function() {
				// Here we need to fire the focusin event of editor because
				// in default formatting we have two span tags, so somehow
				// when mail is reply/forward cursor set in first outer span which is not contains any
				// formatting so default formatting gets lost. to overcome this problem
				// we need to fire the focusin event of editor.
				editor.dispatch("focusin", {
					target: editor.getBody(),
					relatedTarget: null
				});
			}));
		} else {
			// if editor instance is not available yet to do auto focus than we have to reschedule the
			// auto focus mechanism un till editor instance will be available, simply register on
			// {@link #initialized} event.
			this.on("initialized", (function() {
				var focusCmp = this.ownerCt;
				focusCmp.focus.defer(1, focusCmp);
				focusCmp.fireEvent("setAutoFocusCursor", focusCmp.getEditor());
			}), this);
		}
	},

	/**
	 * Function will get the editor and fetch document element of the editor.
	 * @return {HTMLDocument} it will return document element of the editor iframe
	 */
	getEditorDocument: function()
	{
		return this.getEditor().getDoc();
	},

	/**
	 * Function will get the editor and fetch body element of the editor.
	 * @return {HTMLBodyElement} it will return body element of the editor iframe
	 */
	getEditorBody: function()
	{
		return this.getEditor().getBody();
	},

	/**
	 * bind an {@link Zarafa.core.data.IPMRecord} to this component
	 * record is necessary to properly convert img tags, for which store and entryid are needed
	 * @param {Zarafa.core.data.IPMRecord} record
	 */
	bindRecord: function(record)
	{
		this.record = record;
	},

	/**
	 * Event handler triggers when content tab panel is changed
	 */
	onBeforeTabChange: function()
	{
		this.isTabChanged = true;
		if (this.hasFocus) {
			this.getEditor().fire("blur", this);
		}
	},

	/**
	 * Function to set formatting with default font family and font size
	 */
	applyFontStyles: function()
	{
		var body = Ext.get(this.getEditorBody());
		body.setStyle("font-family", this.defaultFontFamily);
		body.setStyle("font-size", this.defaultFontSize);
	}
});

/**
 * Core pattern for Windows file paths, matched anywhere within a text node.
 * Three alternatives, tried in order:
 *   1. file: URLs  - file://server/share, file:///C:/dir, file:\\server\share
 *   2. UNC paths   - \\server\share\dir\file (server plus at least one segment)
 *   3. mapped drive - X:\dir\file (a single drive letter, guarded by a lookbehind so it can
 *                     never match the ':' inside a real scheme such as http: or a time 12:30)
 * Matching stops at whitespace, quotes and angle brackets. Used (with the 'gi' flags) to build
 * fresh RegExp objects so callers never share a stateful lastIndex.
 * @property
 * @type RegExp
 * @static
 */
Zarafa.common.ui.HtmlEditor.FILE_LINK_RE =
	/file:[\\/]{1,3}[^\s"'<>]+|\\\\[^\s\\/"'<>]+(?:[\\/][^\s\\/"'<>]+)+[\\/]?|(?<![A-Za-z0-9])[A-Za-z]:[\\/][^\s"'<>]+/;

/**
 * Same pattern as {@link #FILE_LINK_RE} but anchored to the end of the string, used to detect a
 * path that the user just finished typing right before the caret.
 * @property
 * @type RegExp
 * @static
 */
Zarafa.common.ui.HtmlEditor.FILE_LINK_TAIL_RE =
	new RegExp("(?:" + Zarafa.common.ui.HtmlEditor.FILE_LINK_RE.source + ")$", "i");

/**
 * Trailing sentence punctuation that should stay as plain text rather than becoming part of the
 * linkified path (e.g. the period in "see \\server\share.").
 * @property
 * @type RegExp
 * @static
 */
Zarafa.common.ui.HtmlEditor.FILE_LINK_TRAILING_RE = /[.,;:!?)\]}]+$/;

Ext.reg("zarafa.htmleditor", Zarafa.common.ui.HtmlEditor);

// Create a hidden html editor to prefetch all tiny files
Zarafa.onReady((function()
{
	var body = Ext.getBody();
	// Only prefetch for the webclient not for the welcome screen
	if (body.hasClass("zarafa-webclient")) {
		var el = body.createChild({
			id: "tiny-prefetch",
			style: {
				width: "10px",
				height: "10px",
				"z-index": -10,
				top: "-10000px",
				left: "-10000px",
				visibility: "hidden",
				position: "absolute"
			}
		});
		new Ext.Panel({
			xtype: "panel",
			applyTo: el,
			layout: "fit",
			border: false,
			flex: 1,
			autoHeight: false,
			items: [ {
				xtype: "zarafa.editorfield",
				ref: "../editorField",
				flex: 1,
				useHtml: true
			} ]
		});
	}
}));
