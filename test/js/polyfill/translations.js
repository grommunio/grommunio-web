/*
 * This document contains all translations functions, implemented as no-op functions,
 * so all javascript files can be loaded, assuming the translation system is in place.
 */

/*
 * Implement the _() function to always return the input
 * string. We have no use for translations (at this point)
 */
const _ = function(text)
{
	return text;
};

/*
 * Implement the dgettext() function to always return the input
 * string. We have no use for translations (at this point)
 */
const dgettext = function(domain, msgid)
{
	return msgid;
};

/*
 * Implement the ngettext() function to always return the input
 * string. We have no use for translations (at this point)
 */
const ngettext = function(msgid, msgid_plural, count)
{
	return msgid;
};

/*
 * Implement the dngettext() function to always return the input
 * string. We have no use for translations (at this point)
 */
const dngettext = function(domain, msgid, msgid_plural, count)
{
	return msgid;
};

/*
 * Implement the pgettext() function to always return the input
 * string. We have no use for translations (at this point)
 */
const pgettext = function(msgctxt, msgid)
{
	return msgid;
};

/*
 * Implement the npgettext() function to always return the input
 * string. We have no use for translations (at this point)
 */
const npgettext = function(msgctxt, msgid, msgid_plural, count)
{
	return msgid;
};
