const express = require('express')
const app = express()
const port = 3000

// web server for uptime check -- pain

app.get('*', (req, res) => {
    res.send('Bot is Online!')
})

app.listen(process.env.PORT || 3000, () => console.log("Server is running..."));
