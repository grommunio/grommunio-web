<?php
namespace WAYF;

include('X509.php');
include('Ocsp.php');

class NemidLogin {

    /** 
      Prepares an array with the parameters for the nemid login form given a config object:
       class Nemidconfig {
           public $privatekey           = '../certs/testkey.pem';
           public $privatekeypass       = '';
           public $certificate          = '../certs/testcertifikat.pem';
           public $serverurlprefix      = 'https://appletk.danid.dk';  # test
           #public $serverurlprefix     = 'https://applet.danid.dk';   # prod
           public $nonceprefix          = 'nemid-test-';
       }
     */
    public function prepareparamsfornemid($config)
    {
        $paramcert = file_get_contents($config->certificate);
        $paramcert = preg_replace('/(-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s)/s', "", $paramcert);

        $params = array(
            'ServerUrlPrefix' => $config->serverurlprefix,
            'ZIP_BASE_URL' => $config->serverurlprefix,
            'ZIP_FILE_ALIAS' => 'OpenLogon2',
            'log_level' => 'ERROR',
            'paramcert' => $paramcert,
            'signproperties' => "NoNcE=" . base64_encode(uniqid($config->nonceprefix, true)),
        );

        uksort($params, "strnatcasecmp");

        $normalized = '';
        foreach ($params as $name => $value) {
            $normalized .= strtolower($name) . $value;
        }
        $normalized = utf8_encode($normalized);
        $paramsdigest = hash('sha256', $normalized, true);
        $params['paramsdigest'] = base64_encode($paramsdigest);

        $privatekey = file_get_contents($config->privatekey);
        $key = openssl_pkey_get_private($privatekey, $config->privatekeypass);
        Nemid52Compat::openssl_sign($normalized, $signeddigest, $key, 'sha256WithRSAEncryption');
        $params['signeddigest'] = base64_encode($signeddigest);

        $params['MAYSCRIPT'] = 'true';
        return $params;
    }
}

class NemidCertificateCheck {
    const GENERALIZED_TIME_FORMAT = 'YmdHis\Z';

    /**
      Does the checks according to 'Implementation instructions for NemID' p. 35.

      1. Validate the signature on XMLDSig.
      2. Extract the certificate from XMLDSig.
      3. Validate the certificate and identify CA as OCES I or OCES II throughout the whole certificate chain to the root certificate.
      4. Check that the certificate has not expired.
      5. Check that the certificate has not been revoked.
      6. Extract the PID or RID from the certificate.
      7. Translate the PID or RID to a CPR number.

      The parameters are:
      $signature - the signature returned by the applet
      $nonce     - the nonce used for uniqifying the request
      $pidconfig - an optional pidconfig object used if pid to cpr lookup is to be performed
      see pidCprRequest for format

      Returns the users certificate - as an array

      Triggers an E_USER_ERROR if ANYTHING goes wrong ...
     */
     
    public function checkAndReturnCertificate($signature, $nonce, $trustedroots, $disableocspcheck = false)
    {
        $document = new \DOMDocument();
        $xml = base64_decode($signature);
        $document->loadXML($xml);

        $xp = new \DomXPath($document);
        $xp->registerNamespace('openoces', 'http://www.openoces.org/2006/07/signature#');
        $xp->registerNamespace('ds', 'http://www.w3.org/2000/09/xmldsig#');

        $x509 = new X509();

        $certchain = $this->xml2certs($xp, $x509);
        print_r($certchain);

        $nemidfixedpathlength = 1; # as per RFC 5280: 'maximum number of non-self-issued intermediate certificates'

        $leafcertificate = end($certchain);
        $this->verifySignature($xml, $xp, $leafcertificate, $nonce);
        $this->simpleVerifyCertificateChain($certchain, array('digitalSignature'), $trustedroots, $nemidfixedpathlength);
        if (!$disableocspcheck) {
            $this->checkOcsp($certchain, $x509);
        }

        return $leafcertificate;
    }

    private function certificateAsPem($cert)
    {
        return "-----BEGIN CERTIFICATE-----\n"
               .  chunk_split(base64_encode($cert['certificate_der']))
               . "-----END CERTIFICATE-----";
    }

    protected function verifyRSASignature($data, $signature, $signatureAlgorithm, $publicKeyPem)
    {
        $publicKey = openssl_get_publickey($publicKeyPem);
        if (!$publicKey) {
            trigger_error(openssl_error_string(), E_USER_ERROR);
        }
        if (Nemid52Compat::openssl_verify($data, $signature, $publicKey, $signatureAlgorithm) != 1) {
            trigger_error(openssl_error_string(), E_USER_ERROR);
        }
    }

