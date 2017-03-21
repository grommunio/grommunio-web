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
	 * @param {String} messageClass (optional) The message class for the message,
	 * if not provided, the message_class property from the record will be used.
	 * @param {Object} options (optional) The options which contains optional information
	 * about given record.
	 * @return {String} icon class.
	 */
	getIconClassFromMessageClass : function(record, messageClass, options)
	{
		var recurring = false;
		var counter_proposal = false;
		if (record) {
			// If the message is a stub, then we always return the stubbed
			// icon regardless of the actual type of the message.
			if(record.get('stubbed')) {
				return 'icon_mail_stubbed';
			}

			// Check if the message is recurring.
			recurring = Ext.isFunction(record.isRecurring) && record.isRecurring();
			counter_proposal = record.get('counter_proposal');
			// Check if the message class was provided,
			// use the message_class property otherwise.
			messageClass = messageClass || record.get('message_class');
		} else if (Ext.isObject(options)) {
			messageClass = messageClass.toUpperCase();
			if (messageClass === 'IPM.TASK') {
				var iconCls = Zarafa.core.mapi.IconIndex.getClassName(options.icon_index);
				if (!Ext.isEmpty(iconCls)) {
					return iconCls;
				}
			}
		}

		if (messageClass) {
			// Ensure case-insensitive comparison
			messageClass = messageClass.toUpperCase();

			var mapping = {
				'IPM.APPOINTMENT'			: 'icon_appt_appointment',
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
		}

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
	}
};
