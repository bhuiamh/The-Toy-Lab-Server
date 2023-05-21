const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.axhfmt5.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyJWT = (req, res, next) => {
  console.log("headers", req.headers);
  console.log(req.headers.authorization);
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorized Access 1" });
  }
  const token = authorization.split(" ")[1];
  console.log("token", token);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      console.log(error);
      return res
        .status(403)
        .send({ error: true, message: "Unauthorized Access 2" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    // await client.connect();

    const toysCollection = client.db("theToyLab").collection("alltoys");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      console.log("token", { token });
      res.send({ token });
    });

    app.get("/mytoys", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      console.log("come Back", decoded.email);
      console.log("after came back", req.query.email);

      if (decoded.email != req.query.email) {
        return res.status(403).send({ error: 1, message: "Forbidden Access" });
      }

      let query = {};
      if (req.query?.email) {
        query = { sellerEmail: req.query.email };
      }

      const result = await toysCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/mytoys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/alltoys", async (req, res) => {
      const result = await toysCollection.find().toArray();
      res.send(result);
    });

    app.get("/alltoys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await toysCollection.findOne(query);
      res.send(result);
    });
    app.post("/addatoy", async (req, res) => {
      const toys = req.body;
      console.log(toys);
      const result = await toysCollection.insertOne(toys);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("The Toy Lab is running");
});

app.listen(port, () => {
  console.log(`The Toy Lab Server is running on port ${port}`);
});
