Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.IconClass
 * 
 * Class returns icon class for different records, like folder and message records,
 * based on it's properties like container_class/message_class, distlist_type,
 * display_type, icon_index.
 * 
 * @singleton
 */
Zarafa.common.ui.IconClass = {
	/**
	 * Convenience method for getting the icon class for the record.
	 *
	 * It will check for {@link Zarafa.core.mapi.ObjectType ObjectType} of record.
	 * and on the basis of it, It will return CSS iconClass.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record for which we need to find iconClass.
	 * @return {String} icon class.
	 */
	getIconClass : function(record)
	{
		var iconIndex = record.get('icon_index');
		var objectType = record.get('object_type');
		var iconCls = '';

		// When the iconIndex is provided, we prefer to use this index
		// rather then guessing based on a different property.
		// One exception exists however which is the 'appt_recurring' icon
		// for Meeting requests/responses. For those types of messages we
		// do need to read the message class.
		if(!Ext.isEmpty(iconIndex)) {
			if ((iconIndex !== Zarafa.core.mapi.IconIndex['appt_recurring'] &&
				 iconIndex !== Zarafa.core.mapi.IconIndex['appt_appointment']  ) ||
				!Zarafa.core.MessageClass.isClass(record.get('message_class'), ['IPM.Schedule.Meeting'], true)) {
				iconCls = Zarafa.core.mapi.IconIndex.getClassName(iconIndex, 'icon');
			}
		}

		// If assignee uses older version webapp and he/she can decline task
		// then it shows wrong icon for the declined task to assigner because
		// earlier we use 0x00000502 icon index (icon_task_assignee class) for
		// declined/accepted task in assigner task grid but after KW-1283 ticket
		// we use 0x00000506 and 0x00000503 icon index for the declined and accepted task in
		// assigner task grid.
		if (!Ext.isEmpty(iconCls) &&
			objectType === Zarafa.core.mapi.ObjectType.MAPI_MESSAGE &&
			Ext.isFunction(record.isMessageClass) &&
			record.isMessageClass('IPM.Task')) {
			if (record.isTaskOrganized() && iconCls === 'icon_task_assignee'){
				if(record.isTaskDeclined()) {
					iconCls = 'icon_task_declined';
				} else if (record.isTaskAccepted()) {
					iconCls = 'icon_task_assigner';
				}
			}
		}

		// If the iconIndex could not be resolved to a CSS class, we have to
		// read the other properties to see what CSS class might be applied
		if (Ext.isEmpty(iconCls)) {
			switch(objectType) {
				case Zarafa.core.mapi.ObjectType.MAPI_STORE:
				case Zarafa.core.mapi.ObjectType.MAPI_FOLDER:
					iconCls = this.getIconClassFromContainerClass(record);
					break;
				case Zarafa.core.mapi.ObjectType.MAPI_MESSAGE:
					iconCls = this.getIconClassFromMessageClass(record);
					break;
				case Zarafa.core.mapi.ObjectType.MAPI_MAILUSER:
				case Zarafa.core.mapi.ObjectType.MAPI_DISTLIST:
				case Zarafa.core.mapi.ObjectType.MAPI_ABCONT:
					iconCls = this.getIconClassFromDisplayType(record);
					break;
				case Zarafa.core.mapi.ObjectType.MAPI_ATTACH:
					iconCls = this.getIconClassFromAttachMethod(record);
					break;
				default:
					var distlistType = record.get('distlist_type');
					if (Ext.isDefined(distlistType)) {
						iconCls = this.getIconClassFromDistlistType(record);
					}
			}
		}

		// Add special class in case the message was unread
		if (objectType === Zarafa.core.mapi.ObjectType.MAPI_MESSAGE) {
			if (Ext.isFunction(record.isRead) && !record.isRead()) {
				iconCls += ' icon_message_unread';
			} else {
				iconCls += ' icon_message_read';
			}

			if (Ext.isFunction(record.isRecurring) && record.isRecurring()) {
				iconCls += ' icon_message_recurring';
			}
		}

		return iconCls;
	},

	/**
	 * Convenience method for getting the icon class for the 
	 * {@link Zarafa.core.data.IPFRecord IPFRecord}.
	 *
	 * Function will first check whether folder is IPM_Subtree then return store icon,
	 * Then check whether it's a default folder than set perticular default folder icon,
	 * otherwise get icon class from container_class.
	 *
	 * @param {Zarafa.hierarchy.data.IPFRecord} folder The mapi folder/store record.
	 * @param {String} containerClass (optional) The container class for the folder,
	 * if not provided, the container_class property from the folder will be used.
	 * @return {String} icon class.
	 */
	getIconClassFromContainerClass : function(folder, containerClass)
	{
		if (folder) {
			if (Ext.isFunction(folder.isFavoritesFolder) && folder.isFavoritesFolder()) {
				if(folder.isSearchFolder()) {
					return 'icon_magnifier';
				}
				return 'icon_folder_note';
			}
			// For root nodes we need to discover if it is our private or public store,
			// or if it is a shared store, in which case it can be an entire
			// store, or only the root folder for a specific folder type
			if (folder.isIPMSubTree()) {
				var mapiStore = folder.getMAPIStore();

				if (mapiStore.isSharedStore()) {
					// For a shared store, check the folder_type
					// to determine if the entire store is loaded,
					// or only a specific folder type.
					var type = mapiStore.get('folder_type');
					if (type === 'all') {
						return 'icon_folder_shared_store';
					} else {
						return 'icon_folder_shared_' + type;
					}
				} else if (mapiStore.isPublicStore()) {
					// Public store
					return 'icon_folder_public_store';
				} else {
					// Private store
					return 'icon_folder_store';
				}
			} else if (Ext.isFunction(folder.isFavoritesFolder) && folder.isFavoritesRootFolder()) {
				return 'icon_folder_favorites';
			}
		
			// check if the folder is a default folder
			var defaultKey = folder.getDefaultFolderKey();
			if (defaultKey) {
				return 'icon_folder_default_' + defaultKey.toLowerCase();
			}

			// Check if the container class was provided,
			// use the container_class property otherwise.
			containerClass = containerClass || folder.get('container_class');
		}

		if (Zarafa.core.ContainerClass.isClass(containerClass, 'IPF.Note.OutlookHomepage', true)) {
			return 'icon_folder_rss';
		} else if (Zarafa.core.ContainerClass.isClass(containerClass, 'IPF', true)) {
			return 'icon_folder_' + containerClass.toLowerCase().split('.')[1];
		} else {
			// No, or invalid, containerClass defined, return default icon.
			return 'icon_folder_note';
		}
	},

	/**
	 * Function will first check for icon from icon_index, if icon_index is not found
	 * It will generate icon_class from the message_class and will return it.
	 * @param {Zarafa.core.data.IPMRecord} message The mapi message record.
	 * if not provided, the message_class property from the record will be used.
	 * @return {String} icon class.
	 * @private
	 */
	getIconClassFromMessageClass : function(record)
	{
		var recurring = false;
		var counter_proposal = false;
		var declinedTask = false;
		var messageClass = record.get('message_class') || '';
		messageClass = messageClass.toUpperCase();

		if (record) {
			// If the message is a stub, then we always return the stubbed
			// icon regardless of the actual type of the message.
			if(record.get('stubbed')) {
				return 'icon_mail_stubbed';
			}

			// Check if the message is recurring.
			recurring = Ext.isFunction(record.isRecurring) && record.isRecurring();
			counter_proposal = record.get('counter_proposal');

			// If Assigner sent task request using older webapp version then KW-1283
			// and assignee declined task from latest webapp version in that case
			// mail icon shows instead of decline task icon to avoid this we add below code.
			// Note : In future we can remove this check.
			if (messageClass === 'IPM.TASK' && !Ext.isEmpty(record.get('icon_index'))) {
				declinedTask = record.isTaskOrganized() && record.isTaskDeclined();
			}
		}

		var mapping = {
			'IPM.APPOINTMENT'			: 'icon_appt_appointment',
			'IPM.TASK'                  : declinedTask ? 'icon_task_declined' : 'icon_task_normal',
			'IPM.TASKREQUEST'			: 'icon_task_request',
			'IPM.TASKREQUEST.DECLINE'	: 'icon_task_declined',
			'IPM.TASKREQUEST.ACCEPT'	: 'icon_task_accepted',
			'IPM.STICKYNOTE'			: 'icon_note_yellow',
			'IPM.CONTACT'				: 'icon_contact_user',
			'IPM.DISTLIST'				: 'icon_contact_distlist',
			'IPM.DISTLIST.ORGANIZATION'		: 'icon_contact_distlist_organization',
			'IPM.SCHEDULE.MEETING.REQUEST'		: recurring ? 'icon_appt_meeting_recurring' : 'icon_appt_meeting_single',
			'IPM.SCHEDULE.MEETING.RESP.POS'		: 'icon_appt_meeting_accept',
			'IPM.SCHEDULE.MEETING.RESP.TENT'	: counter_proposal ? 'icon_appt_meeting_newtime' : 'icon_appt_meeting_tentative',
			'IPM.SCHEDULE.MEETING.RESP.NEG'		: 'icon_appt_meeting_decline',
			'IPM.SCHEDULE.MEETING.CANCELED'		: 'icon_appt_meeting_cancel',
			'IPM.NOTE'				: 'icon_mail',
			'REPORT.IPM.NOTE.IPNRN'			: 'icon_mail_read_receipt',
			'REPORT.IPM.NOTE.IPNNRN'		: 'icon_mail_nonread_receipt',
			'REPORT.IPM.NOTE.DR'			: 'icon_mail_delivery_receipt',
			'REPORT.IPM.NOTE.NDR'			: 'icon_mail_nondelivery_receipt',
			'IPM.NOTE.STORAGEQUOTAWARNING'		: 'icon_mail icon_message_unread'
		};

		do {
			var iconClass = mapping[messageClass];
			if (!Ext.isEmpty(iconClass)) {
				return iconClass;
			}

			var index = messageClass.lastIndexOf('.');
			if (index <= 0) {
				break;
			}

			messageClass = messageClass.substr(0, index);
		} while (true);

		// No, or unknown, messageClass defined, return default icon.
		return 'icon_message';
	},

	/**
	 * Function returns icon_class from the distlist_type for showing icons for members
	 * @param {Zarafa.contact.DistlistMemberRecord} record The mapi message record.
	 * @param {String} distlistType (optional) The distlist type for the message,
	 * if not provided, the distlist_type property from the record will be used.
	 * @return {String} icon class.
	 */
	getIconClassFromDistlistType : function(record, distlistType)
	{
		if (record) {
			// Check if the distlist type was provided,
			// use the distlist_type property otherwise.
			distlistType = distlistType || record.get('distlist_type');
		}

		switch(distlistType) {
			case Zarafa.core.mapi.DistlistType.DL_DIST:
			case Zarafa.core.mapi.DistlistType.DL_DIST_AB:
				return 'icon_contact_distlist';
			case Zarafa.core.mapi.DistlistType.DL_USER:
			case Zarafa.core.mapi.DistlistType.DL_USER2:
			case Zarafa.core.mapi.DistlistType.DL_USER3:
			case Zarafa.core.mapi.DistlistType.DL_USER_AB:
			/* falls through*/
			default:
				return 'icon_contact_user';
		}
	},

	/**
	 * Function returns icon_class from the distlist_type for showing icons for members
	 * @param {Zarafa.core.data.IPMRecord} record The mapi message record.
	 * @param {String} displayType (optional) The display type for the message,
	 * if not provided, the display_type property from the record will be used.
	 * @return {String} icon class.
	 */
	getIconClassFromDisplayType : function(record, displayType)
	{
		if (record) {
			// Check if the display type was provided,
			// use the display_type property otherwise.
			if (!Ext.isDefined(displayType)) {
				displayType = record.getDisplayType();
			}
		}

		switch(displayType) {
			case Zarafa.core.mapi.DisplayType.DT_ORGANIZATION:
				return 'icon_contact_company';
			case Zarafa.core.mapi.DisplayType.DT_DISTLIST:
			case Zarafa.core.mapi.DisplayType.DT_PRIVATE_DISTLIST:
			case Zarafa.core.mapi.DisplayType.DT_AGENT:
			case Zarafa.core.mapi.DisplayTypeEx.DT_SEC_DISTLIST:
				return 'icon_contact_distlist';
			case Zarafa.core.mapi.DisplayType.DT_REMOTE_MAILUSER:
				return 'icon_contact_gab_user';
			case Zarafa.core.mapi.DisplayTypeEx.DT_ROOM:
				return 'icon_contact_room';
			case Zarafa.core.mapi.DisplayTypeEx.DT_EQUIPMENT:
				return 'icon_contact_equipment';
			case Zarafa.core.mapi.DisplayType.DT_MAILUSER:
			/* falls through*/
			default:
				return 'icon_contact_user';
		}
	},

	/**
	 * Function returns icon_class from the attach_method for showing icons for attachments.
	 * @param {Zarafa.core.data.IPMAttachmentRecord} record The mapi attachment record.
	 * @return {String} icon class.
	 */
	getIconClassFromAttachMethod : function(record)
	{
		if(record.isEmbeddedMessage()) {
			return 'icon_embed_attachment';
		} else {
			return 'icon_attachment';
		}
	},

	/**
	 * Obtain reminder icon in svg format.
	 * @param {String} color The icon color.
	 * @return {String} The reminder icon
	 */
	getReminderSvgIcon : function(counter)
	{
		return 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(this.getReminderSvgStructure(counter));
	},

	/**
	 * Obtain svg structure for reminder icon.
	 * @param {Number} counter The number of reminders in {@link Zarafa.common.reminder.data.ReminderStore ReminderStore}.
	 * @return {String} The svg structure of reminder icon
	 */
	getReminderSvgStructure : function(counter)
	{
		var hasCounter = (counter !== 0 && Ext.isDefined(counter));
		var svg = '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="-40 -51 100 120">' +
			'<g>' +
				'<path style="fill:#FFF;" d="M7.3846154 18C8.4 18 9.2307692 17.169231 9.2307692 16.153846l-3.6923077 0C5.5384615 17.169231 6.36 18 7.3846154 18l0 0zm5.5384616 -5.538461l0 -4.6153851C12.923077 5.0123077 11.409231 2.64 8.7692308 2.0123077l0 -0.6276923C8.7692308 0.61846154 8.1507692 0 7.3846154 0 6.6184615 0 6 0.61846154 6 1.3846154L6 2.0123077C3.3507692 2.64 1.8461539 5.0030769 1.8461539 7.8461539l0 4.6153851L0 14.307692l0 0.923077 14.769231 0 0 -0.923077 -1.846154 -1.846153 0 0z"/>' +
			'</g>';

		if (hasCounter) {
			svg +='<circle fill="#ee162d" cx="16" cy="2.5" r="8"/>' +
				'<text x="16" y="5.5" id="counter" style="fill:#FFF; font-weight: bold; font-family: arial, tahoma, helvetica, sans-serif;font-size: 10px;" text-anchor="middle">'+counter+'</text>';
		}
		svg += '</svg>';
		return svg;
	}
};
