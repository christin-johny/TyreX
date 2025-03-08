const loadProductList=async (req,res) => {
    try {
        res.render('productList')
    } catch (error) {
        res.redirect("/user/pageNotFound");
    }
    
}







module.exports={loadProductList}