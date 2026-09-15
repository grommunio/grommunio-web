/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.calendar.data');

/**
 * @class Grommunio.calendar.data.DragStates
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different Drag & Drop states for the
 * {@link Grommunio.calendar.ui.CalendarViewDragZone Drag}&{@link Grommunio.calendar.ui.CalendarViewDropZone Drop}
 * support in the {@link Grommunio.calendar.ui.AbstractCalendarView calendar}.
 *
 * @singleton
 */
Grommunio.calendar.data.DragStates = Grommunio.core.Enum.create({
	/**
	 * No active D&D state
	 * @property
	 * @type Number
	 */
	NONE: 0,

	/**
	 * D&D proxy is currently dragging an item
	 * @property
	 * @type Number
	 */
	DRAGGING: 1,

	/**
	 * D&D proxy is currently selecting a date range
	 * @property
	 * @type Number
	 */
	SELECTING: 2,

	/**
	 * D&D proxy is resizing an item at the start of
	 * the appointment
	 * @property
	 * @type Number
	 */
	RESIZING_START: 3,

	/**
	 * D&D proxy is resizing an item at the end of
	 * the appointment
	 * @property
	 * @type Number
	 */
	RESIZING_DUE: 4
});
