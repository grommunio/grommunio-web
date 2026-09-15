/*
 * #dependsFile client/grommunio/core/data/RecordFactory.js
 * #dependsFile client/grommunio/core/data/MessageRecord.js
 */
Ext.namespace('Grommunio.advancesearch');

/**
 * @class Grommunio.advancesearch.AdvanceSearchRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Grommunio.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all 'IPM.Search' type messages.
 */
Grommunio.advancesearch.AdvanceSearchRecordFields = [
	{name: 'searchdate', type: 'date', dateFormat: 'timestamp', defaultValue: null, sortDir: 'DESC'},
	{name: 'duedate', type: 'date', dateFormat: 'timestamp', defaultValue: null, sortDir: 'DESC'},
	{name: 'task_duedate', type: 'date', dateFormat: 'timestamp', defaultValue: null, sortDir: 'DESC'}
];

Grommunio.core.data.RecordFactory.addFieldToMessageClass('IPM.Search', Grommunio.advancesearch.AdvanceSearchRecordFields);
Grommunio.core.data.RecordFactory.setBaseClassToMessageClass('IPM.Search', Grommunio.core.data.MessageRecord);

// Add the field to all IPM (and IPM child) records
Grommunio.core.data.RecordFactory.addFieldToMessageClass('IPM', Grommunio.advancesearch.AdvanceSearchRecordFields);

