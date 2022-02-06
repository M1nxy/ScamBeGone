const { Client, Intents, MessageEmbed } = require("discord.js");
const mongoose = require("mongoose");
const package = require('./package.json');
const isUrl = require("url-validator");
// const express = require('express')
require('dotenv').config()
// const app = express()
// const port = 3000

let data = require('./blacklist.json');
let users = 0;
let guilds = 0;

let client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.DIRECT_MESSAGES],
    allowedMentions: { parse: ['users'] },
    partials: ["CHANNEL"]
});

client.db = mongoose.connection;
if (process.env['MONGODB']) {
    mongoose.connect(process.env['MONGODB']);
}

client.db.on('error', console.error.bind(console, 'connection error:'));
client.models = [];

// client events

client.on('messageCreate', async (message) => {
    if(message.author.bot) return;
    if(message.channel.type == 'DM'){
        let ScamReviewChannel = client.channels.cache.get('939802381229629440') // In the Main Server
        ScamReviewChannel.send(`\`\`\`${message.content.replaceAll('`', '')} - ${message.author.tag}\`\`\``)
            .then(message => message.react('⬆️'))
            .catch(console.error);
        message.reply('Submitted <3')
    }
    if(message.content == 'scam!credits'){
        let creditsEmbed = new MessageEmbed().setTitle('Credits')
            .setDescription(`Thank you for using Scam Avoid. To contribute a link send it in a direct message to the bot.`)
            .setTimestamp()
            .addField('Creator','M1nx', true)
            .addField('Contributer', 'OccultWaifu', true)
            .addField('Contributer', 'Ash', true)
            .addField('Contributer', 'Magnetar',true)
            .setFooter({ text: `ScamAvoid ${package.version} by M1nx`})

        message.reply({
            embeds: [creditsEmbed]
        })
    }
    if(message.content == 'scam!stats'){
        let statsEmbed = new MessageEmbed().setTitle('Stats')
            .addField('Links',`${data.links.length}`, true)
            .addField('Users', `${users}`, true)
            .addField('guilds', `${guilds}`, true)
            .setFooter({ text: `ScamAvoid ${package.version} by M1nx`})
            .setTimestamp()

        message.reply({
            embeds: [statsEmbed]
        })
    }
    if(isUrl(message.content)) {
        let flagged = false

        let compromisedEmbed = new MessageEmbed().setTitle('Compromised Account')
            .setDescription(`Your account has been compromised and used to promote a scam, as a result you have been banned from ${message.guild.name}. If you still have access to this account please reset your password or delete the account. In future be more careful pressing random links on the internet and never download anything from a website unless it is 100% trustworthy.`)
            .setTimestamp()
            .setThumbnail('https://i.imgur.com/AdjxcEc.png')
            .setFooter({ text: `ScamAvoid ${package.version} by M1nx`})

        for(link of data.links){
            if (message.content.includes(link)){ flagged = true }
        }

        if (flagged) {
            try {
                let author = message.guild.members.cache.get(message.author.id);

                (await author.createDM()).send({
                    embeds: [compromisedEmbed]
                }).then( test => {
                    if(author.bannable){
                        author.ban({
                            days: 7,
                            reason: 'Compromised Account Detected 😞'
                        })
                    }
                })

            } catch (e) {
                console.log(e)
            }
        }
    }

})

client.on('ready', (client) =>{
    console.log(`Logged in as ${client.user.tag}`) // login

    for(let guild of client.guilds.cache){ // Ready in Servers
        console.log(`Ready in ${guild[1].name} for ${guild[1].memberCount} members.`)
        users += guild[1].memberCount;
        guilds += 1;
    }

    client.user.setActivity(`${users} Members for scams.`, { type: "WATCHING", }); // Set Status

})

client.on('guildCreate', (guild) =>{
    console.log(`Joined: ${guild}`)
})
client.on('guildDelete', (guild) =>{
    console.log(`Left: ${guild}`)
})
client.login(process.env['TOKEN'])

// web server for uptime check -- pain
//
// app.get('*', (req, res) => {
//     res.send('Bot Online!')
// })
//
// app.listen(process.env.PORT || 3000,
//     () => console.log("Server is running..."));
