/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/mapi/Sensitivity.js
 */
Ext.namespace('Grommunio.common.data');

/**
 * @class Grommunio.common.data.SensitivityFlags
 * @singleton
 * This class is used by rules to display the sensitivity.
 */
Grommunio.common.data.SensitivityFlags = {
	flags: [{
		value: Grommunio.core.mapi.Sensitivity['NONE'],
		name: Grommunio.core.mapi.Sensitivity.getDisplayName(Grommunio.core.mapi.Sensitivity['NONE'])
	},{
		value: Grommunio.core.mapi.Sensitivity['PERSONAL'],
		name: Grommunio.core.mapi.Sensitivity.getDisplayName(Grommunio.core.mapi.Sensitivity['PERSONAL'])
	},{
		value: Grommunio.core.mapi.Sensitivity['PRIVATE'],
		name: Grommunio.core.mapi.Sensitivity.getDisplayName(Grommunio.core.mapi.Sensitivity['PRIVATE'])
	},{
		value: Grommunio.core.mapi.Sensitivity['COMPANY_CONFIDENTIAL'],
		name: Grommunio.core.mapi.Sensitivity.getDisplayName(Grommunio.core.mapi.Sensitivity['COMPANY_CONFIDENTIAL'])
	}]
};
