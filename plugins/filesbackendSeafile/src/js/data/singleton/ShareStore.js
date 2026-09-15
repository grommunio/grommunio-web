/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.backend.Seafile.data.singleton');

/**
 * Singleton wrapper around the share grid store so multiple widgets can share it.
 */
Grommunio.plugins.files.backend.Seafile.data.singleton.ShareStore = Ext.extend(
	Object,
	{
		store: undefined,
		init: function (e) {
			this.store = new Grommunio.plugins.files.backend.Seafile.data.ShareGridStore(
				e,
			);
		},
		addUser: function (e) {
			var t = false;
			var i = false;
			var a = false;
			var s = false;
			if (e.permissions - 16 >= 1) {
				s = true;
				e.permissions -= 16;
			}
			if (e.permissions - 8 >= 1) {
				a = true;
				e.permissions -= 8;
			}
			if (e.permissions - 4 >= 1) {
				t = true;
				e.permissions -= 4;
			}
			if (e.permissions - 2 >= 1) {
				i = true;
			}
			var r = [e.id, e.shareWith, e.shareWithDisplayname, 'user', t, i, a, s];
			this.store.loadData([r], true);
		},
		addGroup: function (e) {
			var t = false;
			var i = false;
			var a = false;
			var s = false;
			if (e.permissions - 16 >= 1) {
				s = true;
				e.permissions -= 16;
			}
			if (e.permissions - 8 >= 1) {
				a = true;
				e.permissions -= 8;
			}
			if (e.permissions - 4 >= 1) {
				t = true;
				e.permissions -= 4;
			}
			if (e.permissions - 2 >= 1) {
				i = true;
			}
			var r = [e.id, e.shareWith, e.shareWithDisplayname, 'group', t, i, a, s];
			this.store.loadData([r], true);
		},
		getStore: function () {
			return this.store;
		},
	},
);
Grommunio.plugins.files.backend.Seafile.data.singleton.ShareStore =
	new Grommunio.plugins.files.backend.Seafile.data.singleton.ShareStore();
