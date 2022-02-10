export let inviteCommand = {
    name: 'invite',
    description: 'Get an invite code for the bot!',
    adminOnly: false,

    async execute(message, args, client) {
        let msg = await message.react('❤️')
        console.log(args)
    }
}
