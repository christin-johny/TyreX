const loadProductList=async (req,res) => {
    try {
        res.render('productList')
    } catch (error) {
        res.redirect("/pageNotFound");
    }
    
}







module.exports={loadProductList}