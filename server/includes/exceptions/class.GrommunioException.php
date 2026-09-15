<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Defines a base exception class for custom grommunio generated exceptions, these exceptions
 * are generated and handled by our application only.
 */
class GrommunioException extends BaseException {}

class_alias(GrommunioException::class, 'ZarafaException');
