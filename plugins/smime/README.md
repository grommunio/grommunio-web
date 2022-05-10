# S/MIME Plugin

## Dependencies

* php-bcmath
* php-openssl
* php-curl
* php-kopano-smime (for PHP < 7.2)

## Tests

Run the basic unit tests. (requires libfaketime)

	make test

Coverage is located in htmlcov or can be viewed using

	make open-coverage

## Linting

S/MIME uses eslint, simply run the following command for linting.

	make lint

## S/MIME Certificate Storage

S/MIME Certificate private/public are stored in the users store in the root folder in the associated messages.
The private and public certificates are stored in a separate MAPI Message with the following properties set

Property                   | Content
-------------------------- | --------------------------------------------
PR_SUBJECT                 | Email address belonging to the certificate
PR_MESSAGE_CLASS           | WebApp.Security.Public or WebApp.Security.Private denotes certificate type
PR_MESSAGE_DELIVERY_TIME   | validTo time from the public certificate
PR_CLIENT_SUBMIT_TIME      | validFrom time from the public certificate
PR_SENDER_NAME             | The public certificate's serial number
PR_SENDER_EMAIL_ADDRESS    | The issuer denoted as C=NL ST=Zuid-Holland
PR_SUBJECT_PREFIX          | The subject denoted as C=NL .... CN=john
PR_RECEIVED_BY_NAME        | The SHA1 certificate finger print
PR_INTERNET_MESSAGE_ID     | The MD5 certificate finger print

In the attachment of this message the pkcs12 is stored (based64) encoded for a WebApp.Security.Private message,
   if it is a WebApp.Security.Public message the attachment contains a base64 encoded PEM file.

## Testing

To test the S/MIME plugin, a valid certificate is required and can be generated using [step-cli](https://github.com/smallstep/cli) and openssl.

#### 1. Create a Root CA

```
step certificate create root-ca root-ca.crt root-ca.key --profile root-ca
```

#### 2. Install Root CA

```
step certificate install root-ca.crt
```

#### 3. Create s/mime certificate

Create a certificate for `user1@grommunio.local` which is valid for 1 day.

```
step certificate create user1 user1.crt user1.key --ca root-ca.crt --ca-key root-ca.key --san user1@grommunio.local --not-after 24h --template tools/smime.tpl
```

#### 4. Create PKCS#12 file

```
openssl pkcs12 -export -in user1.crt -inkey user1.key -out user1.p12
```

