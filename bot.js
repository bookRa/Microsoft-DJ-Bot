// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { ChoicePrompt, DialogSet, NumberPrompt, TextPrompt, WaterfallDialog, DialogTurnStatus } = require('botbuilder-dialogs');

// Some modularized items
const { UserProfile } = require('./dialogs/userProfile')
const { PlaylistDialog } = require('./dialogs/playlist')

// returns an array of relavent videos
const { bingSearch } = require('./bingAPI')

// dialog state
const DIALOG_STATE_PROP = 'dialogState';
const USER_PROFILE_PROP = 'userProfileProperty';

// LUIS service type entry as defined in the .bot file.
const LUIS_CONFIGURATION = 'DjBot'

// user state
const USER_PROFILE = 'user'

const PLAYLIST_DIALOG = 'playlistDialog'
const INTRO = 'get_name';
const SONG_REQUEST = 'get_music_choices'
const SERVE_SONGS = 'serve_songs'
const OUTRO = 'standby_pattern'

const MORE_VIDS_PROMPT = 'more_vids_prompt'
const RESTART_PROMPT = 'restart_prompt'

// Supported LUIS Intents
const DEFINE_MUSIC_INTENT = "DefineMusic"
const SET_NAME_INTENT = "SetName"
const NONE_INTENT = "None"
// Entities
const MUSIC_ENTITIES = ["MusicGenre", "Entertainment.Person"]

class DjBot {
  /**
   *
   * @param {ConversationState} conversation state object
   * @param {UserState} user state object
   * @param {BotConfiguration} botConfig contents of the .bot fiel
   */
  constructor(conversationState, userState, botConfig) {
    if (!conversationState) throw new Error('Missing parameter.  conversationState is required');
    if (!userState) throw new Error('Missing parameter.  userState is required');
    if (!botConfig) throw new Error('Missing parameter.  botConfig is required');

    // A LUIS recognizer
    const luisConfig = botConfig.findServiceByNameOrId(LUIS_CONFIGURATION)
    if (!luisConfig || !luisConfig.appId) throw new Error('Missing LUIS configs')
    this.luisRecognizer = new LuisRecognizer({
      applicationId: luisConfig.appId,
      endpoint: luisConfig.getEndpoint(),
      endpointKey: luisConfig.authoringKey

    })
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
    this.dialogs.add(new ChoicePrompt(MORE_VIDS_PROMPT))
    this.dialogs.add(new ChoicePrompt(RESTART_PROMPT))
    // Main Dialog that gets user's info and music prefs. 
    this.dialogs.add(new PlaylistDialog(PLAYLIST_DIALOG, this.userProfile))
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
      // return await step.endDialog();
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
      let dialogResult;
      // create a dialog context
      const dc = await this.dialogs.createContext(turnContext)

      const results = await this.luisRecognizer.recognize(turnContext);
      const topIntent = LuisRecognizer.topIntent(results)

      console.log("THE TOP INTENT IS: ", topIntent)

      // update user profile property with any entities captured by LUIS
      // This could be user responding with their name or city while we are in the middle of greeting dialog,
      // or user saying something like 'i'm {userName}' while we have no active multi-turn dialog.
      if (topIntent === "DefineMusic") {
        await this.updateMusicPrefs(results, turnContext);
      } else if (topIntent === "SetName") {
        await this.updateName(results, turnContext);
      }

      // I think this is necessary in case something gets paused for whatever reason
      dialogResult = await dc.continueDialog();

      if (!dc.context.responded) {
        switch (dialogResult.status) {
          case DialogTurnStatus.empty:
            switch (topIntent) {
              case NONE_INTENT:
                await dc.beginDialog(PLAYLIST_DIALOG)
                break
              case SET_NAME_INTENT:
                await dc.context.sendActivity("Sorry if I missed your name before...my headphones are loud!")
                await dc.context.sendActivity(JSON.stringify(await this.userProfile.get(dc.context)))
                break
              case DEFINE_MUSIC_INTENT:
                await dc.context.sendActivity("Let me see if I've got this right. You like...")
                await dc.context.sendActivity(JSON.stringify(await this.userProfile.get(dc.context)))
                let musicVid = await this.fetchASong(dc.context)
                console.log(musicVid)
                dc.context.sendActivity(`Is this what you had in mind? ${musicVid}`)
                // if (this.userProfile.genre !== undefined && this.userProfile.artist !== undefined) {
                //   console.log("We're gonna serve up some stuff man!!!")

                // }
                break
              default:
                await dc.context.sendActivity("It's loud in here.... say again?")
                break
            }
            break;
          case DialogTurnStatus.waiting:
            break
          case DialogTurnStatus.complete:
            break
          default:
            await dc.cancelAllDialogs();
            break;
        }
      } else {
        // console.log("TURNCONTEXT HAS RESPONDED")
        await dc.beginDialog(OUTRO)
      }
    } else {
      const description = `
      Hey there, I'm a DJ Bot.
      You can tell me your name like 'my name is <name>', and you can also tell me about your music tastes so I can spin up the records you love.
      Just say 'I like punk rock music by The Pixies' or something like that, and I'll try to understand. 
      `
      await turnContext.sendActivity(description)
    }



    // save changes to the user state
    await this.userState.saveChanges(turnContext)

    // save changes to convo state and end turn
    await this.conversationState.saveChanges(turnContext)

  }

  /**
  * Helper function to update user profile with entities returned by LUIS.
  *
  * @param {LuisResults} luisResults - LUIS recognizer results
  * @param {DialogContext} dc - dialog context
  */
  async updateMusicPrefs(luisResult, context) {
    // Do we have any entities?
    // console.log("LUIS RESULTS ARE: ", luisResult)
    if (Object.keys(luisResult.entities).length !== 1) {
      // get userProfile object using the accessor
      let userProfile = await this.userProfile.get(context);
      if (userProfile === undefined) {
        userProfile = new UserProfile();
      }
      for (let key in luisResult.entities) {
        if (!["$instance", "personName"].includes(key)) {
          if (key === "Entertainment_Person") { userProfile["artist"] = luisResult.entities[key][0] }
          else { //It mentions the genre (TODO: Add name later) 
            userProfile["genre"] = luisResult.entities[key][0]
            userProfile["genreType"] = key
          }
        }

      }
      await this.userProfile.set(context, userProfile);
      console.log("GROUND USERPROF FROM MUSICPREFS:", await this.userProfile.get(context))
    }
  }
  async updateName(luisResult, context) {
    if (Object.keys(luisResult.entities).length !== 1) {
      let userProfile = await this.userProfile.get(context);

      if (userProfile === undefined) {
        userProfile = new UserProfile();
      }
      if (luisResult.entities["personName"] !== undefined) { userProfile.name = luisResult.entities["personName"][0] }
      // console.log("NAME UPDATED", userProfile)
      await this.userProfile.set(context, userProfile)
      console.log("GROUNDSTATE UPROF", await this.userProfile.get(context))
    }
  }
  async fetchASong(context) {
    let userProfile = await this.userProfile.get(context);
    let vidString = await bingSearch(userProfile.genre, userProfile.artist)
    console.log(vidString)
    return vidString
  }
}

module.exports.DjBot = DjBot;