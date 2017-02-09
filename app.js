/********************************************************************************/
/* Name:       nextBestAction                                                   */
/*                                                                              */
/* Purpose:    Gets invoked by Presence Insights when an event occurs (enter,   */
/*             exit or dwell). In the demo story line we are keying on dwell    */
/*             events, although this code actually responds to any event in the */
/*             kbPoliceZone that is not an exit event. We then call into Mobile */
/*             Application Content Manger searching for offers that are assoc-  */
/*             iated with the theme category and police subcategory. We have    */
/*             two offers associated with those categories. In the demo we will */
/*             show two users, each getting a different offer. To do this, we   */ 
/*             have placed the name of the user at the end of the identifier    */
/*             used to register a phone with PI.  We use the name part to       */
/*             determine which offer to push to the user and we use the device  */
/*             identifier to push the offer to the phone via the Mobile First   */
/*             Push Adapter.                                                    */
/*                                                                              */
/* Interfaces: Invoked by Presence Insights                                     */
/*             Calls Mobile Application Content Manager                         */
/*             Sends push notification via Mobile First Platform                */
/*                                                                              */
/* Author:     Jim Williams                                                     */
/*                                                                              */
/********************************************************************************/
var http       = require('http');
var express    = require('express');
var bodyParser = require('body-parser');
var cfenv      = require('cfenv');
var request    = require('request');

/******************************************************/
/* Set up express                                     */
/******************************************************/
var app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // for parsing application/json

/******************************************************/
/* Set up push notification URL                       */
/******************************************************/
var pushHost     = '134.168.21.33';
var pushPort     = '9080';
var pushPath     = '/MobileFirstStarter/invoke';
var pushQString1 = "adapter=PushAdapter&procedure=sendDeviceNotification&parameters=['"
var pushParmsSep = "','";
var pushQString2 = "']";

var pushOptions  = "";
var pushUrl      = "";
var pushOffer    = "";

/******************************************************/
/* Set up Mobile Application Content Manager URL      */
/******************************************************/
var macmHost = "macm.saas.ibmcloud.com/wps/myportal/vp6991";
var macmQstring =  "/caas?urile=wcm%3Apath%3Akidbrix%20library/views/all&current=true&ibm.filter.categories.all=kidbrix+library%2fmacm%2ftheme%2fpolice&mime-type=application/json";

var macmUsername = "5613067566776991";
var macmPassword = "hpwPa_%823";

var macmUrl     = "https://" + macmHost + macmQstring;

var macmOptions = 
{
   url: macmUrl, 
   auth: {
      user: macmUsername,
      password: macmPassword
   },
   headers: {
      'Cookie': 'ibm.login.type=basicauth'
   },
   jar: 'true'
}
/**********************************************/
/* Handle the POSTs from Presence Insights.   */
/**********************************************/
app.post('/*', function (PIreq, PIres) 
{
    var mDate = new Date();
    var payload = PIreq.body;
    var device = "";
    var user = "";

    console.log('**********************************************************');
    console.log('POST from PI ==> Date:       ' + mDate);
    console.log('POST from PI ==> Site:       ' + payload.site.name);
    console.log('POST from PI ==> Floor:      ' + payload.floor.name);
    console.log('POST from PI ==> Zone:       ' + payload.zone.name);
    console.log('POST from PI ==> Customer:   ' + payload.device.name);
    console.log('POST from PI ==> Event:      ' + payload.activity);
    console.log('POST from PI ==> Dwell Time: ' + payload.dwellPeriod);
    console.log('**********************************************************');


    if (payload.zone.name == 'kbPoliceZone' && payload.activity != 'exit')
    {

       /******************************************************/
       /* Call to MACM                                       */
       /******************************************************/
       request(macmOptions, function (err, macmResponse, macmBody) 
       {
          if (err) 
          {
            console.log(err.statusCode)
            PIres.sendStatus(macmResponse.statusCode);
            return;
          }

          console.log("MACM response ==> " + macmResponse.statusCode);

          if (macmResponse.statusCode == 200)
          {
             /**********************************************************/
             /* Separate the device id from the user name              */
             /**********************************************************/
             device = payload.device.name.substr(0, payload.device.name.indexOf("#"));
             user   = payload.device.name.substr(payload.device.name.indexOf("#") +1);

             console.log("Here is the device ==> " + device);
             console.log("Here is the user   ==> " + user);

             console.log('**********************************************************');
             console.log('Good return from MACM                                     '); 
             console.log('**********************************************************');
             var fromMACM = JSON.parse(macmBody.toString());
             console.log(fromMACM);

             /**********************************************************/
             /* Set offer based on who the user is                     */
             /**********************************************************/
             if (user == "Bob")
             {
                pushOffer = fromMACM.values[1][1];
             }
             else
             {
                pushOffer = fromMACM.values[0][1];
             }
             
             /*********************************************************/
             /* Finalize pushUrl now that we have the offer from MACM */
             /*********************************************************/
             pushUrl     = 'http://' + pushHost + ':' + pushPort + pushPath + '?' + pushQString1 + 
                            pushOffer + pushParmsSep + device + pushQString2;
             console.log("Push URL = " + pushUrl);

             pushOptions = 
             {
               url: pushUrl 
             };
             /******************************************************/
             /* Call to Push notification                          */
             /******************************************************/
             request(pushOptions, function (err, pushResponse, body) 
             {
               if (err) 
               {
                  console.log("Error calling MACM ==> " + err.statusCode)
                  PIres.sendStatus(pushResponse.statusCode);
                  return;
               }
               else
               {
                  console.log('POST from PI == Status code: ', pushResponse.statusCode)
                  console.log("POST from PI ==> End");
                  PIres.sendStatus(200);
                  return;
               }
            });
          } 
          else 
          {
             console.log('**********************************************************');
             console.log('Bad return from MACM                                      '); 
             console.log('**********************************************************');
             PIres.sendStatus(macmResponse.statusCode);
             return;
          }
       });
    }
    else
    {
       PIres.sendStatus(200);
       return;
    }
});

app.get('/test2', function (req, res) 
{
   'use strict';
   var x = 3;
   var device = "abcdefg#Bob";
   var device2 = "abcdefg#Alice";
   console.log(device.substr(0, device.indexOf("#")));
   console.log(device.substr(device.indexOf("#") +1));
   console.log(device2.substr(device2.indexOf("#") +1));
   res.sendStatus(200);
});
/**********************************************/
/* Use GET to test other function without PI  */
/**********************************************/
app.get('/test', function (PIreq, PIres) 
{
   console.log('Testing calls to MACM');
   console.log(macmUrl);

   request(macmOptions, function (err, macmResponse, macmBody) 
   {
      if (err) 
      {
        console.log(err.statusCode)
        PIres.sendStatus(macmResponse.statusCode);
        return;
      }
      console.log("MACM response ==> " + macmResponse.statusCode);
      if (macmResponse.statusCode == 200)
      {
         var fromMACM = JSON.parse(macmBody.toString());
         console.log(fromMACM.values[0][1]);
         console.log(fromMACM.values[1][1]);
         PIres.sendStatus(200);
         return;
      }
      else
      {
         console.log("******************************************");
         console.log("* BAD RETURN CODE FROM MACM              *");
         console.log("******************************************");
         PIres.sendStatus(macmResponse.statusCode);
         return;
      }
   });
});

/**********************************************/
/* Start the server                           */ 
/**********************************************/ 
var appEnv = cfenv.getAppEnv();
app.listen(appEnv.port, appEnv.bind, function () 
{
   console.log("server starting on " + appEnv.url);
});

