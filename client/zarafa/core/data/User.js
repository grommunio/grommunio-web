Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.User
 * @extends Object
 *
 * An object which represents a logged
 * on user in the WebApp environment.
 * To obtain the instance of this object
 * for the currently logged in user,
 * refer to {@link Zarafa.core.Container#getUser}
 */
Zarafa.core.data.User = Ext.extend(Object, {

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
	 * @return {String} The entryid for the user
	 */
	getEntryId : function()
	{
		return this.meta.entryid;
	},

	/**
	 * @return {String} The searchkey for the user
	 */
	getSearchKey : function()
	{
		return this.meta.search_key;
	},

	/**
	 * The display name for the user, this can be either
	 * the {@link #getFullName} or {@link #getUserName}
	 * depending which one is a non-empty string.
	 * @return {String} The displayname for the user
	 */
	getDisplayName : function()
	{
		return this.meta.fullname || this.meta.username;
	},

	/**
	 * @return {String} The fullname for this user
	 */
	getFullName : function()
	{
		return this.meta.fullname;
	},

	/**
	 * @return {String} The username for this user
	 */
	getUserName : function()
	{
		return this.meta.username;
	},

	/**
	 * @return {String} The emailaddress for this user
	 */
	getEmailAddress : function()
	{
		return this.meta.email_address;
	},

	/**
	 * @return {String} The email address for this user
	 */
	getSMTPAddress : function()
	{
		return this.meta.smtp_address;
	},

	/**
	 * @deprecated 2.2.0 This function only exists for backward compatibility with
	 * 		 that want to send the session id as a GET parameter with requests that
	 * 		 they make to kopano.php. Currently kopano.php does not expect this
	 * 		 parameter anymore, but plugins that have not been updated might still 
	 * 		 call this function.
	 * @return {String} Always empty
	 */
	getSessionId : function()
	{
		return '';
	},
	
	/**
	 * @return {String} The first name for this user
	 */
	getFirstName : function()
	{
		return this.meta.given_name;
	},
	
	/**
	 * @return {String} The initials for this user
	 */
	getInitials : function()
	{
		return this.meta.initials;
	},
	
	/**
	 * @return {String} The surname for this user
	 */
	getLastName : function()
	{
		return this.meta.surname;
	},
	
	/**
	 * @return {String} The street address for this user
	 */
	getAddress : function()
	{
		return this.meta.street_address;
	},
	
	/**
	 * @return {String} The city for this user
	 */
	getCity : function()
	{
		return this.meta.locality;
	},
	
	/**
	 * @return {String} The state or province for this user
	 */
	getState : function()
	{
		return this.meta.state_or_province;
	},
	
	/**
	 * @return {String} The zipcode for this user
	 */
	getZipCode : function()
	{
		return this.meta.postal_code;
	},
	
	/**
	 * @return {String} The country for this user
	 */
	getCountry : function()
	{
		return this.meta.country;
	},
	
	/**
	 * @return {String} The title for this user
	 */
	getTitle : function()
	{
		return this.meta.title;
	},
	
	/**
	 * @return {String} The company for this user
	 */
	getCompany : function()
	{
		return this.meta.company_name;
	},
	
	/**
	 * @return {String} The department for this user
	 */
	getDepartment : function()
	{
		return this.meta.department_name;
	},
	
	/**
	 * @return {String} The office location for this user
	 */
	getOffice : function()
	{
		return this.meta.office_location;
	},
	
	/**
	 * @return {String} The assistent for this user
	 */
	getAssistant : function()
	{
		return this.meta.assistant;
	},
	
	/**
	 * @return {String} The business phone number for this user
	 */
	getPhone : function()
	{
		return this.getPhoneBusiness();
	},
	
	/**
	 * @return {String} The business phone number for this user
	 */
	getPhoneBusiness : function()
	{
		return this.meta.business_telephone_number || this.meta.office_telephone_number;
	},
	
	/**
	 * @return {String} The second business phone number for this user
	 */
	getPhoneBusiness2 : function()
	{
		return this.meta.business2_telephone_number;
	},
	
	/**
	 * @return {String} The fax number for this user
	 */
	getFax : function()
	{
		return this.meta.primary_fax_number;
	},
	
	/**
	 * @return {String} The phone number of the assistant for this user
	 */
	getPhoneAssistant : function()
	{
		return this.meta.assistant_telephone_number;
	},
	
	/**
	 * @return {String} The home phone number for this user
	 */
	getPhoneHome : function()
	{
		return this.meta.home_telephone_number;
	},
	
	/**
	 * @return {String} The second home phone number for this user
	 */
	getPhoneHome2 : function()
	{
		return this.meta.home2_telephone_number;
	},
	
	/**
	 * @return {String} The mobile phone number for this user
	 */
	getPhoneMobile : function()
	{
		return this.meta.mobile_telephone_number;
	},
	
	/**
	 * @return {String} The pager phone number for this user
	 */
	getPhonePager : function()
	{
		return this.meta.pager_telephone_number;
	}
});
