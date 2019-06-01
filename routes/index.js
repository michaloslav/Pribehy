var express = require('express');
var router = express.Router();

async function getInfoFromDb(next){
	// get featured books and news
	var featuredBooksP = query("SELECT * FROM books WHERE featured = 1 ORDER BY featuredOrder ASC", next)
	var featuredNewsP = query("SELECT * FROM news WHERE featured = 1 ORDER BY timestamp DESC", next)
	// find out if there are non-featured books or news
	var nonFeaturedBooksP = query("SELECT id FROM books WHERE featured = 0", next, true)
	var nonFeaturedNewsP = query("SELECT id FROM news WHERE featured = 0", next, true)
	// get the page text and images
	var pageTextP = query("SELECT * FROM pageText", next)
	var imagesUrlP = query("SELECT back, tofanaLogo, VYDANI, cartIcon, VOP, DOD_UHR, tofanaBack, tofanaAbout FROM imagesUrl", next)

	// wait for the promises
	var promises = [featuredBooksP, nonFeaturedBooksP, featuredNewsP, nonFeaturedNewsP, pageTextP, imagesUrlP]
	var [books_featured, nonFeaturedBooks, news_featured, nonFeaturedNews, pageText, imagesUrl] = await Promise.all(promises)

	var books_showMore = nonFeaturedBooks.length != 0
	var news_showMore = nonFeaturedNews.length != 0

	pageText = pageText[0]
	imagesUrl = imagesUrl[0]

	// check if the pageText contains <script> or <iframe>
	try {
		if(pageText.home.includes("<script")
			|| pageText.home.includes("<iframe")
			|| pageText.about.includes("<script")
			|| pageText.about.includes("<iframe")){
				throw new Error("pageText contains a dangerous HTML tag")
			}
	} catch(e){
		next(e)
	}

	// get the pictures associated with featured books and news
	var featuredBooksIds = books_featured.map(el => el.id)
	var featuredNewsIds = news_featured.map(el => el.id)
	var booksUrlResultP = query("SELECT * FROM booksUrl WHERE id IN(" + featuredBooksIds.join(", ") + ")", next)
	var newsUrlResultP = query("SELECT * FROM newsUrl WHERE id IN(" + featuredNewsIds.join(", ") + ")", next)
	var previewsUrlResultP = query("SELECT * FROM previewsUrl WHERE id IN(" + featuredBooksIds.join(", ") + ")", next)

	// wait for the promises
	promises = [booksUrlResultP, newsUrlResultP, previewsUrlResultP]
	var [booksUrlResult, newsUrlResult, previewsUrlResult] = await Promise.all(promises)

	// transform the URLs
	var booksUrl = transformUrl(booksUrlResult)
	var newsUrl = transformUrl(newsUrlResult)
	var previewsUrl = transformUrl(previewsUrlResult)
	relevantUrls = {booksUrl, newsUrl, previewsUrl}

	return {books_featured, books_showMore, news_featured, news_showMore, pageText, imagesUrl, relevantUrls}
}

/* GET home page. */
router.get('/', async (req, res, next) => {

	var {books_featured, books_showMore, news_featured, news_showMore, pageText, imagesUrl, booksUrl, newsUrl, previewsUrl} = cachedData
	// if caching failed, use async queries instead
	if(!books_featured || typeof books_showMore === "undefined" ||
		!news_featured || typeof news_showMore === "undefined" ||
		!pageText || !imagesUrl || !booksUrl || !newsUrl || !previewsUrl
	){
		var {books_featured, books_showMore, news_featured, news_showMore, pageText, imagesUrl, relevantUrls} = await getInfoFromDb(next)
	}
	else{
		try{
			var featuredBooksIds = books_featured.map(el => el.id)
			var featuredNewsIds = news_featured.map(el => el.id)
			var urls = {booksUrl, newsUrl, previewsUrl}
			var relevantUrls = {booksUrl: {}, newsUrl: {}, previewsUrl: {}}
			Object.entries(urls).forEach(([urlsKey, urlsVal]) => {
				let idArr = urlsKey === "newsUrl" ? featuredNewsIds : featuredBooksIds
				Object.keys(urlsVal).forEach(urlId => {
					if(idArr.includes(parseInt(urlId))) relevantUrls[urlsKey][urlId] = urlsVal[urlId]
				})
			})
		}
		catch(e){
			console.warn(e)
			var {books_featured, books_showMore, news_featured, news_showMore, pageText, imagesUrl, relevantUrls} = await getInfoFromDb(next)
		}
	}

	res.render('index', { active: "index",
		justOrdered: req.query.justOrdered,
		itemsInCart: req.session.itemsInCart,
		featuredBooks: books_featured,
		showMoreBooks: books_showMore,
		featuredNews: news_featured,
		showMoreNews: news_showMore,
		pageText,	imagesUrl,
		...relevantUrls
	})
})

module.exports = router;
