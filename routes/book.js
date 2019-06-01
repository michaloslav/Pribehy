var express = require('express');
var router = express.Router();

async function getBookDataFromDb(bookId, next){
	var imagesUrlP = query("SELECT back, tofanaLogo, VYDANI, cartIcon, VOP, DOD_UHR FROM imagesUrl", next)

	var bookInfo = await query("SELECT * FROM books WHERE id = ?", next, false, [bookId])
	bookInfo = bookInfo[0];

	var previewsUrlResultP = query("SELECT * FROM previewsUrl WHERE id = ?", next, false, [bookInfo.id])

	var otherBooksFromTheAuthor = await query(`SELECT * FROM books WHERE authorID = ? AND NOT id = ?`, next, false, [bookInfo.authorID, bookInfo.id])
	var otherBooksFromTheAuthorIds = otherBooksFromTheAuthor.map(el => el.id)
	var booksUrlResultP = query(`SELECT * FROM booksUrl WHERE id = ? OR id IN(${otherBooksFromTheAuthorIds.join(", ")})`, next, false, [bookInfo.id])

	var promises = [imagesUrlP, previewsUrlResultP, booksUrlResultP]
	var [imagesUrl, previewsUrlResult, booksUrlResult] = await Promise.all(promises)

	var booksUrl = transformUrl(booksUrlResult)
	var previewsUrl = transformUrl(previewsUrlResult)
	imagesUrl = imagesUrl[0]

	return {bookInfo, otherBooksFromTheAuthor, imagesUrl, booksUrl, previewsUrl}
}

/* GET users listing. */
router.get('/:id', async (req, res, next) => {
	var {books, booksUrl, previewsUrl, imagesUrl} = cachedData

	// check if caching worked or failed
	if(books && booksUrl && previewsUrl && imagesUrl){
		try{
			// only send the relevant data
			var bookInfo = books.find(el => el.id == req.params.id)
			var bookId = bookInfo.id
			previewsUrl = {[bookId]: previewsUrl[bookId]}
			var otherBooksFromTheAuthor = books.filter(el => el.authorID === bookInfo.authorID && el.id !== bookId)

			var booksFromTheAuthorIds = otherBooksFromTheAuthor.map(el => el.id)
			booksFromTheAuthorIds.push(bookId)
			var relevantBooksUrl = {}
			booksFromTheAuthorIds.forEach(id => relevantBooksUrl[id] = booksUrl[id])
			booksUrl = relevantBooksUrl
		}
		catch(e){
			console.warn(e)
			var {bookInfo, otherBooksFromTheAuthor, imagesUrl, booksUrl, previewsUrl} = await getBookDataFromDb(req.params.id, next)
		}
	}
	// if caching failed, use async queries
	else{
		var {bookInfo, otherBooksFromTheAuthor, imagesUrl, booksUrl, previewsUrl} = await getBookDataFromDb(req.params.id, next)
	}

	res.render("book", {itemsInCart: req.session.itemsInCart,
		bookInfo, otherBooksFromTheAuthor, imagesUrl, booksUrl, previewsUrl
	})
})

module.exports = router;
