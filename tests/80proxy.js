/**
 * Pure proxy server with streams.
 * BROWSER --> PROXY --> ORIGHOST
 * $ node 80proxy.js
 * Then open in the browser: http://localhost:1111
 */
const http = require('http');
const https = require('https');
const stream = require('stream');

const port = 1111;
// const baseURL = 'http://www.adsuu.com';
const baseURL = 'https://www.dex8.com';
// const baseURL = 'https://mikosoft.info/';
// const baseURL = 'http://mikosoft.info/';
// const baseURL = 'https://www.google.com';
// const baseURL = 'https://www.ebay.com';

console.log(`Proxy request from http://localhost:${port} to ${baseURL}`);


const proxyServer = http.createServer().listen(port);

proxyServer.on('request', (proxyServer_req, proxyServer_res) => {
  const options = new URL(proxyServer_req.url, baseURL);
  options.headers = proxyServer_req.headers;
  options.headers.host = options.host;
  console.log('\n\noptions::', options);

  const nodeLib = /^https/.test(baseURL) ? https : http;

  const clientRequest = nodeLib.request(options, (clientResponse) => {
    proxyServer_res.writeHeader(clientResponse.statusCode, clientResponse.headers);
    clientResponse.pipe(proxyServer_res, { end: true });

    console.log('clientRequest.headers::', clientRequest.getHeaders());
    console.log('clientResponse.headers::', clientResponse.headers);
    console.log('Readable:::', clientResponse instanceof stream.Readable); // true
    console.log('Writable:::', clientResponse instanceof stream.Writable); // false
    // clientResponse.pipe(process.stdout); // will print HTML
  });
  proxyServer_req.pipe(clientRequest, { end: true });
});


