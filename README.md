# dj_bot

This simple nodeJS botBuilder was built upon the Yeoman bot generator. I pulled out most of the boilerplate comments in `bot.js` so I can help myself (and demonstrate that I can ) understand the framework. 

If you are not my future boss (:wink:) you can go to the [Main Bot Framework Page](https://dev.botframework.com) or the [GitHub repo](https://github.com/Microsoft/BotBuilder/) for more info.

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