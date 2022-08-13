/**
 * $ node 05setHeaders.js
 */

const HttpClient = require('../HttpClient.js');
const httpClient = new HttpClient();

// default headers
console.log('headers_before:: ', httpClient.getHeaders());

httpClient.setHeader('user-agent', 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)');

// headers after change
console.log('headers_after:: ', httpClient.getHeaders());
