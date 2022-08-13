const { HttpClient, RobotsTxt } = require('../../index.js');

const robotsTxt = new RobotsTxt(HttpClient);


const fja = async () => {
  // const url = 'https://www.yahoo.com/lifestyle/mom-makes-upsetting-discovery-walmart-134505752.html';
  const url = 'https://www.dex8.com';

  const robotsText = await robotsTxt.fetch(url);
  console.log('robotsText::');
  console.log(robotsText);

  const robotsTextObj = robotsTxt.parse(robotsText);
  console.log('robotsTextObj::', robotsTextObj);

  const follow_urls = robotsTxt.whatToFollow(robotsTextObj, '*');
  console.log('follow_urls::', follow_urls);

  const unfollow_urls = robotsTxt.whatToUnfollow(robotsTextObj, '*');
  console.log('unfollow_urls::', unfollow_urls);
};

fja();
