const urlModel = require("../models/urlModel")
const shortid = require('shortid')
const redis = require("redis");
const { promisify } = require("util");

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true
};



//*************Connect to redis*************//
const redisClient = redis.createClient(
    18828,
    "redis-18828.c264.ap-south-1-1.ec2.cloud.redislabs.com", { no_ready_check: true }
);
redisClient.auth("FF8DZ6Pb9Nr44KutDfIwqPKgY5gROY0g", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


//*************URL create*************//


const createUrl = async function (req, res) {
    try {
        const baseUrl = "http://localhost:3000/"
        const data = req.body
        const { longUrl } = data
        let keys = Object.keys(data)
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "please put some data in the body" })
        }
        if (keys.length > 0) {
            if (!(keys.length == 1 && keys == 'longUrl')) {
                return res.status(400).send({ status: false, message: "only longUrlfield is allowed" })
        }
        if (!/^https?:\/\/\w/.test(baseUrl.trim())) { 
            return res.status(400).send({ status: false, msg: "baserUrl is not valid" }) 
        }
        // VALIDATING LONG-URL:
        if (!data.longUrl) {
            return res.status(400).send({ status: false, msg: "longUrl is not present" })
        }
        if (data.longUrl.trim().length == 0){
            return res.status(400).send({ status: false, msg: "enter the longUrl in proper format" })
        }
        if (!(/^https?:\/\/([\w\d\-]+\.)+\w{2,}(\/.+)?$/
        ).test(longUrl.trim())) 
        {
            return res.status(400).send({ status: false, msg: "longUrl is invalid" })
        }
        let cahcedLongUrlData = await GET_ASYNC(`${longUrl}`)
            if (cahcedLongUrlData) {
                return res.status(200).send({ status: true, message: "data is present in the catche",data:JSON.parse(cahcedLongUrlData)})
            }else{
            let duplicateUrl = await urlModel.findOne({ longUrl: longUrl }).select({longUrl:1,shortUrl:1,urlCode:1,_id:0})
            if (duplicateUrl) {
            await SET_ASYNC(`${longUrl}`, (JSON.stringify(duplicateUrl)))
            return res.status(200).send({ status: true,msg: "shortUrl is already present for this longUrl", data: { "longUrl": duplicateUrl.longUrl, "shortUrl": duplicateUrl.shortUrl, "urlCode": duplicateUrl.urlCode } })
        }
    }
        // VALIDATING URL-CODE:
        data.urlCode = shortid.generate().toLowerCase()
        // VALIDATING SHORT-URL:
        data.shortUrl = baseUrl + `${data.urlCode}`
        console.log(data.shortUrl)
        // CACHEING OF THE TOTAL DATA:
        const SavedUrl = await urlModel.create(data)
        return res.status(201).send({ status: true, msg: "url-shortend", data: { "longUrl": SavedUrl.longUrl, "shortUrl": SavedUrl.shortUrl, "urlCode": SavedUrl.urlCode } })
    }
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
//*********GET URL*********** */

const getUrl = async function (req, res) {
    try {
        let urlCode = req.params.urlCode

        if (urlCode.trim().length == 0) {
            return res.status(400).send({ status: false, message: "plz provide URL Code in params" });;
        }

        const isUrlCodePresent = await urlModel.findOne({ urlCode: urlCode })

        if (!isUrlCodePresent) {
            return res.status(404).send({ status: false, msg: "Url not found with this urlCode" })
        }

        let chacedUrlData = await GET_ASYNC(`{$urlCode}`)
        if (chacedUrlData) {
            res.redirect(JSON.parse(chacedUrlData).longUrl)
        } else {
            await SET_ASYNC(`{$urlCode}`, JSON.stringify(isUrlCodePresent))
            res.redirect(isUrlCodePresent.longUrl)
        }

    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }

};
module.exports.createUrl = createUrl
module.exports.getUrl = getUrl