    /*
            
        $maxpathlength may be more limited than pathLenConstraint
    
    */
    protected function simpleVerifyCertificateChain($certchain, $keyUsages, $trustedroots, $maxpathlength)
    {
        $now = gmdate(self::GENERALIZED_TIME_FORMAT);
        $leaf = $maxpathlength + 1;
        sizeof($certchain) == ($maxpathlength + 2) or trigger_error('Length of certificate chain is not ' . $maxpathlength, E_USER_ERROR);

        foreach ($keyUsages as $usage) {
            ($certchain[$leaf]['tbsCertificate']['extensions']['keyUsage']['extnValue'][$usage])
                    or trigger_error('Certificate has not keyUsage: ' . $usage, E_USER_ERROR);
        }

        for ($i = $leaf; $i > 0; $i--) {
            $issuer = max($i - 1, 0);
            $der = $certchain[$i]['tbsCertificate']['tbsCertificate_der'];
            # skip first null byte - number of unused bits at the end ...
            $signature = substr($certchain[$i]['signature'], 1);
            $this->verifyRSASignature($der, $signature, $certchain[$i]['signatureAlgorithm'], $this->certificateAsPem($certchain[$issuer]));

            ($certchain[$i]['tbsCertificate']['validity']['notBefore'] <= $now
                    && $now <= $certchain[$i]['tbsCertificate']['validity']['notAfter'])
                    or trigger_error('certificate is outside it\'s validity time', E_USER_ERROR);
            $extensions = $certchain[$issuer]['tbsCertificate']['extensions'];
            ($extensions['basicConstraints']['extnValue']['cA'])
                    or trigger_error('Issueing certificate has not cA = true', E_USER_ERROR);
            if (isset($extensions['basicConstraints']['extnValue']['pathLenConstraint'])) {
                $pathLenConstraint = @$extensions['basicConstraints']['extnValue']['pathLenConstraint'];
            }
            (empty($pathLenConstraint) || $pathLenConstraint >= $leaf - $issuer - 1)
                    or trigger_error('pathLenConstraint violated', E_USER_ERROR);
            ($extensions['keyUsage']['extnValue']['keyCertSign'])
                    or trigger_error('Issueing certificate has not keyUsage: keyCertSign', E_USER_ERROR);
        }

        # first digest is for the root ...
        # check the root digest against a list of known root oces certificates
        $digest = hash('sha256', $certchain[0]['certificate_der']);
        in_array($digest, array_values($trustedroots->trustedrootdigests)) or trigger_error('Certificate chain not signed by any trustedroots', E_USER_ERROR);
    }

    /**
      Verifies the signed element in the returned signature
     */
    protected function verifySignature($message, $xp, $certificate, $nonce)
    {
        $context = $xp->query('/openoces:signature/ds:Signature')->item(0);
        $signednonce = $xp->query('ds:Object/ds:SignatureProperties/ds:SignatureProperty[openoces:Name=\'NoNcE\']/openoces:Value', $context)->item(0)->textContent;

        if ($nonce != 'NoNcE=' . $signednonce)
            trigger_error("Nonce has been tampered with: $nonce != NoNcE=$signednonce", E_USER_ERROR);

        $signedElement = $xp->query('ds:Object[@Id="ToBeSigned"]', $context)->item(0)->C14N();
        $digestValue = base64_decode($xp->query('ds:SignedInfo/ds:Reference/ds:DigestValue', $context)->item(0)->textContent);

        $signedInfo = $xp->query('ds:SignedInfo', $context)->item(0)->C14N();
        $signatureValue = base64_decode($xp->query('ds:SignatureValue', $context)->item(0)->textContent);
        $publicKey = openssl_get_publickey($this->certificateAsPem($certificate));

        if (!((hash('sha256', $signedElement, true) == $digestValue)
                && openssl_verify($signedInfo, $signatureValue, $publicKey, 'sha256WithRSAEncryption') == 1)) {
            trigger_error('Error verifying incoming XMLsignature' . PHP_EOL
                    . openssl_error_string() . PHP_EOL . 'XMLsignature: ' . print_r(htmlspecialchars($message), 1), E_USER_ERROR);
        }
    }

    /**
      Does the ocsp check of the last certificate in the $certchain
      $certchain contains root + intermediate + user certs
     */
     
