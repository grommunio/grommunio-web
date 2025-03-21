<?php

namespace Files\Backend;

interface iFeatureOAUTH {
	/**
	 * Update the stored access token.
	 */
	public function changeAccessToken($newtoken);
}
