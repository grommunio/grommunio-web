/*
 * #dependsFile client/zarafa/core/mapi/Sensitivity.js
 */
Ext.namespace('Zarafa.common.data');

/**
 * @class Zarafa.common.data.SensitivityFlags
 * @singleton
 * This class is used by rules to display the sensitivity.
 */
Zarafa.common.data.SensitivityFlags = {
	flags : [{
		value: Zarafa.core.mapi.Sensitivity['NONE'],
		name: Zarafa.core.mapi.Sensitivity.getDisplayName(Zarafa.core.mapi.Sensitivity['NONE'])
	},{
		value: Zarafa.core.mapi.Sensitivity['PERSONAL'],
		name: Zarafa.core.mapi.Sensitivity.getDisplayName(Zarafa.core.mapi.Sensitivity['PERSONAL'])
	},{
		value: Zarafa.core.mapi.Sensitivity['PRIVATE'],
		name: Zarafa.core.mapi.Sensitivity.getDisplayName(Zarafa.core.mapi.Sensitivity['PRIVATE'])
	},{
		value: Zarafa.core.mapi.Sensitivity['COMPANY_CONFIDENTIAL'],
		name: Zarafa.core.mapi.Sensitivity.getDisplayName(Zarafa.core.mapi.Sensitivity['COMPANY_CONFIDENTIAL'])
	}]
};
