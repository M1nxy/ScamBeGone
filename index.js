import { Client, Intents, MessageEmbed } from "discord.js";
import fetch from "node-fetch";
import * as dotenv from "dotenv";
import { ToadScheduler, SimpleIntervalJob, Task } from 'toad-scheduler';
import { commands } from "./commands/commands.js";
// The following are unused with the exception of `filterUrls`
import {filterUrls, filter} from "string-flagger";
import extractUrls from "extract-urls";
import hastebin from "hastebin-gen";
import { inspect } from "util";

dotenv.config();

// scheduled events
const scheduler = new ToadScheduler();
const dataRefresh = new Task("data refresh", async () => {
    let oldData = client.data
    try{
        client.data = (await (await fetch(process.env["DATA"] || "https://api.exerra.xyz/scam/all")).json())
        console.log(`Refreshed ${client.data.length} scam links!`)
    } catch (e) {
        client.data = oldData
        console.log("Failed to refresh scam links!")
    }
});
const statsRefresh = new Task("stats refresh", async () => {
    await refreshStats()
});
const scamLinkRefresh = new SimpleIntervalJob({ seconds: 3600, runImmediately: true }, dataRefresh,"id_1");
const botstatsRefresh = new SimpleIntervalJob({ seconds: 300, runImmediately: true }, statsRefresh,"id_2");

// list of people with trusted status
const adminArray = [ // users with extra perms
    "719292655963734056", // M1nx
    "391878815263096833" // Occult
]

// Client initialization
class CustomClient extends Client{
    data = []
    commands = []
}
let client = new CustomClient({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.DIRECT_MESSAGES],
    allowedMentions: { parse: ["users"] },
    partials: ["CHANNEL"]
});
client.commands = commands

// commonly used functions
export async function refreshStats(){
    let stats = { users: 0, guilds: 0, data: 0 }

    for(let guild of client.guilds.cache) {
        stats.users += guild[1].memberCount;
        stats.guilds += 1;
    }
    stats.data = client.data.length

    client.user.setActivity(`${stats.users} Members for scams`, { type: "WATCHING", }); // Set Status

    return stats
}
export async function sendLog(content){
    let logChannel = client.channels.cache.get(process.env.CHANNEL || "939802381229629440") // Logs submissions and join/leave events
    return logChannel.send(content)
}


// client events
client.on("messageCreate", async (message) => {
    if(message.author.bot) return;
    if(client.data.length == 0) return;
    if (!message.channel.permissionsFor(client.user).has("SEND_MESSAGES")) {
        return;
    }

    if(message.content.startsWith("scam!")){
        let args = (message.content.toLowerCase().split(" ")) // split on " " and put into array called args, index one will be prefix+commandName
        let commandName = args.shift().slice(5) // remove prefix+commandName from args array and strip prefix from commandName
        let command = client.commands.find(x => x.name === commandName) // fetch command from commands array

        if(command){
            if(command.adminOnly && !adminArray.includes(message.author.id)){
                return message.reply("Insufficient Permissions <3"); // whitelisted ids?
            }
            command.execute(message, args, client) // run command
        }
    }
    else if(message.channel.type == "DM"){
        sendLog(`Submission by ${message.author.tag}(${message.author.id}): \`\`\`${message.content.replaceAll("`", "")}\`\`\``)
            .then(message => message.react("⬆️"))
            .catch(console.error);
        message.reply("Submitted <3")
    }
    else {
        let compromisedEmbed = new MessageEmbed().setTitle("Compromised Account")
            .setDescription(`Your account has been compromised and used to promote a scam! As a result, you have been banned from ${message.guild.name}. If you still have access to this account, change your password or delete it. In the future, be more careful with handling random data on the internet and never download anything from websites unless it is 100% trustworthy.`)
            .setTimestamp()
            .setThumbnail("https://i.imgur.com/AdjxcEc.png")
            .setFooter({ text: `${client.user.username} 1.2.5 by M1nx`})

        if(await filterUrls(message.content.toLowerCase(), client.data)) {
            try {
                let author = message.guild.members.cache.get(message.author.id);

                (await author.createDM()).send({
                    embeds: [compromisedEmbed]
                }).then(test => {
                    if (author.bannable) {
                        author.ban({
                            days: 7,
                            reason: "Compromised Account Detected 😞"
                        })
                    }
                })

            } catch (e) {
                console.log(e)
            }
        }
    }

})
client.on("ready", async (client) =>{
    let stats = await refreshStats()
    console.log(`Logged in as ${client.user.tag} in ${stats.guilds} Servers.`) // login
    scheduler.addSimpleIntervalJob(scamLinkRefresh); // Refresh scam links
    scheduler.addSimpleIntervalJob(botstatsRefresh); // Refresh bots stats
})


// client stat refresh
client.on("guildCreate", async (guild) => {
    await refreshStats()
    sendLog(`Joined Server ${guild.name}(${guild.id}): \`\`\`diff\n+ ${guild.memberCount} users.\`\`\``)
})
client.on("guildDelete", async (guild) => {
    await refreshStats()
    sendLog(`Left Server ${guild.name}(${guild.id}): \`\`\`diff\n- ${guild.memberCount} users.\`\`\``)
})
client.on("guildMemberAdd", async (guild) => {
    await refreshStats()
})
client.on("guildMemberRemove", async (guild) => {
    await refreshStats()
})

// client login
client.login(process.env["TOKEN"])

// TODO: Database shenanigans
// TODO: Check command
// TODO: Settings command
// TODO: ESLint - VERY IMPORTANT
