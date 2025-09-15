const discord = require("discord.js");
const { queryParams } = require('../db/database.js');
const { tokens, guildid, welcomechannel } = require("../config.json");
const emailHandler = require("./handlers/emailHandler.js");
const eventHandler = require("./handlers/eventHandler.js");
const { startLicenseChecker } = require('./utils/licensechecker.js');
const { startLeaderboardUpdater } = require('./utils/leaderboardupdater.js');
const { setupMemberHandler } = require('./handlers/welcomeHandler.js');
const { autosecurelogs, initializelogs } = require('../autosecure/utils/embeds/autosecurelogs.js')
const { initializequarantine } = require('./handlers/quarantineMap.js')
const http = require('http');
const { initializeNotificationSystem } = require('./utils/usernotifications.js')
const { initializeInvoices } = require('./utils/purchase/combined.js')
const { initializeappealclient } = require("../autosecure/utils/bancheckappeal/appealmsg.js");
const checkroles = require("./utils/checkroles.js")
/*
Starts Autosecure API
*/
require("./handlers/handleapi.js")

const activityTypes = {
    PLAYING: 0,
    STREAMING: 1,
    LISTENING: 2,
    WATCHING: 3,
    COMPETING: 4
};

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { oldfinishedappeals } = require("./handlers/handleappealnapi.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.GuildMember,
        Partials.User
    ]
});





client.tickets = new Map();
client.cooldowns = new discord.Collection();
eventHandler(client, tokens[0]);



async function setBotPresenceAndStatus() {
    try {
        const rows = await queryParams(
            "SELECT activity_type, activity_name, status FROM controlbot WHERE id = ?",
            [1]
        );

        if (!rows || rows.length === 0 || !rows[0].activity_type || !rows[0].activity_name) {
            await client.user.setPresence({
                activities: [{ name: "Purchase a subscription ;)", type: 0 }],
                status: 'online'
            });
            return;
        }

        const row = rows[0];
        const normalizedActivityType = row.activity_type.toUpperCase();
        const activityType = activityTypes[normalizedActivityType] || 0;

        const statusMapping = {
            'online': 'online',
            'idle': 'idle',
            'dnd': 'dnd',
            'invisible': 'invisible'
        };
        const status = statusMapping[row.status?.toLowerCase()] || 'online';

        await client.user.setPresence({
            activities: [{
                name: row.activity_name,
                type: activityType
            }],
            status: status
        });

    } catch (error) {
        console.error(`Failed to set presence and status: ${error.message}`);
    }
}

async function initializeController() {
    console.log(`Initializing controller!`)
    try {
        client.queryParams = async (query, params = [], method = "all") => {
            return queryParams(query, params, method);
          };
        await client.login(tokens[0]);

        client.once("ready", async () => {
const clientId = client.user.id;
autosecurelogs(client, 'startbots', clientId, null, null, null, null);
initializequarantine();
emailHandler.initialize(client)

await Promise.all([
    startLicenseChecker(client),
    setupMemberHandler(client),
    initializelogs(client),
    initializeappealclient(client),
    oldfinishedappeals(),
    checkroles(client),
    startLeaderboardUpdater(client).then(stop => {
        client.leaderboardCleanup = stop;
    })
]);
        });

    } catch (error) {
        console.error(`Bot|Error|Initialize|${error.message}|${new Date().toISOString()}`);
    }
}

module.exports = { initializeController, client };
