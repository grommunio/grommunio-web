<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace Files\Backend;

interface iFeatureQuota {
	public function getQuotaBytesUsed($dir);

	public function getQuotaBytesAvailable($dir);
}
