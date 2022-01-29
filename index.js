const express = require("express");
const app = express();
app.use(express.json());

const routes = require('./api_routes/routes');
routes(app);
const port = process.env.PORT || 3000;

app.listen(port, () => {
console.log(`Listening on ${port}`);
});