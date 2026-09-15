/*
 * #dependsFile client/grommunio/core/mapi/Importance.js
 */
Ext.namespace('Grommunio.common.data');

/**
 * @class Grommunio.common.data.ImportanceFlags
 * @singleton
 * This class can be used by any context to set the important/priority of the items
 */
Grommunio.common.data.ImportanceFlags = {
	flags: [{
		value: Grommunio.core.mapi.Importance['NONURGENT'],
		name: Grommunio.core.mapi.Importance.getDisplayName(Grommunio.core.mapi.Importance['NONURGENT']),
		iconCls: Grommunio.core.mapi.Importance.getClassName(Grommunio.core.mapi.Importance['NONURGENT'])
	},{
		value: Grommunio.core.mapi.Importance['NORMAL'],
		name: Grommunio.core.mapi.Importance.getDisplayName(Grommunio.core.mapi.Importance['NORMAL']),
		iconCls: Grommunio.core.mapi.Importance.getClassName(Grommunio.core.mapi.Importance['NORMAL'])
	},{
		value: Grommunio.core.mapi.Importance['URGENT'],
		name: Grommunio.core.mapi.Importance.getDisplayName(Grommunio.core.mapi.Importance['URGENT']),
		iconCls: Grommunio.core.mapi.Importance.getClassName(Grommunio.core.mapi.Importance['URGENT'])
	}]
};
