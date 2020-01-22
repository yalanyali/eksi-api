const express = require('express')
const app = express()
const rp = require('request-promise')
const mcache = require('memory-cache')
const auth = require('./eksi-auth')
require('dotenv').config()

const getFromUrl = async (url) => {
  let data
  const options = {
    uri: url,
    headers: {
      'user-agent': 'okhttp/2.3.0',
      authorization: 'bearer ' + auth.getToken(),
      accept: 'application/json'
    },
    json: true
  }

  data = await rp(options)
    .then(res => res)
    .catch(async (err) => {
      if (err.statusCode === 401) {
        return null
      }
      // console.log("API ERROR: " + err);
    })

  if (data) {
    return data
  } else {
    await auth.updateToken()
    return getFromUrl(url)
  }
}

const cache = duration => (req, res, next) => {
  let key = '__express__' + req.originalUrl || req.url
  let cachedBody = mcache.get(key)
  if (cachedBody) {
    res.type('json')
    res.send(cachedBody)
  } else {
    res.sendResponse = res.send
    res.send = body => {
      mcache.put(key, body, duration * 1000)
      res.sendResponse(body)
    }
    next()
  }
}

app.get('/', (req, res) => {
  res.send(';)')
})

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  next()
})

app.get(['/popular', '/popular/:page'], cache(process.env.CACHE_DURATION), async (req, res) => {
  let page = ''
  if (req.params.page) page = '?p=' + req.params.page
  const data = await getFromUrl('https://api.eksisozluk.com/v1/index/popular' + page)
  res.json(data)
})

app.get(['/today', '/today/:page'], cache(process.env.CACHE_DURATION), async (req, res) => {
  let page = ''
  if (req.params.page) page = '?p=' + req.params.page
  const data = await getFromUrl('https://api.eksisozluk.com/v1/index/today' + page)
  res.json(data)
})

app.get('/autocomplete/:text', async (req, res) => {
  let text = 'recep tayyip erd'
  if (req.params.text) text = encodeURIComponent(req.params.text)
  const data = await getFromUrl('https://api.eksisozluk.com/v1/autocomplete/query/' + text)
  res.json(data)
})

app.get(['/topic/id/:id', '/topic/id/:id/:page'], async (req, res) => {
  let id = '963149'
  if (req.params.id) id = encodeURIComponent(req.params.id)
  let page = ''
  if (req.params.page) {
    page = '?p=' + req.params.page
  }
  const data = await getFromUrl('https://api.eksisozluk.com/v1/topic/' + id + page)
  res.json(data)
})

app.get(['/topic/:text', '/topic/:text/:page'], cache(process.env.CACHE_DURATION), async (req, res) => {
  let page = ''
  if (req.params.page) page = '?p=' + req.params.page

  let text = 'semiz'
  if (req.params.text) text = encodeURIComponent(req.params.text)

  const result = await getFromUrl('https://api.eksisozluk.com/v1/topic/query?term=' + text)
  const id = result.QueryData.TopicId

  const data = await getFromUrl('https://api.eksisozluk.com/v1/topic/' + id + page)
  res.json(data)
})

app.listen(process.env.PORT || 80, () => console.log(`Server started.`))
