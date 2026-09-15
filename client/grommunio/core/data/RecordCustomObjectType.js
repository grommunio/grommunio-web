/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core.data');

/**
 * @class Grommunio.core.data.RecordCustomObjectType
 * @extends Grommunio.core.Enum
 *
 * Extension to the MAPI definitions for the
 * {@link Grommunio.core.data.ObjectType}. This can be used
 * by plugins to register new Object Types which can be
 * handled by the {@link Grommunio.core.data.RecordFactory}.
 *
 * New types should be registered using {@link #addProperty}
 * to register their new type, after which the value can be
 * used with the {@link Grommunio.core.data.RecordFactory} to
 * configure the {@link Grommunio.core.data.RecordFactory#addFieldToCustomType fields}
 * for example.
 *
 * @singleton
 */
Grommunio.core.data.RecordCustomObjectType = Grommunio.core.Enum.create({
	/**
	 * Denotes the BASE value from where to start counting
	 * new Custom Type. Because the Custom Types will be used
	 * by the {@link Grommunio.core.data.RecordFactory RecordFactory}
	 * together with {@link Grommunio.core.mapi.ObjectType ObjectType}
	 * the values in this enumeration should be higher then the
	 * highest value of the ObjectType enumeration.
	 * @property
	 * @type Number
	 */
	BASE_TYPE: 1000
});
