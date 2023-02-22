/**
 * $ node 20ask_GET.js <url>
 *
 * // redirection test
 * $ node 20ask_GET.js ebay.com
 *
 * // timeout test
 * set opts.timeout = 10;
 */

const util = require('util');
const HttpClient = require('../HttpClient.js');
const url = process.argv[2];

console.log('asked url:: GET', url);


const getUrl = async () => {

  const opts = {
    encodeURI: false,
    encoding: 'utf8',
    timeout: 3000,
    retry: 2,
    retryDelay: 2100,
    maxRedirects: 3,
    headers: {
      'authorization': '',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
      'accept': '*/*', // 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
      'cache-control': 'no-cache',
      'host': '',
      'accept-encoding': 'gzip',
      'connection': 'close', // keep-alive
      'content-type': 'text/html; charset=UTF-8'
    },
    debug: false
  };


  try {
    const hcn = new HttpClient(opts); // http client instance
    const answers = await hcn.ask(url);

    console.log('answers:: ');
    console.log(util.inspect(answers.map(a => { a.res.content = a.res.content ? a.res.content.length : 0; return a; }), false, 3, true));

  } catch (err) {
    throw err;
  }
};


getUrl().catch(console.error);




