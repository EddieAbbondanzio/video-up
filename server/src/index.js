import express from "express";
const app = express();

const PORT = 3000;

app.get("/", function (req, res) {
  res.send("Hello World");
});

console.log("Starting server");

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
