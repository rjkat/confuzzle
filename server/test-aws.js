const AWS = require('aws-sdk');
const nanoid = require('nanoid');
s3 = new AWS.S3();

const objID = nanoid.nanoid();
s3.putObject({
  ACL: 'public-read',
  Bucket: 'urls.confuzzle.me',
  Key: objID,
  WebsiteRedirectLocation: 'https://confuzzle.app?puz=https%3A%2F%2Fwww.dropbox.com%2Fs%2Fecfa9awe6db34eg%2Fnobees.puz%3Fdl%3D1'
}, function(err, data) {
  if (err) console.log(err, err.stack);
  else     console.log(data);
});

console.log('https://grids.confuzzle.me/' + objID)