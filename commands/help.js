import {MessageEmbed} from "discord.js";

export let helpCommand = {
    name: "help",
    description: "Get an information about a command!",
    adminOnly: false,

    async execute(message, _args, client) {
        let embed = new MessageEmbed().setFooter({ text: `${client.user.username} 1.2.5 by M1nx`}).setTimestamp()

        if(args.length > 0){
            if(args.length > 1){
                embed.setTitle("Error")
                embed.setDescription("Too many args!")
                embed.setColor("RED")
                message.reply({embeds: [embed]})
            }
            else {
                let command = client.commands.find(x => x.name === args[0]);
                if(!command){
                    embed.setTitle(`${command.name[0].toUpperCase() + command.name.substring(1, command.name.length)}`)
                    embed.setDescription(`${command.description}\nmore coming soon™️`)
                    embed.setColor("GREEN")
                    message.reply({embeds: [embed]})
                }
                else{
                    embed.setTitle("Error")
                    embed.setDescription("Command not found!")
                    embed.setColor("RED")
                    message.reply({embeds: [embed]})
                }

            }
        }
        else{
            embed.setTitle("Commands")

            for(let command of client.commands){
                if(!command.adminOnly && command.name !== "help"){
                    embed.addField(`${command.name[0].toUpperCase() + command.name.substring(1, command.name.length)}`, command.description, false)
                }
            }

            message.reply({embeds: [embed]})
        }
    }
}
