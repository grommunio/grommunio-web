<?php
namespace WAYF;
require_once('Der.php');

/**
    X509 is a minimal der parser for certificates - just enough for NemID use
    
    Structure and naming follows Internet X.509 Public Key Infrastructure Certificate and
    Certificate Revocation List (CRL) Profile (http://www.ietf.org/rfc/rfc5280.txt)
*/

class X509Helper extends Der {

    public function generalName()
    {
        $tag = $this->peek();
        switch ($tag) {
            case 0:
                $res['otherName'] = $this->oid(-6);
                break;
            case 1:
                $res['rfc822Name'] = $this->next(-22);
                break;
            case 2:
                $res['dNSName'] = $this->next(-22);
                break;
            case 4:
                $this->next(4);
                $res['directoryName'] = $this->name();
                $res['directoryName_'] = $this->nameasstring($res['directoryName']);
                break;
            case 6:
                $res['uniformResourceIdentifier'] = $this->next(-22);
                break;
            default:
                throw new \Exception("Unsupported GeneralName: $tag");
#                trigger_error("Unsupported GeneralName: $tag", E_USER_ERROR);
        }
        return $res;
    }
    
    public function generalNames($tag = null) {
        $res = array();
        $this->beginsequence($tag);
        while ($this->in()) {
            $res[] = $this->generalName();
        }
        $this->end();
        return $res;
    }
    
    public function nameasstring($name)
    {
        $rdnd = '';
        $res = '';
        $abbvrs = array(
            'countryName' => 'c',
            'organizationName' => 'o',
            'commonName' => 'cn',
            'stateOrProvinceName' => 'state',
            'localityName' => 'l',
            'organizationalUnitName' => 'ou',
            'domainComponent' => 'dc',
        );
        foreach ($name as $rdn) {
            $mrdnd = '';
            $r = "";
            foreach ($rdn as $type => $value) {
                if (substr($type, -1) == '*') continue;
                $type = empty($abbvrs[$type]) ? $type : $abbvrs[$type];
                $r .= $mrdnd . $type . '=' . $value;
                $mrdnd = '+';
            }
            $res .= $rdnd . $r;
            $rdnd = ',';
        }
        return $res;
    }

}

class X509 extends Der {
    protected $xtns;
  
    protected $keyUsages = array(
        'digitalSignature',
        'contentCommitment',
        'keyEncipherment',
        'dataEncipherment',
        'keyAgreement',
        'keyCertSign',
        'cRLSign',
        'encipherOnly',
        'decipherOnly'
    );
    
    public function __construct() {
        $this->xtns = new X509Helper();;
    }
    
    public function certificate($der)
    {
        $this->init($der);
        return $this->certificate_do();
    }
    
    protected function certificate_do() {
        $cert['certificate_der']        = $this->der(); # inclusive signatureAlgorithm and signature
        $this->beginsequence();
        $cert['tbsCertificate']         = $this->tbsCertificate();
        $cert['signatureAlgorithm']     = $this->signatureAlgorithm();
        $cert['signature']              = $this->next(3);
        $this->end();
        return $cert;
        #print_r($cert);
    }

    protected function tbsCertificate()
    {
        $res['tbsCertificate_der'] = $this->der();
        $this->beginsequence();
        $res['version']             = 0;
        if ($this->peek(0)) {
            $res['version']         = $this->next(2);
        }
        $res['serialNumber_der']    = $this->der();
        $res['serialNumber']        = $this->next(2);
        $res['signature']           = $this->signatureAlgorithm();
        $res['issuer_der']          = $this->der();
        $res['issuer']              = $this->name();
        $res['issuer_']             = $this->xtns->nameasstring($res['issuer']);
        $res['validity']            = $this->validity();
        $res['subject_der']         = $this->der();
        $res['subject']             = $this->name();
        $res['subject_']            = $this->xtns->nameasstring($res['subject']);
        $this->beginsequence();
        $res['subjectPublicKeyInfo']['algorithm'] = $this->signatureAlgorithm();
        $res['subjectPublicKeyInfo']['subjectPublicKey'] = $this->next(3);
        $this->end();
        if ($this->peek() == 1) { # issuerUniqueID IMPLICIT
            $this->next(1);
        }
        if ($this->peek() == 2) { #subjectUniqueID IMPLICIT
            $this->next(1);
        }
        if ($this->peek(3)) {
            $res['extensions'] = $this->extensions();
        }
        $this->end();
        return $res;
    }
    
    protected function validity()
    {
        $this->beginsequence();
        $res =  array('notBefore' => $this->time(), 'notAfter' => $this->time());
        $this->end();
        return $res;
    }

    protected function keyUsage($der)
    {
        $this->xtns->init($der);
        $bitstring = $this->xtns->next(3);
        
        /*
          Convert to 'binary' string - '1' in front to not have prefix zeroes removed
          Let go of the last ord(substr($ku[0]['value'], 0, 1) bits as per the BIT STRING der spec
          as well as the '1' prefix from above
         */
         
        $unusedbits = ord(substr($bitstring, 0, 1));
        $ku = base_convert(bin2hex(chr(1) . substr($bitstring, 1)), 16, 2);
        $ku = substr($ku, 1, -$unusedbits);
        $res = array();
        for ($c = 0; $c < strlen($ku); $c++) {
            if ($ku[$c])
                $res[$this->keyUsages[$c]] = 1;
        }
        return $res;
    }

    protected function authorityInfoAccess($der)
    {
        $this->xtns->init($der);
        $this->xtns->beginsequence();
        while ($this->xtns->in()) {
            $this->xtns->beginsequence();
            $accessMethod = $this->xtns->oid();
            $res[$accessMethod][] = array(
                #'accessMethod' => $accessMethod,
                'accessLocation' => $this->xtns->generalName(),
            );
            $this->xtns->end();
        }
        $this->xtns->end();
        return $res;
    }

