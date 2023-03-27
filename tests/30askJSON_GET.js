/**
 * $ node 30askJSON_GET.js <url>
 * $ node 30askJSON_GET.js https://jsonplaceholder.typicode.com/posts/1
 */
const util = require('util');
const HttpClient = require('../HttpClient.js');
const url = process.argv[2];
console.log('asked url:: GET', url);


const getJSON = async () => {
  const opts = {
    encodeURI: false,
    encoding: 'utf8',
    timeout: 3000,
    retry: 1,
    retryDelay: 1300,
    maxRedirects: 0,
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36', // 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36'
      'accept': '*/*', // 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
      'cache-control': 'no-cache',
      'accept-encoding': 'gzip',
      'connection': 'close', // keep-alive
      'content-type': 'text/html; charset=UTF-8'
    },
    debug: false
  };

  try {
    const hcn = new HttpClient(opts);
    const answer = await hcn.askJSON(url, 'GET');

    console.log('answer:');
    console.log(util.inspect(answer, false, 3, true));


    // another request
    const answer2 = await hcn.askJSON('https://jsonplaceholder.typicode.com/posts/2');
    console.log('\n\nanswer2::', answer2);

  } catch (err) {
    throw err;
  }
};


getJSON().catch(console.error);




