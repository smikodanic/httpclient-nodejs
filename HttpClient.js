/**
 * Simple but powerful HTTP client for NodeJS.
 */
const http = require('http');
const https = require('https');
const url_node = require('url');
const zlib = require('zlib');
const pkg_json = require('./package.json');


class HttpClient {

  /**
   * @param {object} opts - HTTP Client options {encodeURI, timeout, retry, retryDelay, maxRedirects, headers}
   * @param {object} proxyAgent - proxy agent (https://www.npmjs.com/package/https-proxy-agent)
   */
  constructor(opts, proxyAgent) {
    this.url;
    this.protocol = 'http:';
    this.hostname = '';
    this.port = 80;
    this.pathname = '/';
    this.queryString = '';
    this.queryObject = {};

    if (!opts || (!!opts && !Object.keys(opts).length)) {
      this.opts = {
        debug: false, // show debug messages
        encodeURI: false,
        encoding: 'utf8', // use 'binary' for PDF files, and revert it to buffer with Buffer.from(answer.res.content, 'binary')
        timeout: 8000,
        retry: 3,
        retryDelay: 5500,
        maxRedirects: 3,
        headers: {
          'authorization': '',
          'user-agent': `HttpClient-NodeJS/${pkg_json.version} https://github.com/smikodanic/httpclient-nodejs`, // 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36'
          'accept': '*/*', // 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
          'cache-control': 'no-cache',
          'host': '',
          'accept-encoding': 'gzip',
          'connection': 'close', // keep-alive
          'content-type': 'text/html; charset=UTF-8'
        }
      };
    } else {
      this.opts = opts;
      this.opts.encoding = this.opts.encoding || 'utf8';
      this.opts.timeout = this.opts.timeout || 8000;
      this.opts.retry = this.opts.retry || 3;
      this.opts.retryDelay = this.opts.retryDelay || 5500;
      this.opts.maxRedirects = this.opts.maxRedirects || 3;
      this.opts.headers = this.opts.headers || {
        'authorization': '',
        'user-agent': `HttpClient-NodeJS/${pkg_json.version} https://github.com/smikodanic/httpclient-nodejs`, // 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36'
        'accept': '*/*', // 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
        'cache-control': 'no-cache',
        'host': '',
        'accept-encoding': 'gzip',
        'connection': 'close', // keep-alive
        'content-type': 'text/html; charset=UTF-8'
      };
    }

    // default request headers
    this.headers = this.opts.headers;

    // proxy agent
    this.proxyAgent = proxyAgent;
  }



  /********** PRIVATES *********/

  /**
   * Parse url.
   * @param {string} url - http://www.adsuu.com/some/thing.php?x=2&y=3
   */
  _parseUrl(url) {
    url = this._correctUrl(url);
    const urlObj = new url_node.URL(url);
    this.url = url;
    this.protocol = urlObj.protocol;
    this.hostname = urlObj.hostname;
    this.port = urlObj.port;
    this.pathname = urlObj.pathname;
    this.queryString = urlObj.search;
    this.queryObject = urlObj.searchParams;

    // debug
    if (this.opts.debug) {
      console.log('this.url:: ', this.url); // http://localhost:8001/www/products?category=mačke
      console.log('this.protocol:: ', this.protocol); // http:
      console.log('this.hostname:: ', this.hostname); // localhost
      console.log('this.port:: ', this.port); // 8001
      console.log('this.pathname:: ', this.pathname); // /www/products
      console.log('this.queryString:: ', this.queryString); // ?category=mačke
      console.log('this.queryObject:: ', this.queryObject); // { 'category' => 'mačke' }
    }

    return url;
  }


  /**
   * URL corrections
   */
  _correctUrl(url) {
    if (!url) { throw new Error('URL is not defined'); }

    // 1. trim from left and right
    url = url.trim();

    // 2. add protocol
    if (!/^https?:\/\//.test(url)) {
      url = 'http://' + url;
    }

    // 3. remove multiple empty spaces and insert %20
    if (this.opts.encodeURI) {
      url = encodeURI(url);
    } else {
      url = url.replace(/\s+/g, ' ');
      url = url.replace(/ /g, '%20');
    }

    return url;
  }


