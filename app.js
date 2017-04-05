require('dotenv-extended').load();

var builder = require('botbuilder');
var restify = require('restify');
var request = require('request');

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector);

var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
bot.recognizer(recognizer);

function createCard(pet, session) {
    return new builder.HeroCard(session)
        .title(pet.name.$t)
        .subtitle('Age: ' + pet.age.$t + ' Sex: ' + pet.sex.$t + ' Size: ' + pet.size.$t)
        .text(pet.description.$t)
        .images([
            builder.CardImage.create(session, pet.media.photos.photo[0].$t)
        ]);
}

bot.dialog('/', [
    function (session) {
       builder.Prompts.text(session, "Hi, welcome to Adopt-Bot! We use Petfinder to find adoptable pets near you. What is your name?");
   },
   function (session, results) {
       session.userData.name = results.response;
       builder.Prompts.number(session, "Hi " + results.response + ", what is your zipcode? I need it to find animals in your area!");
   },
    function (session, results) {
        session.userData.zipcode = results.response;
        session.send('Okay %s, what sort of animal do you want to adopt?', session.userData.name);
    }
]);

bot.dialog('Dog', function(session) {
    request({
    url: 'http://api.petfinder.com/pet.getRandom',
    qs: {key: 'baf60955aefa34ef908fdf31549da0cd', location: session.userData.zipcode, animal: 'dog', format: 'json', output: 'full'},
    }, function(error, response, body){
        if(error) {
            console.log(error);
        } else {
            var petObj = JSON.parse(body);
            var pet = petObj.petfinder.pet;
            // create the card based on selection
            var card = createCard(pet, session);

            // attach the card to the reply message
            var msg = new builder.Message(session).addAttachment(card);
            session.send(msg);
            session.send("Would you like to see another dog? You can say 'more dogs!'");
        }
    });
}).triggerAction({
    matches: 'dogs'
});

bot.dialog('Cat', function(session) {
    request({
    url: 'http://api.petfinder.com/pet.getRandom',
    qs: {key: 'baf60955aefa34ef908fdf31549da0cd', location: session.userData.zipcode, animal: 'cat', format: 'json', output: 'full'},
    }, function(error, response, body){
        if(error) {
            console.log(error);
        } else {
            var petObj = JSON.parse(body);
            var pet = petObj.petfinder.pet;
            // create the card based on selection
            var card = createCard(pet, session);

            // attach the card to the reply message
            var msg = new builder.Message(session).addAttachment(card);
            session.send(msg);
            session.send("Would you like to see another cat? You can say 'more cats!'"); 
        }
    });
}).triggerAction({
    matches: 'cats'
});