    protected function checkOcsp($certchain, $x509)
    {
        $certificate = array_pop($certchain); # the cert we are checking
        $issuer = array_pop($certchain); # assumed to be the issuer of the signing certificate of the ocsp response as well
        $ocspclient = new OCSP();

        $certID = $ocspclient->certOcspID(array(
                    'issuerName' => $issuer['tbsCertificate']['subject_der'],
                    /* remember to skip the first byte it is the number of unused bits and it is alwayf 0 for keys and certificates */
                    'issuerKey' => substr($issuer['tbsCertificate']['subjectPublicKeyInfo']['subjectPublicKey'], 1),
                    'serialNumber_der' => $certificate['tbsCertificate']['serialNumber_der']));

        $ocspreq = $ocspclient->request(array($certID));

        $url = $certificate['tbsCertificate']['extensions']['authorityInfoAccess']['extnValue']['ocsp'][0]['accessLocation']['uniformResourceIdentifier'];

        $stream_options = array(
            'http' => array(
                'ignore_errors' => false,
                'method' => 'POST',
                'header' => 'Content-type: application/ocsp-request' . "\r\n",
                'content' => $ocspreq,
                'timeout' => 5,
            ),
        );

        $context = stream_context_create($stream_options);
        $derresponse = file_get_contents($url, null, $context);

        $ocspresponse = $ocspclient->response($derresponse);

        /* check that the response was signed with the accompanying certificate */
        $der = $ocspresponse['responseBytes']['BasicOCSPResponse']['tbsResponseData_der'];
        # skip first null byte - the unused number bits in the end ...
        $signature = substr($ocspresponse['responseBytes']['BasicOCSPResponse']['signature'], 1);
        $signatureAlgorithm = $ocspresponse['responseBytes']['BasicOCSPResponse']['signatureAlgorithm'];

        $ocspcertificate = $ocspresponse['responseBytes']['BasicOCSPResponse']['certs'][0];

        $this->verifyRSASignature($der, $signature, $signatureAlgorithm, $this->certificateAsPem($ocspcertificate));

        /* check that the accompanying certificate was signed with the intermediate certificate */
        $der = $ocspcertificate['tbsCertificate']['tbsCertificate_der'];
        $signature = substr($ocspcertificate['signature'], 1);

        $this->verifyRSASignature($der, $signature, $ocspcertificate['signatureAlgorithm'], $this->certificateAsPem($issuer));

        $resp = $ocspresponse['responseBytes']['BasicOCSPResponse']['tbsResponseData']['responses'][0];

        $ocspresponse['responseStatus'] === 'successful' or trigger_error("OCSP Response Status not 'successful'", E_USER_ERROR);
        $resp['certStatus'] === 'good' or trigger_error("OCSP Revocation status is not 'good'", E_USER_ERROR);
        $resp['certID']['hashAlgorithm'] === 'sha-256'
                && $resp['certID']['issuerNameHash'] === $certID['issuerNameHash']
                && $resp['certID']['issuerKeyHash'] === $certID['issuerKeyHash']
                && $resp['certID']['serialNumber'] === $certID['serialNumber']
                or trigger_error("OCSP Revocation, mismatch between original and checked certificate", E_USER_ERROR);
        $now = gmdate(self::GENERALIZED_TIME_FORMAT);
        $resp['thisUpdate'] <= $now && $now <= $resp['nextupdate']
                or trigger_error("OCSP Revocation status not current: {$returnedCertResponse['thisUpdate']} <= $now <= {$returnedCertResponse['nextupdate']}", E_USER_ERROR);

        $ocspcertificateextns = $ocspcertificate['tbsCertificate']['extensions'];
        $ocspcertificateextns['extKeyUsage']['extnValue']['ocspSigning'] or trigger_error('ocspcertificate is not for ocspSigning', E_USER_ERROR);
        $ocspcertificateextns['ocspNoCheck']['extnValue'] === null or trigger_error('ocspcertificate has not ocspNoCheck extension', E_USER_ERROR);
    }

