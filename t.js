var request = require("request")
var getContentList = require('./testMacm.js').getContentList
var getContentById = require('./testMacm.js').getContentById
var getLibraryList = require('./testMacm.js').getLibraryList

var options = 
  {
    host:     'macm.saas.ibmcloud.com',
    //username: '1213239548197131',
    //password: 'abXHQ)_91',
    username: '5613239548197131',
    password: 'LdYXW(.280',
    tenant:   'vp7131'
  }

getContentList(options, "kidbrix library", function(err, body) 
{
    if (err) 
    {
      console.log(err);
      console.log("In error handler after call to getContentList");
    } 
    else 
    {
      console.log("Return from getContentList");
    } 
});


