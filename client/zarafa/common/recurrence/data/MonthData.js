Ext.namespace('Zarafa.common.recurrence.data');

/**
 * @class Zarafa.common.recurrence.data.MonthData
 * Month value is calculated on the bases of total minutes before that month.
 * As for exaple, February starts after 44640 minutes obtained by 31(days of January month) * 1440(minutes of a day).
 * @singleton
 */
Zarafa.common.recurrence.data.MonthData = [
	{ name: Date.monthNames[0],		value: 0 },
	{ name: Date.monthNames[1],		value: 44640 },
	{ name: Date.monthNames[2],		value: 84960 },
	{ name: Date.monthNames[3],		value: 129600 },
	{ name: Date.monthNames[4],		value: 172800 },
	{ name: Date.monthNames[5],		value: 217440 },
	{ name: Date.monthNames[6],		value: 260640 },
	{ name: Date.monthNames[7],		value: 305280 },
	{ name: Date.monthNames[8],		value: 349920 },
	{ name: Date.monthNames[9],		value: 393120 },
	{ name: Date.monthNames[10],	value: 437760 },
	{ name: Date.monthNames[11],	value: 480960 }
];
