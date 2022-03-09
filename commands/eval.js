import {inspect} from "util";
import hastebin from "hastebin-gen";
import {MessageEmbed} from "discord.js";
import {refreshStats} from "../index.js"; // for on the fly checks with eval command

export let evalCommand = {
    name: 'eval',
    description: 'Debugging Command!',
    adminOnly: true,

    async execute(message, args, client) {
        let embed,
            result,
            fail,
            start,
            argss,
            lang
        argss = message.content.match(/```.*\s*.*\s*```/gs)
        if(argss == null) return message.channel.send(`Please provide a valid codeblock.`)
        argss = argss[0].replace(/\s*```.*\s*/g, '')
        lang = message.content.match(/```.*\s*.+\s*```/gs)[0].match(/```.*/g) ?
            message.content.match(/```.*\s*.+\s*```/gs)[0].match(/```.*/g)[0].replace('```', '')
            : 'js'

        try {
            result = inspect(eval(argss), { depth: 1 })
        } catch(e) {
            result = e
            fail = true
        }

        if (result.length > 1024 && result.length < 80000) {
            hastebin(result, { extension: lang, url: 'https://paste.exerra.xyz'} ).then(haste => message.channel.send(`Result was too big: ` + haste))
        } else if(result.length > 80000) {
            message.channel.send(`I was going to send this in a hastebin, but the result is over 80,000 characters`)
        } else {
            let embed = new MessageEmbed()
                .addField(`\u200B`, `\`\`\`js\n${result}\`\`\``)
                .setColor(fail ? `#ff0033` : `#8074d2`)
                .setFooter({ text: `${client.user.username} 1.2.5 by M1nx`})
            message.channel.send({ embeds: [embed] })
        }
    }
}
