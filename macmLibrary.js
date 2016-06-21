var request = require("request")

// TODO:
// - reuse auth cookies between requests
//   - not as necessary now, but will be very useful if we download entire libraries


/**
 * Returns a url that is generated from the given portal login options
 *
 * @param options An object with the following properties:
 *                + protocol: http|https
 *                + port: port of the portal server, defaults to 10039
 *                + contextRoot: defaults to "wps"
 *                + handler|mycontenthandler: defaults to "myportal"
 *                + tenant: (optional) The tenant on the portal server. Should
 *                          be used with virtual portals.
 *                + params: an object that contains the key/value pairs for url queries
 *
 * @returns {string}
 */
var makeUrl = function(options) {
  var protocol = options.protocol || "http";
  var host = options.host || "localhost";
  var port = options.port || 10039;
  var contextRoot = options.contextRoot || "wps";
  var handler = options.handler || options.mycontenthandler || "myportal";
  var params = options.params || {};
  var tenant = options.tenant || "";
  
  if (tenant && tenant[tenant.length - 1] != "/") {
    tenant = tenant + "/";
  }
  var url = protocol + "://" + host + ":" + port + "/" + contextRoot + "/" + handler + "/" + tenant + "caas";
  var paramArr = Object.keys(params).map(function(key) {
    return key + "=" + params[key];
  });
  
  if (paramArr.length) {
    return url + "?" + paramArr.join("&");
  } else {
    return url;
  }
}

/**
 * callback(err, cookies) - cookies is a list of cookies
 */
var requestAuthCookies = function(options, callback) {
  var opt = clone(options);
  opt.handler = "mycontenthandler";
  opt.params = { uri : "login:basicauth" }
  var url = makeUrl(opt);
    
  url = url.replace(/\/caas/, "");
  request({
    uri: url,
    method: "POST",
    auth: {
      user: options.username || options.user,
      pass: options.password || options.pass
    }
  }, function(err, response, body) {
    if (err) {
      callback && callback(err)
    } else {
      // make sure that only the cookie doesn't have any extra characters
      var cookies = response.headers["set-cookie"].map(function(cookie) {
        return cookie.match(/^[^;]+/)[0];
      });
      callback && callback(null, cookies);
    }
  });
};

/**
 * callback(err, response, body)
 */
var requestMacm = function(options, callback) {
  var url = makeUrl(options);
  requestAuthCookies(options, function(err, cookies) {
    if (err) {
      callback && callback(err);
    } else {
      request({
        uri: url,
        headers: {
          Cookie: cookies.join("; ")
        }
      }, callback);
    }
  });
};

/**
 * Gets list of all content in a library from MACM server.
 *
 * @param options Portal login options
 * @param libName Name of the library
 * @param callback
 */
var getContentList = function(options, libName, callback) {
  var opt = clone(options);
  opt.params = {
    urile: "wcm:path:" + libName + "/views/all",
    current: "true",
    "mime-type": "application/json",
    //"ibm.type.information": "true",
    "ibm.property.keys": "title,id,name,contenttype" // what else will be needed ...? This is good for now
  };
  requestMacm(opt, function(err, response, body) {
    if (err) {
      callback && callback(err);
    } else {
      try {
        var result = JSON.parse(body.toString());
        callback(null, result);
      } catch (e) {
        callback(e);
      }
    }
  })  
}

/**
 * Downloads a content item from its id. 
 * Note: it doesn't download images directly but gives a path to the image instead
 */
var getContentById = function(options, id, callback) {
  var opt = clone(options);
  opt.params = {
    urile: "wcm:oid:" + id,
    current: "true",
    "mime-type": "application/json",
    "ibm.type.information": "true",
    "ibm.element.keys": "_all",
    "ibm.property.keys": "authtemplateid,authtemplatename,authtemplatetitle,authors,categories,creationdate,creator,currentstage,description,expirydate,id,keywords,lastmodifieddate,lastmodifier,libraryid,libraryname,librarytitle,name,parentid,parentname,parenttitle,projectid,projectname,projecttitle,publishdate,status,statusid,title,contenttype."
  };
  requestMacm(opt, function(err, response, body) {
    if (err) {
      callback && callback(err);
    } else {
      try {
        var result = JSON.parse(body.toString());
        callback(null, result);
      } catch (e) {
        callback(e);
      }
    }
  })  
};

var getImage = function(options, path, callback) {
  var buffer = [];
  var resp;
  requestAuthCookies(options, function(err, cookies) {
    if (err) {
      callback && callback(err);
    } else {
      request.get({
        uri: options.protocol + "://" + options.host + ":" + options.port + path,
        headers: {
          Cookie: cookies.join("; "),
          Connection: "keep-alive"
        }
      }).on('response', function(response) {
        resp = response;
      }).on("data", function(data) {
        buffer.push(data);
      }).on("end", function() {
        buffer = Buffer.concat(buffer);
        callback(null, resp, buffer);
      }).on("error", function(err) {
        console.log(err)
      })
    }
  });
};

/**
 * callback(err, libraryList)
 * - libraryList: list of the names of all libraries on the server
 */
var getLibraryList = function(options, callback) {
  var opt = clone(options);
  opt.handler = "mycontenthandler";
  var url = makeUrl(opt);
  var user = options.username || options.user;
  var pass = options.password || options.pass;
  
  url = url.replace(/:\/\//, "://" + user + ":" + pass + "@");
  url = url.replace("/caas", "");
  url = url + "/!ut/p/digest!/wcmrest/query?type=Library&pagesize=1000";

  request({
    uri: url,
    headers: {
      Accept: "application/json"
    }
  }, function(err, response, body) {
    if (err) {
      callback && callback(err);
    } else {
      var result = JSON.parse(body.toString());
      var titles = result.feed.entry.map(function(entry) {
        return entry.title
      });
      callback && callback(null, titles)
    }
  })
};

module.exports = {
  getContentList: getContentList,
  getContentById: getContentById,
  getLibraryList: getLibraryList,
  getImage: getImage
};

function clone(obj) {
  // fastest way to clone objects (that don't contain functions)
  return JSON.parse(JSON.stringify(obj));
}
