console.log("all messages")
// Imports the Google Cloud client library
const request = require('request');
const ZipStream = require('zip-stream');
const express = require('express');

const {PubSub} = require('@google-cloud/pubsub');
const { Storage } = require('@google-cloud/storage');
const app = require('firebase-admin');
const { applicationDefault } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');

// Creates a client; cache this for further use
const pubSubClient = new PubSub();
const storage = new Storage();
app.initializeApp({
  credential: applicationDefault(),
  databaseURL: 'https://temporaryprojectdmii-default-rtdb.firebaseio.com/',
  projectId: 'temporaryprojectdmii'
});

const db = getDatabase();
const ref = db.ref('khlere/saving-data/POULET');

async function listenForMessages(subscriptionNameOrId, timeout) {
  // References an existing subscription
  const subscription = pubSubClient.subscription(subscriptionNameOrId); // Name for the new subscription to create
  
  var path = 'khlere/poulet'
  // Create an event handler to handle messages
  let messageCount = 0;
  var queue = []

  const messageHandler = async message => {
    var zip = new ZipStream()

 
  const file = await storage
  .bucket("dmii2023bucket")
  .file(path);

  const stream = file.createWriteStream({ metadata: {
    contentType: "application/zip",
    cacheControl: 'private'
    },
    resumable: false
    });
    console.log(`Received message ${message.id}:`);
    console.log(`\tData: ${message.data}`);
    console.log(`\tAttributes: ${message.attributes}`);

    messageCount += 1;

    var arrayOfMessage = JSON.parse(message.data)
    for(let i = 0; i < 10; i++) {
        if (i < arrayOfMessage.url.length) {
            queue.push({ name: `${i}.jpg`, url: `${arrayOfMessage.url[i]}` })
        }
    }

    zip.pipe(stream);
    function addNextFile() {
        var elem = queue.shift()
        var stream = request(elem.url)
        zip.entry(stream, { name: elem.name }, err => {
            if(err) {
              console.log(err)
              throw err;
            }
            
            if(queue.length > 0)
                addNextFile()
            else
               zip.finalize()
        })
    }

    addNextFile()
    
    return new Promise ((resolve, reject) => {
        stream.on('error', (err) => {
        reject(err);
      });
      stream.on('finish', () => {
        message.ack();
        resolve('Ok');
        const zipRef = ref.child('zip');
        zipRef.set({
          zip: {
            tags: arrayOfMessage.tags,
            files: path,
          },
        });
        });
    });    
  };

  // Listen for new messages until timeout is hit
  subscription.on('message', messageHandler);

  // Wait a while for the subscription to run. (Part of the sample only.)
  setTimeout(() => {
    subscription.removeListener('message', messageHandler);
    console.log(`${messageCount} message(s) received.`);
  }, timeout * 1000);
}


function main(
    subscriptionNameOrId = 'dmii2-4',
    timeout = 60
  ) {
    timeout = Number(timeout);
    listenForMessages(subscriptionNameOrId, timeout);
}
  
main(...process.argv.slice(2));
