<?php

class UploadFile {
	/**
	 * Temporary path and file name for upload content.
	 *
	 * @var string
	 */
	public $tempFile;

	/**
	 * Type of file ("email" or "attachment").
	 *
	 * @var string
	 */
	public $fileType;

	/**
	 * Name of file.
	 *
	 * @var string
	 */
	public $fileName;

	/**
	 * File id from kendox (after upload).
	 *
	 * @var string
	 */
	public $kendoxFileId;
}
