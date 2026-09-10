/* Build-only entrypoint: no runtime remote imports or CDN requests. */
import * as openpgp from 'openpgp';
import PostalMime from 'postal-mime';
import {zipSync, unzipSync} from 'fflate';

globalThis.openpgp = openpgp;
globalThis.PostalMime = PostalMime;
globalThis.fflate = {zipSync, unzipSync};
