<?php
namespace Files\Backend;

interface iFeatureQuota
{
	public function getQuotaBytesUsed($dir);

	public function getQuotaBytesAvailable($dir);
}