const urlModel = require("../Models/urlModel")
const mongoose = require("mongoose")
const shortid = require('shortid')
const { url } = require("inspector")
const redis = require("redis");
const { promisify } = require("util");


const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true
}
//Connect to redis
const redisClient = redis.createClient(
    18828,
    "redis-18828.c264.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("FF8DZ6Pb9Nr44KutDfIwqPKgY5gROY0g", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

//Connection setup for redis

const setex = promisify(redisClient.setex).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const createShortUrl = async function (req, res) {
    try {
        const longUrl = req.body.longUrl
        const baseUrl = "http://localhost:3000"

        if (!isValid(longUrl)) return res.status(400).send({ status: false, msg: `longUrl is required` })


        if (!/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/.test(longUrl)) {
            return res.status(400).send({ status: false, msg: "longUrl is not in valid format" })
        }
        const shortUrlisUsed = await urlModel.findOne({ longUrl: longUrl })

        const urlCode = shortid.generate().toLowerCase()
        console.log(urlCode)
        const shortUrl = baseUrl + '/' + urlCode

        let cachelongUrldata = await GET_ASYNC(`${shortUrlisUsed}`)
        if (cachelongUrldata || shortUrlisUsed) {
            console.log("data in already present in cachememory")
            return res.status(400).send({ status: false, msg: `shortUrl is already generated for this longUrl`, data: shortUrlisUsed })
        }
        else {
            await setex(`${longUrl}`,40, JSON.stringify(shortUrlisUsed))
        }
        const urlCreated = await urlModel.create({ urlCode, longUrl, shortUrl })
        // console.log(shortid.generate());
        return res.status(201).send({ status: true, msg: "shortUrl created sucessfully", data: urlCreated })

    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }

}

const getUrlcode = async function (req, res) {
    try {
        const urlCode = req.params.urlCode
        if (urlCode.trim().length == 0) {
            res.status(400).send({ status: false, message: "plz provide URL Code in params" });
            return;
        }

        const url = await urlModel.findOne({ urlCode: urlCode })

        if (!url)
            return res.status(400).send({ status: false, msg: "urlCode is not valid" })
        let cacheUrldata = await GET_ASYNC(`${req.params.urlCode}`)
        if (!url)
            return res.status(400).send({ status: false, msg: "urlCode is not valid" })
        if (cacheUrldata) return res.redirect(JSON.parse(cacheUrldata).longUrl)
        else {
            await setex(`${req.params.urlCode}`,15, JSON.stringify(url))
            res.status(302).redirect(url.longUrl)
        }


    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

module.exports = { createShortUrl, getUrlcode }
