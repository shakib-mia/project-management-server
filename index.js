const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const cors = require("cors");
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// const { error } = require("console");

app.use(
  cors({
    origin: "*",
    method: "*",
  })
);
app.use(express.json());

const uri = `mongodb+srv://projects:${process.env.PASSWORD}@cluster0.gvfpmor.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

client.connect();
const collection = client.db("portfolio").collection("projects");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); // The folder where uploaded files will be stored.
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name for storage.
  },
});

const upload = multer({ storage: storage });

// to deploy ========>> vercel --prod

app.get("/projects", async (req, res) => {
  const query = {};
  const cursor = collection.find(query);
  const projects = await cursor.toArray();
  res.send(projects);
});

app.get("/projects/:_id", async (req, res) => {
  const query = {
    _id: new ObjectId(req.params._id),
  };
  const cursor = collection.find(query);
  const projects = await cursor.toArray();
  res.send(projects);
});

app.post("/projects", async (req, res) => {
  const {
    title,
    smallDesc,
    liveSite,
    frontCode,
    hasBackendLink,
    backendLink,
    email,
    primaryImage,
    secondaryImage,
    tertiaryImage,
  } = req.body;

  const query = {
    title: title,
    liveSite: liveSite,
  };
  const cursor = collection.find(query);
  const exist = await cursor.toArray();

  const data = {
    title,
    smallDesc,
    liveSite,
    frontCode,
    backendLink,
    primaryImage,
    secondaryImage,
    tertiaryImage,
  };

  if (hasBackendLink) {
    if (title && smallDesc && liveSite && frontCode && backendLink) {
      if (exist.length) {
        res.send({ message: "Site Already exists" });
      } else {
        const cursor = await collection.insertOne(data);
        // const response = cursor.toArray();
        res.send({ status: 200, message: "Adding the Site" });
      }
    } else {
      res.send({ status: 204, message: "No field can be empty" });
    }
  } else {
    if (title && smallDesc && liveSite && frontCode) {
      if (exist.length) {
        res.send({ message: "Site Already exists" });
      } else {
        const cursor = await collection.insertOne(data);
        // const response = cursor.toArray();
        res.send({ status: 200, message: "Adding the Site" });
      }
    } else {
      res.send({ status: 204, message: "No field can be empty" });
    }
  }
});

app.put("/projects/:_id", async (req, res) => {
  const { field, updatedDoc } = req.body;
  const query = {
    _id: new ObjectId(req.params._id),
  };

  const updatedDocument = {
    $set: {
      [field]: updatedDoc,
    },
  };

  const cursor = await collection.updateOne(query, updatedDocument);
  if (cursor.modifiedCount) {
    // res.send(cursor);
    const newArr = [];
    const upperCase = /([A-Z])/g;
    const arr = field.split("");
    arr.map((item) => newArr.push(upperCase.test(item)));

    if (newArr.indexOf(true) > -1) {
      arr.splice(newArr.indexOf(true), 0, " ");
      const message = arr.join("") + " updated successfully";
      res.send({ message, ...cursor });
    }
  }
});

app.delete("/projects/:id", async (req, res) => {
  const query = {
    _id: new ObjectId(req.params.id),
  };
  const cursor = await collection.deleteOne(query);
  res.send(cursor);
});

app.get("/", (req, res) =>
  res.send({ message: "Welcome to Project Management Server" })
);

app.post("/file", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file received." });
  } else {
    const hostLink = `${req.protocol}://${req.get("host")}`;
    // console.log(req.file.filename);
    return res.status(200).json({
      url: hostLink + "/uploads/" + req.file.filename,
    });
  }
});

app.get("/uploads/:file", (req, res) => {
  const filename = `./uploads/${req.params.file}`;
  res.sendFile(filename, { root: __dirname });
});

app.delete("/delete/:filename", (req, res) => {
  const filePath = `./uploads/${req.params.filename}`;
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error while deleting the file:", err);
    } else {
      res.status(200).send("file deleted successfully");
    }
  });
});

app.listen(port, () => console.log("listening", port));
