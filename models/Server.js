const {Schema, model} = require('mongoose');

const ServerSchema = new Schema({
    id: Number,
    log: Number,
    appeals: Boolean
});

module.exports = model('Server', ServerSchema);
