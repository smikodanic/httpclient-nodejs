/**
 * Proxy server with used grabStreams() method.
 * BROWSER --> PROXY --> ORIGHOST
 * $ node 81proxy_grabStreams.js
 * Then open in the browser: http://loachost:22222
 */
const HttpClient = require('../HttpClient.js');
const http = require('http');


const port = 2222;
const baseURL = 'http://www.regoch.org';
// const baseURL = 'http://www.adsuu.com';
// const baseURL = 'https://www.yahoo.com';
// const baseURL = 'https://www.youtube.com';

console.log(`Proxy request from http://localhost:${port} to ${baseURL}`);


const proxyServer = http.createServer().listen(port);

proxyServer.on('request', async (proxyServer_req, proxyServer_res) => {
  const urlObj = new URL(proxyServer_req.url, baseURL);
  const url = urlObj.toString(); // https://www.adsuu.com/category/

  // timeout on bad URL
  proxyServer_req.setTimeout(5000);

  // define headers which will be sent to orighost
  const headers = proxyServer_req.headers;
  headers.host = urlObj.host;

  // forward request to original host
  const opts = {
    encodeURI: false,
    encoding: 'utf8',
    timeout: 8000,
    retry: 0,
    retryDelay: 5500,
    maxRedirects: 0,
    headers,
    nodejsObjects: true, // REQUIRED to be true
    debug: false
  };
  const hcn = new HttpClient(opts);

  // get request & response to origserver as stream objects
  const hcnStreams = await hcn.grabStreams(url).catch(err => {
    console.log(err);
    proxyServer_res.end(err.message); // send message when orighost has bad URL, i.e. baseURL is wrong, for example http://www.nonsense-xyz.com
  });

  if (!hcnStreams) { return; }
  const clientRequest = hcnStreams.clientRequest;
  const clientResponse = hcnStreams.clientResponse;

  proxyServer_res.writeHeader(clientResponse.statusCode, clientResponse.headers);
  clientResponse.pipe(proxyServer_res);
  proxyServer_req.pipe(clientRequest);

  console.log('clientRequest.headers::', clientRequest.getHeaders());
  console.log('clientResponse.headers::', clientResponse.headers);
  // clientResponse.pipe(process.stdout); // will print HTML

});

