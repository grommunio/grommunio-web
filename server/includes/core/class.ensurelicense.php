<?php

/**
 * EnsureLicense class will check/ensure the license for the supported builds.
 *
 * @package core
 */
class EnsureLicense
{

	/**
	 * User agent which used in ensuing license.
	 * @var string
	 */
	static $productUserAgent = "Kopano Webapp/v-";

	/**
	 * The flag true to indicate it is supported build and it needs to check/validate the license.
	 * default is false.
	 * @var bool
	 */
	static $kustomerCheckEnabled = false;

	/**
	 * The flag true to indicate pay per use it enabled and false to disable.
	 * default is null.
	 * @var bool
	 */
	static $isPayPerUse = null;

	/**
	 * Function which ensure the license if '$kustomerCheckEnabled' flag is true.
	 * if license is not 'payperuse' then check license is ensure ok or not.
	 *
	 * @param String $productName The name of product which claims we need to check.
	 */
	static function ensureOK($productName)
	{
		if (EnsureLicense::$kustomerCheckEnabled) {
			$beginEnsure = kustomer_instant_ensure(null, EnsureLicense::$productUserAgent . getWebappVersion(), 5);
			EnsureLicense::$isPayPerUse = kustomer_ensure_get_bool($beginEnsure, $productName, "payperuse");
			kustomer_ensure_ok($beginEnsure, $productName);
			kustomer_end_ensure($beginEnsure);

			// Validated license by KC
			$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
			$properties = getPropIdsFromStrings($store, array("license" => "PT_TSTRING:PSETID_KC:0x2"));
			$props = mapi_getprops($store, array($properties["license"]));
			return json_decode($props[$properties["license"]], true);
		}
		return false;
	}

	/**
	 * Helper function used to retrieve the ensure license cache data
	 * from global cache.
	 *
	 * @return array|boolean return array object of if cache is already initialized else false.
	 */
	static function retrieveCache()
	{
		$state = new State("ensure_license", true);
		$state->open();
		$data = $state->read("ensuredLicenseData");
		$state->clean();
		return $data;
	}

	/**
	 * Helper function which update the global cache.
	 *
	 * @param Array $data The data which need to set in global cache.
	 */
	static function updateCache($data)
	{
		$state = new State("ensure_license", true);
		$state->open();
		$state->write("ensuredLicenseData", $data);
		$state->flush();
		$state->clean();
	}
}
