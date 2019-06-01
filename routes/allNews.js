var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', async (req, res, next) => {
	var {news, imagesUrl, newsUrl} = cachedData

	// if caching failed, use async db queries
	if(!news || !imagesUrl || !newsUrl){
		var allNewsInfoP = query("SELECT * FROM news ORDER BY timestamp DESC", next)
		var imagesUrlP = query("SELECT back, tofanaLogo, VYDANI, cartIcon, VOP, DOD_UHR FROM imagesUrl", next)
		var newsUrlResultP = query("SELECT * FROM newsUrl", next)

		var promises = [allNewsInfoP, imagesUrlP, newsUrlResultP]
		var [news, imagesUrl, newsUrlResult] = await Promise.all(promises)

		news.map((row) => {
			row.date = dateFormat(row.timestamp, "d. m. yyyy")
		})
		var newsUrl = transformUrl(newsUrlResult)
		imagesUrl = imagesUrl[0]
	}

  res.render("allNews", {itemsInCart: req.session.itemsInCart,
		allNewsInfo: news, imagesUrl, newsUrl
	})
})

module.exports = router;
