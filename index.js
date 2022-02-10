import { Client, Intents, MessageEmbed } from "discord.js";
import mongoose from "mongoose";
import extractUrls from "extract-urls";
import fetch from "node-fetch";
import * as dotenv from "dotenv";
import { ToadScheduler, SimpleIntervalJob, Task } from 'toad-scheduler';
import hastebin from "hastebin-gen";
import { inspect } from "util"
import {filterUrls, filter} from "string-flagger";
import { commands } from "./commands/commands.js";

dotenv.config();
const scheduler = new ToadScheduler();

const dataRefresh = new Task('simple task', async () => {
    let oldData = client.data
    try{
        client.data = (await (await fetch(`https://api.exerra.xyz/scam/all`)).json())
        console.log(`Refreshed ${client.data.length} scam links!`)
    } catch (e) {
        client.data = oldData
        console.log(`Failed to refresh scam links!`)
    }
});

const statsRefresh = new Task('simple task', async () => {
    refreshStats()
});
const scamLinkRefresh = new SimpleIntervalJob({ seconds: 3600, runImmediately: true }, dataRefresh,'id_1');
const botstatsRefresh = new SimpleIntervalJob({ seconds: 300, runImmediately: true }, statsRefresh,'id_2');

let users = 0;
let guilds = 0;

let adminArray = [ // users with extra perms
    '719292655963734056', // M1nx
    '391878815263096833' // Occult
]

class CustomClient extends Client{
    data = []
    commands = []
}
let client = new CustomClient({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.DIRECT_MESSAGES],
    allowedMentions: { parse: ['users'] },
    partials: ["CHANNEL"]
});

client.db = mongoose.connection;
if(process.env['MONGODB']) {
    mongoose.connect(process.env['MONGODB']);
}

client.db.on('error', console.error.bind(console, 'connection error:'));
client.commands = commands

export function refreshStats(){
    let stats = { users: 0, guilds: 0, data: 0 }

    for(let guild of client.guilds.cache) {
        stats.users += guild[1].memberCount;
        stats.guilds += 1;
    }
    stats.data = client.data.length

    client.user.setActivity(`${stats.users} Members for scams`, { type: "WATCHING", }); // Set Status

    return stats
}


// client events

client.on('messageCreate', async (message) => {
    if(message.author.bot) return;
    if(!message.content.startsWith('scam!')) return;
    if(client.data.length == 0) return message.reply('Bot has not finished loading scam links!');

    let args = (message.content.toLowerCase().split(' ')) // split on ' ' and put into array called args, index one will be prefix+commandName
    let commandName = args.shift().slice(5) // remove prefix+commandName from args array and strip prefix from commandName
    let command = client.commands.find(x => x.name === commandName) // fetch command from commands array

    if(message.channel.type == 'DM'){
        let ScamReviewChannel = client.channels.cache.get('939802381229629440') // In the Main Server
        ScamReviewChannel.send(`${message.author.id} : \`\`\`${message.content.replaceAll('`', '')} - ${message.author.tag}\`\`\``)
            .then(message => message.react('⬆️'))
            .catch(console.error);
        message.reply('Submitted <3')
    }
    else if(command){
        if(!command.adminOnly){
            command.execute(message, args, client) // run command
        } else {
            if(!adminArray.includes(message.author.id)) return message.reply('Insufficient Permissions <3'); // whitelisted ids?
            command.execute(message, args, client) // run command
        }
    }
    else {
        let compromisedEmbed = new MessageEmbed().setTitle('Compromised Account')
            .setDescription(`Your account has been compromised and used to promote a scam, as a result you have been banned from ${message.guild.name}. If you still have access to this account please reset your password or delete the account. In future be more careful pressing random data on the internet and never download anything from a website unless it is 100% trustworthy.`)
            .setTimestamp()
            .setThumbnail('https://i.imgur.com/AdjxcEc.png')
            .setFooter({ text: `${client.user.username} 1.2.0 by M1nx`})

        if(await filterUrls(message.content.toLowerCase(), client.data)) {
            try {
                let author = message.guild.members.cache.get(message.author.id);

                (await author.createDM()).send({
                    embeds: [compromisedEmbed]
                }).then(test => {
                    if (author.bannable) {
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
client.on('ready', async (client) =>{
    let stats = refreshStats()
    console.log(`Logged in as ${client.user.tag} in ${stats.guilds} Servers.`) // login
    scheduler.addSimpleIntervalJob(scamLinkRefresh); // Refresh scam links
    scheduler.addSimpleIntervalJob(botstatsRefresh); // Refresh bots stats
})

// stat refresh events

client.on('guildCreate', (guild) =>{
    refreshStats()

    let ScamReviewChannel = client.channels.cache.get('939802381229629440') // In the Main Server
    ScamReviewChannel.send(`Joined: ${guild}`)
})
client.on('guildDelete', (guild) => {
    refreshStats()

    let ScamReviewChannel = client.channels.cache.get('939802381229629440') // In the Main Server
    ScamReviewChannel.send(`Joined: ${guild}`)
})
client.on('guildMemberAdd', (guild) => {
    refreshStats()
})
client.on('guildMemberRemove', (guild) => {
    refreshStats()
})
client.login(process.env['TOKEN'])
