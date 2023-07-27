/**
 * Get answer.res.content as buffer. The buffer content can be used in FormData: const fd = new Formdata(); fd.append('file', answer.res.content)
 * $ node 12askOnce_file.js <url>
 * $ node 12askOnce_file.js https://adsuu.com/pics/classifieds.png
 */
const util = require('util');
const HttpClient = require('../HttpClient.js');
const url = process.argv[2];

console.log('asked url:: GET', url);


const getFile = async () => {
  const opts = {
    encodeURI: false,
    encoding: 'utf8',
    timeout: 8000,
    retry: 0,
    retryDelay: 5500,
    maxRedirects: 0,
    // headers,
    decompress: false,
    bufferResponse: true,
    debug: false
  };
  const hcn = new HttpClient(opts); //  http client instance
  const answer = await hcn.askOnce(url);
  console.log(`\nanswer:`, util.inspect(answer, false, 3, true)); // content: <Buffer 89 50 4e 47 0d 0a 1a 0a 00 00 00 0d 49 48 44 ...
};


getFile().catch(console.log);
