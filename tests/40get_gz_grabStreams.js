/**
 * $ node 40get_gz.js
 * Get .gz file.
 */
const util = require('util');
const zlib = require('zlib');
const HttpClient = require('../HttpClient.js');
const url = 'https://common.elisaviihde.fi/sitemaps/events-s1.xml.gz';
console.log('asked url:: GET', url);


const getJSON = async () => {
  const opts = {
    encodeURI: false,
    encoding: 'utf8',
    timeout: 8000,
    retry: 0,
    retryDelay: 5500,
    maxRedirects: 0,
    // headers,
    decompress: false,
    debug: false
  };

  try {
    const hcn = new HttpClient(opts);
    // get request & response to origserver as stream objects
    const hcnStreams = await hcn.grabStreams(url).catch(console.log);
    if (!hcnStreams) { return; }
    const clientRequest = hcnStreams.clientRequest;
    const clientResponse = hcnStreams.clientResponse;


    clientResponse
      .pipe(zlib.createGunzip()) // unzip
      .pipe(process.stdout);

    // console.log(util.inspect(answer, false, 3, true));

  } catch (err) {
    throw err;
  }
};


getJSON().catch(console.error);




