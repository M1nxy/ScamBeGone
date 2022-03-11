import {MessageEmbed} from "discord.js";

export let inviteCommand = {
    name: 'invite',
    description: 'Get an invite code for the bot!',
    adminOnly: false,

    async execute(message, args, client) {
        let inviteEmbed = new MessageEmbed().setTitle(`Thank you for showing interest in ${client.user.username} ❤`)
            .setDescription(`Invite Link:\n https://discord.com/api/oauth2/authorize?client_id=939520237110460447&permissions=8&scope=bot%20applications.commands`)
            .setTimestamp()
            .setFooter({ text: `${client.user.username} 1.2.5 by M1nx`})
        let author = message.guild.members.cache.get(message.author.id);
        (await author.createDM()).send({embeds: [inviteEmbed]}).then(async r => {
            let msg = await message.react('❤️')
        })
    }
}
