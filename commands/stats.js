import {MessageEmbed} from "discord.js";
import {refreshStats} from "../index.js";

export let statsCommand = {
    name: "stats",
    description: "Check the bot's statistics!",
    adminOnly: false,

    async execute(message, _args, client) {
        let stats = await refreshStats()
        let statsEmbed = new MessageEmbed().setTitle("Stats")
            .addField("Data",`\`${stats.data}\``, true)
            .addField("Users", `\`${stats.users}\``, true)
            .addField("Guilds", `\`${stats.guilds}\``, true)
            .setFooter({ text: `${client.user.username} 1.2.5 by M1nx`})
            .setTimestamp()

        message.reply({
            embeds: [statsEmbed]
        })
    }
}
