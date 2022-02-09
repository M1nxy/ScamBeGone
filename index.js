import { Client, Intents, MessageEmbed } from "discord.js";
import mongoose from "mongoose";
import extractUrls from "extract-urls";
import fetch from "node-fetch";
import * as dotenv from "dotenv";
import { ToadScheduler, SimpleIntervalJob, Task } from 'toad-scheduler';
import hastebin from "hastebin-gen";
import { inspect } from "util"

dotenv.config();
const scheduler = new ToadScheduler();

const dataRefresh = new Task('simple task', async () => {
    client.data = (await (await fetch(`https://api.exerra.xyz/scam/all`)).json())
    console.log(`Refreshed ${client.data.length} scam links!`)
});
const scamLinkRefresh = new SimpleIntervalJob({ seconds: 3600, runImmediately: true }, dataRefresh,'id_1');

let users = 0;
let guilds = 0;

let adminArray = [ // users with extra perms
    '719292655963734056', // M1nx
    '391878815263096833' // Occult
]


class CustomClient extends Client{
    data = []
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
client.models = [];

// client events

client.on('messageCreate', async (message) => {
    if(message.author.bot) return;
    if(!message.content) return;
    if(!client.data) return;
    if(message.channel.type == 'DM'){
        let ScamReviewChannel = client.channels.cache.get('939802381229629440') // In the Main Server
        ScamReviewChannel.send(`${message.author.id} : \`\`\`${message.content.replaceAll('`', '')} - ${message.author.tag}\`\`\``)
            .then(message => message.react('⬆️'))
            .catch(console.error);
        message.reply('Submitted <3')
    }
    else if(message.content == 'scam!credits'){
        let creditsEmbed = new MessageEmbed().setTitle('Credits')
            .setDescription(`Thank you for using Scam Avoid. To contribute a link send it in a direct message to the bot.`)
            .setTimestamp()
            .addField('Bot Creator','M1nx', true)
            .addField('API Creator', 'Occult Waifu', true)
            .addField('Contributer', 'Ash', true)
            .addField('Contributer', 'Magnetar',true)
            .addField('Contributer', 'BeanBop',true)
            .setFooter({ text: `${client.user.username} 1.2.0 by M1nx`})

        message.reply({
            embeds: [creditsEmbed]
        })
    }
    else if(message.content == 'scam!stats'){
        let statsEmbed = new MessageEmbed().setTitle('Stats')
            .addField('Data',`\`${client.data.length}\``, true)
            .addField('Users', `\`${users}\``, true)
            .addField('Guilds', `\`${guilds}\``, true)
            .setFooter({ text: `${client.user.username} 1.2.0 by M1nx`})
            .setTimestamp()

        message.reply({
            embeds: [statsEmbed]
        })
    }
    else if (message.content.startsWith("scam!eval")) {
        if(!adminArray.includes(message.author.id)) return; // whitelisted ids?
        let msg = message // im used to msg, go cry in corner if you dont like it
        let embed,
            result,
            fail,
            start,
            argss,
            lang
        argss = msg.content.match(/```.*\s*.*\s*```/gs)
        if(argss == null) return msg.channel.send(`Please provide a valid codeblock.`)
        argss = argss[0].replace(/\s*```.*\s*/g, '')
        lang = msg.content.match(/```.*\s*.+\s*```/gs)[0].match(/```.*/g) ?
            msg.content.match(/```.*\s*.+\s*```/gs)[0].match(/```.*/g)[0].replace('```', '')
            : 'js'

        try {
            result = inspect(eval(argss), { depth: 1 })
        } catch(e) {
            result = e
            fail = true
        }

        if (result.length > 1024 && result.length < 80000) {
            hastebin(result, { extension: lang, url: 'https://paste.exerra.xyz'} ).then(haste => msg.channel.send(`Result was too big: ` + haste))
        } else if(result.length > 80000) {
            msg.channel.send(`I was going to send this in a hastebin, but the result is over 80,000 characters`)
        } else {
            let embed = new MessageEmbed()
                .addField(`\u200B`, `\`\`\`js\n${result}\`\`\``)
                .setColor(fail ? `#ff0033` : `#8074d2`)
                .setFooter({ text: `${client.user.username} 1.2.0 by M1nx`})
            msg.channel.send({ embeds: [embed] })
        }
    }
    else {
        let flagged = false

        let compromisedEmbed = new MessageEmbed().setTitle('Compromised Account')
            .setDescription(`Your account has been compromised and used to promote a scam, as a result you have been banned from ${message.guild.name}. If you still have access to this account please reset your password or delete the account. In future be more careful pressing random data on the internet and never download anything from a website unless it is 100% trustworthy.`)
            .setTimestamp()
            .setThumbnail('https://i.imgur.com/AdjxcEc.png')
            .setFooter({ text: `${client.user.username} 1.2.0 by M1nx`})

        let links = extractUrls(message.content, true)

        if(typeof(links) == 'object'){
            for(let link of links){
                let url = new URL(link)
                if(client.data.includes(url.hostname)){
                    flagged = true
                }
                else{
                    flagged = false
                }
            }
        }

        if(flagged) {
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
    console.log(`Logged in as ${client.user.tag}`) // login
    users = 0;
    guilds = 0;
    for(let guild of client.guilds.cache){ // Ready in Servers
        console.log(`Ready in ${guild[1].name} for ${guild[1].memberCount} members.`)
        users += guild[1].memberCount;
        guilds += 1;
    }
    client.user.setActivity(`${users} Members for scams`, { type: "WATCHING", }); // Set Status
    scheduler.addSimpleIntervalJob(scamLinkRefresh); // Refresh scam links
})

client.on('guildCreate', (guild) =>{
    console.log(`Joined: ${guild}`)

    users = 0;
    guilds = 0;

    for(let guild of client.guilds.cache){ // Update presence
        users += guild[1].memberCount;
        guilds += 1;
    }
    client.user.setActivity(`${users} Members for scams`, { type: "WATCHING", }); // Set Status

})
client.on('guildDelete', (guild) => {
    console.log(`Left: ${guild}`)

    users = 0;
    guilds = 0;

    for(let guild of client.guilds.cache){ // Update presence
        users += guild[1].memberCount;
        guilds += 1;
    }
    client.user.setActivity(`${users} Members for scams`, { type: "WATCHING", }); // Set Status

})
client.login(process.env['TOKEN'])
