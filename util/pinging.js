const http = require('http');

// prevent Heroku from sleeping by pinging the site every 5 minutes
function startPinging(){
  let url = "http://pribehy.eu"
  setInterval(() => {
  	try{
  		http.get(url)
  		console.log(`Pinged ${url}`)
  	}
  	catch(e){
  		console.warn(`Pinging ${url} failed!`, e)
  	}
  }, 5*60*1000)
}

function pinging(){
  setTimeout(startPinging, 60*1000)
}

module.exports = pinging
