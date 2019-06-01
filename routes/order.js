var express = require('express');
var router = express.Router();

router.get('/new', (req, res) => {
	res.redirect("/");
})

router.post('/new', async (req, res, next) => {

	// get info about the ordered books
	var {books} = cachedData
	// check if caching failed
	var itemsInCartInfo
	if(books){
		let idsInCart = Object.keys(req.session.itemsInCart).map(el => parseInt(el))
		itemsInCartInfo = books.filter(el => idsInCart.includes(el.id))
	}
	else{
		itemsInCartInfo = await query(`SELECT * FROM books WHERE id IN (${Object.keys(req.session.itemsInCart).join(', ')})`, next)
	}

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
	discount = Math.round(totalPrice * discountPercentage)
	priceAfterDiscount = totalPrice - discount

	// insert data into the database
	var sql = "INSERT INTO orders(items, name, phoneNumber, email, streetAndHouseNumber, zipCode, city, companyID, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
	var orderInfo = [
		JSON.stringify(req.session.itemsInCart),
		req.body.name,
		req.body.phoneNumber,
		req.body.email,
		req.body.streetAndHouseNumber,
		req.body.zipCode,
		req.body.city,
		req.body.companyID,
		priceAfterDiscount
	]
	var orderInfo = await query(sql, next, false, orderInfo)
	var orderID = orderInfo.insertId;

	var timestampResult = await query(`SELECT timestamp FROM orders WHERE id = ${orderID}`, next)

	var imagesUrl
	if(cachedData.imagesUrl && cachedData.imagesUrl.VOP) imagesUrl = {VOP: cachedData.imagesUrl.VOP}
	else imagesUrl = await query("SELECT VOP FROM imagesUrl", next)

	var orderDate = dateFormat(timestampResult[0].timestamp, "d. m. yyyy");


	// send an email to the client
	email
		.send({
			template: "newOrder",
			message: {
				to: req.body.name + " <" + req.body.email + ">"
			},
			locals: {
				orderInfo: orderInfo,
				itemsInCart: req.session.itemsInCart,
				itemsInCartInfo: itemsInCartInfo,
				totalPrice: totalPrice,
				discount: discount,
				priceAfterDiscount: priceAfterDiscount,
				orderID: orderID,
				orderDate: orderDate,
				imagesUrl: imagesUrl
			}
		})
	  .then()
	  .catch(console.error);

	//send an email to the admin
	email
		.send({
			template: "newOrderAdmin",
			message: {
				to: "jra660417@gmail.com"
			},
			locals: {
				orderInfo: orderInfo,
				itemsInCart: req.session.itemsInCart,
				itemsInCartInfo: itemsInCartInfo,
				totalPrice: totalPrice,
				discount: discount,
				priceAfterDiscount: priceAfterDiscount,
				orderID: orderID,
				orderDate: orderDate,
				imagesUrl: imagesUrl
			}
		})
	  .then()
	  .catch(console.error);


	// empty the sess vars (itemsInCart and the savedInputs)
	delete req.session.itemsInCart;
	delete req.session.savedInputs;

	res.redirect("/?justOrdered=true")
})

module.exports = router;
