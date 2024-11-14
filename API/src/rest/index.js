const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const routesFolder = path.join(__dirname, "routes");

fs.readdirSync(routesFolder)
    .filter(function (file) {
        return file.indexOf(".") !== 0 && file.slice(-3) === ".js";
    })
    .forEach(function (file) {
        var route = require(path.join(routesFolder, file));
        router.use(`/${file.replace(".js", "")}`, route);
    });

router.get("/", (req, res) => {
    res.send("REST API Root");
});

module.exports = router;
