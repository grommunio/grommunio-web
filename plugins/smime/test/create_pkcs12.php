<?php
define('OPENSSL_CONF_PATH', '/etc/ssl/openssl.cnf');

$dn = [
	"countryName" => "NL",
	"stateOrProvinceName" => "Zuid Holland",
	"localityName" => "Delft",
	"organizationName" => "Kopano",
	"organizationalUnitName" => "Dev",
	"commonName" => "John",
	"emailAddress" => "john@kopano.com",
];
$config = ['config' => OPENSSL_CONF_PATH];
$daysvalid = 365;
$privkey = openssl_pkey_new();
$csr = openssl_csr_new($dn, $privkey, $config);
$validFrom = time();
$validTo =  time() + (86400*365);
$sscert = openssl_csr_sign($csr, null, $privkey, $daysvalid, $config);
openssl_x509_export($sscert, $publickey);
openssl_pkcs12_export($publickey, $filename, $privkey, "test");
echo base64_encode($filename);