  /**
   * Convert string into integer, float or boolean.
   * @param {string} value
   * @returns {string|number|boolean|object}
   */
  _typeConvertor(value) {
    function isJSON(str) {
      try { JSON.parse(str); }
      catch (err) { return false; }
      return true;
    }

    if (!!value && !isNaN(value) && value.indexOf('.') === -1) { // convert string into integer (12)
      value = parseInt(value, 10);
    } else if (!!value && !isNaN(value) && value.indexOf('.') !== -1) { // convert string into float (12.35)
      value = parseFloat(value);
    } else if (value === 'true' || value === 'false') { // convert string into boolean (true)
      value = JSON.parse(value);
    } else if (isJSON(value)) {
      value = JSON.parse(value);
    }

    return value;
  }



  /**
   * Create query object from query string.
   * @param  {string} queryString - x=abc&y=123&z=true
   * @return {object}             - {x: 'abc', y: 123, z: true}
   */
  _toQueryObject(queryString) {
    const queryArr = queryString.replace(/^\?/, '').split('&');
    const queryObject = {};

    let eqParts, property, value;
    queryArr.forEach(elem => {
      eqParts = elem.split('='); // equotion parts
      property = eqParts[0];
      value = eqParts[1];

      value = this._typeConvertor(value); // t y p e   c o n v e r s i o n
      value = !this.opts.encodeURI ? decodeURI(value) : value;

      if (!!property) { queryObject[property] = value; }
    });

    return queryObject;
  }


  /**
   * Choose http or https NodeJS libraries.
   */
  _selectRequest() {
    let requestLib;
    if (/^https/.test(this.protocol)) {
      requestLib = https.request.bind(https);
    } else {
      requestLib = http.request.bind(http);
    }
    return requestLib;
  }


  /**
   * Create new http/https agent https://nodejs.org/api/http.html#http_new_agent_options
   * @param {Object} opts
   */
  _hireAgent(opts) {
    // default agent options https://nodejs.org/api/http.html#http_new_agent_options
    const options = {
      timeout: opts.timeout, // close socket on certain period of time
      keepAlive: false, // keep socket open so it can be used for future requests without having to reestablish new TCP connection (false)
      keepAliveMsecs: 1000, // initial delay to receive packets when keepAlive:true (1000)
      maxSockets: Infinity, // max allowed sockets (Infinity)
      maxFreeSockets: 256, // max allowed sockets to leave open in a free state when keepAlive:true (256)
    };

    let agent;
    if (!!this.proxyAgent) { agent = this.proxyAgent; }
    else { agent = /^https/.test(this.protocol) ? new https.Agent(options) : new http.Agent(options); }

    return agent;
  }


  /**
   * Kill the agent when it finish its job.
   */
  _killAgent(agent) {
    agent.destroy();
  }


  /**
   * Beautify error messages.
   * @param {Error} error - original error
   * @return formatted error
   */
  _formatError(error, url) {
    const err = new Error(error);

    // reformatting NodeJS errors
    if (error.code === 'ENOTFOUND') {
      err.status = 404;
      err.message = `404 Bad Request [ENOTFOUND] ${url}`;
    } else if (error.code === 'ECONNREFUSED') {
      err.status = 400;
      err.message = `400 Bad Request [ECONNREFUSED] ${url}`;
    } else if (error.code === 'ECONNRESET') {
      err.status = 500;
      err.message = `500 No Server Response [ECONNRESET] ${url}`; // replacing: Error: socket hang up
    } else if (error.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
      err.status = 400;
      err.message = `400 Bad Request [ERR_TLS_CERT_ALTNAME_INVALID] ${error.reason}`;
    } else if (error.status === 404) {
      err.status = 404;
      err.message = `404 Not Found ${url}`;
    } else {
      err.status = error.status || 400;
      err.message = error.message;
    }

    err.original = error;

    return err; // formatted error is returned
  }


  /**
   * Get current date/time
   */
  _getTime() {
    const d = new Date();
    return d.toISOString();
  }


  /**
   * Get time difference in seconds
   */
  _getTimeDiff(start, end) {
    const ds = new Date(start);
    const de = new Date(end);
    return (de.getTime() - ds.getTime()) / 1000;
  }




  /********** REQUESTS *********/

