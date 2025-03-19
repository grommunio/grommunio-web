<?php
namespace Kendox;

use Exception;

class TokenGenerator
{

    /**
     * Token version
     * @var string
     */
    private $TokenVersion = "1";

    /**
     * Token lifetime in seconds
     * @var int
     */
    private $TokenLifeTime = 99000000;

    /**
     * Certificate data (read from PFX-File)
     * @var string
     */
    private $Certificate = null;

    /**
     * Private key of certificate (read from PFX-file)
     * @var string
     */
    private $CertPrivateKey = null;

    /**
     * @param string $issuer
     * @param string $pfxFile
     * @param string $pfxPassword
     */
    function __construct(/**
     * Issuer host name
     */
    private $Issuer, /**
     * Full filename of PFX-File (Certificate)
     */
    private $PfxFile, /**
     * Password for PFX-File (Certificate)
     */
    private $PfxPassword)
    {
        $this->loadCertificateFromPfx();        
    }

    /**
     * Token generation
     * 
     * @param string $userEMail The e-mail of the user to generate a token
     * 
     * @return string Token in XML format
     */
    public function generateToken($userEMail)
    {
        try {
            $now = new \DateTime("now", new \DateTimeZone("utc"));
            $guid = $this->createGUID();
            $writerSignedInfo = xmlwriter_open_memory();        
            $this->writeSignedInfo($writerSignedInfo, $userEMail, $now, $guid);
            $signedInfo = xmlwriter_output_memory($writerSignedInfo);
            $writer = xmlwriter_open_memory();
            xmlwriter_set_indent($writer, false);
            xmlwriter_start_element($writer, "InfoShareToken");
                $this->writeSignedInfo($writer, $userEMail, $now, $guid);
                xmlwriter_start_element($writer, "SignatureValue");
                    xmlwriter_text($writer, $this->signXmlString($signedInfo));
                xmlwriter_end_element($writer);                
            xmlwriter_end_element($writer);
            return xmlwriter_output_memory($writer);
        } catch(\Exception $ex) {
            throw new \Exception("Generating token failed: ".$ex->getMessage());
        }
    }   

    /**
     * Loads the X509-certificate from PFX-File
     */
    private function loadCertificateFromPfx()
    {
        if ($this->PfxFile == null) throw new \Exception("No PFX-File available.");
        if (!file_exists($this->PfxFile)) throw new \Exception("PFX-File not found.");
        if (empty($this->PfxPassword)) throw new \Exception("Password not set for PFX-File.");
        $pfxContent = file_get_contents($this->PfxFile);
        $results = [];
        $read = openssl_pkcs12_read($pfxContent, $results, $this->PfxPassword);
        if ($read == false) throw new \Exception("Error on reading PFX-File: ".openssl_error_string());
        $this->Certificate = $results['pkey'].$results['cert'];
        $this->CertPrivateKey = $results['pkey'];
    }

    private function writeSignedInfo($writer, $userEMail, $time, $uniqueId)
    {
        $utcTime = $time->format('Y-m-d H:i:s');
        $utcTime = str_replace(" ", "T", $utcTime)."Z";
        xmlwriter_start_element($writer, "SignedInfo");
            xmlwriter_start_element($writer, "UserPrincipalName");
            xmlwriter_text($writer, $userEMail);
            xmlwriter_end_element($writer);    
            xmlwriter_start_element($writer, "UniqueId");
            xmlwriter_text($writer, $uniqueId);
            xmlwriter_end_element($writer);            
            xmlwriter_start_element($writer, "Version");
            xmlwriter_text($writer, $this->TokenVersion);
            xmlwriter_end_element($writer);      
            xmlwriter_start_element($writer, "TimeStampUTC");
            xmlwriter_text($writer, $utcTime);
            xmlwriter_end_element($writer);                    
            xmlwriter_start_element($writer, "LifeTimeSeconds");
            xmlwriter_text($writer, $this->TokenLifeTime);
            xmlwriter_end_element($writer);             
            xmlwriter_start_element($writer, "IssueServer");
            xmlwriter_text($writer, $this->Issuer);
            xmlwriter_end_element($writer);     
            xmlwriter_start_element($writer, "CertificateFingerprint");
            xmlwriter_text($writer, strtoupper(openssl_x509_fingerprint($this->Certificate)));
            xmlwriter_end_element($writer);  
            xmlwriter_start_element($writer, "HashAlgorithm");
            xmlwriter_text($writer, "SHA512");
            xmlwriter_end_element($writer);    
            xmlwriter_start_element($writer, "Attributes");
            xmlwriter_text($writer, "");
            xmlwriter_end_element($writer);                                                                                                                                                 
        xmlwriter_end_element($writer);     
    }

    /**
     * Signing a XML-String and returns the result
     * 
     * @param string $xml XML-String
     * 
     * @return string
     */
    function SignXmlString($signedInfoXml)
    {
        try {
            $data = iconv('utf-8', 'utf-16le', $signedInfoXml);    
            $privateKey = \phpseclib3\Crypt\RSA::loadFormat('PKCS8', $this->CertPrivateKey)
                            ->withPadding(\phpseclib3\Crypt\RSA::SIGNATURE_PKCS1)
                            ->withHash('sha512');
            $base64 = base64_encode($privateKey->sign($data));
            return $base64;
        } catch (\Exception $ex) {
            throw new \Exception("XML signing failed: ".$ex->getMessage());
        }
    }

    /**
     * Creates a unique ID
     * @return string
     */
    private function createGUID(){
        if (function_exists('com_create_guid')){
            return com_create_guid();
        }
        else {
            mt_srand((double)microtime()*10000);
            $charid = strtoupper(md5(uniqid(random_int(0, mt_getrandmax()), true)));
            $hyphen = chr(45);// "-"
            $uuid = substr($charid, 0, 8).$hyphen
                .substr($charid, 8, 4).$hyphen
                .substr($charid,12, 4).$hyphen
                .substr($charid,16, 4).$hyphen
                .substr($charid,20,12);
            return $uuid;
        }
    }

}

?>