    /**
      Extracts, parses and orders - leaf to root - the certificates returned by NemID.

      $xp is the DomXPath object - the XML text isn't needed
      $x509 is the parser object
     */
    protected function xml2certs($xp, $x509)
    {
        $nodeList = $xp->query('/openoces:signature/ds:Signature/ds:KeyInfo/ds:X509Data/ds:X509Certificate');

        foreach ($nodeList as $node) {
            $cert = $node->nodeValue;
            $certhash = $x509->certificate(base64_decode($cert));
            $certsbysubject[$certhash['tbsCertificate']['subject_']] = $certhash;
        }

        $count = array();
        foreach ($certsbysubject as $cert) {
            $count[$cert['tbsCertificate']['subject_']] = 0;
            $count[$cert['tbsCertificate']['issuer_']] = 0;
        }
        # maybe hash of structure instead ...
        foreach ($certsbysubject as $cert) {
            $count[$cert['tbsCertificate']['subject_']]++;
            $count[$cert['tbsCertificate']['issuer_']]++;
        }

        $checks = array_count_values($count);

        # the subject of the leaf certificate appears only once ...
        if ($checks[1] != 1) {
            trigger_error("Couldn't find leaf certificate ...", E_USER_ERROR);
        }

        $certpath = array();
        $leafcert = array_search(1, $count);


        # $certpath is sorted list root first ..
        while ($leafcert) {
            array_unshift($certpath, $certsbysubject[$leafcert]);
            #$certpath[] = $certsbysubject[$leafcert];
            $next = $certsbysubject[$leafcert]['tbsCertificate']['issuer_'];
            if ($next == $leafcert)
                break;
            $leafcert = $next;
        }
        return $certpath;
    }

    /**
      Does the pid to cpr lookup
      $config is a configuration object with the following static attributes:
          class Pidcprconfig {
              public $server                = 'https://pidws.pp.certifikat.dk/pid_serviceprovider_server/pidxml/'; # test
              #public $server               = 'https://pidws.certifikat.dk/pid_serviceprovider_server/pidxml/';    # prod
              public $certificateandkey     = '';
              public $privatekeypass        = '';
              public $serviceid             = '';
          }

      $pid is the pid to lookup
    */
     
    public function pidCprRequest($config, $pid, $cpr = null)
    {
        /*
          A:
          O = OK (”OK", "OK")
          1 = NO_MATCH ("CPR svarer ikke til PID", "CPR does not match PID")
          2 = NO_PID ("PID eksisterer ikke", "PID doesn't exist")
          4 = NO_PID_IN_CERTIFICATE ("PID kunne ikke findes i certifikatet", "No PID in certificate")
          8 = NOT_AUTHORIZED_FOR_CPR_LOOKUP ("Der er ikke rettighed til at foretage CPR opslag", "Caller not authorized for CPR lookup")
          16 = BRUTE_FORCE_ATTEMPT_DETECTED ("Forsøg på systematisk søgning på CPR", "Brute force attempt detected")
          17 = NOT_AUTHORIZED_FOR_SERVICE_LOOKUP ( "Der er ikke rettighed til at foretage opslag på service", "Caller not authorized for service lookup")
          4096 = NOT_PID_SERVICE_REQUEST ("Modtaget message ikke pidCprRequest eller pidCprServerStatus", "Non request XML received")
          8192 = XML_PARSE_ERROR ("XML pakke kan ikke parses", "Non parsable XML received")
          8193 = XML_VERSION_NOT_SUPPORTED ("Version er ikke understøttet", "Version not supported")
          8194 = PID_DOES_NOT_MATCH_BASE64_CERTIFICATE ("PID stemmer med ikke med certifikat", "PID does not match certifikat")
          8195 = MISSING_CLIENT_CERT ("Klient certifikat ikke præsenteret", "No client certificate presented")
          16384 = INTERNAL_ERROR ("Intern DanID fejl", "Internal DanID error")
         */

        $pidCprRequest = '<?xml version="1.0" encoding="iso-8859-1"?><method name="pidCprRequest" version="1.0"><request><serviceId>x</serviceId><pid>x</pid><cpr>x</cpr></request></method>';

        $document = new \DOMDocument();
        $document->loadXML($pidCprRequest);
        $xp = new \DomXPath($document);

        $pidCprRequestParams = array(
            'serviceId' => $config->serviceid,
            'pid' => $pid,
            'cpr' => $cpr,
        );
        
        $element = $xp->query('/method/request')->item(0);
        $element->setAttribute("id", uniqid());
        
        foreach ((array) $pidCprRequestParams as $p => $v) {
            $element = $xp->query('/method/request/' . $p)->item(0);
            $newelement = $document->createTextNode($v);
            $element->replaceChild($newelement, $element->firstChild);
        }
        
        if (!$cpr) {
            $element = $xp->query('/method/request/cpr')->item(0);
            $element->parentNode->removeChild($element);
        }

        $pidCprRequest = $document->saveXML();

        if (!file_exists($config->certificateandkey)) {
            trigger_error("Can't find certificate for clientside auth for pidCprRequest", E_USER_ERROR);
        }

        $postdata = http_build_query(
                array(
                    'PID_REQUEST' => $pidCprRequest,
                )
        );

        $stream_options = array(
            'ssl' => array(
                'local_cert' => $config->certificateandkey,
                'passphrase' => $config->privatekeypass,
                'verify_peer' => false,
                'ciphers' => 'ALL',
            ),
            'http' => array(
                'ignore_errors' => false,
                'method' => 'POST',
                'header' => 'Content-type: application/x-www-form-urlencoded',
                'content' => $postdata,
                'timeout' => 5));

        $context = stream_context_create($stream_options);

        $response = file_get_contents($config->server, null, $context);

        $document->loadXML($response);
        $xp = new \DomXPath($document);
        $status = $xp->query('/method/response/status/@statusCode')->item(0)->value;

        if ($status == 0) {
            return $xp->query('/method/response/cpr')->item(0)->nodeValue;
        } else {
            $errormsg = $xp->query('/method/response/status/statusText[@language=\'UK\']')->item(0)->nodeValue;
            trigger_error("PID: $pid Status: $status, $errormsg", E_USER_ERROR);
        }
    }
}

