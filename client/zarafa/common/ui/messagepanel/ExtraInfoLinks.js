Ext.namespace('Zarafa.common.ui.messagepanel');

/**
 * @class Zarafa.common.ui.messagepanel.ExtraInfoLinks
 * @extends Ext.Container
 * @xtype zarafa.extrainfolinks
 */
Zarafa.common.ui.messagepanel.ExtraInfoLinks = Ext.extend(Ext.Container, {
	/**
	 * The record which has been loaded by this container. This record
	 * is provided through the {@link #update} function.
	 *
	 * @property
	 * @type Zarafa.core.data.IPMRecord
	 */
	record : undefined,

	/**
	 * @cfg {String} importantInfoString string which must be displayed in the {@link #header}
	 * if there is any priority set in {@link Zarafa.core.data.IPMRecord record}
	 */
	// # TRANSLATORS: This sentence is given in the Email previewpanel, and indicates with which
	// # importance the message was sent. For example:
	// # 'This message was sent with high importance.'
	// # 'This message was sent with low importance.'
	importantInfoString : pgettext('mail.previewpanel', 'This message was sent with {0} importance.'),

	/**
	 * @cfg {String} sensitivityInfoString string which must be displayed in the {@link #header}
	 * if there is any sensitivity set in {@link Zarafa.core.data.IPMRecord record}
	 */
	// # TRANSLATORS: This sentence is given in the Email previewpanel, and indicates which
	// # sensitivity level applies to the message. For example:
	// # 'Please treat this as Personal.'
	// # 'Please treat this as Private.'
	// # 'Please treat this as Confidential.'
	sensitivityInfoString : pgettext('mail.previewpanel', 'Please treat this as {0}.'),

	/**
	 * @cfg {String} blockStatusInfoString string which must be displayed in the {@link #header} 
	 * if there is any external content blocked in the {@link Zarafa.core.data.IPMRecord record} body.
	 */
	blockStatusInfoString : pgettext('mail.previewpanel', 'Click here to download pictures. To help protect your privacy, WebApp prevented automatic download of some pictures in this message.'),

	/**
	 * @cfg {String} faultyMessageInfoString string which will be displayed in the {@link #header}
	 * if the current {@link Zarafa.core.data.IPMRecord record} is faulty and we will not be able to
	 * perform operations on this record.
	 */
	faultyMessageInfoString : pgettext('mail.previewpanel', 'This message is corrupt and will not be displayed correctly, Click here to fix it.'),

	/**
	 * @cfg {String} acceptInfoString string which must be displayed in the {@link #header}
	 * if user has accepted the meeting request.
	 */
	acceptInfoString : pgettext('mail.previewpanel', '{0} has accepted.'),

	/**
	 * @cfg {String} acceptDelegateInfoString string which must be displayed in the {@link #header}
	 * if delegate has accepted the meeting request on behalf of delegator.
	 */
	acceptDelegateInfoString : pgettext('mail.previewpanel', '{0} has accepted on behalf of {1}.'),

	/**
	 * @cfg {String} tentativeInfoString string which must be displayed in the {@link #header}
	 * if user has tentatively accepted the meeting request.
	 */
	tentativeInfoString : pgettext('mail.previewpanel', '{0} has tentatively accepted.'),

	/**
	 * @cfg {String} tentativeDelegateInfoString string which must be displayed in the {@link #header}
	 * if delegate has tentatively accepted the meeting request on behalf of delegator.
	 */
	tentativeDelegateInfoString : pgettext('mail.previewpanel', '{0} has tentatively accepted on behalf of {1}.'),

	/**
	 * @cfg {String} tentativeInfoString string which must be displayed in the {@link #header}
	 * if user has declined the meeting request.
	 */
	declineInfoString : pgettext('mail.previewpanel', '{0} has declined.'),

	/**
	 * @cfg {String} declineDelegateInfoString string which must be displayed in the {@link #header}
	 * if delegate has declined the meeting request on behalf of delegator.
	 */
	declineDelegateInfoString : pgettext('mail.previewpanel', '{0} has declined on behalf of {1}.'),

	/**
	 * @cfg {String} counterProposalAcceptedString string which must be displayed in the {@link #header}
	 * if any attendee has tentatively accepted the meeting and proposed a new time for the meeting.
	 */
	counterProposalTentativeAcceptedString : pgettext('mail.previewpanel', '{0} tentatively accepted and proposed a new time for this meeting.'),

	/**
	 * @cfg {String} counterProposalTentativeAcceptedDelegateString string which must be displayed in the {@link #header}
	 * if any delegate has tentatively accepted the meeting and proposed a new time for the meeting on behalf of delegator.
	 */
	counterProposalTentativeAcceptedDelegateString : pgettext('mail.previewpanel', '{0} tentatively accepted on behalf of {1} and proposed a new time for this meeting.'),

	/**
	 * @cfg {String} counterProposalDeclinedString string which must be displayed in the {@link #header}
	 * if any attendee has declined the meeting and proposed a new time for the meeting.
	 */
	counterProposalDeclinedString : pgettext('mail.previewpanel', '{0} declined and proposed a new time for this meeting.'),

	/**
	 * @cfg {String} counterProposalDeclinedDelegateString string which must be displayed in the {@link #header}
	 * if any delegate has declined the meeting and proposed a new time for the meeting on behalf of delegator.
	 */
	counterProposalDeclinedDelegateString : pgettext('mail.previewpanel', '{0} declined on behalf of {1} and proposed a new time for this meeting.'),

	/**
	 * @cfg {String} meetingNotFoundInfoString string which must be displayed in the {@link #header}
	 * if there is any change in meeting time set in {@link Zarafa.core.data.IPMRecord record}
	 */
	meetingNotFoundInfoString: pgettext('mail.previewpanel', 'This meeting is not in the Calendar; it may have been moved or deleted.'),

	/**
	 * @cfg {String} meetingOutDatedInfoString string which must be displayed in the {@link #header}
	 * if meeting has occured in the past or expired {@link Zarafa.core.data.IPMRecord record}
	 */
	meetingOutDatedInfoString: pgettext('mail.previewpanel', 'This meeting request was updated after this message was sent. You should open the latest update or open the item from the calendar.'),

	/**
	 * @cfg {String} organizerAsAttendeeInfoString string which must be displayed in the {@link #header}
	 * if change in meeting request is been received by the organizer himself in {@link Zarafa.core.data.IPMRecord record}
	 */
	organizerAsAttendeeInfoString : pgettext('mail.previewpanel', 'As the meeting organizer, you do not need to respond to the meeting'),

	/**
	 * @cfg {String} meetingUpdatedInfoString string which must be displayed in the {@link #header}
	 * if proposed time for meeting request has been accepted by the organizer himself in {@link Zarafa.core.data.IPMRecord record}
	 */
	meetingUpdatedInfoString : pgettext('mail.previewpanel','The meeting was updated after the attendee sent this response'),

	/**
	 * @cfg {String} elapsedTimeInfoString string which must be displayed in the dialog
	 * if meeting time set in {@link Zarafa.core.data.IPMRecord record} is already elapsed.
	 */
	elapsedTimeInfoString : pgettext('mail.previewpanel', 'This appointment occurs in the past.'),

	/**
	 * @cfg {String} responseRequiredString string which must be displayed in the dialog
	 * if meeting accepted time set in {@link Zarafa.core.data.IPMRecord record} is empty.
	 * which means that, meeting request is not responded yet
	 */
	responseRequiredString : pgettext('mail.previewpanel', 'Please respond.'),

	/**
	 * @cfg {String} meetingUpdatedString string which must be displayed in the dialog if the
	 * {@link Zarafa.core.data.IPMRecord record} is an update of a previously sent meeting request.
	 */
	meetingUpdatedString : pgettext('mail.previewpanel', 'This is an update of a previously sent meeting request.'),

	/**
	 * @cfg {String} delegatorInfoString string which must be displayed in the dialog if the
	 * {@link Zarafa.core.data.IPMRecord record} is received as a delegate.
	 */
	delegatorInfoString : pgettext('mail.previewpanel', 'Received for {0}.'),

	/**
	 * @cfg {String} repliedString string which must be displayed in the dialog if the
	 * {@link Zarafa.core.data.IPMRecord record} last_verb_executed property is 102 or 103. Which
	 * means that the user has replied on the email.
	 */
	repliedString : pgettext('mail.previewpanel', 'You replied to this message.'),

	/**
	 * @cfg {String} forwardString string which must be displayed in the dialog if the
	 * {@link Zarafa.core.data.IPMRecord record} last_verb_executed property is 104. Which
	 * means that the user has forwarded this email.
	 */
	forwardString : pgettext('mail.previewpanel', 'You forwarded this message.'),

	/**
	 * @cfg {String} repliedStringTime string which must be displayed in the dialog if the
	 * {@link Zarafa.core.data.IPMRecord record} last_verb_executed property is 102 or 103. Which
	 * means that the user has replied on the email. Including the timestamp.
	 */
	repliedStringTime : pgettext('mail.previewpanel', 'You replied to this message on {0}.'),

	/**
	 * @cfg {String} forwardStringTime string which must be displayed in the dialog if the
	 * {@link Zarafa.core.data.IPMRecord record} last_verb_executed property is 104. Which
	 * means that the user has forwarded this email. Including the timestamp.
	 */
	forwardStringTime : pgettext('mail.previewpanel', 'You forwarded this message on {0}.'),

	/**
	 * @cfg {String} receivedTaskRequest string which must be displayed in the dialog if the
	 * {@link Zarafa.core.data.IPMRecord record} taskhistory property is {@link Zarafa.core.mapi.TaskHistory#ASSIGNED}
	 * and {@link Zarafa.task.TaskRecord#isTaskReceived task is received}. Which
	 * means that user has received task request from assigner.
	 */
	receivedTaskRequest : _('Assigned by {0} on {1}.'),

	/**
	 * @cfg {String} sentTaskRequest string which must be displayed in the dialog if the
	 * {@link Zarafa.core.data.IPMRecord record} taskhistory property is {@link Zarafa.core.mapi.TaskHistory#ASSIGNED}
	 * and {@link Zarafa.task.TaskRecord#isTaskReceived task is not received}. Which
	 * means that user has assigned task to assignee.
	 */
	sentTaskRequest : _('Waiting for response from recipient'),

	/**
	 * @cfg {String} acceptedTaskRequest string which must be displayed in the dialog if the
	 * {@link Zarafa.core.data.IPMRecord record} taskhistory property is {@link Zarafa.core.mapi.TaskHistory#ACCEPTED}
	 * Which means that task is accepted by assignee.
	 */
	acceptedTaskRequest : _('Accepted by {0} on {1}.'),

	/**
	 * @cfg {String} acceptDelegateTaskRequestInfoString string which must be displayed in the {@link #header}
	 * if delegate has accepted the task request on behalf of delegator.
	 */
	acceptDelegateTaskRequestInfoString : _('{0} has accepted on behalf of {1} {2}.'),

	/**
	 * @cfg {String} declineTaskRequest string which must be displayed in the
	 * dialog if the {@link Zarafa.core.data.IPMRecord record} taskhistory property is
	 * {@link Zarafa.core.mapi.TaskHistory#DECLINED}, and taskstate property is not
	 * {@link Zarafa.core.mapi.TaskState#ACCEPT}. Which means task is assigner received decline
	 * task request response from assignee.
	 */
	declineAssignerTaskRequest : _('Declined by {0} on {1}.'),

	/**
	 * @cfg {String} acceptDelegateTaskRequestInfoString string which must be displayed in the {@link #header}
	 * if delegate has declined the task request on behalf of delegator.
	 */
	declineDelegateTaskRequestInfoString : _('{0} has declined on behalf of {1} {2}.'),

	/**
	 * @cfg {String} declineTaskRequest string which must be displayed in the
	 * dialog if the {@link Zarafa.core.data.IPMRecord record} taskhistory property is
	 * {@link Zarafa.core.mapi.TaskHistory#UPDATED}, and
	 * {@link Zarafa.task.TaskRecord#isTaskRequest record} is not task request record.
	 * Which means task is assigner received update task request response from assignee.
	 */
	updateTaskRequest : _('Last update sent on {0}.'),

	/**
	 * @cfg {String} acceptDelegateTaskRequestInfoString string which must be displayed in the {@link #header}
	 * if delegate has updated the task request on behalf of delegator.
	 */
	updateDelegateTaskRequestInfoString : _('{0} has updated on behalf of {1} {2}.'),

	/**
	 * @cfg {String} itemCls css class that will be added to every item of this component.
	 */
	itemCls : 'preview-header-extrainfobox-item',

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		config =  Ext.applyIf(config, {
			xtype: 'zarafa.extrainfolinks',
			cls: 'preview-header-extrainfobox'
		});

		Zarafa.common.ui.messagepanel.ExtraInfoLinks.superclass.constructor.call(this, config);
	},

	/**
	 * Set sensitivity, important/priority information from {@link Zarafa.core.data.IPMRecord record}.
	 * it will also handle showing/hiding of {@link Zarafa.common.ui.messagepanel.ExtraInfoLinks ExtraInfoLinks}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record to update the {@link Zarafa.common.ui.messagepanel.ExtraInfoLinks ExtraInfoLinks} with
	 */
	update : function(record)
	{
		// clear the previous contents
		var el = this.getEl();
		if(Ext.isDefined(el.dom)) {
			el.dom.innerHTML = '';
		}

		if(!Ext.isDefined(record)) {
			this.setVisible(false);
			return;
		}

		this.record = record;
		var isVisible = false;
		var sensitivity = record.get('sensitivity');
		var importance = record.get('importance');
		var lastVerbExecuted = record.get('last_verb_executed');
		var lastVerbExecutionTime = record.get('last_verb_execution_time');

		// 104 is set in createmailitemmodule::setReplyForwardInfo when a message is forwarded.
		if(lastVerbExecuted === 104) {
			var text = lastVerbExecutionTime ? String.format(this.forwardStringTime, lastVerbExecutionTime.format('j-m-Y H:i')) :
				this.forwardString;
			el.createChild({tag: 'div', html: text, cls: this.itemCls});

			isVisible = true;
		} else if(lastVerbExecuted === 102 || lastVerbExecuted == 103) { // 102/103 is set when the message is a reply.
			var text = lastVerbExecutionTime ? String.format(this.repliedStringTime, lastVerbExecutionTime.format('j-m-Y H:i')) :
				this.repliedString;
			el.createChild({tag: 'div', html: text, cls: this.itemCls});

			isVisible = true;
		}

		if(Ext.isDefined(sensitivity) && sensitivity != Zarafa.core.mapi.Sensitivity.NONE && this.isShowExtraInfo()){
			var text = String.format(this.sensitivityInfoString, Zarafa.core.mapi.Sensitivity.getDisplayName(sensitivity));
			el.createChild({tag: 'div', html: text, cls: this.itemCls});
			isVisible = true;
		}

		if(Ext.isDefined(importance) && importance != Zarafa.core.mapi.Importance.NORMAL && this.isShowExtraInfo()){
			var text = String.format(this.importantInfoString, Zarafa.core.mapi.Importance.getDisplayName(importance));
			el.createChild({tag: 'div', html: text, cls: this.itemCls});
			isVisible = true;
		}

		if(record.isFaultyMessage()) {
			var faultyInfoElement = el.createChild({tag: 'div', html: this.faultyMessageInfoString, cls: this.itemCls});

			// add click event
			this.mon(faultyInfoElement, 'click', this.onExtraInfoFaultyClick, this);

			// add class to show that this element is clickable
			faultyInfoElement.addClassOnOver('preview-header-extrainfobox-item-over');

			isVisible = true;
		}

		if(this.record instanceof Zarafa.core.data.MessageRecord) {
			if(record.isExternalContentBlocked()) {
				var blockElement = el.createChild({tag: 'div', html: this.blockStatusInfoString, cls: this.itemCls});

				// add click event
				this.mon(blockElement, 'click', this.onExtraInfoBlockClick, this);

				// add class to show that this element is clickable
				blockElement.addClassOnOver('preview-header-extrainfobox-item-over');

				isVisible = true;
			}

			// extra info for meeting items
			if(this.record instanceof Zarafa.calendar.MeetingRequestRecord) {
				isVisible = (this.setMeetingInfo(el) === true ? true : isVisible);
			} else if(this.record instanceof Zarafa.task.TaskRecord) {
				isVisible = (this.setTaskRequestInfo(el) === true ? true : isVisible);
			}
		}

		this.setVisible(isVisible);
		// Only re-layout when the component is visible.
		if (isVisible) {
			// For the task general tab we must do a layout of the complete panel because
			// the extra info is updated after the other things are rendered.
			var parent = this.findParentByType('zarafa.taskgeneraltab');
			if ( parent ){
				parent.doLayout();
			} else {
				this.doLayout();
			}
		}
	},

	/**
	 * Function will be used to determine that {@link Zarafa.core.mapi.Sensitivity Sensitivity} or
	 * {@link Zarafa.core.mapi.Importance importance} related extra info link on header of the record.
	 *
	 * @return {boolean}
	 */
	isShowExtraInfo : function ()
	{
		if (this.record.isMessageClass('IPM.Task')) {
			// Only show the extra info link if record is task and user is task organizer/assigner
			// or task is received task and still not Accepted/Updated.
			return this.record.isTaskOrganized() || (this.record.isTaskReceived() && !this.record.isTaskAccepted() && !this.record.isTaskUpdated());
		} else {
			return true;
		}
	},

	/**
	 * Function will be used to display {@link Zarafa.common.ui.messagepanel.ExtraInfoContextMenu ExtraInfoContextMenu}
	 * for showing options for mails which has external content and its blocked because of security reasons.
	 * @param {Ext.EventObject} evtObject
	 * @private
	 */
	onExtraInfoBlockClick : function(evtObject)
	{
		Zarafa.core.data.UIFactory.openContextMenu(Zarafa.core.data.SharedComponentType['common.contextmenu.previewpanel.extrainfo'], this.record, { position : evtObject.getXY() });
	},

	/**
	 * Function will be used to display a warning to user that we are going to change some properties in the corrupted
	 * message and will save the changes on server.
	 * @param {Ext.EventObject} evtObject
	 * @private
	 */
	onExtraInfoFaultyClick : function(evtObject)
	{
		Ext.MessageBox.show({
			title : _('Kopano WebApp'),
			msg :_('We are going to try to fix a corrupted mail message, do you wish to continue?'),
			icon : Ext.MessageBox.WARNING,
			fn : this.onFixFaultyMessage,
			scope : this,
			buttons : Ext.MessageBox.YESNO
		});
	},

	/**
	 * Callback function from {@link Ext.MessageBox#show} which checks
	 * if the user want to try to fix faulty mail message.
	 * @param {String} button button text which was pressed.
	 * @private
	 */
	onFixFaultyMessage : function(button)
	{
		if (button == 'yes') {
			// if the record is loaded through show mail tab/dialog then
			// we will take a shortest route to fix message and close dialog
			// because its tricky to change record in the dialog/tab
			if(this.dialog) {
				this.dialog.closeOnSave = true;
			}

			this.record.fixFaultyMessage();
		}
	},

	/**
	 * Set task request information from {@link Zarafa.core.data.IPMRecord record} data.
	 *
	 * @param {Ext.Element/HTMLElement} el The target element which is being layed out
	 * @return {Boolean} true if function added any info to {@link Zarafa.common.ui.messagepanel.ExtraInfoLinks ExtraInfoLinks}
	 * and it should be made visible else false.
	 * @private
	 */
	setTaskRequestInfo : function (el)
	{
		var isVisible;
		var taskHistory = this.record.get('taskhistory');
		var infoMsg = '';
		var taskLastUser = this.record.get('tasklastuser');
		var delegateResponse  = false;
		// check if delegate has responded
		var delegateEntryid = this.record.get('sender_entryid');
		var delegatorEntryid = this.record.get('sent_representing_entryid');
		var assigneeName = '';
		// check if sender and sent representing entryids are different
		if(delegatorEntryid && !Zarafa.core.EntryId.compareABEntryIds(delegateEntryid, delegatorEntryid)) {
			delegateResponse  = true;
			// get assignee information
			assigneeName = this.record.get('sent_representing_name') || this.record.get('sent_representing_email_address');
		}
		switch (taskHistory) {
			case Zarafa.core.mapi.TaskHistory.ASSIGNED:
				if (this.record.isTaskReceived()) {
					infoMsg = String.format(this.receivedTaskRequest, this.record.get('tasklastuser'), this.record.get('task_assigned_time').format(_('d-m-Y g:i a')));
				} else {
					infoMsg = this.sentTaskRequest;
				}
				isVisible = true;
				break;
			case Zarafa.core.mapi.TaskHistory.ACCEPTED:
				if (delegateResponse ) {
					infoMsg = String.format(this.acceptDelegateTaskRequestInfoString, taskLastUser, assigneeName, this.record.get('task_assigned_time').format(_('d-m-Y g:i a')));
				} else {
					infoMsg = String.format(this.acceptedTaskRequest, taskLastUser, this.record.get('task_assigned_time').format(_('d-m-Y g:i a')));
				}
				isVisible = true;
				break;
			case Zarafa.core.mapi.TaskHistory.DECLINED:
				if (delegateResponse ) {
					infoMsg = String.format(this.declineDelegateTaskRequestInfoString, taskLastUser, assigneeName, this.record.get('task_assigned_time').format(_('d-m-Y g:i a')));
				} else {
					infoMsg = String.format(this.declineAssignerTaskRequest, taskLastUser, this.record.get('task_assigned_time').format(_('d-m-Y g:i a')));
				}
				isVisible = true;
				break;
			case Zarafa.core.mapi.TaskHistory.UPDATED:
				if (delegateResponse ) {
					infoMsg = String.format(this.updateDelegateTaskRequestInfoString, taskLastUser, assigneeName, this.record.get('task_assigned_time').format(_('d-m-Y g:i a')));
				} else {
					infoMsg = String.format(this.updateTaskRequest, this.record.get('task_assigned_time').format(_('d-m-Y g:i a')));
				}
				isVisible = true;
				break;
		}

		if (isVisible) {
			if (this.record.get('task_not_found')) {
				el.createChild({tag: 'div', html: _('The matching task was not found in your task list.'), cls: this.itemCls});
			}
			el.createChild({tag: 'div', html: infoMsg, cls: this.itemCls});
		}
		return isVisible;
	},

	/**
	 * Set meeting information from {@link Zarafa.core.data.IPMRecord record} data
	 * and if found will update the panel by loading data from the record data into the template
	 *
	 * @param {Ext.Element/HTMLElement} el The target element which is being layed out
	 * @return {Boolean} true if {@link Zarafa.core.data.IPMRecord IPMRecord} contains any meeting info
	 * @private
	 */
	setMeetingInfo : function(el)
	{
		var isVisible = this.setMeetingNotFoundInfo(el);

		isVisible = (this.setDelegatorInfo(el) === true ? true : isVisible);

		// display meeting request specific info
		if(this.record.isMeetingRequest()) {
			isVisible = (this.setMeetingRequestInfo(el) === true ? true : isVisible);

			// display recurring meeting request related info
			if(this.record.isRecurringException()) {
				isVisible = (this.setRecurringMeetingRequestInfo(el) === true ? true : isVisible);
			}
		}

		// display meeting response related info
		if(this.record.isMeetingRequestResponse()) {
			isVisible = (this.setMeetingResponseInfo(el) === true ? true : isVisible);
		}

		return isVisible;
	},

	/**
	 * Set delegator info if the meeting request is forwarded by delegate meeting rule,
	 * get info from {@link Zarafa.core.data.IPMRecord record} data.
	 * @param {Ext.Element/HTMLElement} el The target element which is being layed out
	 * @return {Boolean} true if function added any info to {@link Zarafa.common.ui.messagepanel.ExtraInfoLinks ExtraInfoLinks}
	 * and it should be made visible else false.
	 * @private
	 */
	setDelegatorInfo : function(el)
	{
		var delegatedByRule = this.record.get('delegated_by_rule');
		var isVisible = false;

		if(delegatedByRule) {
			var delegatorName = this.record.get('received_representing_name') || this.record.get('received_representing_email_address');

			el.createChild({tag: 'div', html: String.format(this.delegatorInfoString, delegatorName), cls: this.itemCls});
			isVisible = true;
		}

		return isVisible;
	},

	/**
	 * Set meeting request information from {@link Zarafa.core.data.IPMRecord record} data.
	 * @param {Ext.Element/HTMLElement} el The target element which is being layed out
	 * @return {Boolean} true if function added any info to {@link Zarafa.common.ui.messagepanel.ExtraInfoLinks ExtraInfoLinks}
	 * and it should be made visible else false.
	 * @private
	 */
	setMeetingRequestInfo : function(el)
	{
		var meetingConflict = this.record.get('conflictinfo');
		var outDated = this.record.isMeetingOutOfDate();
		var senderIsReceiver = this.record.senderIsReceiver();
		var appNotFound = this.record.get('appointment_not_found');
		var isVisible = false;

		// Do not show ExtraInfo when in sentItems folder
		if(this.record.senderIsUser()) {
			return isVisible;
		}

		if(outDated) {
			// check for out dated/expired meeting status
			el.createChild({tag: 'div', html: this.meetingOutDatedInfoString, cls: this.itemCls});
			isVisible = true;
		} else {
			if (senderIsReceiver) {
				el.createChild({tag: 'div', html: this.organizerAsAttendeeInfoString, cls: this.itemCls});
				isVisible = true;
			} else {
				if(this.record.isAppointmentInPast()) {
					el.createChild({tag: 'div', html: this.elapsedTimeInfoString, cls: this.itemCls});
					isVisible = true;
				} else if(appNotFound !== true) {
					// Meeting is in future, but not replied yet
					el.createChild({tag: 'div', html: this.responseRequiredString, cls: this.itemCls});
					isVisible = true;
				}

				if(!Ext.isEmpty(meetingConflict)) {
					// display meeting conflicting with any other appointment
					el.createChild({tag: 'div', html: meetingConflict, cls: this.itemCls});
					isVisible = true;
				}
			}

			if(this.record.get('updatecounter') > 0){
				el.createChild({tag: 'div', html: this.meetingUpdatedString, cls: this.itemCls});
				isVisible = true;
			}
		}

		return isVisible;
	},

	/**
	 * Set meeting response information from {@link Zarafa.core.data.IPMRecord record} data
	 * and if found will update the panel by loading data from the record data into the template
	 * @param {Ext.Element/HTMLElement} el The target element which is being layed out
	 * @return {Boolean} true if function added any info to {@link Zarafa.common.ui.messagepanel.ExtraInfoLinks ExtraInfoLinks}
	 * and it should be made visible else false.
	 * @private
	 */
	setMeetingResponseInfo : function(el)
	{
		var isVisible = false;

		var counterProposal = this.record.get('counter_proposal');

		// check if delegate has responded
		var delegateEntryid = this.record.get('sender_entryid');
		var delegatorEntryid = this.record.get('sent_representing_entryid');

		// get attendee information
		var attendeeName = this.record.get('sent_representing_name') || this.record.get('sent_representing_email_address');
		var delegateName = '';

		// check if sender and sent representing entryids are different
		if(delegatorEntryid && !Zarafa.core.EntryId.compareABEntryIds(delegateEntryid, delegatorEntryid)) {
			delegateName = this.record.get('sender_name') || this.record.get('sender_email_address');
		}

		if(!Ext.isEmpty(attendeeName)) {
			if(this.record.get('meeting_updated')) {
				el.createChild({tag: 'div', html: this.meetingUpdatedInfoString, cls: this.itemCls});
				isVisible = true;
			}

			if(counterProposal) {
				var htmlString = '';

				if(!Ext.isEmpty(delegateName)) {
					// delegate has responded
					if (this.record.isMessageClass('IPM.Schedule.Meeting.Resp.Tent')) {
						htmlString = String.format(this.counterProposalTentativeAcceptedDelegateString, delegateName, attendeeName);
					} else if (this.record.isMessageClass('IPM.Schedule.Meeting.Resp.Neg')) {
						htmlString = String.format(this.counterProposalDeclinedDelegateString, delegateName, attendeeName);
					}
				} else {
					// attendee has responded
					if (this.record.isMessageClass('IPM.Schedule.Meeting.Resp.Tent')) {
						htmlString = String.format(this.counterProposalTentativeAcceptedString, attendeeName);
					} else if (this.record.isMessageClass('IPM.Schedule.Meeting.Resp.Neg')) {
						htmlString = String.format(this.counterProposalDeclinedString, attendeeName);
					}
				}

				if(!Ext.isEmpty(htmlString)) {
					el.createChild({tag: 'div', html: htmlString, cls: this.itemCls});
					isVisible = true;
				}
			} else {
				var htmlString = '';

				if(!Ext.isEmpty(delegateName)) {
					// delegate has responded
					if(this.record.isMessageClass('IPM.Schedule.Meeting.Resp.Pos')) {
						htmlString = String.format(this.acceptDelegateInfoString, delegateName, attendeeName);
					} else if (this.record.isMessageClass('IPM.Schedule.Meeting.Resp.Tent')) {
						htmlString = String.format(this.tentativeDelegateInfoString, delegateName, attendeeName);
					} else if (this.record.isMessageClass('IPM.Schedule.Meeting.Resp.Neg')) {
						htmlString = String.format(this.declineDelegateInfoString, delegateName, attendeeName);
					}
				} else {
					// attendee has responded
					if(this.record.isMessageClass('IPM.Schedule.Meeting.Resp.Pos')) {
						htmlString = String.format(this.acceptInfoString, attendeeName);
					} else if (this.record.isMessageClass('IPM.Schedule.Meeting.Resp.Tent')) {
						htmlString = String.format(this.tentativeInfoString, attendeeName);
					} else if (this.record.isMessageClass('IPM.Schedule.Meeting.Resp.Neg')) {
						htmlString = String.format(this.declineInfoString, attendeeName);
					}
				}

				if(!Ext.isEmpty(htmlString)) {
					el.createChild({tag: 'div', html: htmlString, cls: this.itemCls});
					isVisible = true;
				}
			}
		}

		return isVisible;
	},

	/**
	 * Set meeting not found information if meeting is not found in the calendar,
	 * get info from {@link Zarafa.core.data.IPMRecord record} data
	 * @param {Ext.Element/HTMLElement} el The target element which is being layed out
	 * @return {Boolean} true if function added any info to {@link Zarafa.common.ui.messagepanel.ExtraInfoLinks ExtraInfoLinks}
	 * and it should be made visible else false.
	 * @private
	 */
	setMeetingNotFoundInfo : function(el)
	{
		var apptNotFound = this.record.get('appointment_not_found');
		var isVisible = false;

		if(apptNotFound) {
			el.createChild({tag: 'div', html: this.meetingNotFoundInfoString, cls: this.itemCls});
			isVisible = true;
		}

		return isVisible;
	},

	/**
	 * Set recurring meeting request information from {@link Zarafa.core.data.IPMRecord record} data.
	 * @param {Ext.Element/HTMLElement} el The target element which is being layed out
	 * @return {Boolean} true if function added any info to {@link Zarafa.common.ui.messagepanel.ExtraInfoLinks ExtraInfoLinks}
	 * and it should be made visible else false.
	 * @private
	 */
	setRecurringMeetingRequestInfo : function(el)
	{
		var recurringPattern = this.record.get('recurring_pattern');
		var isVisible = false;

		if(recurringPattern) {
			el.createChild({tag: 'div', html: Ext.util.Format.htmlEncode(recurringPattern), cls: this.itemCls});
			isVisible = true;
		}

		return isVisible;
	}
});

Ext.reg('zarafa.extrainfolinks', Zarafa.common.ui.messagepanel.ExtraInfoLinks);
