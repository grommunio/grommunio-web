<?php

namespace Files\Backend;

interface iFeatureOAUTH {
	/**
	 * Update the stored access token.
	 *
	 * @param mixed $newtoken
	 */
	public function changeAccessToken($newtoken);
}
