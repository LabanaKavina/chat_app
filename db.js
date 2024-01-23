const {Client} = require('pg')

const client = new Client({
    user : 'postgres',
    host: '192.168.10.137',
    database : 'chat-app',
    password : 'avesta',
    port : 5432,
})
client.connect()
module.exports = {
    query : async(query , params) => {
        return await client.query(query , params)
    }
}