const Discord = require("discord.js");
const fs = require("fs");

const helpMessage = fs.readFileSync("./help").toString();
const admins = JSON.parse(fs.readFileSync("./admins.json"));

const client = new Discord.Client(
    {
        intents: [ 
            Discord.Intents.FLAGS.GUILDS,
            Discord.Intents.FLAGS.GUILD_MESSAGES,
            Discord.Intents.FLAGS.GUILD_MEMBERS,
            Discord.Intents.FLAGS.DIRECT_MESSAGES
        ]
    }
);

if(!fs.existsSync("./accounts")) {
    fs.mkdirSync("./accounts");
}

client.once("ready", () => {
    console.log("Bot Online");
});

client.on("messageCreate", async function(message) {
    try {
        let author = "<@!" + message.author.id + ">";

        if(!message.content.startsWith("w! ")) {
            return;
        }

        let commandAndArgs = message.content.split(" ");

        console.log("received command " + commandAndArgs + " from " + author);

        switch(commandAndArgs[1]) {
            case "help": {
                message.channel.send(helpMessage).catch(console.error);
                break;
            }

            // case "!dm": {
            //     message.author.send("You can now make transactions with me! If in the future you find transactions aren't working through DMs, use the `!dm` command again!");
            //     break;
            // }

            case "pay": {
                message.delete().catch(console.error);

                let payee_account = getAccount(author);

                let recipient = commandAndArgs[2];
                if(recipient == undefined) {
                    message.author.send("Please specify a recipient! Use `w! help` if you're confused");
                    break;
                }

                let recipient_account = getAccount(recipient);


                let amount = parseInt(commandAndArgs[3]);
                if(amount == NaN || amount < 0) {
                    amount = 0;
                }

                if(payee_account.balance - amount < 0) {
                    message.author.send("Not enough balance!");
                    break;
                }

                recipient_account.balance += amount;
                saveAccount(recipient_account);

                payee_account.balance -= amount;
                saveAccount(payee_account);

                let recipient_user = await client
                    .users 
                    .fetch(recipient.replace(/[^0-9.]/g, ""));
                    // removes characters which aren't numbers in order to get discord id

                message.author.send("Payed " + recipient_user.username + " " + amount + "Ð").catch(console.error);

                recipient_user.send("Received " + amount + "Ð from " + message.author.username).catch(console.error);

                let now = new Date();

                fs.appendFileSync(
                    "./log",
                    now + ": " + message.author.username + " payed " + recipient_user.username + " "+ amount + "\n"
                );

                break;
            }

            case "balance": {
                let account = getAccount(author);

                message
                    .author
                    .send("You have " + `${account.balance}` + "Ð");

                message.delete();

                break;
            }
            
            case "setBal": {
                if(!admins.includes(author)) {
                    message
                        .channel
                        .send("You must be an admin to execute that command! This incident has been reported, and you should be ashamed of yourself.");
                    break;
                }

                let recipient = commandAndArgs[2];
                let amount = parseInt(commandAndArgs[3]);

                let account = getAccount(recipient);
                account.balance = amount;
                saveAccount(account);

                message
                    .author
                    .send("Set " + recipient + "'s balance to " + account.balance);

                message.delete();

                break;
            }

            case "changeBal": {
                if(!admins.includes(author)) {
                    message
                        .channel
                        .send("You must be an admin to execute that command! This incident has been reported, and you should be ashamed of yourself.");
                    break;
                }

                let recipient = commandAndArgs[2];
                let recipient_account = getAccount(recipient);

                let amount = parseInt(commandAndArgs[3]);
                if(amount == NaN || amount < 0) {
                    amount = 0;
                }

                recipient_account.balance += amount;

                message.author.send(recipient + "'s account balance is now " + recipient_account.balance.stringify());
            }

            case "balanceOf": {
                if(!admins.includes(author)) {
                    message
                        .channel
                        .send("You must be an admin to execute that command! This incident has been reported, and you should be ashamed of yourself.");
                    break;
                }

                let subject = commandAndArgs[2];
                let account = getAccount(subject);

                message
                    .author
                    .send(subject + "'s balance is " + account.balance + "Ð");

                message.delete();

                break;
            }
        }
    } catch(error) {
        console.error(error);
    }
});

function getAccount(name) {
    let account_path = getAccountPath(name);

    if(fs.existsSync(account_path)) {
        return JSON.parse(fs.readFileSync(account_path));
    } else {
        return { "name": name, "balance": 0 };
    }
}

function saveAccount(account) {
    console.log("Saving account " + JSON.stringify(account));
    fs.writeFileSync(getAccountPath(account.name), JSON.stringify(account));
}

function getAccountPath(name) {
    return "./accounts/" + name + ".bal";
}

const token = fs.readFileSync("./token").toString().replace("\n", "");
client.login(token);
