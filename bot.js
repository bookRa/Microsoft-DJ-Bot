// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes } = require('botbuilder');

// User State properties
// const FAV_GENRE = 'favGenreProperty';
// const FAV_ARTIST = 'favArtistProperty';
const TOPIC_STATE = 'topic'
const USER_PROFILE = 'user'



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

      if(currTopic.prompt == "askName"){
        await turnContext.sendActivity("Hello there! What's your name?");

        // move the convo forward to next prompt (for the next turn)
        currTopic.prompt = "askGenre";
        // update state
        await this.topicState.set(turnContext, currTopic);
      }
      else if(currTopic.prompt == "askGenre"){
        //guess this stores the response from the last turn?
        userProfile.userName = turnContext.activity.text 
        await turnContext.sendActivity(`Nice to meet you ${userProfile.userName}! My name is DJ. I'm a DJ ¥[^.^]¥`)
        await turnContext.sendActivity('So tell me, what is your favorite genre of music?')
        
        currTopic.prompt = "askArtist";
        
        await this.topicState.set(turnContext, currTopic);
      }else if(currTopic.prompt == "askArtist"){
        userProfile.favGenre = turnContext.activity.text
        if(userProfile.favGenre =="jazz"){ //shout out to jazz aficionados
          
          await turnContext.sendActivity('Hey, me too! You must be one cool cat :sunglasses:')
          await turnContext.sendActivity('Whose your favorite artist? Miles Davis? Brubeck? Mingus? Coltrane?')
          
        }else{
          await turnContext.sendActivity("Excellent! I'm more of a classic jazz bot myself :saxophone:")
          await turnContext.sendActivity(`So, who is your favorite ${userProfile.favGenre} musician?`)
        }
        currTopic.prompt = "searchYoutube";

        await this.topicState.set(turnContext, currTopic);

      }
      // Save state changes
      await this.conversationState.saveChanges(turnContext);
      await this.userState.saveChanges(turnContext);
    } else {
      await turnContext.sendActivity(`[${turnContext.activity.type} event detected]`);
    }
  }
}

module.exports.DjBot = DjBot;