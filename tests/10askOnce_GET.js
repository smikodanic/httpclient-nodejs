/**
 * $ node 10askOnce_GET.js <url>
 * $ node 10askOnce_GET.js http://www.adsuu.com
 * $ node 10askOnce_GET.js http://api.dex8.com
 */
const util = require('util');
const HttpClient = require('../HttpClient.js');
const url = process.argv[2];

console.log('asked url:: GET', url);


const getUrl = async () => {
  const hcn = new HttpClient(); //  http client instance
  const answer = await hcn.askOnce(url);
  console.log('answer:');
  console.log(util.inspect(answer, false, 3, true));
};


getUrl().catch(console.log);




