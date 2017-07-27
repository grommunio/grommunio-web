#!/usr/bin/env python
from MAPI.Util import *
import sys

# Try simplejson if json is not available
try:
    import json
except ImportError:
    import simplejson as json

# Define where to read and write our WebApp config from / to
PR_EC_WEBACCESS_SETTINGS_JSON = PROP_TAG(PT_STRING8, PR_EC_BASE + 0x72)


def check_input():
    if len(sys.argv) < 2:
        sys.exit('Usage: %s username' % sys.argv[0])


def read_settings():
    data = None
    username = sys.argv[1]

    try:
        s = OpenECSession(sys.argv[1], '', 'file:///var/run/kopano/server.sock')
        st = GetDefaultStore(s)

    except MAPIErrorNotFound as e:
        print('User \'%s\' has no user store (%s)' % (username, e))
        return

    except MAPIErrorLogonFailed as e:
        print('User \'%s\' not found (on this server) (%s)' % (username, e))
        return

    try:
        settings = st.OpenProperty(PR_EC_WEBACCESS_SETTINGS_JSON, IID_IStream, 0, 0)
        data = settings.Read(33554432)
    except Exception as e:
        # Return empty config tree
        data = '{"settings": {"zarafa": {"v1": {"contexts": {"mail": {}}}}}}'

    return data


def write_settings(data):
    s = OpenECSession(sys.argv[1], '', 'file:///var/run/kopano/server.sock')
    st = GetDefaultStore(s)

    settings = st.OpenProperty(PR_EC_WEBACCESS_SETTINGS_JSON, IID_IStream, 0, MAPI_MODIFY | MAPI_CREATE)
    settings.SetSize(0)
    settings.Seek(0, STREAM_SEEK_END)

    writesettings = settings.Write(data.encode('utf-8'))

    if writesettings:
        print('Writing settings for user \'%s\'' % sys.argv[1])
        settings.Commit(0)
    else:
        print('Writing Default Signature for user \'%s\' failed.' % sys.argv[1])


def main():
    data = read_settings()
    signatureid = '1'
    signaturename = u'WebApp Default Signature'
    signaturefile = open('signature.html', 'r')
    signaturehtml = signaturefile.read()
    signaturecontent = dict({u'name': signaturename, u'content': signaturehtml, u'isHTML': True})

    if data:
        webappsettings = json.loads(data.decode('utf-8'))

        if not len(webappsettings['settings']['zarafa']['v1']['contexts']['mail']):
            print("WebApp settings are empty.")
            print("Adding config tree.")
            webappsettings['settings']['zarafa']['v1']['contexts']['mail'] = dict({})

        if u'signatures' not in list(webappsettings['settings']['zarafa']['v1']['contexts']['mail']):
            print("Adding Signature settings to config tree.")
            webappsettings['settings']['zarafa']['v1']['contexts']['mail']['signatures'] = dict({})

        if u'all' not in list(webappsettings['settings']['zarafa']['v1']['contexts']['mail']['signatures']):
            print("Empty Signature settings detected.")
            webappsettings['settings']['zarafa']['v1']['contexts']['mail']['signatures'] = dict({'all': dict({})})

        if webappsettings['settings']['zarafa']['v1']['contexts']['mail']['signatures']['all'].get(signatureid):
            print('Default Signature already exists.')
        else:
            print('Adding Default Signature.')
            webappsettings['settings']['zarafa']['v1']['contexts']['mail']['signatures']['all'][
                signatureid] = signaturecontent
            webappsettings['settings']['zarafa']['v1']['contexts']['mail']['signatures']['new_message'] = signatureid
            webappsettings['settings']['zarafa']['v1']['contexts']['mail']['signatures'][
                'replyforward_message'] = signatureid
            write_settings(json.dumps(webappsettings))


if __name__ == '__main__':
    check_input()
    main()
