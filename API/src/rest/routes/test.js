const { Op } = require("sequelize");
const db = require("../../db");
const router = require("express").Router();

router.get("/", (req, res) => {
    res.send("TEST Endpoint");
});

module.exports = router;