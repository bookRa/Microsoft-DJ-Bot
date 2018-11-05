const { ComponentDialog, WaterfallDialog, TextPrompt } = require('botbuilder-dialogs')

const { UserProfile } = require('./userProfile')

// Dialog ID
const DJ_DIALOG = 'djDialog'

// Prompt IDs
const NAME_PROMPT = 'namePrompt'
const GENRE_PROMPT = 'genrePrompt'
const ARTIST_PROMPT = 'artistPrompt'
// const SERVEMORE_PROMPT = 'serveMorePrompt' //Will do later

const VALIDATION_SUCCESS = true;
const VALIDATION_FAILURE = !VALIDATION_SUCCESS;

/**
 * @param dialogId
 * @param userProfileAccessor
 * 
  */
class PlaySet extends ComponentDialog {
    constructor(dialogId, userProfileAccessor) {
        super(dialogId);

        // validate what was passed in
        if (!dialogId) throw ('Missing parameter.  dialogId is required');
        if (!userProfileAccessor) throw ('Missing parameter.  userProfileAccessor is required');

        this.addDialog(new WaterfallDialog(DJ_DIALOG, [
            this.initializeStateStep.bind(this),
            this.promptForNameStep.bind(this),
            this.promptForGenreStep.bind(this),
            this.promptForArtistStep.bind(this)
        ]));

        // Add text prompts for name, genre, artist
        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new TextPrompt(GENRE_PROMPT));
        this.addDialog(new TextPrompt(ARTIST_PROMPT));

        // Save userProfileAccessor for write later
        this.userProfileAccessor = userProfileAccessor
    }

    // Function 1: initialize State
    async initializeStateStep(step) {
        let userProfile = await this.userProfileAccessor.get(step.context)
        if (userProfile === undefined) {
            if (step.options && step.options.userProfile) {
                await this.userProfileAccessor.set(step.context, step.options.userProfile);
            } else {
                await this.userProfileAccessor.set(step.context, new UserProfile())
            }

        }
        return await step.next();
    }
    async promptForNameStep(step) {
        const userProfile = await this.userProfileAccessor.get(step.context);
        // if we have everything we need, greet user and return
        if (userProfile !== undefined && userProfile.name !== undefined && userProfile.city !== undefined) {
            return await this.greetUser(step);
        }
        if (!userProfile.name) {
            // prompt for name, if missing
            return await step.prompt(NAME_PROMPT, "Welcome to my Studio! What's your name?");
        } else {
            return await step.next();
        }
    }
    async promptForGenreStep(step) {
        // save name, if prompted for
        const userProfile = await this.userProfileAccessor.get(step.context);
        if (userProfile.name === undefined && step.result) {
            let lowerCaseName = step.result;
            // capitalize and set name
            userProfile.name = lowerCaseName.charAt(0).toUpperCase() + lowerCaseName.substr(1);
            await this.userProfileAccessor.set(step.context, userProfile);
        }
        if (!userProfile.genre) {
            return await step.prompt(GENRE_PROMPT, `Hello ${userProfile.name}. So tell me, what's your favorite music genre?`);
        } else {
            return await step.next();
        }
    }
    async promptForArtistStep(step) {
        // save name, if prompted for
        const userProfile = await this.userProfileAccessor.get(step.context);
        if (userProfile.genre === undefined && step.result) {
            let lowerCaseGenre = step.result;
            // capitalize and set name
            userProfile.genre = lowerCaseGenre;
            await this.userProfileAccessor.set(step.context, userProfile);
        }
        if (!userProfile.artist) {
            return await step.prompt(ARTIST_PROMPT, `NICE... Sound's like you have good taste in music So tell me, whose your favorite ${userProfile.genre}`);
        } else {
            return await step.next();
        }
    }



}

exports.PlaySet = PlaySet;