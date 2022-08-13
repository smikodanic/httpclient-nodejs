/**
 * $ node 05setHeaders.js
 */

const HttpClient = require('../index.js');
const httpClient = new HttpClient();

// default headers
console.log('headers_before:: ', httpClient.getHeaders());

httpClient.delHeaders(['user-agent', 'accept', 'x-nonsense']);

// headers after change
console.log('headers_after:: ', httpClient.getHeaders());
