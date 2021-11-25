const Discord = require("discord.js");
const fs = require("fs");

process.on('uncaughtException', err => {
  console.error('There was an uncaught error', err)
})

if(!fs.existsSync("./accounts")) {
    fs.mkdirSync("./accounts");
}

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

client.once("ready", () => {
    console.log("ready");
});

client.on("messageCreate", message => {
    message.delete();

    let author = "<@!" + message.author.id + ">";

    if(message.author.username == "WohlstandCentralBank") {
        return;
    }

    if(message.content.charAt(0) != "!") {
        return;
    }

    let commandAndArgs = message.content.split(" ");

    console.log("received command " + commandAndArgs + " from " + author);

    switch(commandAndArgs[0]) {
        case "!help": {
            message.channel.send(helpMessage).catch(console.error);
            break;
        }

        // case "!dm": {
        //     message.author.send("You can now make transactions with me! If in the future you find transactions aren't working through DMs, use the `!dm` command again!");
        //     break;
        // }

        case "!pay": {
            let payee = author;
            let payee_account = getAccount(payee);

            let recipient = commandAndArgs[1];
            let recipient_account = getAccount(recipient);


            let amount = parseInt(commandAndArgs[2]);

            if(payee_account.balance - amount < 0) {
                message.author.send("Not enough balance!").catch(console.error);
                break;
            }

            recipient_account.balance += amount;
            saveAccount(recipient_account);

            payee_account.balance -= amount;
            saveAccount(payee_account);

            message.author.send("Payed " + recipient + " " + amount + "$");

            let recipient_user = client
                .users
                .fetch(recipient.replace(/[^0-9.]/g, ""))

            recipient_user.then(user => {
                user
                    .send("Received " + amount + "$ from " + message.author.username);
            });

            break;
        }

        case "!balance": {
            let account = getAccount(author);
            message
                .author
                .send("You have " + account.balance.toString() + "$")
                .catch(console.error);

            message.delete().catch(console.error);

            break;
        }
        
        case "!setBal": {
            if(!admins.includes(author)) {
                message
                    .channel
                    .send("You must be an admin to execute that command! This incident has been reported, and you should be ashamed of yourself.");
                break;
            }

            let recipient = commandAndArgs[1];
            let amount = parseInt(commandAndArgs[2]);

            let account = getAccount(recipient);
            account.balance = amount;
            saveAccount(account);

            message
                .author
                .send("Set " + recipient + "'s balance to " + account.balance)
                .catch(console.error);

            break;
        }

        case "!balanceOf": {
            if(!admins.includes(author)) {
                message
                    .channel
                    .send("You must be an admin to execute that command! This incident has been reported, and you should be ashamed of yourself.");
                break;
            }

            let subject = commandAndArgs[1];
            let account = getAccount(subject);

            message
                .author
                .send(subject + "'s balance is " + account.balance + "$")
                .catch(console.error);

            break;
        }
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
