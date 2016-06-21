/**************************************************/
/* Test calling service                           */
/**************************************************/
var request = require('request')

//var username = '5613239548197131'
//var password = 'LdYXW(.280'

var options = {
 url: 'http://localhost:4321/properties/2001',
}

request(options, function (err, res, body) {
  if (err) {
    console.dir(err)
    return
  }
  console.log('headers', res.headers)
  console.log('status code', res.statusCode)
  console.log(body)
})
