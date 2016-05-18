/*
 * #dependsFile client/zarafa/core/mapi/BusyStatus.js
 */
Ext.namespace('Zarafa.calendar.data');

/**
 * @class Zarafa.calendar.data.BusyStatus
 * @singleton
 */
Zarafa.calendar.data.BusyStatus = [{
	value: Zarafa.core.mapi.BusyStatus['FREE'],
	name: Zarafa.core.mapi.BusyStatus.getDisplayName(Zarafa.core.mapi.BusyStatus['FREE'])
},{
	value: Zarafa.core.mapi.BusyStatus['TENTATIVE'],
	name: Zarafa.core.mapi.BusyStatus.getDisplayName(Zarafa.core.mapi.BusyStatus['TENTATIVE'])
},{
	value: Zarafa.core.mapi.BusyStatus['BUSY'],
	name: Zarafa.core.mapi.BusyStatus.getDisplayName(Zarafa.core.mapi.BusyStatus['BUSY'])
},{
	value: Zarafa.core.mapi.BusyStatus['OUTOFOFFICE'],
	name: Zarafa.core.mapi.BusyStatus.getDisplayName(Zarafa.core.mapi.BusyStatus['OUTOFOFFICE'])
}];
