var express = require('express');
var router = express.Router();
const formValidator = require("mininodevalidator");

async function getItemsInCartFromDb(itemsInCart, next){
  var itemsInCartInfoP = query(`SELECT * FROM books WHERE id IN (${Object.keys(itemsInCart).join(', ')})`, next)
  var booksUrlResultP = query(`SELECT * FROM booksUrl WHERE id IN (${Object.keys(itemsInCart).join(', ')})`, next)

  var promises = [itemsInCartInfoP, booksUrlResultP]
  let [itemsInCartInfo, booksUrlResult] = await Promise.all(promises)

  var relevantBooksUrl = transformUrl(booksUrlResult)

  return {itemsInCartInfo, relevantBooksUrl}
}

async function getItemsInCart(itemsInCart, cachedData, next){
  var {books, booksUrl} = cachedData

  // if caching failed
  if(!books || !booksUrl){
    var {itemsInCartInfo, relevantBooksUrl} = await getItemsInCartFromDb(itemsInCart, next)
    return {itemsInCartInfo, relevantBooksUrl}
  }

  // get only the relevant data, if something fails, use the async queries
  try{
    var idsInCart = Object.keys(itemsInCart).map(el => parseInt(el))
    var itemsInCartInfo = books.filter(el => idsInCart.includes(el.id))
    var relevantBooksUrl = {}
    itemsInCartInfo.forEach(el => relevantBooksUrl[el.id] = booksUrl[el.id])
  }
  catch(e){
    console.warn(e)
    var {itemsInCartInfo, relevantBooksUrl} = await getItemsInCartFromDb(itemsInCart, next)
  }

  return {itemsInCartInfo, relevantBooksUrl}
}

async function getImagesUrl(cachedData, next){
  var {imagesUrl} = cachedData

  // if caching failed
  if(!imagesUrl){
    imagesUrl = await query("SELECT back, tofanaLogo, VYDANI, cartIcon, VOP, DOD_UHR FROM imagesUrl", next)
    imagesUrl = imagesUrl[0]
  }

  return imagesUrl
}

/* GET users listing. */
router.get('/1', async (req, res, next) => {

  var imagesUrl = await getImagesUrl(cachedData, next)

  if(req.session.itemsInCart && Object.keys(req.session.itemsInCart).length != 0){
    var {itemsInCartInfo, relevantBooksUrl} = await getItemsInCart(req.session.itemsInCart, cachedData, next)

    res.render("cart1", {active: "cart1",
      itemsInCart: req.session.itemsInCart,
      itemsInCartInfo, imagesUrl, booksUrl: relevantBooksUrl
    })
  }
  else{
    res.render("cart1", {title: "Cart",
      imagesUrl
    })
  }
});

router.get('/2', async (req, res, next) => {
  if(req.session.itemsInCart && Object.keys(req.session.itemsInCart).length != 0){
    var imagesUrl = await getImagesUrl(cachedData, next)

    var {itemsInCartInfo, relevantBooksUrl} = await getItemsInCart(req.session.itemsInCart, cachedData, next)

    if(!req.session.savedInputs) req.session.savedInputs = {};

    res.render("cart2", {active: "cart2",
      itemsInCart: req.session.itemsInCart,
      savedInputs: req.session.savedInputs,
      itemsInCartInfo, imagesUrl, booksUrl: relevantBooksUrl
    })
  }
  else{
    res.redirect("/cart/1");
  }
});

router.post("/addItem", (req, res, next) => {
  // if the session variable doesn't exist, create it
  if(!req.session.itemsInCart) req.session.itemsInCart = {};

  // add the bookID into the session var
  // if the user has already added the same book into the cart, add one more pice of it
  if(req.body.bookID in req.session.itemsInCart) req.session.itemsInCart[req.body.bookID]++;
  // else, add one piece of it into the cart
  else req.session.itemsInCart[req.body.bookID] = 1;

  res.redirect("/cart/1");
})

router.post("/editItemsInCart", (req, res, next) => {
  req.session.itemsInCart[req.body.bookID] = req.body.pieces;
  res.send("Edit successful");
})

router.post("/removeItem", (req, res, next) => {
  delete req.session.itemsInCart[req.body.bookID];

  if(req.session.itemsInCart == {}){
    delete req.session.itemsInCart;
    res.redirect("/");
  }
  else res.redirect("/cart/1");
})

router.post("/saveInputs", (req, res, next) => {
  req.session.savedInputs = req.body;
  req.session.save()
  console.log(req.session.savedInputs);
  res.send("Saved");
})

router.post("/formValidator", (req, res) => {
  res.send(formValidator(req.body, {
    phoneNumber: {
      regex: /^(00420|\+420|)[0-9]{9}$/,
      errorMessage: "Neplatné telefonní číslo!",
      removeSpaces: true
    },
    zipCode: {
      regex: /^\d{5}$/,
      errorMessage: "Neplatné PSČ!",
      removeSpaces: true
    },
    email: {
      regex: /^(\w|[._%+-])+@(\w|[-])+?(\.[a-z]{2,})+$/,
      errorMessage: "Neplatný email!",
    }
  }));
});

module.exports = router;
