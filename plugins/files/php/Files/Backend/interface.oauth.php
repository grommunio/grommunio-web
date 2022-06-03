<?php

namespace Files\Backend;

interface iFeatureOAUTH {
	/**
	 * Update the stored access token.
	 *
	 * @param $newtoken
	 */
	public function changeAccessToken($newtoken);
}
