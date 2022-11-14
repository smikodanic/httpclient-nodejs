/**
 * $ node 07delHeaders.js
 */

const HttpClient = require('../HttpClient.js');
const httpClient = new HttpClient();

// default headers
console.log('headers_before:: ', httpClient.getHeaders());

httpClient.delHeaders(['user-agent', 'Accept', 'x-nonsense']);

// headers after change
console.log('headers_after:: ', httpClient.getHeaders());
