<?php
namespace Files\Backend;

interface iFeatureStreaming
{
	/**
	 * Open a readable stream to a remote file
	 *
	 * @param string $path
	 * @return resource a read only stream with the contents of the remote file
	 */
	public function getStreamreader($path);

	/**
	 * Open a writable stream to a remote file
	 *
	 * @param string $path
	 * @return resource a write only stream to upload a remote file
	 */
	public function getStreamwriter($path);
}