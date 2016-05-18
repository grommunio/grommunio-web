Ext.namespace('Zarafa.common.ui.messagepanel');

/**
 * @class Zarafa.common.ui.messagepanel.MessageHeader
 * @extends Ext.Panel
 * @xtype zarafa.messageheader
 */
Zarafa.common.ui.messagepanel.MessageHeader = Ext.extend(Ext.Panel, {
	// Insertion points for this class
	/**
	 * @insert previewpanel.toolbar.detaillinks The insertion point to add a special
	 * panel with extra details inside the header of the previewpanel.
	 * @param {Zarafa.common.ui.messagepanel.MessageHeader} panel This panel
	 */

	/**
	 * @cfg {Ext.Template/String} headerTemplate The template or template string which
	 * must be applied to the {@link #header} when the {@link Zarafa.core.data.IPMRecord record}
	 * has been {@link #update updated}. The arguments of this template will be the
	 * {@link Zarafa.core.data.IPMRecord#data record.data} field.
	 */
	headerTemplate :
		'<div class="preview-header-titlebox">' +
			'<img src="' + Ext.BLANK_IMAGE_URL + '" class="preview-header-collapse preview-header-collapse-minus"/>' +
			'<tpl if="!Ext.isEmpty(values.subject)">' +
				'<span class="preview-title">{subject:htmlEncode}</span>' +
			'</tpl>' +
		'</div>',

	/**
	 * The element which is used to {@link #collapse} or {@link #expand} the panel.
	 * This is initialized during {@link #update} as the element definition comes from {@link #headerTemplate}.
	 * @property
	 * @type Ext.Element
	 */
	collapseElement : undefined,

	/**
	 * Used by {@link #onCollapseClick} to determine if a {@link #collapse} or {@link #expand} event is
	 * already busy animating. During this animation, no concurrent {@link #collapse} or {@link #expand}
	 * events are allowed on the element.
	 * @property
	 * @type Boolean
	 */
	sliding : false,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			xtype: 'zarafa.messageheader',
			autoScroll:true,
			anchor : '100%',
			cls : 'preview-header',
			border : false,
			autoHeight: true,
			collapsible : true,
			hideCollapseTool : true,
			header :  true,
			headerCfg : {
				cls : 'preview-header-title'
			},
			items: [{
				xtype : 'zarafa.extrainfolinks'
			},{
				xtype : 'zarafa.sentinfolinks'
			},{
				xtype : 'zarafa.recipientlinks',
				plugins : [ 'zarafa.recordcomponentupdaterplugin' ],
				fieldLabel    : pgettext('mail.previewpanel', 'To'),
				recipientType : Zarafa.core.mapi.RecipientType.MAPI_TO
			},{
				xtype : 'zarafa.recipientlinks',
				plugins : [ 'zarafa.recordcomponentupdaterplugin' ],
				fieldLabel    : pgettext('mail.previewpanel', 'Cc'),
				recipientType : Zarafa.core.mapi.RecipientType.MAPI_CC
			},{
				xtype : 'zarafa.recipientlinks',
				plugins : [ 'zarafa.recordcomponentupdaterplugin' ],
				fieldLabel    : pgettext('mail.previewpanel', 'Bcc'),
				recipientType : Zarafa.core.mapi.RecipientType.MAPI_BCC
			},{
				xtype : 'zarafa.attachmentlinks',
				plugins : [ 'zarafa.recordcomponentupdaterplugin' ],
				fieldLabel    : pgettext('mail.previewpanel', 'Attachments')
			},
			container.populateInsertionPoint('previewpanel.toolbar.detaillinks', this)
			]
		});

		Zarafa.common.ui.messagepanel.MessageHeader.superclass.constructor.call(this, config);

		this.on('collapse', this.onAfterSlide, this);
		this.on('expand', this.onAfterSlide, this);

		if (Ext.isString(this.headerTemplate)) {
			this.headerTemplate = new Ext.XTemplate(this.headerTemplate, {
				compiled: true
			});
		}
	},

	/**
	 * Called when the container is being rendered.
	 * @private
	 */
	onRender : function()
	{
		Zarafa.common.ui.messagepanel.MessageHeader.superclass.onRender.apply(this, arguments);

		// The superclass unconditionally called this.header.unselectable(), as we want to
		// allow users to select the subject, we must make it selectable here again.
		if (this.header) {
			this.header.selectable();
		}
	},

	/**
	 * Update the {@link Zarafa.common.ui.messagepanel.RecipientLinks header} with the data
	 * from the {@link Zarafa.core.data.IPMRecord record}. Updates the panel
	 * by loading data from the record data into the template.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record to update the header panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function(record, contentReset)
	{
		if (Ext.isDefined(this.header)) {
			// If this is the initial load, then we must ensure that the panel is expanded.
			if (contentReset === true && this.collapseElement && (this.collapsed === true || this.sliding === true)) {
				// When we are currently sliding, we cannot call the expand function now,
				// so we defer the update function until a few milliseconds later.
				// Note that if the number of milliseconds is not enough, we will end
				// up here again and defer the action again.
				if (this.sliding === true) {
					this.update.defer(10, this, [record, contentReset]);
					return;
				}

				this.collapseElement.removeClass('preview-header-collapse-plus');
				this.expand(false);
				this.collapseElement.addClass('preview-header-collapse-minus');
			}

			// We are going to reset the innerHTML, so make sure to unregister any
			// events have have hooked to it.
			if (this.collapseElement) {
				this.mun(this.collapseElement, 'click', this.onCollapseClick, this);
			}

			if (Ext.isDefined(record)) {
				this.headerTemplate.overwrite(this.header.dom, record.data);

				this.collapseElement = this.header.child('.preview-header-collapse');
				if (this.collapseElement) {
					this.mon(this.collapseElement, 'click', this.onCollapseClick, this);
				}
			} else {
				this.header.dom.innerHTML = '';
			}
		}
	},

	/**
	 * Event handler which is fired when the {@link #collapseElement} has been clicked.
	 * This will toggle the CSS class for the event, and call {@link #toggleCollapse}
	 * to either {@link #collapse} or {@link #expand} the panel.
	 * @param {Ext.Event} event The event object
	 * @private
	 */
	onCollapseClick : function(event)
	{
		// Make sure the event was triggered for the collapseEvent which we want
		// to listen to. Should always be true, but better be safe...
		if (this.collapseElement && event.target.id == this.collapseElement.id && this.sliding === false) {
			// We're going to animate, block all concurrent animations.
			this.sliding = true;

			if (this.collapseElement.hasClass('preview-header-collapse-minus')) {
				this.collapseElement.removeClass('preview-header-collapse-minus');
				this.collapse();
				this.collapseElement.addClass('preview-header-collapse-plus');
			} else {
				this.collapseElement.removeClass('preview-header-collapse-plus');
				this.expand();
				this.collapseElement.addClass('preview-header-collapse-minus');
			}
		}
	},

	/**
	 * Event handler which is fired when the {@link #collapse} or {@link #expand} events have
	 * been fired which indicate that the sliding behavior has completed. This will reset the
	 * {@link #sliding} boolean to allow for new animations to be fired.
	 * @private
	 */
	onAfterSlide : function()
	{
		this.sliding = false;
	}
});

Ext.reg('zarafa.messageheader', Zarafa.common.ui.messagepanel.MessageHeader);
