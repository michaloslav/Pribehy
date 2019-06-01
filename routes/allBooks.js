var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', async (req, res, next) => {
	var {books, imagesUrl, booksUrl} = cachedData

	// if caching failed, use async db queries
	if(!books || !imagesUrl || !booksUrl){
		var allBooksInfoP = query("SELECT * FROM books", next)
		var imagesUrlP = query("SELECT back, tofanaLogo, VYDANI, cartIcon, VOP, DOD_UHR FROM imagesUrl", next)
		var booksUrlResultP = query("SELECT * FROM booksUrl", next)

		var promises = [allBooksInfoP, imagesUrlP, booksUrlResultP]
		var [books, imagesUrl, booksUrlResult] = await Promise.all(promises)

		imagesUrl = imagesUrl[0]
		var booksUrl = transformUrl(booksUrlResult)
	}

	res.render("allBooks", {itemsInCart: req.session.itemsInCart,
		allBooksInfo: books, imagesUrl, booksUrl
	})
})

module.exports = router;