  /**
   * Sending one HTTP request to HTTP server.
   *  - 301 redirections are not handled.
   *  - retries are not handled
   * @param {string} url - https://www.adsuu.com/contact
   * @param {string} method - GET, POST, PUT, DELETE, PATCH
   * @param {object} body_obj - http body payload
   */
  askOnce(url, method = 'GET', body_obj) {
    // answer (response object)
    const answer = {
      requestURL: url,
      requestMethod: method,
      status: 0,
      statusMessage: '',
      httpVersion: undefined,
      gzip: false,
      https: false,
      // remoteAddress: // TODO
      // referrerPolicy: // TODO
      req: {
        query: {},
        headers: this.headers,
        payload: undefined
      },
      res: {
        headers: undefined,
        content: undefined
      },
      time: {
        req: this._getTime(),
        res: undefined,
        duration: undefined
      }
    };


    // check and correct URL
    try {
      url = this._parseUrl(url);
      answer.requestURL = url;
      answer.https = /^https/.test(this.protocol);
      answer.req.query = this._toQueryObject(this.queryString); // from ?a=sasa&b=2 => {a:'sasa', b:2}
    } catch (err) {
      // if URL is not properly defined
      const ans = { ...answer }; // clone object to prevent overwrite of object properies once promise is resolved
      ans.status = 400; // client error - Bad Request
      ans.statusMessage = err.message || 'Bad Request';
      ans.time.res = this._getTime();
      ans.time.duration = this._getTimeDiff(ans.time.req, ans.time.res);

      return ans; // send answer and stop further execution
    }


    const agent = this._hireAgent(this.opts);
    const requestLib = this._selectRequest();



    /*** 1) init HTTP request ***/
    // http.request() options https://nodejs.org/api/http.html#http_http_request_url_options_callback
    const requestOpts = {
      agent,
      hostname: this.hostname,
      port: this.port,
      path: this.pathname + this.queryString,
      method,
      headers: this.headers
    };

    let clientRequest;
    if (/GET/i.test(method)) {  // GET  - no body
      clientRequest = requestLib(requestOpts);

    } else { // POST, PUT, DELETE, ... - with body
      answer.req.payload = body_obj;

      const body_str = JSON.stringify(body_obj);
      const contentLength = Buffer.byteLength(body_str, this.opts.encoding);
      this.headers['content-length'] = contentLength;
      requestOpts.headers['content-length'] = contentLength;

      clientRequest = requestLib(requestOpts);
      clientRequest.write(body_str, this.opts.encoding);
    }



    const promise = new Promise((resolve, reject) => {
      /*** 3.A) successful response ***/
      clientRequest.on('response', res => {
        // collect raw data e.g. buffer data
        const buf_chunks = [];
        res.on('data', (buf_chunk) => {
          buf_chunks.push(buf_chunk);
        });


        const resolveAnswer = () => {
          // concat buffer parts
          const buf = Buffer.concat(buf_chunks);

          // decompress
          let gzip = false;
          let gunziped = buf;
          if (!!res.headers['content-encoding'] && res.headers['content-encoding'] === 'gzip') {
            try {
              gunziped = zlib.gunzipSync(buf);
            } catch (err) {

            }
            gzip = true;
          }

          // convert buffer to string
          let content = gunziped.toString(this.opts.encoding);

          // convert string to object if content is in JSON format
          let contentObj;
          try {
            contentObj = JSON.parse(content);
            if (!!contentObj) { content = contentObj; }
          } catch (err) { }

          // format answer
          const ans = { ...answer }; // clone object to prevent overwrite of object properies once promise is resolved
          ans.status = res.statusCode; // 2xx -ok response, 4xx -client error (bad request), 5xx -server error
          ans.statusMessage = res.statusMessage;
          ans.httpVersion = res.httpVersion;
          ans.gzip = gzip;
          ans.res.headers = res.headers;
          ans.res.content = content;
          ans.time.res = this._getTime();
          ans.time.duration = this._getTimeDiff(ans.time.req, ans.time.res);
          resolve(ans);

          this._killAgent(agent);
        };


        // when server sends normal response
        res.on('end', resolveAnswer);

        // when server sends HTTP header Connection: 'keep-alive' the res.on('end', ...) is never fired
        setTimeout(resolveAnswer, this.opts.timeout);

      });


      /*** 3.B) on timeout (no response from the server) ***/
      clientRequest.setTimeout(this.opts.timeout);
      clientRequest.on('timeout', () => {
        this._killAgent(agent);

        // format answer
        const ans = { ...answer }; // clone object to prevent overwrite of object properies once promise is resolved
        ans.status = 408; // 408 - timeout
        ans.statusMessage = `Request aborted due to timeout (${this.opts.timeout} ms) ${url} `;
        ans.time.res = this._getTime();
        ans.time.duration = this._getTimeDiff(ans.time.req, ans.time.res);

        resolve(ans);
      });


      /*** 3.C) on error (only if promise is not resolve by timeout - prevent resolving twice)***/
      clientRequest.on('error', error => {
        this._killAgent(agent);
        const err = this._formatError(error, url);

        // format answer
        const ans = { ...answer }; // clone object to prevent overwrite of object properies once promise is resolved
        ans.status = err.status;
        ans.statusMessage = err.message;
        ans.time.res = this._getTime();
        ans.time.duration = this._getTimeDiff(ans.time.req, ans.time.res);

        // do not resolve if it's already resolved by timeout
        resolve(ans);
      });



    });

    /*** 4) finish with sending request */
    clientRequest.end();



    return promise;


  } // \askOnce



