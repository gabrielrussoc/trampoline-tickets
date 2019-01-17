const TelegramBot = require('node-telegram-bot-api');

const unirest = require('unirest');

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// Matches "/echo [whatever]"
// bot.onText(/\/echo (.+)/, (msg, match) => {
//   // 'msg' is the received Message from Telegram
//   // 'match' is the result of executing the regexp above on the text content
//   // of the message

//   const chatId = msg.chat.id;
//   const resp = match[1]; // the captured "whatever"

//   // send back the matched "whatever" to the chat
//   bot.sendMessage(chatId, resp);
// });

// // Listen for any kind of message. There are different kinds of
// // messages.
// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;

//   // send a message to the chat acknowledging receipt of their message
//   bot.sendMessage(chatId, 'Received your message');
// });

const send_ingredients_msg = 'Please send me your ingredients';

// [ { id: 728454,
//     title: 'Raspberry Apple Smoothie with Bananas',
//     image: 'https://spoonacular.com/recipeImages/728454-312x231.jpg',
//     imageType: 'jpg',
//     usedIngredientCount: 2,
//     missedIngredientCount: 2,
//     likes: 434 },
//   { id: 47942,
//     title: 'Easy Glonola Stuffed Baked Apples',
//     image: 'https://spoonacular.com/recipeImages/47942-312x231.jpg',
//     imageType: 'jpg',
//     usedIngredientCount: 2,
//     missedIngredientCount: 2,
//     likes: 129 },
//   { id: 527766,
//     title: 'White Smoothie',
//     image: 'https://spoonacular.com/recipeImages/527766-312x231.jpg',
//     imageType: 'jpg',
//     usedIngredientCount: 2,
//     missedIngredientCount: 2,
//     likes: 29 },
//   { id: 596287,
//     title: 'Romaine and Apple Cinnamon Green Smoothie',
//     image: 'https://spoonacular.com/recipeImages/596287-312x231.jpg',
//     imageType: 'jpg',
//     usedIngredientCount: 2,
//     missedIngredientCount: 2,
//     likes: 18 } ]

function handleIngredients(chatId, ingredients) {
    // console.log(ingredients);

    let ingredientsQuery = ingredients.join("%2C");
    unirest.get(`https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByIngredients?number=4&ranking=1&ingredients=${ingredientsQuery}`)
        .header("X-RapidAPI-Key", "2b68db47d6msh71dcf6a6341a607p1e7f28jsnb6c7d178b72c")
        .end(async function (result) {
        // console.log(result.status, result.headers, result.body);

        let recipe = result.body[1];

        
        await bot.sendMessage(chatId, 'You could try making: ' + recipe.title);
        await bot.sendPhoto(chatId, recipe.image);
        
        unirest.get(`https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/${recipe.id}/information`)
            .header("X-RapidAPI-Key", "2b68db47d6msh71dcf6a6341a607p1e7f28jsnb6c7d178b72c")
            .end(function (result) {

                let response = result.body;

                let ingredientsList = [];
                response.extendedIngredients.forEach(ingredient => ingredientsList.push(ingredient.original));

                console.log(response);
                let instructionsList = response.instructions.replace(/\./g, '\n');

                bot.sendMessage(chatId, ingredientsList.join('\n'));
                bot.sendMessage(chatId, instructionsList);
        });

    });
}

bot.onText(/^\/recipe(@\w+)*$/, (msg) => {
    const chatId = msg.chat.id;

    if(msg.text.indexOf(' ') === -1) {
        bot.sendMessage(chatId, send_ingredients_msg, {
            reply_to_message_id: msg.message_id,
            reply_markup: {
                force_reply: true,
                selective: true
            }
        });
        return;
    }

    handleIngredients(chatId, msg.split(','));
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    if(msg.reply_to_message) {
        handleIngredients(chatId, msg.text.split(','));
    }
});