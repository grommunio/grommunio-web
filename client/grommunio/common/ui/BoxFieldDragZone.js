/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.ui');

/**
 * @class Grommunio.common.ui.BoxFieldDragZone
 * @extends Ext.dd.DragZone
 * @xtype grommunio.boxfielddragzone
 *
 * A {@link Ext.dd.DragZone DragZone} installed on a {@link Grommunio.common.ui.BoxField BoxField}
 * Ensures cooperation between different BoxFields' drag and drop zones in order to enable the dragging
 * of boxes
 */
Grommunio.common.ui.BoxFieldDragZone = Ext.extend(Ext.dd.DragZone, {
	/**
	 * @cfg {Grommunio.common.ui.BoxFieldField} field The field on which this drag zone is installed
	 */
	field: undefined,

	/**
	 * Returns the data object associated with this drag source
	 * Here it contains:
	 * 	- ddel - a drag proxy that follows the mouse
	 * - sourceEl - original dragged element
	 * - repairXY - {Number[]} an array of [x, y] coordinates for repairing on illegal drop
	 * - draggedRecord - the {Grommunio.core.data.IPMRecord} record for the box that is being dragged
	 *
	 * @param {Ext.EventObject} e The mouse event
	 * @return {Object} data An object containing arbitrary data
	 */
	getDragData: function(e)
	{
		var sourceEl = e.getTarget('.x-grommunio-boxfield-item');
		if (sourceEl) {

			// create box element but in a div instead of li
			var d = Ext.DomHelper.createDom({
				tag: 'div',
				html: sourceEl.innerHTML,
				id: Ext.id(),
				cls: sourceEl.className,
				style: 'display: inline-block'
			});

			// ensure that child nodes have unique ids
			for (var i=0; i < d.childNodes.length; i++) {
				if (d.childNodes[i].id) {
					d.childNodes[i].id = Ext.id();
				}
			}

			return {
				ddel: d,
				sourceEl: sourceEl,
				repairXY: Ext.fly(sourceEl).getXY(),
				draggedRecord: this.field.items.get(sourceEl.id).record
			};
		}
	},

	/**
	 * Called before a repair of an invalid drop to get the XY to animate to. By default returns
	 * the XY of this.dragData.ddel
	 * @param {EventObject} e The mouse up event
	 * @return {Array} The xy location (e.g. [100, 200])
	 */
	getRepairXY: function()
	{
		return this.dragData.repairXY;
	}
});

Ext.reg('grommunio.boxfielddragzone', Grommunio.common.ui.BoxFieldDragZone);
