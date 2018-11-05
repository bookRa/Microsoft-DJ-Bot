const path = require('path');
const axios = require('axios')

const ENV_FILE = path.join(__dirname, '.env');
const env = require('dotenv').config({path: ENV_FILE});


const BING_KEY = process.env.bingApiKey


const bingSearch = async (genre, artist) => {
    let host = 'https://api.cognitive.microsoft.com';
    let path = '/bing/v7.0/videos/search';
    let term = `${genre} ${artist} best music video`

    return axios({
        baseURL: host,
        url: path + "?q=" + encodeURIComponent(term),
        headers: { 'Ocp-Apim-Subscription-Key': BING_KEY }
  
      }).then(resp => {
        let myArr = resp.data.value.map(vid => vid.contentUrl)
        console.log(myArr)
        let rand = myArr[Math.floor(Math.random() * myArr.length)];
        return rand
        // return myArr.slice(0, 1)
      })
        .catch(error => {
          console.log("Error: ", error)
          return (["...oops...never mind :("])
  
        })
}

module.exports.bingSearch = bingSearch