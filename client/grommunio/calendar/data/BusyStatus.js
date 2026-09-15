/*
 * #dependsFile client/grommunio/core/mapi/BusyStatus.js
 */
Ext.namespace('Grommunio.calendar.data');

/**
 * @class Grommunio.calendar.data.BusyStatus
 * @singleton
 */
Grommunio.calendar.data.BusyStatus = [{
	value: Grommunio.core.mapi.BusyStatus['FREE'],
	name: Grommunio.core.mapi.BusyStatus.getDisplayName(Grommunio.core.mapi.BusyStatus['FREE'])
},{
	value: Grommunio.core.mapi.BusyStatus['TENTATIVE'],
	name: Grommunio.core.mapi.BusyStatus.getDisplayName(Grommunio.core.mapi.BusyStatus['TENTATIVE'])
},{
	value: Grommunio.core.mapi.BusyStatus['BUSY'],
	name: Grommunio.core.mapi.BusyStatus.getDisplayName(Grommunio.core.mapi.BusyStatus['BUSY'])
},{
	value: Grommunio.core.mapi.BusyStatus['OUTOFOFFICE'],
	name: Grommunio.core.mapi.BusyStatus.getDisplayName(Grommunio.core.mapi.BusyStatus['OUTOFOFFICE'])
},{
	value: Grommunio.core.mapi.BusyStatus['WORKINGELSEWHERE'],
	name: Grommunio.core.mapi.BusyStatus.getDisplayName(Grommunio.core.mapi.BusyStatus['WORKINGELSEWHERE'])
}];
