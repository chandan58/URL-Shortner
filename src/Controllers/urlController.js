const urlModel = require("../Models/urlModel")
const mongoose = require("mongoose")
const shortid = require('shortid')
const { url } = require("inspector")

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true
}
const createShortUrl = async function (req, res) {
    try {
        const longUrl = req.body.longUrl
        const baseUrl = "http://localhost:3000"

        if (!isValid(longUrl)) return res.status(400).send({ status: false, msg: `longUrl is required` })


        if (!/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/.test(longUrl)) {
            return res.status(400).send({ status: false, msg: "longUrl is not in valid format" })
        }
        const urlCode = shortid.generate()
        const shortUrl = baseUrl + '/' + urlCode

        urlCreated = await urlModel.create({
            urlCode,
            longUrl,
            shortUrl
        })
        console.log(shortid.generate());
        return res.status(201).send({ status: true, msg: "shortUrl created sucessfully", data: urlCreated })



    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }

}

const getUrlcode = async function (req, res) {
    try {
        const urlCode = req.params.urlCode

        if (!urlCode)
            return res.status(400).send({ status: false, msg: "params value is not present" })

        const url = await urlModel.findOne({ urlCode })
        if (urlCode.trim().length==0) {
            res.status(400).send({ status: false, message: "plz provide URL Code in params" });
            return;
        }
        if (!url)
            return res.status(400).send({ status: false, msg: "urlCode is not present" })
        res.status(200).redirect( url.longUrl )

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

module.exports = { createShortUrl, getUrlcode }