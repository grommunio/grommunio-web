<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace Files\Backend;

interface iFeatureOAUTH {
	/**
	 * Update the stored access token.
	 *
	 * @param mixed $newtoken
	 */
	public function changeAccessToken($newtoken);
}
