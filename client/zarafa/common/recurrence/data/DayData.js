Ext.namespace('Zarafa.common.recurrence.data');

/**
 * @class Zarafa.common.recurrence.data.DayData
 * @singleton
 */
Zarafa.common.recurrence.data.DayData = [
	{ name: _('Day'),			value: 127 },
	{ name: _('Weekday'),		value: 62 },
	{ name: _('Weekend Day'),	value: 65 },
	// The following are initialized empty,
	// because the order of the days is
	// depending on the 'zarafa/v1/main/week_start'
	// configuration option, which we cannot use
	// until the Document has been loaded.
	{ name: null,				value: 0 },
	{ name: null,				value: 0 },
	{ name: null,				value: 0 },
	{ name: null,				value: 0 },
	{ name: null,				value: 0 },
	{ name: null,				value: 0 },
	{ name: null,				value: 0 }
];

// With the document loaded, we can now access the 'zarafa/v1/main/week_start'
// configuration option, which we need to build the last 7 items from the
// Zarafa.common.recurrence.data.DayData structure.
Zarafa.onReady(function() {
	var weekStart = container.getSettingsModel().get('zarafa/v1/main/week_start');      

	for (var i = 3; i < Zarafa.common.recurrence.data.DayData.length; i++) {
		var index = (weekStart + (i - 3)) % 7;
		Zarafa.common.recurrence.data.DayData[i].name = Date.dayNames[index];
		Zarafa.common.recurrence.data.DayData[i].value = Math.pow(2, index);
	}
}, undefined, { single: true });
