/*
 * #dependsFile client/zarafa/core/mapi/AppointmentLabels.js
 */
Ext.namespace('Zarafa.calendar.data');

/**
 * @class Zarafa.calendar.data.AppointmentLabels
 * @singleton
 */
Zarafa.calendar.data.AppointmentLabels = [{
	value: Zarafa.core.mapi.AppointmentLabels['NONE'],
	name: Zarafa.core.mapi.AppointmentLabels.getDisplayName(Zarafa.core.mapi.AppointmentLabels['NONE'])
},{
	value: Zarafa.core.mapi.AppointmentLabels['IMPORTANT'],
	name: Zarafa.core.mapi.AppointmentLabels.getDisplayName(Zarafa.core.mapi.AppointmentLabels['IMPORTANT'])
},{
	value: Zarafa.core.mapi.AppointmentLabels['WORK'],
	name: Zarafa.core.mapi.AppointmentLabels.getDisplayName(Zarafa.core.mapi.AppointmentLabels['WORK'])
},{
	value: Zarafa.core.mapi.AppointmentLabels['PERSONAL'],
	name: Zarafa.core.mapi.AppointmentLabels.getDisplayName(Zarafa.core.mapi.AppointmentLabels['PERSONAL'])
},{
	value: Zarafa.core.mapi.AppointmentLabels['HOLIDAY'],
	name: Zarafa.core.mapi.AppointmentLabels.getDisplayName(Zarafa.core.mapi.AppointmentLabels['HOLIDAY'])
},{
	value: Zarafa.core.mapi.AppointmentLabels['REQUIRED'],
	name: Zarafa.core.mapi.AppointmentLabels.getDisplayName(Zarafa.core.mapi.AppointmentLabels['REQUIRED'])
},{
	value: Zarafa.core.mapi.AppointmentLabels['TRAVEL_REQUIRED'],
	name: Zarafa.core.mapi.AppointmentLabels.getDisplayName(Zarafa.core.mapi.AppointmentLabels['TRAVEL_REQUIRED'])
},{
	value: Zarafa.core.mapi.AppointmentLabels['PREPARE_REQUIRED'],
	name: Zarafa.core.mapi.AppointmentLabels.getDisplayName(Zarafa.core.mapi.AppointmentLabels['PREPARE_REQUIRED'])
},{
	value: Zarafa.core.mapi.AppointmentLabels['BIRTHDAY'],
	name: Zarafa.core.mapi.AppointmentLabels.getDisplayName(Zarafa.core.mapi.AppointmentLabels['BIRTHDAY'])
},{
	value: Zarafa.core.mapi.AppointmentLabels['SPECIAL_DATE'],
	name: Zarafa.core.mapi.AppointmentLabels.getDisplayName(Zarafa.core.mapi.AppointmentLabels['SPECIAL_DATE'])
},{
	value: Zarafa.core.mapi.AppointmentLabels['PHONE_INTERVIEW'],
	name: Zarafa.core.mapi.AppointmentLabels.getDisplayName(Zarafa.core.mapi.AppointmentLabels['PHONE_INTERVIEW'])
}];
