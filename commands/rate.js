import {MessageEmbed} from "discord.js";

export let rateCommand = {
    name: 'rate',
    description: 'Rate the bot on top.gg!',
    adminOnly: false,

    async execute(message, args, client) {
        let inviteEmbed = new MessageEmbed().setTitle(`Thanks for using ${client.user.username} ❤`)
            .setDescription(`Top.gg Link:\n https://top.gg/bot/939520237110460447`)
            .setTimestamp()
            .setFooter({ text: `${client.user.username} 1.2.5 by M1nx`})
        let author = message.guild.members.cache.get(message.author.id);
        (await author.createDM()).send({embeds: [inviteEmbed]}).then(async r => {
            let msg = await message.react('❤️')
        })
    }
}
