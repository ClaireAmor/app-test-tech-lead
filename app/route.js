require('dotenv').config();

const formValidator = require('./form_validator');
const photoModel = require('./photo_model');
const {PubSub} = require('@google-cloud/pubsub');
const { Storage } = require('@google-cloud/storage');

var moment = require('moment')
const storage = new Storage();


function route(app) {
  app.get('/', async (req, res) => {
    const tags = req.query.tags;
    const tagmode = req.query.tagmode;

    const ejsLocalVariables = {
      tagsParameter: tags || '',
      tagmodeParameter: tagmode || '',
      photos: [],
      searchResults: false,
      invalidParameters: false
    };

    // if no input params are passed in then render the view with out querying the api
    if (!tags && !tagmode) {
      return res.render('index', ejsLocalVariables);
    }

    // validate query parameters
    if (!formValidator.hasValidFlickrAPIParams(tags, tagmode)) {
      ejsLocalVariables.invalidParameters = true;
      return res.render('index', ejsLocalVariables);
    }

    const options = { 
      action: 'read',
      expires: moment().add(2, 'days').unix() * 1000
    };
    const signedUrls = await storage
           .bucket(process.env.STORAGE_BUCKET)
           .file("poulet")
           .getSignedUrl(options);

    console.log("poleugrehjgbkughfighrveb")
    console.log(signedUrls)

    // get photos from flickr public feed api
    return photoModel
      .getFlickrPhotos(tags, tagmode)
      .then(photos => {
        ejsLocalVariables.photos = photos;
        ejsLocalVariables.searchResults = true;
        console.log(photos.length);
        return res.render('index', ejsLocalVariables);
      })
      .catch(error => {
        return res.status(500).send({ error });
      });
  });
  app.post('/zip', (req, res) => {
    // quickstart()
    console.log("CE SOIR ON DANCE AU NAZILAND", req.body.tags, req.body.tagmode);
    const tags = req.body.tags;
    const tagmode = req.body.tagmode;

    const ejsLocalVariables = {
      tagsParameter: tags || '',
      tagmodeParameter: tagmode || '',
      photos: [],
      searchResults: false,
      invalidParameters: false
    };

    // if no input params are passed in then render the view with out querying the api
    if (!tags && !tagmode) {
      return res.render('index', ejsLocalVariables);
    }

    // validate query parameters
    if (!formValidator.hasValidFlickrAPIParams(tags, tagmode)) {
      ejsLocalVariables.invalidParameters = true;
      return res.render('index', ejsLocalVariables);
    }

    var allMedias = []
   
    // get photos from flickr public feed api
    return photoModel
      .getFlickrPhotos(tags, tagmode)
      .then(photos => {
        ejsLocalVariables.photos = photos;
        ejsLocalVariables.searchResults = true;
        photos.forEach((element) => {
          allMedias.push(element.media.m)
        });
        quickstart(JSON.stringify(allMedias))

        res.render('index', ejsLocalVariables);
        
      })
      .catch(error => {
        console.log(error);
        return res.status(500).send({ error });
      });

      
  })
}

async function quickstart(
  message,
  projectId = 'temporaryprojectdmii', // Your Google Cloud Platform project ID
  topicNameOrId = 'dmii2-4', // Name for the new topic to create
  subscriptionName = 'dmii2-4' // Name for the new subscription to create
) {
  // Instantiates a client
  const pubsub = new PubSub({projectId});

  // Creates a new topic
  const topic = await pubsub.topic(topicNameOrId);
  console.log(`Topic ${topic.name} created.`);

  // Send a message to the topic
  topic.publishMessage({data: Buffer.from(message)});
}


module.exports = route;
