<?php
namespace WAYF;
/**
    OCSP is able to encode OCSPRequests and decode OCSPResponses - just enough for NemID use    
*/

class OCSP extends X509 {

    public function request($certids = array())
    {
        $certids_der = '';
        foreach ($certids as $certid) {
            $certids_der .= $this->sequence(
                            $this->sequence($this->s2oid($certid['hash_alg']))
                            . $this->octetstring($certid['issuerNameHash'])
                            . $this->octetstring($certid['issuerKeyHash'])
                            . $certid['serialNumber_der']);
        }
        return $this->sequence($this->sequence($this->sequence($this->sequence($certids_der))));
    }

    private function sequence($pdu)
    {
        return "\x30" . self::len($pdu) . $pdu;
    }

    protected function octetstring($s)
    {
        return "\x04" . $this->len($s) . $s;
    }

/** serialNumber is now in DER encoding - no need to convert from bc to DER
    so this is not used any more
*/
    private function d2i($d)
    {
        $der = '';
        while ($d) {
            $der .= chr(bcmod($d, 256));
            $d = bcdiv($d, 256, 0);
        }
        return "\x02" . $this->len($der) . strrev($der);
    }

    private function len($i)
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

    protected function s2oid($s)
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
        return "\x06" . $this->len($der) . $der;
    }

    public function certOcspID($certid = array(), $hash_alg = 'sha256')
    {
        $hash_algs = array('sha1' => "1.3.14.3.2.26", 'sha256' => "2.16.840.1.101.3.4.2.1");
         return array(
            'hash_alg' => $hash_algs[$hash_alg],
            'issuerNameHash' => openssl_digest($certid['issuerName'], $hash_alg, true),
            'issuerKeyHash' => openssl_digest($certid['issuerKey'], $hash_alg, true),
            'serialNumber_der' => $certid['serialNumber_der'],
         );
    }
 
    public function response($der)
    {
        $this->init($der);
        $this->beginsequence();
        $ocspresponse['responseStatus'] = $this->responseStatus();
        if ($ocspresponse['responseStatus'] == 'successful') {
            $ocspresponse['responseBytes'] = $this->responseBytes();
        }
        $this->end();
        return $ocspresponse;
    }

    protected function responseStatus()
    {
        $responsestatus = array(
            'successful',
            'malformedRequest',
            'internalError',
            'tryLater',
            'NOT USED',
            'sigRequired',
            'unauthorized',
        );
        return $responsestatus[$this->next(10)];
    }

    protected function responseBytes()
    {
        $this->next(0);
        $this->beginsequence();
        $res['responseType'] = $this->oid();
        if ($res['responseType'] == 'ocspBasic') {
            $res['BasicOCSPResponse'] = $this->ocspBasic($this->next(4));
        }
        $this->end();
        return $res;
    }

    protected function ocspBasic($der)
    {
        $this->xtns->init($der);
        $this->xtns->beginsequence();
        $res['tbsResponseData_der'] = $this->xtns->der();
        $res['tbsResponseData'] = $this->tbsResponseData();
        $res['signatureAlgorithm'] = $this->xtns->signatureAlgorithm();
        $res['signature'] = $this->xtns->next(3);

        if ($this->xtns->peek() === 0) {
            $this->xtns->next(0);
            if ($this->xtns->peek() === 16) {
            $this->xtns->beginsequence();
            $x = new X509();
            while($this->xtns->in()) {
                $res['certs'][] = $x->certificate($this->xtns->der(null, true)); # get and continue past ...
            }
            $this->xtns->end();
        }
        }
        $this->xtns->end();
        return $res;
    }

    protected function tbsResponseData()
    {
        $res['version'] = 0;
        $this->xtns->beginsequence();
        if ($this->xtns->peek() == 0) {
            $this->xtns->next(0);
            $res['version'] = $this->xtns->next(2);;
        }
        $choice = $this->xtns->peek();
        $this->xtns->next();
        if ($choice == 1) {
            $res['responderID']['byName'] = $this->xtns->name();
        } elseif ($choice == 2) {
            $res['responderID']['byKey'] = $this->xtns->keyident();
        }
        $res['producedAt'] = $this->xtns->time();
        $res['responses'] = $this->singleResponses();
        $this->xtns->end();
        return $res;
    }

    protected function singleResponses()
    {
        $this->xtns->beginsequence();
        while ($this->xtns->in()) {
            $this->xtns->beginsequence();
            $srres['certID'] = $this->certID();
            $certstatuses = array('good', 'revoked', 'unknown');
            $srres['certStatus'] = $certstatuses[$this->xtns->peek()];
            $this->xtns->next();
            $srres['thisUpdate'] = $this->xtns->time();
            if ($this->xtns->in() && $this->xtns->peek() == 0) {
                $this->xtns->next(0);
                $srres['nextupdate'] = $this->xtns->time();
            } if ($this->xtns->in() && $this->xtns->peek() == 1) {
                $this->xtns->next(1);
                $srres['singleextensions'] = $this->xtns->next;
            }
            $res[] = $srres;
            $this->xtns->end();
        }
        $this->xtns->end();
        return $res;
    }

    public function certID()
    {
        $this->xtns->beginsequence();
        $res['hashAlgorithm']   = $this->xtns->signatureAlgorithm();
        $res['issuerNameHash']  = $this->xtns->next(4);
        $res['issuerKeyHash']   = $this->xtns->next(4);
        $res['serialNumber']    = $this->xtns->next(2);
        $this->xtns->end();
        return $res;
    }
}
