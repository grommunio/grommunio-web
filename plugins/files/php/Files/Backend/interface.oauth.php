<?php
namespace Files\Backend;

interface iFeatureOAUTH
{
	/**
	 * Update the stored access token.
	 *
	 * @param $newtoken
	 */
	function changeAccessToken($newtoken);
}