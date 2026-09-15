<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

class AttachmentInfo {
	/**
	 * Store id of attachment.
	 *
	 * @var string
	 */
	public $id;

	/**
	 * file name of attachment.
	 *
	 * @var string
	 */
	public $name;

	/**
	 * size of attachment.
	 *
	 * @var int
	 */
	public $size;

	/**
	 * Whether attachment is an inline/embedded image.
	 *
	 * @var bool
	 */
	public $hidden = false;
}
