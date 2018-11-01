// 'use strict';
const axios = require('axios')
// I'm using a 7 day free trial (circa Halloween 2018) so this should expire by 11/7 (alt key2: "58e992c7cc0e43cab864573d0bf7d038")
const BING_KEY = 'c9f4ac8a66d74c31a228b19b33292625' 

let host = 'https://api.cognitive.microsoft.com';
let path = '/bing/v7.0/videos/search?q=';
let term = `jazz miles best music video`

axios({
    baseURL: host,
    url : path+"?q="+ encodeURIComponent(term),
    headers: {'Ocp-Apim-Subscription-Key': BING_KEY}

}).then(resp=> {
    let myArr = resp.data.value.map(vid=> vid.contentUrl)
    console.log("Success!")
    console.log(myArr)
})
.catch(error=> console.log("Error: ", error))




// let https = require('https');

// // **********************************************
// // *** Update or verify the following values. ***
// // **********************************************

// // Replace the subscriptionKey string value with your valid subscription key.
// let subscriptionKey = 'c9f4ac8a66d74c31a228b19b33292625';

// // Verify the endpoint URI.  At this writing, only one endpoint is used for Bing
// // search APIs.  In the future, regional endpoints may be available.  If you
// // encounter unexpected authorization errors, double-check this host against
// // the endpoint for your Bing Search instance in your Azure dashboard.
// let host = 'api.cognitive.microsoft.com';
// let path = '/bing/v7.0/videos/search';

// let term = 'jazz music video';

// let response_handler = function (response) {
//     let body = '';
//     response.on('data', function (d) {
//         console.log("GETTING DATA")
//         console.log(d)

//         body += d;
//     });
//     response.on('end', function () {
//         console.log('\nRelevant Headers:\n');
//         for (var header in response.headers)
//             // header keys are lower-cased by Node.js
//             if (header.startsWith("bingapis-") || header.startsWith("x-msedge-"))
//                  console.log(header + ": " + response.headers[header]);
//         body = JSON.stringify(JSON.parse(body), null, '  ');
//         console.log('\nJSON Response:\n');
//         console.log(response);
//     });
//     response.on('error', function (e) {
//         console.log('Error: ' + e.message);
//     });
// };

// let bing_video_search = function (search) {
//   console.log('Searching videos for: ' + term);
//   let request_params = {
//         method : 'GET',
//         hostname : host,
//         path : path + '?q=' + encodeURIComponent(search),
//         headers : {
//             'Ocp-Apim-Subscription-Key' : subscriptionKey,
//         }
//     };

//     let req = https.request(request_params, response_handler);
//     req.end();
// }
// bing_video_search(term);