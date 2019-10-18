const rp = require('request-promise')
require('dotenv').config()

let token = ''

const updateToken = async () => {
  const options = {
    method: 'POST',
    json: true,
    uri: 'https://api.eksisozluk.com/token',
    headers:
            {
              'Cache-Control': 'no-cache',
              'accept': 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
              'user-agent': 'okhttp/2.3.0'
            },
    form: {
      'grant_type': 'password',
      'username': process.env.USERNAME,
      'password': process.env.PASSWORD,
      'client_secret': process.env.CLIENT_SECRET
    }
  }

  await rp(options)
    .then(parsedBody => {
      token = parsedBody.access_token
    })
    .catch(err => {
      console.log('API ERROR: ' + err)
    })

  return token
}

const getToken = () => token

module.exports = { updateToken, getToken }
