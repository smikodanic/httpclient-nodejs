/**
 * $ node 02correctUrl.js <url>
 * $ node 02correctUrl.js aduu.com?x=22   --> will return http://aduu.com?x=22
 */

const HttpClient = require('../HttpClient.js');
const url = process.argv[2];

console.log('url:: ', url);

const opts = {
  encodeURI: true
};

const httpClient = new HttpClient(opts);
const url2 = httpClient._correctUrl(url);

console.log('corrected url:: ', url2);
