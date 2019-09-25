/*
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 * #dependsFile client/zarafa/core/data/MessageRecord.js
 */
Ext.namespace('Zarafa.advancesearch');

/**
 * @class Zarafa.advancesearch.AdvanceSearchRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all 'IPM.Search' type messages.
 */
Zarafa.advancesearch.AdvanceSearchRecordFields = [
	{name: 'searchdate', type: 'date', dateFormat: 'timestamp', defaultValue: null, sortDir : 'DESC'},
	{name: 'task_duedate', type: 'date', dateFormat: 'timestamp', defaultValue: null, sortDir : 'DESC'}
];

Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.Search', Zarafa.advancesearch.AdvanceSearchRecordFields);
Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('IPM.Search', Zarafa.core.data.MessageRecord);

// Add the field to all IPM (and IPM child) records
Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM', Zarafa.advancesearch.AdvanceSearchRecordFields);

