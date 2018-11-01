// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes } = require('botbuilder');
const axios = require('axios')

// User State properties
// const FAV_GENRE = 'favGenreProperty';
// const FAV_ARTIST = 'favArtistProperty';
const TOPIC_STATE = 'topic'
const USER_PROFILE = 'user'
const BING_KEY = 'c9f4ac8a66d74c31a228b19b33292625' // I'm using a 7 day free trial (circa Halloween 2018) so this should expire by 11/7 (alt key2: "58e992c7cc0e43cab864573d0bf7d038")


class DjBot {
  /**
   *
   * @param {ConversationState} conversation state object
   * @param {UserState} user state object
   */
  constructor(conversationState, userState) {
    // Creates a new state accessor property.
    // See https://aka.ms/about-bot-state-accessors to learn more about the bot state and state accessors.
    this.conversationState = conversationState;
    this.topicState = this.conversationState.createProperty(TOPIC_STATE);

    // Create the user state
    this.userState = userState;
    this.userProfile = this.userState.createProperty(USER_PROFILE)
  }
  /**
   *
   * @param {TurnContext} on turn context object.
   */
  async onTurn(turnContext) {
    // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
    if (turnContext.activity.type === ActivityTypes.Message) {
      // read from state and start at the top of the dialog flow
      let currTopic = await this.topicState.get(turnContext, {
        prompt: "askName" // the first step, introductions
      });
      let userProfile = await this.userProfile.get(turnContext, {
        //  We care about three things: name, favorite genre, and favorite artist
        "userName": "",
        "telephoneNumber": ""
      });

      if (currTopic.prompt == "askName") {
        await turnContext.sendActivity("Hello there! What's your name?");

        // move the convo forward to next prompt (for the next turn)
        currTopic.prompt = "askGenre";
        // update state
        await this.topicState.set(turnContext, currTopic);
      }
      else if (currTopic.prompt == "askGenre") {
        //guess this stores the response from the last turn?
        userProfile.userName = turnContext.activity.text
        await turnContext.sendActivity(`Nice to meet you ${userProfile.userName}! My name is DJ. I'm a DJ ¥[^.^]¥`)
        await turnContext.sendActivity('So tell me, what is your favorite genre of music?')

        currTopic.prompt = "askArtist";

        await this.topicState.set(turnContext, currTopic);
      } else if (currTopic.prompt == "askArtist") {

        userProfile.favGenre = turnContext.activity.text
        if (userProfile.favGenre == "jazz") {
          //shout out to jazz aficionados
          await turnContext.sendActivity('Hey, me too! You must be one cool cat B)')
          await turnContext.sendActivity('Whose your favorite artist? Miles Davis? Brubeck? Mingus? Coltrane?')

        } else {
          await turnContext.sendActivity("Excellent choice! I'm more of a classic jazz bot myself :saxophone:")
          await turnContext.sendActivity(`So, who is your favorite ${userProfile.favGenre} musician?`)
        }
        currTopic.prompt = "searchYoutube";

        await this.topicState.set(turnContext, currTopic);

      } else if (currTopic.prompt == "searchYoutube") {

        userProfile.favArtist = turnContext.activity.text
        await turnContext.sendActivity(`Hey ${userProfile.userName}, would you like me to buy you
         tickets to see ${userProfile.favArtist} LIVE in concert?`)
        //  setting Timeout doesn't work...
        // setTimeout(() => { turnContext.sendActivity(`Ha! jk, I'll do the next best thing, though. Hang on...`) }, 1500)
        await turnContext.sendActivity(`Ha! jk, I'll do the next best thing, though. Hang on...`)
        let youtubeURL = await this.queryTube(userProfile.favGenre, userProfile.favArtist)
        console.log("bot has fetched: ", youtubeURL)
        await turnContext.sendActivity(`check this out: ${youtubeURL}`)
        currTopic.prompt = null;

        await this.topicState.set(turnContext, currTopic)
      } else {
        // Default message
        await turnContext.sendActivity("I'm not taking requests at the moment ¯\\_(ツ)_/¯");
      }
      // Save state changes
      await this.conversationState.saveChanges(turnContext);
      await this.userState.saveChanges(turnContext);
    } else {
      await turnContext.sendActivity(`[${turnContext.activity.type} event detected]`);
    }
  }

  async queryTube(genre, artist) {
    let host = 'https://api.cognitive.microsoft.com';
    let path = '/bing/v7.0/videos/search?q=';
    let term = `${genre} ${artist} best music video`

    return axios({
      baseURL: host,
      url: path + "?q=" + encodeURIComponent(term),
      headers: { 'Ocp-Apim-Subscription-Key': BING_KEY }

    }).then(resp => {
      console.log("got a response")
      let myArr = resp.data.value.map(vid => vid.contentUrl)
      console.log(myArr[0])
      return myArr[0]
    })
      .catch(error =>{
        console.log("Error: ", error)
        return("...oops...never mind :(")

      })
  }
}

module.exports.DjBot = DjBot;