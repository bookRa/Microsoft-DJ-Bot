// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes } = require('botbuilder');
const {LuisRecognizer } = require('botbuilder-ai');
const { ChoicePrompt, DialogSet, NumberPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');

// returns an array of relavent videos
const { bingSearch } = require('./bingAPI')

// dialog state
const DIALOG_STATE_PROP = 'dialogState';
// convo state
const TOPIC_STATE = 'topic'
// user state
const USER_PROFILE = 'user'

const INTRO = 'get_name';
const SONG_REQUEST = 'get_music_choices'
const SERVE_SONGS = 'serve_songs'
const OUTRO = 'standby_pattern'

const NAME_PROMPT = 'name_prompt'
const GENRE_PROMPT = 'genre_prompt'
const ARTIST_PROMPT = 'artist_prompt'
const MORE_VIDS_PROMPT = 'more_vids_prompt'
const RESTART_PROMPT = 'restart_prompt'


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
    // Create the user state
    this.userState = userState;
    this.userProfile = this.userState.createProperty(USER_PROFILE)

    // Create the dialog state
    this.dialogState = this.conversationState.createProperty(DIALOG_STATE_PROP);
    this.dialogs = new DialogSet(this.dialogState)

    // Add a bunch of prompts to the dialogSet
    this.dialogs.add(new TextPrompt(NAME_PROMPT))
    this.dialogs.add(new ChoicePrompt(GENRE_PROMPT))
    this.dialogs.add(new TextPrompt(ARTIST_PROMPT))
    this.dialogs.add(new ChoicePrompt(MORE_VIDS_PROMPT))
    this.dialogs.add(new ChoicePrompt(RESTART_PROMPT))

    // Create a dialog that Introduces bot to user
    this.dialogs.add(new WaterfallDialog(INTRO, [
      this.promptForName.bind(this),
      this.confirmName.bind(this)
    ]))

    // Create a dialog that gets a music request
    this.dialogs.add(new WaterfallDialog(SONG_REQUEST, [
      this.promptForGenre.bind(this),
      this.promptForArtist.bind(this),
      this.captureArtist.bind(this)
    ]))

    // Create a dialog that serves Youtube Vids
    this.dialogs.add(new WaterfallDialog(SERVE_SONGS, [
      this.queryBing.bind(this),
      this.promptForMoreVids.bind(this),
      this.wrapUpSet.bind(this)
    ]))

    // Handles the end state
    this.dialogs.add(new WaterfallDialog(OUTRO), [
      this.handleOutro.bind(this)
    ])
  }

  async promptForName(step) {
    return await step.prompt(NAME_PROMPT, `Hello there! What's your name`)
  }
  async confirmName(step) {

    const user = await this.userProfile.get(step.context, {})
    if (step.result.trim() !== '') {
      user.name = step.result.trim();
      await this.userProfile.set(step.context, user)
      await step.context.sendActivity(`Nice to meet you ${user.name}! My name is DJ... I'm a DJ ¥[^.^]¥`)

    } else {
      user.name = "Stranger"
      await this.userProfile.set(step.context, user)
      await step.context.sendActivity(`Ok... well I'll just call you ${user.name}, OK? My name is DJ... I'm a DJ ¥[^.^]¥`)
    }
    return await step.endDialog();
  }

  async promptForGenre(step) {
    const user = await this.userProfile.get(step.context, {})
    return await step.prompt(GENRE_PROMPT, `So tell me, ${user.name}, what is your favorite genre of music?`,
      [
        'rock',
        'rap',
        'country',
        'classical',
        'jazz',
        'electronic',
        'reggae',
        'something else?'
      ])
  }
  async promptForArtist(step) {
    const user = await this.userProfile.get(step.context, {})
    // console.log("STEP FROM ARTISTPROMPT:", step.result)
    user.favGenre = step.result.value ? step.result.value : "etc."
    // custom response to genre selection
    switch (step.result.value) {
      case 'rock':
        await step.context.sendActivity("Yeah... Rock on!")
        break
      case 'rap':
        await step.context.sendActivity("Word up. Mad props yo")
        break
      case 'country':
        await step.context.sendActivity("I don't know too much country, I'm a city-slicker thru and thru")
        break
      case 'classical':
        await step.context.sendActivity("You did strike me as the refined, elegant type")
        break
      case 'jazz':
        await step.context.sendActivity("That's my favorite too! You must be one cool cat daddy-o")
        break
      case 'electronic':
        await step.context.sendActivity("Electronic is more than just music for me...it's a way of life ;-)")
        break
      case 'reggae':
        await step.context.sendActivity("Jah, man. Take life easy :-)")
        break
      default:
        await step.context.sendActivity("Ah, something more esoteric, then?")
        break
    }
    await this.userProfile.set(step.context, user)
    console.log("Why would this fire twice???")
    return await step.prompt(ARTIST_PROMPT, `So who is your favorite ${user.favGenre} artist?`)
  }
  async captureArtist(step) {
    const user = await this.userProfile.get(step.context, {});
    if (step.result.trim() !== '') {
      user.favArtist = step.result.trim()
      await this.userProfile.set(step.context, user)
      await step.context.sendActivity(`${user.favArtist}, huh? Ok let me see what I have here...`)
    } else {
      user.favArtist = "Greatest Ever"
      await this.userProfile.set(step.context, user)
      await step.context.sendActivity(`Well if you won't tell me I'll just have to pick for you. Sit back and enjoy :)...`)
    }
    return await step.endDialog();
  }
  async queryBing(step) {
    const user = await this.userProfile.get(step.context, {});
    let musicQ = user.musicQ
    // console.log("LOOKIT MUSICQ atm: ", musicQ)
    if (!musicQ) { // haven't fetched the video yet
      step.context.sendActivity(`I'm fetching some ${user.favGenre} videos you may enjoy`)
      musicQ = await bingSearch(user.favGenre, user.favArtist)
      user.musicQ = musicQ
      // await this.userProfile.set(step.context, user)
    }
    if (musicQ.length) { //user wants more, and there's more to give
      // console.log("WE'RE IN THE QUERY BING, WANT TO SERVE!")
      let currSong = musicQ.pop()
      // console.log("THE CURRENT SONG IS:", currSong)
      // console.log("AND NOW MUSICQ LOOKS LIKE :", musicQ)
      user.musicQ = musicQ
      await this.userProfile.set(step.context, user)
      await step.context.sendActivity(`Check this out: ${currSong}`)
      return await step.next(true)
    } else { //user wants more, but there's no more
      // console.log("OUR RESERVES ARE TAPPED AT THE MOMENT")
      await step.context.sendActivity(`Sorry, I'm tapped out of ${user.favArtist} music videos`)
      return await step.next(-1)
    }



  }

  async promptForMoreVids(step) {
    // console.log(step.result)
    if (step.result == -1) {
      return step.next("no")
    }
    return await step.prompt(MORE_VIDS_PROMPT, "Did you like that?? Wanna hear another one?", ["yes", "no"])
  }

  async wrapUpSet(step) {
    // console.log("WRAP UP STEPRESULT", step.result)
    if (step.result == "no") {
      await step.context.sendActivity("Now if you'll excuse me, I need to go spin up some turntables. If you need more music just holler")
      return await step.endDialog();
    } else {
      return await step.beginDialog(SERVE_SONGS)
    }
  }

  async handleOutro(step) {
    const user = await this.userProfile.get(step.context, {})
    let userName = user.name ? user.name : "Stranger"
    await step.context.sendActivity(`Not now ${userName}, I'm busy spinning C-_-`)
    return await step.endDialog();
  }

  async onTurn(turnContext) {
    if (turnContext.activity.type === ActivityTypes.Message) { //User has messaged us
      // create a dialog context
      const dc = await this.dialogs.createContext(turnContext)

      // I think this is necessary in case something gets paused for whatever reason
      await dc.continueDialog();

      // This determines what dialog I enter, I believe
      if (!turnContext.responded) {
        const user = await this.userProfile.get(dc.context, {})
        if (!user.name) await dc.beginDialog(INTRO)
        else if (!user.favArtist) await dc.beginDialog(SONG_REQUEST)
        else if (!user.musicQ) await dc.beginDialog(SERVE_SONGS)
        else {
          // console.log("were at the endgame")
          await dc.beginDialog(OUTRO)
        } //Why won't the OUTRO dialog start?? #confusion
      } else {
        // console.log("TURNCONTEXT HAS RESPONDED")
        await dc.beginDialog(OUTRO)
      }
    } else {
      const description = "I was created by Omar to serve you music. Talk to me I talk back (but not using LUIS just yet)"
      await turnContext.sendActivity(description)
    }
    // save changes to the user state
    await this.userState.saveChanges(turnContext)

    // save changes to convo state and end turn
    await this.conversationState.saveChanges(turnContext)

  }


}

module.exports.DjBot = DjBot;