/**************************************************/
/* This works with MACM                           */
/**************************************************/
//npm install -S request

var request = require('request')

//var username = '5613239548197131'
//var password = 'LdYXW(.280'
var username = '5613067566776991'
var password = 'ywTuv-(296'

var options = {
 url: 'https://macm.saas.ibmcloud.com/wps/myportal/vp7131/caas?urile=wcm%3Apath%3Akidbrix%20library/views/all&current=true&mime-type=application/json',
  auth: {
    user: username,
    password: password
  },
  headers: {
    'Cookie': 'ibm.login.type=basicauth'
  },
  jar: 'true'

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
