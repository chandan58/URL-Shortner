const express = require('express');
const router = express.Router();

const urlController = require("../Controllers/urlController")

router.get("/test-me", function(req, res){
    res.send({status : true, msg : "working"})
})

router.post("/url/shorten",urlController.createShortUrl)

router.get("/:urlCode",urlController.getUrlcode)

module.exports = router;