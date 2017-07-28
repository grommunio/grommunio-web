Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.Version
 * @extends Object
 *
 * An object which represents the versioning
 * information of the WebApp environment.
 * To obtain the instance of this object
 * refer to {@link Zarafa.core.Container#getVersion}
 */
Zarafa.core.data.Version = Ext.extend(Object, {

	/**
	 * Object containing all meta data for
	 * this user.
	 * @property
	 * @type Object
	 */
	meta : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		this.meta = config;
	},

	/**
	 * @return {String} Return the WebApp version number
	 */
	getWebApp : function()
	{
		return this.meta.webapp;
	},

	/**
	 * @return {String} Return the Kopano Core version number
	 */
	getZCP : function()
	{
		return this.meta.zcp;
	},

	/**
	 * @return {String} Return the current Git branch
	 */
	getGit : function()
	{
		return this.meta.git;
	},
	
	/**
	 * Compares two version strings.
	 * @param {String} version1 The first version string for the comparision
	 * @param {String} version2 The second version string for the comparision
	 * @return {Integer} -1 if version1 is lower than version2, 
	 * 1 if version2 is lower, 0 if the versions are equal.
	 */
	versionCompare : function(version1, version2)
	{
		// First remove unnecessary parts
		if ( version1.indexOf('-') > -1 ){
			version1 = version1.split('-')[0];
		}
		if ( version2.indexOf('-') > -1 ){
			version2 = version2.split('-')[0];
		}
		
		version1 = version1.split('.');
		version2 = version2.split('.');

		// Only compare major, minor, patch version.
		if (version1.length > 3) {
			version1 = version1.splice(0,3);
		}

		if (version2.length > 3) {
			version2 = version2.splice(0,3);
		}
		
		for ( var i=0; i<version1.length; i++ ){
			if ( !Ext.isDefined(version2[i]) ){
				return 1;
			}
			
			var v1 = parseInt(version1[i], 10);
			var v2 = parseInt(version2[i], 10);
			
			if ( v1 < v2 ){
				return -1;
			}else if ( v1 > v2 ){
				return 1;
			}
		}
		
		if ( version2[version1.length] ){
			return -1;
		}
		
		// When we get here the versions are considered the same
		return 0;
	}
});
