import {MessageEmbed} from "discord.js";

export let serverCommand = {
    name: 'servers',
    description: 'List all server names, IDs and owners!',
    adminOnly: true,
    async execute(message, args, client) {
        let servers = []
        for(let guild of client.guilds.cache){
            let guildOwner = await client.users.cache.get(guild[1].ownerId)

            let guildInfo = {
                ID: guild[1].id,
                name: guild[1].name,
                icon: `https://cdn.discordapp.com/icons/${guild[1].id}/${guild[1].icon}`,
                ownerId: guild[1].ownerId,
                raw: guild
            }

            servers.push(guildInfo)
        }

        for(let server of servers){
            let serverEmbed = new MessageEmbed()
                .setTitle(server.name)
                .addField('ID', server.ID)
                .addField('Owner', `<@${server.ownerId}>`)
                .setThumbnail(server.icon)
                .setTimestamp()
                .setFooter({ text: `${client.user.username} 1.2.5 by M1nx`})

            message.reply({embeds: [serverEmbed]})
        }
    }
}
