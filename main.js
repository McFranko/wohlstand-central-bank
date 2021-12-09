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
        ],
        partials: ["CHANNEL"]
    }
);

if(!fs.existsSync("./accounts")) {
    fs.mkdirSync("./accounts");
}

client.once("ready", function() {
    console.log("Bot Online");
});

client.on("guildMemberUpdate", async function(member) {
    await member.fetch();
});

client.on("messageCreate", async function(message) {
    let author = "<@!" + message.author.id + ">";

    if(!message.content.startsWith("w! ")) {
        return;
    }

    let commandAndArgs = message.content.split(" ");

    console.log("received command " + commandAndArgs + " from " + author);

    switch(commandAndArgs[1]) {
        case "help": {
            message.reply(helpMessage).catch(console.error);
            break;
        }

        case "init": {
            await message.guild.members.fetch();

            break;
        }

        case "test": {
            break;
        }

        case "pay": {
            let payee = message.author;

            let recipientUsername;
            try {
                recipientUsername = getUsernameFromCommand(message.content, 2);
            } catch(error) {
                console.log(error);
                message.reply(
                    "Could not find the recipient's username! Use `w! help` if you need help"
                );
                return;
            }

            let recipient;
            try {
                recipient = getUserFromUsername(recipientUsername);
            } catch(error) {
                console.log(error);

                message.reply(
                    "Could not find a user by the name \"" + recipientUsername + "\""
                );
                return;
            }

            let amount_str = commandAndArgs[commandAndArgs.length - 1];
            let amount = parseInt(amount_str);
            if(isNaN(amount) || amount < 0) {
                message.reply(amount_str + " is not a valid payment amount");
                return;
            }

            try {
                pay(recipient, amount, payee);

                message.reply(
                    "Payed " + 
                    recipient.username + 
                    " " + 
                    amount + 
                    "Ð"
                ).catch(console.error);

                recipient.send("Recieved " + amount + "Ð from " + payee.username).catch(console.error);
            } catch(error) {
                console.log(error);

                if(error == "Insufficient Balance") {

                    message.reply("You do not have enough balance!").catch(console.error);
                }
            }

            break;
        }

        case "balance": {
            let account = getAccount(message.author.id);

            message.reply("You have " + `${account.balance}` + "Ð")

            break;
        }

        case "setBal": {
            let recipientUsername;
            try {
                recipientUsername = getUsernameFromCommand(message.content, 2);
            } catch(error) {
                console.log(error);
                message.reply(
                    "Could not find the recipient's username! Use `w! help` if you need help"
                );
                return;
            }

            let recipient;
            try {
                recipient = getUserFromUsername(recipientUsername);
            } catch(error) {
                console.log(error);

                message.reply(
                    "Could not find a user by the name \"" + recipientUsername + "\""
                );
                return;
            }

            let amount_str = commandAndArgs[commandAndArgs.length - 1];
            let amount = parseInt(amount_str);
            if(isNaN(amount) || amount < 0) {
                message.reply(amount_str + " is not a valid amount");
                return;
            }

            let account = getAccount(recipient.id);
            account.balance = amount;
            saveAccount(account);

            message
                .reply("Set " + recipientUsername + "'s balance to " + account.balance);

            break;
        }

        case "balanceOf": {
            let subjectUsername;
            try {
                subjectUsername = getUsernameFromCommand(message.content, 2);
            } catch(error) {
                console.log(error);
                message.reply(
                    "Could not find the subject's username!"
                );
                return;
            }

            let subject;
            try {
                subject = getUserFromUsername(subjectUsername);
            } catch(error) {
                console.log(error);

                message.reply(
                    "Could not find a user by the name \"" + subjectUsername + "\""
                );
                return;
            }

            let account = getAccount(subject.id);

            message.reply(
                subject.username + "'s balance is " + account.balance + "Ð"
            );

            break;
        }
    }
});

function pay(recipient, amount, payee) {
    let recipient_account = getAccount(recipient.id);
    let payee_account = getAccount(payee.id);

    if(payee_account.balance < amount) {
        throw "Insufficient Balance";
    }

    recipient_account.balance += amount;
    payee_account.balance -= amount;

    saveAccount(recipient_account);
    saveAccount(payee_account);
}

function getUsernameFromCommand(command, username_index) {
    // Get username that is inside quotes
    let recipientUsername = command.split("\"")[1];

    if(recipientUsername == undefined) {
        let commandAndArgs = command.split(" ");
        recipientUsername = commandAndArgs[username_index];

        if(recipientUsername == undefined) {
            throw "Couldn't find username";
        }
    }

    return recipientUsername;
}

function getUserFromUsername(username) {
    let recipient = client.users.cache.find(
        user => user.username.toLowerCase() == username.toLowerCase()
    );

    if(recipient == undefined) {
        throw "Could not find a user by the name \"" + recipientUsername + "\"";
    }

    return recipient;
}

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