class NemidRoot {
    static public function fingerprint($url) {
        print hash('sha256', base64_decode(preg_replace('/(-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s)/s', "", file_get_contents($url))));
    }
}

class Nemid52Compat {

    static function openssl_sign($data, &$signature, $priv_key_id, $signature_alg)
    {
        $eb = self::my_rsa_sha_encode($data, $priv_key_id, $signature_alg);
        openssl_private_encrypt($eb, $signature, $priv_key_id, OPENSSL_NO_PADDING); 
    }
    
    static function openssl_verify($data, $signature, $pub_key_id, $signature_alg)
    {
        openssl_public_decrypt($signature, $decrypted_signature, $pub_key_id, OPENSSL_NO_PADDING);
        $eb = self::my_rsa_sha_encode($data, $pub_key_id, $signature_alg);
        return $decrypted_signature === $eb ? 1 : 0;
    }
    
    static function my_rsa_sha_encode($data, $key_id, $signagure_alg) {
        $algos = array(
            'sha1WithRSAEncryption'   => array('alg' => 'sha1',   'oid' => '1.3.14.3.2.26'),
            'sha256WithRSAEncryption' => array('alg' => 'sha256', 'oid' => '2.16.840.1.101.3.4.2.1'),
            'sha384WithRSAEncryption' => array('alg' => 'sha384', 'oid' => '2.16.840.1.101.3.4.2.2'),
            'sha512WithRSAEncryption' => array('alg' => 'sha512', 'oid' => '2.16.840.1.101.3.4.2.3'),
        );
    
        $pinfo = openssl_pkey_get_details($key_id);
     
        $digestalgorithm = $algos[$signagure_alg]['alg'];
        $digestalgorithm or trigger_error('unknown or unsupported signaturealgorithm: ' . $signagure_alg);
        $oid = $algos[$signagure_alg]['oid'];
    
        $digest = hash($digestalgorithm, $data, true);
        
        $t = self::sequence(self::sequence(self::s2oid($oid) . "\x05\x00") . self::octetstring($digest));
        $pslen = $pinfo['bits']/8 - (strlen($t) + 3);
    
        $eb = "\x00\x01" . str_repeat("\xff", $pslen) . "\x00" . $t;
        return $eb;
    }
    
    static function sequence($pdu)
    {
        return "\x30" . self::len($pdu) . $pdu;
    }
    
    static function s2oid($s)
    {
        $e = explode('.', $s);
        $der = chr(40 * $e[0] + $e[1]);
    
        foreach (array_slice($e, 2) as $c) {
            $mask = 0;
            $derrev = '';
            while ($c) {
                $derrev .= chr(bcmod($c, 128) + $mask);
                $c = bcdiv($c, 128, 0);
                $mask = 128;
            }
            $der .= strrev($derrev);
        }
        return "\x06" . self::len($der) . $der;
    }
    
    static function octetstring($s)
    {
        return "\x04" . self::len($s) . $s;
    }
    
    
    static function len($i)
    {
        $i = strlen($i);
        if ($i <= 127)
            $res = pack('C', $i);
        elseif ($i <= 255)
            $res = pack('CC', 0x81, $i);
        elseif ($i <= 65535)
            $res = pack('Cn', 0x82, $i);
        else
            $res = pack('CN', 0x84, $i);
        return $res;
    }
}
