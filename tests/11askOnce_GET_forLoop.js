/**
 * $ node 10askOnce_GET.js
 */
const util = require('util');
const HttpClient = require('../HttpClient.js');



const getUrl = async () => {
  const url = 'http://www.adsuu.com?x=čazma';
  const hcn = new HttpClient(); //  http client instance
  console.log('asked url:: GET', url);

  for (let i = 1; i <= 10; i++) {
    const answer = await hcn.askOnce(url);
    answer.res.content = answer.res.content ? answer.res.content.length : 0; // shorten the console.log
    console.log(`\n[${i}] answer:`, util.inspect(answer, false, 3, true));
  }

};


getUrl().catch(console.log);