  /**
   * Sending HTTP request to HTTP server.
   *  - 301 redirections are handled.
   *  - retries are handled
   * @param {string} url - https://www.adsuu.com/contact
   * @param {string} method - GET, POST, PUT, DELETE, PATCH
   * @param {object} body_obj - http body
   */
  async ask(url, method = 'GET', body_obj) {

    let answer = await this.askOnce(url, method, body_obj);
    const answers = [answer];


    /*** a) HANDLE 3XX REDIRECTS */
    let redirectCounter = 1;

    while (!!answer && /^3\d{2}/.test(answer.status) && redirectCounter <= this.opts.maxRedirects) { // 300, 301, 302, ...
      const from = url;
      const to = answer.res.headers.location || '';
      const url_new = url_node.resolve(from, to); // redirected URL is in 'location' header
      this.opts.debug && console.log(`#${redirectCounter} redirection ${answer.status} from ${this.url} to ${url_new}`);

      answer = await this.askOnce(url_new, method, body_obj); // repeat request with new url
      answers.push(answer);

      redirectCounter++;
    }



    /*** b) HANDLE RETRIES when status = 408 timeout */
    let retryCounter = 1;

    while (answer.status === 408 && retryCounter <= this.opts.retry) {
      this.opts.debug && console.log(`#${retryCounter} retry due to timeout (${this.opts.timeout}) on ${url}`);
      await new Promise(resolve => setTimeout(resolve, this.opts.retryDelay)); // delay before retrial

      answer = await this.askOnce(url, method, body_obj);
      answers.push(answer);


      retryCounter++;
    }



    return answers;

  }



  /**
   *
   * @param {string} url - https://api.adsuu.com/contact
   * @param {string} method - GET, POST, PUT, DELETE, PATCH
   * @param {object|string} body - http body as Object or String type
   */
  async askJSON(url, method = 'GET', body) {

    // convert body string to object
    let body_obj = body;
    if (typeof body === 'string') {
      try {
        body_obj = JSON.parse(body);
      } catch (err) {
        throw new Error('Body string is not valid JSON.');
      }
    } else if (body === undefined || body === '') { // undefined or empty string
      body_obj = {};
    }

    // JSON request headers
    this.setHeaders({
      'content-type': 'application/json; charset=utf-8',
      'accept': 'application/json'
    });

    const answer = await this.askOnce(url, method, body_obj);
    return answer;
  }




  /********** HEADERS *********/
  /**
   * Change header object.
   * Previously defined this.headers properties will be overwritten.
   * @param {object} headerObj - {'authorization', 'user-agent', 'accept', 'cache-control', 'host', 'accept-encoding', 'connection'}
   */
  setHeaders(headerObj) {
    this.headers = Object.assign(this.headers, headerObj);
    this._lowercaseHeaders();
  }

  /**
   * Set (add/update) header.
   * Previously defined header will be overwritten.
   * @param {string} headerName - 'content-type' or 'Content-Type'
   * @param {string} headerValue - 'text/html; charset=UTF-8'
   */
  setHeader(headerName, headerValue) {
    const headername = headerName.toLowerCase();
    this.headers[headername] = headerValue;
    this._lowercaseHeaders();
  }

  /**
   * Delete header object.
   * @param {array} headerNames - array of header names    ['content-type', 'accept']
   */
  delHeaders(headerNames) {
    this._lowercaseHeaders();
    headerNames.forEach(headerName => {
      if (!headerName) { return; }
      delete this.headers[headerName.toLowerCase()];
    });
  }

  /**
   * Get active headers
   */
  getHeaders() {
    return this.headers;
  }

  /**
   * Set all header property names to lower case. Content-Type -> content-type
   */
  _lowercaseHeaders() {
    const headersCloned = { ...this.headers };
    this.headers = {};
    Object.keys(headersCloned).forEach(headerProp => {
      const headerprop = headerProp.toLowerCase();
      this.headers[headerprop] = headersCloned[headerProp];
    });
  }



}



module.exports = HttpClient;
