/*
 * #dependsFile client/zarafa/core/mapi/Importance.js
 */
Ext.namespace('Zarafa.common.data');

/**
 * @class Zarafa.common.data.ImportanceFlags
 * @singleton
 * This class can be used by any context to set the important/priority of the items
 */
Zarafa.common.data.ImportanceFlags = {
	flags : [{
		value: Zarafa.core.mapi.Importance['NONURGENT'],
		name: Zarafa.core.mapi.Importance.getDisplayName(Zarafa.core.mapi.Importance['NONURGENT']),
		iconCls: Zarafa.core.mapi.Importance.getClassName(Zarafa.core.mapi.Importance['NONURGENT'])
	},{
		value: Zarafa.core.mapi.Importance['NORMAL'],
		name: Zarafa.core.mapi.Importance.getDisplayName(Zarafa.core.mapi.Importance['NORMAL']),
		iconCls: Zarafa.core.mapi.Importance.getClassName(Zarafa.core.mapi.Importance['NORMAL'])
	},{
		value: Zarafa.core.mapi.Importance['URGENT'],
		name: Zarafa.core.mapi.Importance.getDisplayName(Zarafa.core.mapi.Importance['URGENT']),
		iconCls: Zarafa.core.mapi.Importance.getClassName(Zarafa.core.mapi.Importance['URGENT'])
	}]
};