    protected function certificatePolicies($der)
    {
        $this->xtns->init($der);
       
        $res = array();
        $this->xtns->beginsequence();
        while ($this->xtns->in()) {
            $this->xtns->beginsequence();
            $PolicyInformation['policyIdentifier'] = $this->xtns->oid();
            if ($this->xtns->in()) {
                $this->xtns->beginsequence();
                while ($this->xtns->in()) {
                    $this->xtns->beginsequence();
                    $policyQualifier = array();
                    $policyQualifierId = $this->xtns->oid();
                    $policyQualifier['policyQualifierId'] = $policyQualifierId;
                    if ($policyQualifierId == 'cps') {
                        $policyQualifier['cPSuri'] = $this->xtns->next(22);
                    } elseif ($policyQualifierId == 'unotice') {
                        $this->xtns->beginsequence();
                        if ($this->xtns->peek() == 16) {
                            $this->xtns->beginsequence();
                            $policyQualifier['UserNotice']['noticeRef']['organisation'] = $this->xtns->next();
                            $this->xtns->beginsequence();
                            while($this->xtns->in()) {
                                $policyQualifier['UserNotice']['noticeRef']['noticeNumbers'][] = $this->xtns->next(2);
                            }
                            $this->xtns->end();
                            $this->xtns->end();
                        } 
                        if ($this->xtns->in()) {
                            $policyQualifier['UserNotice']['explicitText'] = $this->xtns->next();
                        }
                        $this->xtns->end();
                    }
    
                    $PolicyInformation['qualifier'][] = $policyQualifier;
                    $this->xtns->end();
                }
                $this->xtns->end();
            }
            $this->xtns->end();
            $res[] = $PolicyInformation;
        }
        $this->xtns->end();
        return $res;
    }

    protected function cRLDistributionPoints($der)
    {
        $this->xtns->init($der);
        $this->xtns->beginsequence();
        while ($this->xtns->in()) {
            $res = array();
            $this->xtns->beginsequence();
            if ($this->xtns->peek(0)) {
                if ($this->xtns->peek() == 0) {
                    $res['distributionPoint']['fullname'][] = $this->xtns->generalnames(0);
                }
                if ($this->xtns->peek() == 1) {
                    $res['distributionPoint']['nameRelativeToCRLIssuer'][] = $this->xtns->name(1);
                }
            };
            if ($this->xtns->peek() == 1) {
                $res['reasons'] = $this->xtns->next(1);
            };
            if ($this->xtns->peek() == 2) {
                $res['cRLIssuer'] = $this->xtns->next(2);

            };
            $this->xtns->end();
            $crldps[] = $res;
        }
        $this->xtns->end();
        return $crldps;
    }

    protected function authorityKeyIdentifier($der)
    {
        $this->xtns->init($der);
        $this->xtns->beginsequence();
        if ($this->xtns->peek() == 0) {
            $res['keyIdentifier'] = chunk_split(bin2hex($this->xtns->next()), 2, ':');
        }
        if ($this->xtns->in() && $this->xtns->peek() == 1) {
            $res['authorityCertIssuer'] = $this->xtns->GeneralNames();
        }
        if ($this->xtns->in() && $this->xtns->peek() == 2) {
            $res['authorityCertSerialNumber'] = $this->xtns->next();
        }
        $this->xtns->end();
        return $res;
    }

    protected function subjectKeyIdentifier($der)
    {
        $this->xtns->init($der);
        $res['keyIdentifier'] = chunk_split(bin2hex($this->xtns->next(4)), 2, ':');
        return $res;
    }

    protected function basicConstraints($der)
    {
        $res['cA'] = false;
        $this->xtns->init($der);
        $this->xtns->beginsequence();
        if ($this->xtns->in()) $res['cA'] = $this->xtns->next(1);
        # pathLenConstraint optional even if cA is true ???
        if ($res['cA'] && $this->xtns->in()) {
            $res['pathLenConstraint'] = $this->xtns->next(2);
        }
        $this->xtns->end();
        return $res;
    }

    protected function extKeyUsage($der)
    {
        $this->xtns->init($der);
        $this->xtns->beginsequence();
        while ($this->xtns->in()) {
            $res[$this->xtns->oid()] = 1;
        }
        $this->xtns->end();
        return $res;
     }

    protected function subjectAltName($der)
    {
        $this->xtns->init($der);
        $this->xtns->beginsequence();
        while ($this->xtns->in()) {
            $res['subjectAltName'][] = $this->xtns->generalName();
        }
        $this->xtns->end();
        return $res;
    }

    protected function privateKeyUsagePeriod($der)
    {
        $this->xtns->init($der);
        $this->xtns->beginsequence();
        if ($this->xtns->in() && $this->xtns->peek() == 0) {
            $res['notBefore'] = $this->xtns->time(-24);
        }
        if ($this->xtns->in() && $this->xtns->peek() == 1) {
            $res['notAfter'] = $this->xtns->time(-24);
        }
        $this->xtns->end();
        return $res;
    }

    protected function ocspNoCheck($der)
    {
        $this->xtns->init($der);
        return $this->xtns->next();
    }

    # RFC 2313 p. 15 ...

    public function RSASignatureValue($der)
    {
        $this->xtns->init($der);
        $res['digestAlgorithm']['algorithm'] = $this->xtns->oid();
        $res['digestAlgorithm']['parameters'] = $this->next();
        return $res;
    }

}
