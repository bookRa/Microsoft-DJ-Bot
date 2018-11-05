# dj_bot
<hr>

## Update

The three components that comprise this bot:
1. **LUIS integration**: I was pleasently surprised at how easy it was to go from a very shakey model to one that is fairly robust by iteratively training on new endpoint utterances. My model has two intents {setName , setMusic} and three entities {userName, artistName, musicGenre}.

2. **Azure deployment**: This ate up a _lot_ of time. Figuring out which keys go where, which tool(s) to use (VSCode vs. terminal vs. opening up a new project in Azure portal)...it was not fun. Bumped up against [this issue](https://github.com/Microsoft/botbuilder-tools/issues/596) several times and had to workaround.

3. **The Dialog/Basic-Bot**: Integrating LUIS makes some things easier, but there's still much room for growth when it comes to more tightly controlling the converstaion/dialog flow. Also, it is important for effectivley coupling with the LUIS service (ex. when/if to modify a UserProfile based on the likelihood of the intent). It is important for the most seamless UX. Would also be nice to integrate cards with the videos built-in. 

A working (🤞) sample can be found at https://bookra.github.io/Microsoft-DJ-Bot/

Questions or comments? <omar.abdelbadie1@gmail.com>, or (425) 246-2060

<hr>

This simple nodeJS botBuilder was built upon the Yeoman bot generator. I pulled out most of the boilerplate comments in `bot.js` so I can help myself (and demonstrate that I can ) understand the framework. 

If you are not my future boss (:wink:) you can go to the [Main Bot Framework Page](https://dev.botframework.com) or the [GitHub repo](https://github.com/Microsoft/BotBuilder/) for more info.

Upon cloning this repo, run `npm i && npm start`, then open `dj_bot.bot` in the [Microsoft botBuilder Emulator](https://github.com/Microsoft/BotFramework-Emulator).

There are definitely several ~bugs~ TODOs that I would prefer to get done, but I promised that I would submit this within 48hrs (the 0.1 tag has less bugs but is also more basic). In order of importance, these are the top 5 things I would change/add/learn to improve my Music-slinging bot:
1. Advance to the next WaterFallDialog without requiring user input. This is partially an issue with design (I'm sure there's a more optimal way to divide up my intended conversation into dialog "chunks"), but mostly due to having not yet learned the ins-and-outs of conversation flow management. I believe my target to fixing this lies either in `bot.onTurn()` when it comes to checking `turnContext.responded`. OR it could be fixed a la [this article](https://docs.microsoft.com/en-us/azure/bot-service/nodejs/bot-builder-nodejs-dialog-waterfall?view=azure-bot-service-3.0#advance-the-waterfall).
2. Branching and Looping of the Dialog Tree for better control over corner/unexpected use cases. 
3. Integrate with LUIS so I can utilize utterances, and enter/exit dialogs based on utterances.
4. Host on Azure, to observe the bot in multiple channels, as well as experiment with different adapters and different persistant storages.
5. Look into better UI such as adaptive cards.

# writing pieces
I have accrued some (semi-)techical writing online to help people learn/troubleshoot problems in development. Here are two examples of my communication (can supply more upon request):
1. [My Medium Blog Articles](https://medium.com/@omar.abdelbadie1)
2. [My YouTube Python Tutorials](https://www.youtube.com/channel/UCVR7Wz3INGwnyP0L5uuye7Q?view_as=subscriber)

<hr>
Any other questions? Feel free to reach out:
omar.abdelbadie1@gmail.com
(425) 246-2060
