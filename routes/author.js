var express = require('express');
var router = express.Router();

async function getAuthorDataFromDb(authorId, next){
	var imagesUrlP = query("SELECT back, tofanaLogo, VYDANI, cartIcon, VOP, DOD_UHR FROM imagesUrl", next)

	var authorInfo = await query("SELECT * FROM authors WHERE Id = ?", next, false, [authorId])
	authorInfo = authorInfo[0]

	var authorsUrlResultP = query("SELECT * FROM authorsUrl WHERE id = ?", next, false, [authorInfo.id])

	var booksFromTheAuthor = await query("SELECT * FROM books WHERE authorID = ?", next, false, [authorInfo.id])
	var booksFromTheAuthorIds = booksFromTheAuthor.map(el => el.id)
	var booksUrlResultP = query(`SELECT * FROM booksUrl WHERE id IN(${booksFromTheAuthorIds.join(", ")})`, next)

	var promises = [imagesUrlP, authorsUrlResultP, booksUrlResultP]
	var [imagesUrl, authorsUrlResult, booksUrlResult] = await Promise.all(promises)

	var authorsUrl = transformUrl(authorsUrlResult)
	var relevantBooksUrl = transformUrl(booksUrlResult)
	imagesUrl = imagesUrl[0]

	return {authorInfo, booksFromTheAuthor, imagesUrl, authorsUrl, relevantBooksUrl}
}

/* GET users listing. */
router.get('/:id', async (req, res, next) => {
	var {authors, authorsUrl, books, booksUrl, imagesUrl} = cachedData

	// make sure caching dind't fail
	if(authors && authorsUrl && books && booksUrl && imagesUrl){
		try{
			// only send the relevant data
			var authorInfo = authors.find(el => el.id == req.params.id)
			var authorId = authorInfo.id
			var booksFromTheAuthor = books.filter(el => el.authorID === authorId)
			authorsUrl = {[authorId]: authorsUrl[authorId]}
			var relevantBooksUrl = {}
			booksFromTheAuthor.forEach(({id}) => relevantBooksUrl[id] = booksUrl[id])
		}
		catch(e){
			console.warn(e)
			var {authorInfo, booksFromTheAuthor, imagesUrl, authorsUrl, relevantBooksUrl} = await getAuthorDataFromDb(req.params.id, next)
		}
	}
	// if caching failed, use async queries instead
	else{
		var {authorInfo, booksFromTheAuthor, imagesUrl, authorsUrl, relevantBooksUrl} = await getAuthorDataFromDb(req.params.id, next)
	}

	res.render("author", {itemsInCart: req.session.itemsInCart,
		authorInfo, booksFromTheAuthor, imagesUrl, authorsUrl, booksUrl: relevantBooksUrl
	})
})

module.exports = router;
