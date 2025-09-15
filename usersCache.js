    const { Client } = require("discord.js");
    let client = new Client({ intents: [""] })
    client.login("")


    let usersCache = new Map()
    async function getUser(id) {
        if (isNaN(id) || id >= 9223372036854775807) return { username: "Invalid ID" }
        if (usersCache.has(id)) {
            let temp = usersCache.get(id)
            return temp
        } else {
            let temp2 = await fetchUser(id)
            return temp2
        }
    }


    async function fetchUser(id) {
        if (!client) return { username: "User Cacher isn't accessible!" }
        try {
            let user = await client.users.fetch(id)
            let resUser = {
                username: user.username,
                avatar: user.displayAvatarURL({ extension: "png", size: 128 }),
                discord_id: id
            }
            usersCache.set(id, resUser)
            return resUser
        } catch (e) {
            if (e.message == "Expected token to be set for this request, but none was present") {
                return { username: "User Cacher isn't accessible!" }
            } else if (e.message == "Unknown User") {
                let resUser = { username: "Unknown User" }
                usersCache.set(id, resUser)
                return resUser
            } else {
                console.log(e.message)
                return { username: "Couldn't fetch your discord user" }
            }
        }
    }
    module.exports = { getUser }
