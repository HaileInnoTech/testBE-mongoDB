const express = require("express");
const { MongoClient } = require("mongodb");
const axios = require("axios");
const Realm = require("realm-web");
const auth = new Realm.App({ id: "data-eaisp" });
const cors = require("cors");

const uri =
  "mongodb+srv://hai28022002:matkhaulaloz02@mongodb.caqg1s8.mongodb.net/?retryWrites=true&w=majority&appName=mongoDB";

const client = new MongoClient(uri);
const { createServer } = require("http");
const httpServer = createServer();
const { Server } = require("socket.io");
const io = new Server(httpServer, { cors:  {origin: "*",
preflightContinue: false,
optionsSuccessStatus: 204 }});
io.on("connect", async (socket) => {
  console.log("A user connected");
 
  

  await connectMongoDB();
  getDataByTimestamp()
    .then((data) => {
      console.log(typeof data);
      socket.emit("initData", data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });

  const changeStream = client.db("IOT").collection("data2").watch();
  changeStream.on("change", (change) => {
    getDataByTimestamp()
      .then((data) => {
        console.log(typeof data);
        socket.emit("updateData", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });
  socket.on("disconnect", () => {
    console.log("A user disconnected");
    changeStream.close();
  });
});
httpServer.listen(process.env.PORT || 3000, function() {
  var host = httpServer.address().address
  var port = httpServer.address().port
  console.log(`Example app listening at http://${host}:${port}`)
});
async function getDataByTimestamp() {
  try {
    const result = await client
      .db("IOT")
      .collection("data2")
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
    return result.reverse();
  } catch (error) {
    console.error("Error fetching data by timestamp:", error);
    throw error; // Re-throw the error to handle it outside
  }
}
async function connectMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error; // Re-throw the error to handle it outside
  }
}

const app = express();
app.use(express.json());
const port = 5000;
async function loginEmailPassword(email, password) {
  // Create an email/password credential
  const credentials = Realm.Credentials.emailPassword(email, password);
  // Authenticate the user
  const user = await auth.logIn(credentials);
  // 'App.currentUser' updates to match the logged in user
  console.assert(user.id === auth.currentUser.id);
  return user;
}

async function getIotData() {
  try {
    const databasesList = await client.db().admin().listDatabases();
    console.log("Databases:");
    databasesList.databases.forEach((db) => console.log(` - ${db.name}`));
  } catch (error) {
    console.error("Error fetching IoT data:", error);
    throw error; // Re-throw the error to handle it outside
  }
}

async function addIotData(temp, humid) {
  try {
    const result = await client
      .db("IOT")
      .collection("data")
      .insertOne({
        temperatur: parseInt(temp),
        humidity: parseInt(humid),
      });
    console.log(`New data added successfully ${result.insertedId}`);
  } catch (error) {
    console.error("Error adding IoT data:", error);
    throw error; // Re-throw the error to handle it outside
  }
}

//call API
async function fetchData() {
  try {
    const data = JSON.stringify({
      collection: "data",
      database: "IOT",
      dataSource: "mongoDB",
    });

    const config = {
      method: "post",
      url: "https://ap-southeast-1.aws.data.mongodb-api.com/app/data-eaisp/endpoint/data/v1/action/find",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Request-Headers": "*",
        "api-key":
          "RKDlX4SH2ptt51yt9Xp2gWOvugnkr0EZ9KItWGfg1jNC1t7CPYOhSOmBkONd0j7d",
      },
      data: data,
    };

    const response = await axios(config);
    console.log("Estimated document count:", response.data.documents.length);
    const count = response.data.documents.length;
    return count;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Re-throw the error to handle it outside
  }
}
async function fetchDataBearer(token) {
  var data = JSON.stringify({
    collection: "data",
    database: "IOT",
    dataSource: "mongoDB",
    filter: {
      _id: {
        $oid: "6600358aa6fd3904fef92031",
      },
    },
  });
  var config = {
    method: "post",
    url: "https://ap-southeast-1.aws.data.mongodb-api.com/app/data-eaisp/endpoint/data/v1/action/findOne",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Request-Headers": "*",
      Authorization: `Bearer ${token}`,
    },
    data: data,
  };
  axios(config)
    .then(function (response) {
      const data = JSON.stringify(response.data);
      console.log(data);
    })
    .catch(function (error) {
      console.log(error);
    });
}

async function start() {
  try {
    await connectMongoDB();
    // await getIotData();
    // const randomTemp = parseInt(Math.floor(Math.random() * 50));
    // const randomHumid = parseInt(Math.floor(Math.random() * 50));
    // await addIotData(randomTemp, randomHumid);
    // const count = await fetchData();
    // console.log("Total documents:", count);

    // Set up change stream
    const changeStream = client.db("IOT").collection("data2").watch();
    changeStream.on("change", async (change) => {
      console.log(change.fullDocument);
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

// Start the server
app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  start();
  const user = await loginEmailPassword(
    "hai28022002@gmail.com",
    "hoanghai2002"
  );
  // console.log(user.accessToken);
  // fetchDataBearer(user.accessToken);
});
