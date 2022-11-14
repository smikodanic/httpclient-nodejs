/**
 * $ node 05setHeaders.js
 */

const HttpClient = require('../HttpClient.js');
const httpClient = new HttpClient();

// default headers
console.log('headers_before:: ', httpClient.getHeaders());

// content-type and accept headers will be overwritten while others will stay same
httpClient.setHeaders({
  'Content-Type': 'application/json; charset=utf-8',
  'Accept': 'application/json'
});

// headers after change
console.log('headers_after:: ', httpClient.getHeaders());
