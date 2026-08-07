Ext.namespace('Zarafa.note.dialogs');

/**
 * @class Zarafa.note.dialogs.NoteEditPanel
 * @extends Ext.form.FormPanel
 * @xtype zarafa.noteeditpanel
 *
 * this class is used to provide ui for note dialog
 */
Zarafa.note.dialogs.NoteEditPanel = Ext.extend(Ext.FormPanel, {
	/**
	 * The current CSS class which is applied for
	 * determining the background color for this panel.
	 * @property
	 * @type String
	 */
	currentColorCss: undefined,

	/**
	 * @cfg {Ext.Template/String} linkedMailTemplate The template for the bar naming the
	 * mail this note annotates, shown only when it is linked to one.
	 */
	linkedMailTemplate:
			'<span class="stickynote_linkedmail_link">' +
				/* # TRANSLATORS: Names the mail a note is attached to, e.g. "Note on: Re: invoice" */
				pgettext('note.dialog', 'Note on') + ': ' +
				'<tpl if="!Ext.isEmpty(values.note_link_subject)">{note_link_subject:htmlEncode}</tpl>' +
				'<tpl if="Ext.isEmpty(values.note_link_subject)">' + _('(no subject)') + '</tpl>' +
			'</span>',

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config,{
			xtype	: 'zarafa.noteeditpanel',
			layout	: { type: 'vbox', align: 'stretch' },
			border	: false,
			items : [{
				xtype: 'container',
				ref: 'linkedMailBar',
				cls: 'stickynote_linkedmail',
				hidden: true,
				autoHeight: true,
				listeners: {
					// The record usually arrives before this bar is rendered, so it
					// has to be filled in once the element exists.
					afterrender: this.onLinkedMailBarRender,
					scope: this
				}
			}, {
				xtype: 'zarafa.editorfield',
				useHtml: false,
				ref: 'noteText',
				plaintextName: 'body',
				flex: 1,
				listeners: {
					change: this.onTextareaChange,
					scope: this
				}
			}]
		});

		Zarafa.note.dialogs.NoteEditPanel.superclass.constructor.call(this,config);

		if (Ext.isString(this.linkedMailTemplate)) {
			this.linkedMailTemplate = new Ext.XTemplate(this.linkedMailTemplate, {
				compiled: true
			});
		}
	},

	/**
	 * Binds the click handler which opens the mail this note annotates.
	 * @private
	 */
	afterRender: function()
	{
		Zarafa.note.dialogs.NoteEditPanel.superclass.afterRender.apply(this, arguments);

		// Delegated from the panel rather than the bar, whose element does not exist
		// yet at this point.
		this.mon(this.el, 'click', this.onLinkedMailClick, this, {
			delegate: '.stickynote_linkedmail_link'
		});
	},

	/**
	 * Fills in the linked-mail bar once it has an element to render into.
	 * @private
	 */
	onLinkedMailBarRender: function()
	{
		this.updateLinkedMailBar(this.record);
	},

	/**
	 * Opens the mail this note annotates.
	 * @private
	 */
	onLinkedMailClick: function()
	{
		if (this.record) {
			Zarafa.note.Actions.openLinkedMail(this.record);
		}
	},

	/**
	 * Shows which mail this note annotates, or hides the bar when it annotates none.
	 * The mail can only be opened from here if its entryid was recorded, which notes
	 * made before this feature existed do not have.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The note record
	 * @private
	 */
	updateLinkedMailBar: function(record)
	{
		var bar = this.linkedMailBar;

		if (!bar || !bar.rendered) {
			return;
		}

		if (!record || Ext.isEmpty(record.get('note_link_id'))) {
			bar.setVisible(false);
			return;
		}

		this.linkedMailTemplate.overwrite(bar.getEl(), record.data);
		// Only toggle our own class here; assigning className would drop the classes
		// Ext puts on the element, including the one that hides it.
		bar.getEl()[Zarafa.note.Actions.getLinkedMailRecord(record) ? 'removeClass' : 'addClass'](
			'stickynote_linkedmail_unopenable'
		);
		bar.setVisible(true);
		this.doLayout();
	},

	/**
	 * handler for change event of text area in note dialog
	 * @param {Object} textarea object
	 * @private
	 */
	onTextareaChange:function(textarea)
	{
		var body = textarea.getValue();
		this.record.beginEdit();
		this.record.set('body',body);
		this.record.generateSubject();
		this.record.endEdit();
	},

	/**
	 * this function returns css class in response to icon index
	 * to set background color of Note Dialog's text area
	 * @param{String/Number} String or Int icon index value
	 * @return css class name
	 * @private
	 */
	getTextAreaColor: function(iconIndex)
	{
		var textAreaCSSClass = "";

		switch(parseInt(iconIndex, 10))
		{
			case Zarafa.core.mapi.IconIndex['note_blue']:
				textAreaCSSClass = "stickynote_dialog_blue";
				break;
			case Zarafa.core.mapi.IconIndex['note_green']:
				textAreaCSSClass = "stickynote_dialog_green";
				break;
			case Zarafa.core.mapi.IconIndex['note_pink']:
				textAreaCSSClass = "stickynote_dialog_pink";
				break;
			case Zarafa.core.mapi.IconIndex['note_yellow']:
			/* falls through */
			default:
				textAreaCSSClass = "stickynote_dialog_yellow";
				break;
			case Zarafa.core.mapi.IconIndex['note_white']:
				textAreaCSSClass = "stickynote_dialog_white";
				break;
		}

		return textAreaCSSClass;
	},

	/**
	 * Function is used to update values of form fields when ever
	 * an updated {@link Zarafa.core.data.IPMRecord record} is received
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @private
	 */
	update: function(record, contentReset)
	{
		var textArea = this.noteText.getEditor();

		this.updateLinkedMailBar(record);

		if (record) {
			this.record = record;
			if (contentReset || record.isModifiedSinceLastUpdate('body')) {
				this.noteText.setValue(record.get('body') || '');
			}

			if (contentReset || record.isModifiedSinceLastUpdate('icon_index')) {
				textArea.removeClass(this.currentColorCss);
				var currentColor = this.getTextAreaColor(record.get('icon_index'));
				this.currentColorCss = currentColor;
				textArea.addClass(currentColor);
			}
		} else {
			this.noteText.setValue('');
			textArea.removeClass(this.currentColorCss);
		}
	},

	/**
	 * Function to update the record whenever form fields are modified
	 * @param {Zarafa.core.data.IPMRecord} the record to update
	 * @private
	 */
	updateRecord: function(record)
	{
		var body = this.noteText.getValue();
		this.record.beginEdit();
		this.record.set('body',body);
		this.record.generateSubject();
		this.record.endEdit();
	}
});

//Register note dialog edit panel xtype
Ext.reg('zarafa.noteeditpanel',Zarafa.note.dialogs.NoteEditPanel);
