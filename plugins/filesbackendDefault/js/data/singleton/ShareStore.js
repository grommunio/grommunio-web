Ext.namespace('Zarafa.plugins.files.backend.Default.data.singleton');

/**
 * @class Zarafa.plugins.files.backend.Default.data.singleton.ShareStore
 * @extends Object
 *
 * This singleton provides access to the {@link Zarafa.plugins.files.backend.Default.data.ShareGridStore ShareGridStore}.
 * It must be initialized once by calling the init method.
 */
Zarafa.plugins.files.backend.Default.data.singleton.ShareStore = Ext.extend(
	Object,
	{
		/**
		 * @property
		 * @type Zarafa.plugins.files.data.AccountStore
		 * @private
		 */
		store: undefined,

		/**
		 * Triggers a call to the backend to load version information.
		 * @param {Number} fileType folder or file
		 */
		init: function (fileType) {
			this.store = new Zarafa.plugins.files.backend.Default.data.ShareGridStore(
				fileType,
			);
		},

		/**
		 * Loads userdata to the store.
		 *
		 * @param {Object} shareOpts object with the sharing options
		 * Possible values of shareOpts are:
		 * - id: the id oof the share
		 * - shareWith: ownclouds internal user identifier
		 * - shareWithDisplayname: the shareusers displayname
		 * - permissions: bytecode presentation of the chare permissions
		 * - shareType: type of the share, one of Zarafa.plugins.files.backend.Default.data.RecipientTypes
		 */
		addUser: function (shareOpts) {
			var permissionCreate = false;
			var permissionChange = false;
			var permissionDelete = false;
			var permissionShare = false;

			// parse the permission number
			if (shareOpts.permissions - 16 >= 1) {
				permissionShare = true;
				shareOpts.permissions -= 16;
			}
			if (shareOpts.permissions - 8 >= 1) {
				permissionDelete = true;
				shareOpts.permissions -= 8;
			}
			if (shareOpts.permissions - 4 >= 1) {
				permissionCreate = true;
				shareOpts.permissions -= 4;
			}
			if (shareOpts.permissions - 2 >= 1) {
				permissionChange = true;
			}

			var record = [
				shareOpts.id,
				shareOpts.shareWith,
				shareOpts.shareWithDisplayname,
				'user',
				permissionCreate,
				permissionChange,
				permissionDelete,
				permissionShare,
			];

			this.store.loadData([record], true);
		},

		/**
		 * Loads groupdata to the store.
		 *
		 * @param {Object} shareOpts object with the sharing options
		 * Possible values of shareOpts are:
		 * - id: the id oof the share
		 * - shareWith: ownclouds internal user identifier
		 * - shareWithDisplayname: the shareusers displayname
		 * - permissions: bytecode presentation of the chare permissions
		 * - shareType: type of the share, one of Zarafa.plugins.files.backend.Default.data.RecipientTypes
		 */
		addGroup: function (shareOpts) {
			var permissionCreate = false;
			var permissionChange = false;
			var permissionDelete = false;
			var permissionShare = false;

			// parse the permission number
			if (shareOpts.permissions - 16 >= 1) {
				permissionShare = true;
				shareOpts.permissions -= 16;
			}
			if (shareOpts.permissions - 8 >= 1) {
				permissionDelete = true;
				shareOpts.permissions -= 8;
			}
			if (shareOpts.permissions - 4 >= 1) {
				permissionCreate = true;
				shareOpts.permissions -= 4;
			}
			if (shareOpts.permissions - 2 >= 1) {
				permissionChange = true;
			}

			var record = [
				shareOpts.id,
				shareOpts.shareWith,
				shareOpts.shareWithDisplayname,
				'group',
				permissionCreate,
				permissionChange,
				permissionDelete,
				permissionShare,
			];

			this.store.loadData([record], true);
		},

		/**
		 * Get instance of the {@link Zarafa.plugins.files.data.AccountStore Accountstore}
		 * @return {Zarafa.plugins.files.data.AccountStore} the account store
		 */
		getStore: function () {
			return this.store;
		},
	},
);

// Make it a Singleton
Zarafa.plugins.files.backend.Default.data.singleton.ShareStore =
	new Zarafa.plugins.files.backend.Default.data.singleton.ShareStore();
