const url_node = require('url');


/**
 * Fetch and parse robots.txt
 */
class RobotsTxt {

  constructor(HttpClient) {
    this.HttpClient = HttpClient;
  }


  /**
   * Get text (content) of the robots.txt file.
   * @param {string} url  - base URL or some URL: www.yahoo.com , www.ads.com/some/path
   * @param {string} opts  - HttpClient options
   * @return {string} - robots.txt content
   */
  async fetch(url, opts) {
    // define base_url & url for  robots.txt
    const urlObj = new url_node.URL(url);
    this.base_url = urlObj.protocol + '//' + urlObj.host;
    this.robotsTxt_url = url_node.resolve(this.base_url, 'robots.txt');

    opts = opts || {
      encodeURI: false,
      timeout: 8000,
      retry: 0,
      retryDelay: 2100,
      maxRedirects: 5,
      headers: {
        'authorization': '',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Safari/537.36',
        'accept': '*/*', // 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
        'cache-control': 'no-cache',
        'host': '',
        'accept-encoding': 'gzip',
        'connection': 'close', // keep-alive
        'content-type': 'text/plain; charset=UTF-8'
      }
    };
    const hcn = new this.HttpClient(opts);
    const answers = await hcn.ask(this.robotsTxt_url);

    const robotsText = answers[answers.length - 1].res && answers[answers.length - 1].res.content ? answers[answers.length - 1].res.content : ''; // get last answer in case of 301 redirection
    if (!robotsText) { throw new Error(`Not found ${this.robotsTxt_url}`); }

    return robotsText;
  }


  /**
   * Convert robots.txt file into JS object.
   * https://developers.google.com/search/reference/robots_txt
   * @param {string} url  - base URL or some URL: www.yahoo.com , www.ads.com/some/path
   * @return {object} - robots.txt in JS object format
   */
  parse(robotsTxt) {
    const robotsText_obj = {};

    const lines = robotsTxt.split('\n'); // [ 'User-agent: *', 'Disallow:', '' ]

    let userAgent; // User-agent value in robots.txt

    lines.forEach(line => {
      const keyval_arr = line.split(':'); // ['User-agent', 'Googlebot']

      // don't parse array without 2 elements
      if (keyval_arr.length !== 2) { return; }

      const key = keyval_arr[0].trim().toLowerCase(); // 'user-agent'
      let val = keyval_arr[1].trim(); // Googlebot

      if (/user-agent/i.test(line)) { // User-agent: Googlebot
        userAgent = val;
        robotsText_obj[val] = {
          allow: [],
          disallow: []
        };
      } else if (/host/i.test(line)) {
        val = val.replace(/\*/g, '.*'); // replace * with .*
        robotsText_obj[userAgent].host = val;
      } else if (/^allow/i.test(line)) {
        val = val.replace(/\*/g, '.*'); // replace * with .*
        robotsText_obj[userAgent].allow.push(val);
      } else if (/^disallow/i.test(line)) {
        robotsText_obj[userAgent].disallow.push(val);
      } else if (/sitemap/i.test(line)) {
        robotsText_obj[userAgent].sitemap.push(val);
      } else if (/crawl-delay/i.test(line)) {
        robotsText_obj[userAgent].crawlDelay.push(val);
      }

    });

    return robotsText_obj;
  }



  /**
   * Determine which URLs (links) to follow.
   * Notice that * in robots.txt is replaced with regular expression .*
   * Also relative URLs are converted to absolute.
   * @param {object} robotsTextObj - robots.txt as JS object
   * @param {string} botName - bot name defined in robots.txt (Googlebot, baiduspider, bingbot, slurp, yandex)
   * @return {string[]}
   */
  whatToFollow(robotsTextObj, botName = '*') {
    const follow_urls = [];

    // if botName is not defined then use general directives
    const userAgent = botName;

    // if user-agent is not defined in the robots.txt then use general user-agent: *
    const userAgentObj = !!robotsTextObj[userAgent] ? robotsTextObj[userAgent] : robotsTextObj['*'];

    if (!!userAgentObj && !!userAgentObj.allow.length) {
      userAgentObj.allow.forEach(relativeURL => {
        if (!relativeURL) { return; }
        const absoluteURL = url_node.resolve(this.base_url, relativeURL);
        follow_urls.push(absoluteURL);
      });
    }

    return follow_urls;
  }



  /**
   * Determine which URLs (links) not to follow.
   * Notice that * in robots.txt is replaced with regular expression .*
   * Also relative URLs are converted to absolute.
   * @param {object} robotsTextObj - robots.txt as JS object
   * @param {string} botName - bot name defined in robots.txt (Googlebot, baiduspider, bingbot, slurp, yandex)
   * @return {string[]}
   */
  whatToUnfollow(robotsTextObj, botName = '*') {
    const unfollow_urls = [];

    // if botName is not defined then use general directives
    const userAgent = botName;

    // if user-agent is not defined in the robots.txt then use general user-agent: *
    const userAgentObj = !!robotsTextObj[userAgent] ? robotsTextObj[userAgent] : robotsTextObj['*'];

    if (!!userAgentObj && !!userAgentObj.disallow.length) {
      userAgentObj.disallow.forEach(relativeURL => {
        if (!relativeURL) { return; }
        const absoluteURL = url_node.resolve(this.base_url, relativeURL);
        unfollow_urls.push(absoluteURL);
      });
    }

    return unfollow_urls;
  }




}




module.exports = RobotsTxt;
