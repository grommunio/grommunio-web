Ext.namespace('Zarafa.common.ui.messagepanel');

/**
 * @class Zarafa.common.ui.messagepanel.SentInfoLinks
 * @extends Ext.Container
 * @xtype zarafa.sentinfolinks
 */
Zarafa.common.ui.messagepanel.SentInfoLinks = Ext.extend(Ext.Container, {
	/**
	 * @cfg {String} senderCls is the CSS class which should be applied to sender Template
	 */
	senderCls : 'preview-header-senderbox',

	/**
	 * @cfg {Number} maximum length of text allowed before truncations,
	 * truncation will be replaced with ellipsis ('...').
	 */
	ellipsisStringStartLength : 30,

	/**
	 * @cfg {Number} maximum length of text allowed after truncations,
	 * truncation will be replaced with ellipsis ('...').
	 */
	ellipsisStringEndLength : 30,
	/**
	 * @cfg {Zarafa.core.data.IPMRecord} record Holds the current record
	 */
	record: undefined,
	/**
	 * @cfg {Ext.Template/String} senderTemplate The template or template string which
	 * must be applied to the {@link #header} to build sender info when the
	 * {@link Zarafa.core.data.IPMRecord record} has been {@link #update updated}.
	 * The arguments of this template will be the {@link Zarafa.core.data.IPMRecord#data record.data} field.
	 */
	senderTemplate :
		'<tpl if="!Ext.isEmpty(values.sender_entryid) && !Ext.isEmpty(values.sent_representing_entryid) && !Zarafa.core.EntryId.compareABEntryIds(values.sent_representing_entryid, values.sender_entryid)">' +
			'<span class="preview-from">' +
				'<span class="zarafa-emailaddress-link zarafa-sentinfo-link"> ' +
					'<span class="zarafa-presence-status {[Zarafa.core.data.PresenceStatus.getCssClass(values.sender_presence_status)]}">'+
						'<span class="zarafa-presence-status-icon"></span>' +
						'{sender_name:htmlEncode} &lt;{sender_email_address:htmlEncode}&gt; '+
					'</span>' +
				'</span>' +
				/* # TRANSLATORS: check if the mail is send by some delegator or not. if then display "on behalf of". */
				'<span>&nbsp;' + pgettext('mail.previewpanel', 'on behalf of') + '&nbsp;</span>' +
				'<span class="zarafa-emailaddress-link zarafa-sentinfo-on-behalf">' +
					'<span class="zarafa-presence-status {[Zarafa.core.data.PresenceStatus.getCssClass(values.sent_representing_presence_status)]}">'+
						'<span class="zarafa-presence-status-icon"></span>' +
						'{sent_representing_name:htmlEncodeElide(this.ellipsisStringStartLength, this.ellipsisStringEndLength)}&nbsp;' +
						'<tpl if="!Ext.isEmpty(values.sent_representing_email_address)">' +
							'&lt;{sent_representing_email_address:htmlEncode}&gt;'+
						'</tpl>' +
					'</span>' +
				'</span>' +
			'</span>' +
		'</tpl>' +
		'<tpl if="Ext.isEmpty(values.sender_entryid) || Ext.isEmpty(values.sent_representing_entryid) || Zarafa.core.EntryId.compareABEntryIds(values.sent_representing_entryid, values.sender_entryid)">' +
				'<span class="preview-from zarafa-presence-status {[Zarafa.core.data.PresenceStatus.getCssClass(values.sender_presence_status)]}">' +
				'<span class="zarafa-presence-status-icon"></span>' +
				'<span class="zarafa-emailaddress-link zarafa-sentinfo-link">' +
					'{sender_name:htmlEncodeElide(this.ellipsisStringStartLength, this.ellipsisStringEndLength)}&nbsp;' +
					'<tpl if="!Ext.isEmpty(values.sender_email_address)">' +
						'&lt;{sender_email_address:htmlEncode}&gt;'+
					'</tpl>' +
				'</span>' +
			'</span>' +
		'</tpl>' +
		/* don't display Sent field if item is a meeting/task/contact etc. */
		'<tpl if="!this.isMeeting(values.message_class)">' +
			'<span class="preview-timestamp">' +
		'</tpl>'+
		'<tpl if="this.isMeeting(values.message_class)">' +
			'<span class="preview-timestamp preview-meetingrequest">' +
		'</tpl>'+
		'<tpl>'+
			/* # TRANSLATORS: This message is used as label for the field which indicates the date/time on which the given message was sent. */
			'<span class="preview-timestamp-title">' + pgettext('mail.previewpanel', 'Sent') + ':</span>' +
				'<tpl if="Ext.isDate(values.message_delivery_time)">' +
					// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
					'{message_delivery_time:date(_("l jS F Y G:i"))}' +
				'</tpl>' +
				'<tpl if="!Ext.isDate(values.message_delivery_time)">' +
					/* # TRANSLATORS: This message is used to indicate that no sent date is available for the message (because it has not been sent yet). */
					pgettext('mail.previewpanel', 'None') +
				'</tpl>' +
			'</span>'+
		'</tpl>',

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config,{
			xtype: 'zarafa.sentinfolinks',
			border : false,
			autoScroll:true,
			anchor : '100%',
			cls : 'preview-header-sentinfo'
		});

		Zarafa.common.ui.messagepanel.SentInfoLinks.superclass.constructor.call(this, config);

		if (Ext.isString(this.senderTemplate)) {
			this.senderTemplate = new Ext.XTemplate(this.senderTemplate, {
				compiled: true,
				ellipsisStringStartLength : this.ellipsisStringStartLength,
				ellipsisStringEndLength : this.ellipsisStringEndLength,
				/*
				 * Template member Function
				 * This function will check if the passed data in the template is a meeting/scheduled items or not
				 * @private
				 */
				isMeeting: function(messageClass) {
					return (Zarafa.core.MessageClass.isClass(messageClass, 'ipm.schedule.meeting', true));
				}
			});
		}
	},

	/**
	 * Render the template and set the references to HTML Elements.
	 * @protected
	 */
	onRender: function()
	{
		Zarafa.common.ui.messagepanel.SentInfoLinks.superclass.onRender.apply(this, arguments);

		// Setup the HTML structure for the whole recipientLink and get references to the different elements in it
		this.senderElem  = Ext.DomHelper.append(this.el.dom,{tag:'div', cls:this.senderCls});
	},

	/**
	 * Update the {@link Zarafa.common.ui.messagepanel.SentInfo header} with the data
	 * from the {@link Zarafa.core.data.IPMRecord record}. Updates the panel
	 * by loading data from the record data into the template.
	 * Attach mouse handlers on the anchors
	 * @param {Zarafa.core.data.IPMRecord} record to update the header panel with
	 */
	update: function(record)
	{
		if (this.senderElem){
			var senderElem = Ext.get(this.senderElem);

			if (!Ext.isDefined(record)) {
				//remove event handlers before template is emptied
				this.mun(senderElem.select('.zarafa-sentinfo-link'), 'contextmenu', this.onSenderRightClick, this);
				this.mun(senderElem.select('.zarafa-sentinfo-on-behalf'), 'contextmenu', this.onSenderRightClick, this);
				this.mun(senderElem.select('.zarafa-sentinfo-link'), 'mouseenter', this.onMouseEnter, this);
				this.mun(senderElem.select('.zarafa-sentinfo-on-behalf'), 'mouseenter', this.onMouseEnter, this);
				this.mun(senderElem.select('.zarafa-sentinfo-link'), 'mouseleave', this.onMouseLeave, this);
				this.mun(senderElem.select('.zarafa-sentinfo-on-behalf'), 'mouseleave', this.onMouseLeave, this);
				this.mun(senderElem.select('.zarafa-sentinfo-link'), 'dblclick', this.onDoubleClick, this);
				this.mun(senderElem.select('.zarafa-sentinfo-on-behalf'), 'dblclick', this.onDoubleClick, this);
				this.senderElem.innerHTML = '';
			} else {
				var user;
				if (Ext.isFunction(record.getSender)) {
					user = Zarafa.core.data.UserIdObjectFactory.createFromRecord(record.getSender());
					record.data.sender_presence_status = Zarafa.core.PresenceManager.getPresenceStatusForUser(user);
				}

				if (Ext.isFunction(record.getSentRepresenting)) {
					user = Zarafa.core.data.UserIdObjectFactory.createFromRecord(record.getSentRepresenting());
					record.data.sent_representing_presence_status = Zarafa.core.PresenceManager.getPresenceStatusForUser(user);
				}

				this.senderTemplate.overwrite(senderElem, record.data);
				//bind click events after template has been populated
				this.mon(senderElem.select('.zarafa-sentinfo-link'), 'contextmenu', this.onSenderRightClick, this);
				this.mon(senderElem.select('.zarafa-sentinfo-on-behalf'), 'contextmenu', this.onSenderRightClick, this);
				this.mon(senderElem.select('.zarafa-sentinfo-link'), 'mouseenter', this.onMouseEnter, this);
				this.mon(senderElem.select('.zarafa-sentinfo-on-behalf'), 'mouseenter', this.onMouseEnter, this);
				this.mon(senderElem.select('.zarafa-sentinfo-link'), 'mouseleave', this.onMouseLeave, this);
				this.mon(senderElem.select('.zarafa-sentinfo-on-behalf'), 'mouseleave', this.onMouseLeave, this);
				this.mon(senderElem.select('.zarafa-sentinfo-link'), 'dblclick', this.onDoubleClick, this);
				this.mon(senderElem.select('.zarafa-sentinfo-on-behalf'), 'dblclick', this.onDoubleClick, this);
			}
		}
		this.record = record;
	},

	/**
	 * Called when user right-clicks on an link in {@link Zarafa.common.ui.messagepanel.SentInfoLinks}
	 * It will show {@link Zarafa.common.recipientfield.ui.RecipientHoverCardView}
	 * @param {Ext.EventObject} evt The mouse event
	 * @param {HTMLElement} elem The target node
	 * @param {Object} obj The options configuration passed to the {@link Ext.Element#addListener} call
	 * @private
	 */
	onSenderRightClick: function (evt, elem, obj)
	{
		var recipient = this.convertSenderToRecord(elem);
		var senderElem = Ext.get(this.senderElem);
		Zarafa.core.data.UIFactory.openHoverCard(recipient, {
			position: evt.getXY(),
			recipientView : senderElem
		});
	},

	/**
	 * Called when user double-clicks on a link in {@link Zarafa.common.ui.messagepanel.SentInfoLinks}
	 * invokes {@link Zarafa.common.Actions#openViewRecipientContentPanel} with the selected {@link Zarafa.core.data.IPMRecord}
	 * @param {Ext.EventObject} evt The mouse event object
	 * @param {HTMLElement} elem The target node
	 * @param {Object} obj The options configuration passed to the {@link Ext.Element#addListener} call
 	 * @private
	 */
	onDoubleClick : function(evt, elem, obj)
	{
		var recipient = this.convertSenderToRecord(elem);
		Zarafa.common.Actions.openViewRecipientContent(recipient);
	},

	/**
	 * Converts the sender to a record
	 * Checks which {@link HTMLElement} was clicked - 'sent by' or 'sent on behalf of'
	 * Depending on this check either {@link Zarafa.core.data.MessageRecord#getSender} or {@link Zarafa.core.data.MessageRecord#getSenderRepresenting} is invoked on the current {@link Zarafa.core.data.MessageRecord}.
	 * @return {Zarafa.core.data.IPMRecipientRecord} or undefined
	 */
	convertSenderToRecord : function(elem)
	{
		var sender;

		//depending on whether the user clicked on sender or 'on behalf of', choose appropriate fields
		if(Ext.get(elem).hasClass('zarafa-sentinfo-link')) {
			sender = this.record.getSender();
		} else if(Ext.get(elem).hasClass('zarafa-sentinfo-on-behalf')) {
			sender = this.record.getSentRepresenting();
		}
		return sender;
	},

	/**
	 * Event handler which handel mouse enter event.
	 * It will show {@link Zarafa.common.recipientfield.ui.RecipientHoverCardView}
	 * after 700 ms.
	 * @param {Ext.EventObject} e The mouse event
	 * @param {HTMLElement} node The target node
	 */
	onMouseEnter: function (e, node)
	{
		this.timer = setTimeout(function (scope) {
			var recipient = scope.convertSenderToRecord(node);
			var senderElem = Ext.get(scope.senderElem);
			Zarafa.core.data.UIFactory.openHoverCard(recipient, {
				position: e.getXY(),
				recipientView : senderElem
			});
		}, 700, this);
	},

	/**
	 * Event handler which is triggered when
	 * mouse leaves the sender links. it will
	 * just clear the timeout.
	 */
	onMouseLeave : function ()
	{
		clearTimeout(this.timer);
	}
});

Ext.reg('zarafa.sentinfolinks', Zarafa.common.ui.messagepanel.SentInfoLinks);
