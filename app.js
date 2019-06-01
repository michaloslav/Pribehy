var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const Email = require("email-templates");
dateFormat = require('dateformat');
fs = require("fs");
str = require('string-to-stream');

tablesInfo = {
	authors: {cacheWith: ["authorsUrl"]},
	// fields with dontCachePriodically are updated together with other fields
	authorsUrl: {dontCachePriodically: true, transformUrl: true},
	books: {
		cacheWith: ["booksUrl", "previewsUrl"],
		featured: {sort: {by: "featuredOrder", order: "ASC"}}
	},
	booksUrl: {dontCachePriodically: true, transformUrl: true},
	imagesUrl: {exactlyOne: true},
	news: {
		cacheWith: ["newsUrl"],
		convertTimestampToDate: true,
		featured: {sort: {by: "timestamp", order: "DESC"}}
	},
	newsUrl: {dontCachePriodically: true, transformUrl: true},
	pageText: {exactlyOne: true, detectDangerousTags: true},
	previewsUrl: {dontCachePriodically: true, transformUrl: true}
}
cachedData = {}


// connect to MySQl
con = require('./sensitive')
con.connect(err => {
	if(err) throw err;
	else console.log("Connected")

	cacheData(Object.keys(tablesInfo))
})

// SQL error handling
noSQLErrors = (err, result, next, canBeEmpty = false) => {
	if(err) next(err);
	else if(!result) next(Error("!result"))
	else if(result.length === 0 && !canBeEmpty) next(new Error("result.length === 0"))
	else return true
}

// promisifying con.query()
query = (dbQuery, next, canBeEmpty, queryParams) => new Promise((resolve, reject) => {
	con.query(dbQuery, queryParams, (err, result) => {
		if(noSQLErrors(err, result, next, canBeEmpty)) resolve(result)
	})
})

// caching
cacheData = async tables => {
	let queries = tables.map(table => "SELECT * FROM " + table)
	let promises = []
	queries.forEach(q => {
		promises.push(query(q, console.warn, true))
	})
	let data = await Promise.all(promises)
	data.forEach((val, i) => {
		let key = tables[i]

		let valToStore = val
		if(tablesInfo[key].exactlyOne) valToStore = valToStore[0]
		if(tablesInfo[key].transformUrl) valToStore = transformUrl(valToStore)
		if(tablesInfo[key].convertTimestampToDate) valToStore.map(el => {el.date = dateFormat(el.timestamp, "d. m. yyyy")})
		if(tablesInfo[key].featured){
			let featuredVals = valToStore.filter(el => parseInt(el.featured) === 1)
			let sort = tablesInfo[key].featured.sort
			featuredVals.sort((a, b) => {
				var aIsBigger = a[sort.by] > b[sort.by]
				return sort.order === "ASC" ? aIsBigger : !aIsBigger
			})

			cachedData[key + "_featured"] = featuredVals
			cachedData[key + "_showMore"] = featuredVals.length < valToStore.length
		}
		if(tablesInfo[key].detectDangerousTags){
			["home", "about"].forEach(pageTextKey => {
				["<script", "<iframe"].forEach(tag => {
					valToStore[pageTextKey] = valToStore[pageTextKey].split(tag).join("")
				})
			})
		}

		cachedData[key] = valToStore

		// set the timeout for the next caching
		if(!tablesInfo[key].dontCachePriodically){
			let timeoutAmount = (Math.random() + .5) * 10*60*1000 // every 5-15 minutes (different for each field so that we don't update all of them at the same time)

			let tablesToCache
			if(tablesInfo[key].cacheWith) tablesToCache = [key, ...tablesInfo[key].cacheWith]
			else tablesToCache = [key]

			setTimeout(() => {cacheData(tablesToCache)}, timeoutAmount)
		}
	})

	console.log("Finished caching", tables.join(", "));
}


// MySQL session store
const sessionStore = new MySQLStore({
	clearExpired: true,
	checkExpirationInterval: 900000,
	expiration: 86400000,
	createDatabaseTable: true
}, con);

// email
email = new Email({
	message: {
		from: "Nakladatelství Tofana <tofana@post.cz>"
	},
	// uncomment below to send emails in development/test env:
  // send: true
  transport: {
    host: "77.75.72.43",
		port: 25,
		secure: true,
		auth: {
			user: "tofana@post.cz",
			pass: "Muskat321"
		}
  }
})

