const { HttpClient, RobotsTxt } = require('../../index.js');

const robotsTxt = new RobotsTxt(HttpClient);


const fja = async () => {
  const url = 'https://www.yahoo.com/lifestyle/mom-makes-upsetting-discovery-walmart-134505752.html';

  const robotsText = await robotsTxt.fetch(url);
  console.log('robotsText::');
  console.log(robotsText);

  const robotsTextObj = robotsTxt.parse(robotsText);
  console.log('robotsTextObj::', robotsTextObj);
};

fja();

