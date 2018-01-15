/*
 * Tests the Zarafa.common.ui.IconClass
 */
describe('IconClass', function() {
	container = new Zarafa.core.Container();
	container.setUser({'fullname': 'henk', 'username': 'henk'});

	describe('getIconClass', function() {
		it('IPM.Note unread', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note');
			const iconClass = Zarafa.common.ui.IconClass.getIconClass(record);
			expect(iconClass).toEqual('icon_mail icon_message_unread');
		});

		it('IPM.Note read', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note');
			record.set('message_flags', Zarafa.core.mapi.MessageFlags.MSGFLAG_READ);
			const iconClass = Zarafa.common.ui.IconClass.getIconClass(record);
			expect(iconClass).toEqual('icon_mail icon_message_read');
		});

		it('IPM.Note stubbed', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note');
			record.set('stubbed', true);
			const iconClass = Zarafa.common.ui.IconClass.getIconClass(record);
			expect(iconClass).toEqual('icon_mail_stubbed icon_message_unread');
		});

		it('IPM.Appointment', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Appointment');
			const iconClass = Zarafa.common.ui.IconClass.getIconClass(record);
			expect(iconClass).toEqual('icon_appt_appointment icon_message_read');
		});

		it('IPM.Contact', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Contact');
			const iconClass = Zarafa.common.ui.IconClass.getIconClass(record);
			expect(iconClass).toEqual('icon_contact_user icon_message_read');
		});

		it('IPM.Task', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Task');
			const iconClass = Zarafa.common.ui.IconClass.getIconClass(record);
			expect(iconClass).toEqual('icon_task_normal icon_message_read');
		});

		it('IPM.StickyNote', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.StickyNote');
			const iconClass = Zarafa.common.ui.IconClass.getIconClass(record);
			expect(iconClass).toEqual('icon_note_yellow icon_message_read');
		});

		it('IPM.Distlist', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Distlist');
			const iconClass = Zarafa.common.ui.IconClass.getIconClass(record);
			expect(iconClass).toEqual('icon_contact_distlist icon_message_read');
		});
	});

	describe('getIconClassFromDisplayType', function() {
		var record;

		beforeEach(function() {
			record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Distlist');
		});

		it('Mailuser', function() {
			record.set('display_type', Zarafa.core.mapi.DisplayType.DT_MAILUSER);
			record.set('display_type_ex', Zarafa.core.mapi.DisplayType.DT_MAILUSER);
			const iconClass = Zarafa.common.ui.IconClass.getIconClassFromDisplayType(record);
			expect(iconClass).toEqual('icon_contact_user');
		});

		it('Distlist', function() {
			record.set('display_type', Zarafa.core.mapi.DisplayType.DT_DISTLIST);
			record.set('display_type_ex', Zarafa.core.mapi.DisplayTypeEx.DT_SEC_DISTLIST);
			const iconClass = Zarafa.common.ui.IconClass.getIconClassFromDisplayType(record);
			expect(iconClass).toEqual('icon_contact_distlist');
		});

		it('Gab users', function() {
			record.set('display_type', Zarafa.core.mapi.DisplayType.DT_REMOTE_MAILUSER);
			record.set('display_type_ex', Zarafa.core.mapi.DisplayTypeEx.DT_REMOTE_MAILUSER);
			const iconClass = Zarafa.common.ui.IconClass.getIconClassFromDisplayType(record);
			expect(iconClass).toEqual('icon_contact_gab_user');
		});

		it('Contact room', function() {
			record.set('display_type', Zarafa.core.mapi.DisplayType.DT_MAILUSER);
			record.set('display_type_ex', Zarafa.core.mapi.DisplayTypeEx.DT_ROOM);
			const iconClass = Zarafa.common.ui.IconClass.getIconClassFromDisplayType(record);
			expect(iconClass).toEqual('icon_contact_room');
		});

		it('Equipment', function() {
			record.set('display_type', Zarafa.core.mapi.DisplayType.DT_MAILUSER);
			record.set('display_type_ex', Zarafa.core.mapi.DisplayTypeEx.DT_EQUIPMENT);
			const iconClass = Zarafa.common.ui.IconClass.getIconClassFromDisplayType(record);
			expect(iconClass).toEqual('icon_contact_equipment');
		});
	});
});