transformUrl = function(urlResult) {
	var url = {}
	urlResult.map(el => {
		url[el.id] = el.url
	})
	return url
}

// require routers
var indexRouter = require('./routes/index');
var cartRouter = require('./routes/cart');
var bookRouter = require('./routes/book');
var authorRouter = require('./routes/author');
var orderRouter = require('./routes/order');
var allBooksRouter = require('./routes/allBooks');
var allNewsRouter = require('./routes/allNews');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// express session middleware
app.use(session({
	key: "pribehySessCookie",
  secret: "pribehy web developper 420",
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
}))

/*app.use((req, res, next) => {
	console.log(req.originalUrl);
	console.log(req.session.savedInputs);
	next();
})*/

// routers middleware
app.use('/', indexRouter);
app.use('/cart', cartRouter);
app.use('/book', bookRouter);
app.use('/author', authorRouter);
app.use('/order', orderRouter);
app.use('/allBooks', allBooksRouter);
app.use('/allNews', allNewsRouter);

/*
app.get("/email", (req, res, next) => {
	con.query("SELECT * FROM books WHERE id IN (" + Object.keys(req.session.itemsInCart).join(', ') + ")", (err, itemsInCartInfo) => {
		if(noSQLErrors(err, itemsInCartInfo, next)){

			// get total price
			var totalPrice = 0;
			var itemsInCartKeys = Object.keys(req.session.itemsInCart);
			for(i = 0; i < itemsInCartInfo.length; i++){
				totalPrice += req.session.itemsInCart[itemsInCartInfo[i].id] * itemsInCartInfo[i].price;
			}

			// calculate the discount
			var totalPieces = 0; ////////
			for(var i in req.session.itemsInCart){
				if(req.session.itemsInCart.hasOwnProperty(i)){
					totalPieces += parseInt(req.session.itemsInCart[i])
				}
			}
			var discount;
			var discountPercentage;
			switch(totalPieces){
				case 1:
					discountPercentage = 0;
					break;
				case 2:
					discountPercentage = 0.1;
					break;
				default:
					discountPercentage = 0.15;
			}
			discount = totalPrice * discountPercentage
			priceAfterDiscount = totalPrice - discount

  		res.render("email", {
				itemsInCart: req.session.itemsInCart,
				itemsInCartInfo: itemsInCartInfo,
				totalPrice: totalPrice,
				discount: discount,
				priceAfterDiscount: priceAfterDiscount,
				orderInfo: [
					"JSON.stringify(req.session.itemsInCart)",
					"req.body.name",
					"req.body.phoneNumber",
					"req.body.email",
					"req.body.streetAndHouseNumber",
					"req.body.zipCode",
					"req.body.city",
					"req.body.companyID"
				],
				orderID: "x"
			})
		}
	})
})

app.get("/emailAdmin", (req, res, next) => {
	con.query("SELECT * FROM books WHERE id IN (" + Object.keys(req.session.itemsInCart).join(', ') + ")", (err, itemsInCartInfo) => {
		if(noSQLErrors(err, itemsInCartInfo, next)){

			// get total price
			var totalPrice = 0;
			var itemsInCartKeys = Object.keys(req.session.itemsInCart);
			for(i = 0; i < itemsInCartInfo.length; i++){
				totalPrice += req.session.itemsInCart[itemsInCartInfo[i].id] * itemsInCartInfo[i].price;
			}
			console.log(totalPrice);

		  res.render("emailAdmin", {
				orderInfo: [
					"JSON.stringify(req.session.itemsInCart)",
					"req.body.name",
					"req.body.phoneNumber",
					"req.body.email",
					"req.body.streetAndHouseNumber",
					"req.body.zipCode",
					"req.body.city",
					"req.body.companyID"
				],
				itemsInCart: req.session.itemsInCart,
				itemsInCartInfo: itemsInCartInfo,
				orderID: "x",
				discount: discount,
				priceAfterDiscount: priceAfterDiscount,
				totalPrice: totalPrice
			})
		}
	})
})
*/


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(async (err, req, res, next) => {
	console.warn(err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
	var imagesUrl = await query("SELECT back, tofanaLogo, VYDANI, cartIcon, VOP, DOD_UHR, error FROM imagesUrl", next)
	imagesUrl = imagesUrl[0]
	res.render('error', {error: err,
		active: "error",
		imagesUrl
	})
});

// pinging (aka preventing Heroku from sleeping)
const pinging = require('./util/pinging')
pinging()

module.exports = app;
