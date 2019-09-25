Ext.namespace('Zarafa.calendar.dialogs');

/**
 * @class Zarafa.calendar.dialogs.AppointmentPanel
 * @extends Ext.Panel
 * @xtype zarafa.appointmentpanel
 * 
 * Panel that is used to create Appointments and Meeting Requests.
 */
Zarafa.calendar.dialogs.AppointmentPanel = Ext.extend(Ext.Panel, {
	// Insertion points for this class
	/**
	 * @insert context.calendar.appointmentcontentpanel.tabs
	 * can be used to add extra tabs to appointmentcontentpanel by 3rd party plugins
	 * @param {Zarafa.calendar.dialogs.AppointmentPanel} panel This appointmentpanel
	 */

	/**
	 * @cfg {Number} activeTab, the tab which should be active in {Zarafa.calendar.dialogs.AppointmentPanel tabs}
	 * 0 opens Appointment tab{@link Zarafa.calendar.dialogs.AppointmentTab}, this is defaultValue, we also want this tab when we accept any proposed time from attendee,
	 * 1 opens Freebusy tab{@link Zarafa.calendar.dialogs.FreebusyTab}, we want this tab to be opened when we view all propsed time from Attendees
	 * 2 opens Tracking tab{@link Zarafa.calendar.dialogs.TrackingTab}
	 */
	activeTab : undefined,

	/**
	 * True by default to display the information while switching between tab.
	 * This notification/message should be shown only once,
	 * but if there are any update/change in data it will be reset.
	 * @property
	 * @type Boolean
	 */
	enableNotifier : true,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};
		
		if (Ext.isDefined(config.activeTab)) {
			this.activeTab = config.activeTab;	
		}

		config = Ext.applyIf(config, {
			xtype: 'zarafa.appointmentpanel',
			border: false,
			layout: 'fit',
			items: this.createTabPanel(this.activeTab)
		});

		Zarafa.calendar.dialogs.AppointmentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize {@link Ext.TabPanel tabpanel) that will contain all the fields and forms
	 * @return {Object} Configuration object for the form panel
	 * @private
	 */
	createTabPanel : function(activeTab)
	{
		return [{
			xtype : 'tabpanel',
			ref : 'tabPanel',
			activeTab : activeTab || 0,
			border : false,
			layoutOnTabChange : true,
			plugins : [ 'zarafa.recordcomponentupdaterplugin' ],
			update : this.onTabPanelUpdate.createDelegate(this),
			listeners : {
				render : this.onTabPanelRender,
				tabchange : this.onTabPanelChange,
				scope : this
			},
			items : [{
				xtype: 'zarafa.appointmenttab',
				title: _('Appointment'),
				ref : '../appointmentTab'
			},{
				xtype: 'zarafa.freebusytab',
				title: _('Scheduling'),
				ref : '../schedulingTab'
			},{
				xtype: 'zarafa.trackingtab',
				title: _('Tracking'),
				ref: '../trackingTab'
			},
			// Add insertion point
			container.populateInsertionPoint('context.calendar.appointmentcontentpanel.tabs', this)
			]
		}];
	},

	/**
	 * Update the TabPanel with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	onTabPanelUpdate : function(record, contentReset)
	{
		// When the 'meeting' flag has been changed, and it is no longer a meeting request,
		// then force the user to the appointmentTab.
		if (!contentReset && record.isModifiedSinceLastUpdate('meeting') && record.get('meeting') == Zarafa.core.mapi.MeetingStatus.NONMEETING) {
			if (this.tabPanel.activeTab == this.schedulingTab || this.tabPanel.activeTab == this.trackingTab) {
				this.tabPanel.setActiveTab(this.appointmentTab);
			}
		}
		// Tracking tab should only be shown when meeting request is already sent
		if (record.isMeetingSent()) {
			this.tabPanel.unhideTabStripItem(this.trackingTab);
		}
	},

	/**
	 * Event handler which is fired when the TabPanel is being rendered, this will
	 * disable the TrackingTab by default (until it needs to be shown).
	 * @param {Ext.TabPanel} tabpanel The tabpanel which has been rendered
	 * @private
	 */
	onTabPanelRender : function(tabpanel)
	{
		this.tabPanel.hideTabStripItem(this.trackingTab);
	},
	
	/**
	 * Event handler which is fired when the TabPanel is being changed, this will
	 * display/notify useful information to the user while switching between the tab
	 * @param {Ext.TabPanel} tabPanel The tabPanel which has been rendered
	 * @param {Ext.FormPanel} activeTab The new active tab
	 * @private
	 */
	onTabPanelChange : function(tabPanel, activeTab)
	{
		if(activeTab && activeTab.record){	
			var recipientStore = activeTab.record.getRecipientStore();
			if(recipientStore && recipientStore.getCount() > 0){
				this.mon(recipientStore, 'update', this.onRecipientsChange, this);
				this.mon(recipientStore, 'add', this.onRecipientsChange, this);
				this.mon(recipientStore, 'remove', this.onRecipientsChange, this);
				this.mon(recipientStore, 'datachanged', this.onRecipientsChange, this);

				if (this.enableNotifier){
					var unresolved = recipientStore.getUnresolvedRecipients();
					var invalid = recipientStore.getInvalidRecipients();
					
					// If there are unresolved recipients, then it should shown an information message to user
					if (!Ext.isEmpty(invalid) || !Ext.isEmpty(unresolved)){
						container.getNotifier().notify('info.unresolved_recipients', '', pgettext('calendar.dialog', 'Not all attendees could be resolved.'), {
							container : this.getEl(),
							persistent : true
						});
						this.enableNotifier = false;
					}
				}
			}
		}
	},

	/**
	 * Event handler which is fired when data in {@link Zarafa.core.data.IPMRecipientStore} has changed. 
	 * This will reset the flag {@link Zarafa.calendar.dialogs.AppointmentPanel enableNotifier}
	 * @private
	 */
	onRecipientsChange : function()
	{
		this.enableNotifier = true;
	}
});

Ext.reg('zarafa.appointmentpanel', Zarafa.calendar.dialogs.AppointmentPanel);
