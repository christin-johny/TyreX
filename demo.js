function validateAndSubmit(){
    document.forms[0].submit();
        // if(validateForm()){
            
        // }
     }
    
    function viewImage1(event){
      document.getElementById('imgView1').src=URL.createObjectURL(event.target.files[0]);
    }
    
    function viewImage2(event){
      document.getElementById('imgView2').src=URL.createObjectURL(event.target.files[0]);
    }
    
    function viewImage3(event){
      document.getElementById('imgView3').src=URL.createObjectURL(event.target.files[0]);
    }
    
    function viewImage4(event){
      document.getElementById('imgView4').src=URL.createObjectURL(event.target.files[0]);
    }
    
    
    
    function viewImage(event,index){
        let input=event.target;
        let reader=new FileReader();
        reader.onload = function(){
          let dataURL = reader.result
          let image= document.getElementById('imgView'+index);
          image.src = dataURL;
    
          let cropper = new Cropper(image,{
            aspectRatio:1,
            viewMode:1,
            guides:true,
            background:false,
            autoCropArea:1,
            Zoomable:true,
          })
    console.log(cropper)
    
          let cropperContainer = document.querySelector("#croppedImg"+index).parentNode;
          cropperContainer.style.display='block';
    
    
          let saveButton = document.querySelector('#saveButton'+index);
          saveButton.addEventListener('click',async function () {
            let croppedCanvas= cropper.getCroppedCanvas();
            let croppedImage= document.getElementById("croppedImg"+index);
            croppedImage.src = croppedCanvas.toDataURL('image/jpeg',1.0);
    
            let timestamp = new Date().getTime();
            let filename =`cropped-img-${timestamp}-${index}.png`;
    
            await croppedCanvas.toBlob(blob=>{
              let input = document.getElementById('input'+index);
              let imgFile=new File([blob],fileName,blob);
              const fileList = new DataTransfer();
              fileList.items.add(imgFile);
              input.files = fileList.files
            });
    
            cropperContainer.style.display='none';
            cropper.destroy();
    
          });
        };
    
        reader.readAsDataURL(input.files[0]);
    }
    
    
    const selectedImages =[];
    document.getElementById('input1').addEventListener('change',handleFileSelect);
    
    function handleFileSelect(event){
      const  addedImagesContainer = document.getElementById('addedImagesContainer');
    
    }addedImagesContainer.innerHTML
    
     
    
    
    
    
    //  function validateForm(){
    //       clearErrorMessages();
    //       const name=document.getElementById('productName').value;
    //       const description=document.getElementById('description').value;
    //       const number = document.getElementById('productNumber').value;
    //       const category=document.getElementById('category').value;
    //       const brand= document.getElementById('brand').value;
    //       const size = document.getElementById('size').value;
    //       const regularPrice=document.getElementById('regularPrice').value;
    //       const salePrice=document.getElementById('salePrice').value;
    //       const warranty= document.getElementById('warranty').value;
    //       const quantity= document.getElementById('quantity').value;
    //       const images = document.getElementById('input1')
    
    
    //       let isValid=true;
    
    //       const nameregex=/^[a-zA-Z][a-zA-Z0-9\/\-]*$/;
    //       if(name.trim()===''){
    //         displayErrorMessage('productName-error', "Product name can't be empty")
    //         isValid=false;
    //       }else if(!nameregex.test(name)){
    //         displayErrorMessage('productName-error', "enter a valid product name ")
    //         isValid=false
    //       }
    
    //       const descriptionregex=/^[a-zA-Z][a-zA-Z0-9.,\-\/()&'\"!?;:\s]*$/;
    //       if(description.trim()===''){
    //         displayErrorMessage('description-error', "Description can't be empty")
    //         isValid=false;
    //       }else if(!descriptionregex.test(description)){
    //         displayErrorMessage('description-error', "Enter a valid description")
    //         isValid=false;
    //       }
    
    //       if(number.trim()===''){
    //         displayErrorMessage('productNumber-error', "Product number can't be empty")
    //         isValid=false;
    //       }else if(!/^[0-9/-]+$/.test(number)){
    //         displayErrorMessage('productNumber-error', "Enter a valid Product number")
    //         isValid=false;
    //       }
    
    //       if (category.trim()==='') {
    //         displayErrorMessage('category-error', "Please select a category")
    //         isValid=false;
    //       }
    
    //       if (brand.trim()==='') {
    //         displayErrorMessage('brand-error', "Please select a brand")
    //         isValid=false;
    //       }
    
    //       if (size.trim()==='') {
    //         displayErrorMessage('size-error', "Please select a size")
    //         isValid=false;
    //       }
    
    //       if(regularPrice.trim()===''|| !/^\d+(\.\d{1,2})?$/.test(regularPrice)){
    //         displayErrorMessage('regularPrice-error', "Please enter a valid non-negative price.")
    //         isValid=false;
    //       }
    
    //       if(salePrice.trim()===''|| !/^\d+(\.\d{1,2})?$/.test(salePrice)){
    //         displayErrorMessage('salePrice-error', "Please enter a valid non-negative price.")
    //         isValid=false;
    //       }else if(parseFloat(regularPrice)<parseFloat(salePrice)){
    //         displayErrorMessage('salePrice-error', "Sale price can't be greater than Regular price")
    //         isValid=false;
    //       }
          
    //       if(quantity.trim()===''|| !/^\d+$/.test(quantity)){
    //         displayErrorMessage('quantity-error', "Please enter a valid number as quantity")
    //         isValid=false;
    //       }
    
    //       if(warranty.trim()===''|| !/^\d+$/.test(warranty)){
    //         displayErrorMessage('warranty-error', "Please enter a valid number of months")
    //         isValid=false;
    //       }
    //       if (images.files.length === 0) {
    //         displayErrorMessage("images-error",'Please select an image.');
    //         isValid = false;
    //     }
    
    //       return isValid
    //  }
    
    
    
    
    
    
     function displayErrorMessage(elementId, message) {
        var errorElement = document.getElementById(elementId);
        errorElement.innerText = message;
        errorElement.style.display = "block";
    }
    
    
    function clearErrorMessages() {
        const errorElements = document.getElementsByClassName('error-message');
        Array.from(errorElements).forEach(element => {
            element.innerText = '';
        });
        const errorMessage = document.getElementById('errorMessage');
    
    
    }

    const express = require("express");
    const router = express.Router();
    const adminController = require("../controllers/admin/adminController");
    const customerController = require("../controllers/admin/customerController");
    const categoryController = require("../controllers/admin/categoryController");
    const multer=require('multer')
    const { adminAuth } = require("../middlewares/auth");
    
    const storage=require("../helpers/multer")
    const uploads=multer({storage:storage});
    const brandController = require("../controllers/admin/brandController");
    const productController = require("../controllers/admin/productController");
    
    // Admin Login Routes
    router.get("/login", adminController.loadLogin);
    router.post("/login", adminController.login);
    
    // Protected Admin Routes (Require Authentication)
    router.get("/dashboard", adminAuth, adminController.loadDashboard);
    router.post("/logout", adminAuth, adminController.logout);
    
    // Error Page Route
    router.get("/admin-error", adminController.pageError);
    
    // Customer Management
    router.get("/customers", adminAuth, customerController.customerInfo);
    router.post("/customers/block/:id", adminAuth, customerController.blockCustomer);
    router.post("/customers/unblock/:id", adminAuth, customerController.unblockCustomer);
    
    // Category Management
    router.get("/category", adminAuth, categoryController.categoryInfo);
    router.post("/addCategory", adminAuth, categoryController.addCategory);
    router.post("/addCategoryOffer", adminAuth, categoryController.addCategoryOffer);
    router.post("/removeCategoryOffer", adminAuth, categoryController.removeCategoryOffer);
    router.get("/listCategory", adminAuth, categoryController.getListCategory);
    router.get("/unlistCategory", adminAuth, categoryController.getUnlistCategory);
    router.get("/editCategory", adminAuth, categoryController.getEditCategory);
    router.post("/editCategory/:id", adminAuth, categoryController.editCategory);
    
    // Brands Management
    router.get("/brands", adminAuth, brandController.getBrandPage);
    router.post("/addBrand", adminAuth, uploads.single("image"), brandController.addBrand);
    router.get("/blockBrand", adminAuth, brandController.blockBrand);
    router.get("/unBlockBrand", adminAuth, brandController.unBlockBrand);
    router.get("/deleteBrand", adminAuth, brandController.deleteBrand);
    
    // Product Management
    router.get("/add-products", adminAuth, productController.getProductAddPage);
    router.post("/add-products", adminAuth, uploads.array("productImagess",4), productController.addProducts);
    router.get("/products", adminAuth, productController.getAllProducts);
    router.post("/addProductOffer", adminAuth, productController.addProductOffer);
    router.post("/removeProductOffer", adminAuth, productController.removeProductOffer);
    router.get("/blockProduct", adminAuth, productController.blockProduct);
    router.get("/unblockProduct", adminAuth, productController.unblockProduct);
    router.get("/edit-Products", adminAuth, productController.getEditProduct);
    router.post("/edit-Products/:id",adminAuth,uploads.array("productImagess",4),productController.editProducts)
    router.post("/deleteImage",adminAuth,productController.deleteSingleImage)
    module.exports = router;




    router.get("/edit-Products", adminAuth, productController.getEditProduct);
router.post("/edit-Products/:id",adminAuth,uploads.array("productImages",4),productController.editProducts)
router.post("/deleteImage",adminAuth,productController.deleteSingleImage)
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const mongoose=require('mongoose')







// // Get Product Add Page
// const getProductAddPage = async (req, res) => {
//     try {
//         const categories = await Category.find({ isListed: true });
//         const brands = await Brand.find({ isBlocked: false });

//         res.render("add-products", {
//             cat: categories,
//             brand: brands,
//             currentPage: "add-products",
//             error: req.query.error || null,
//             success: req.query.success || null
//         });
//     } catch (error) {
//         console.error("Error fetching product add page data:", error);
//         return res.redirect("/admin/add-products?error=Failed to load data");
//     }
// };
// Get Product Add Page
const getProductAddPage = async (req, res) => {
    try {
        const categories = await Category.find({ isListed: true });
        const brands = await Brand.find({ isBlocked: false });

        res.render("add-products", {
            cat: categories,
            brand: brands,
            currentPage: "add-products",
            error: req.query.error || null,
            success: req.query.success || null,
            product: {} 
        });
    } catch (error) {
        console.error("Error fetching product add page data:", error);
        return res.redirect("/admin/add-products?error=Failed to load data");
    }
};

// Add Product
const addProducts = async (req, res) => {
    try {
        const { productName, description, regularPrice, category, brand, quantity, size, color, salePrice } = req.body;
        console.log(req.body)
        if (!productName || !description || !regularPrice || !category || !brand) {
            return res.redirect("/admin/add-products?error=Missing required fields");
        }

        let images = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const originalImagePath = file.path;
                    const resizedImagePath = path.join("public", "uploads", "product-images", file.filename);

                    await sharp(originalImagePath)
                        .resize({ width: 440, height: 440 })
                        .jpeg({ quality: 80 })
                        .toFile(resizedImagePath);

                    images.push(file.filename);
                } catch (imageError) {
                    console.error("Error processing image:", imageError);
                }
            }
        }

        // console.log(category)
        // // if (!mongoose.Types.ObjectId.isValid(category)) {
        // //     return res.redirect("/admin/add-products?error=Invalid category ID");
        // // }
        // // if (!mongoose.Types.ObjectId.isValid(brand)) {
        // //     return res.redirect("/admin/add-products?error=Invalid brand ID");
        // // }
        // console.log(brand)
        // const categoryExists = await Category.findOne({name:category._id});
        // const brandExists = await Brand.findOne({brandName:brand._id});
        // console.log(category)
        // console.log(brandExists)
        // if (!categoryExists) return res.redirect("/admin/add-products?error=Category not found");
        // if (!brandExists) return res.redirect("/admin/add-products?error=Brand not found");
        const categoryName = req.body.category; // Assuming category comes from request
const brandName = req.body.brand;

// Find category by name and get ObjectId
const category1 = await Category.findOne({ name: categoryName });
const brand1 = await Brand.findOne({ brandName: brandName });

if (!category1) return res.redirect("/admin/add-products?error=Category not found");
if (!brand1) return res.redirect("/admin/add-products?error=Brand not found");

console.log("Category ID:", category1._id); 
console.log("Brand ID:", brand1._id);
console.log("Category Name:", categoryName);
console.log("Brand Name:", brandName);
console.log("Category ID:", category1 ? category1._id : "Not Found");
console.log("Brand ID:", brand1 ? brand1._id : "Not Found");



        // Insert product
        const newProduct = new Product({
            productName,
            description,
            brand:brand1._id,
            category:category1._id,
            regularPrice,
            salePrice: req.body.salePrice || req.body.regularPrice,
            quantity,
            size,
            color,
            productImage:images,
            status: "Available",
            createdOn: new Date(),
        });

        await newProduct.save();

        return res.redirect('/admin/add-products?success=Product added successfully');
    } catch (error) {
        console.error("Error saving product", error);
        return res.redirect("/admin/add-products?error=Failed to add product");
    }
};

// Get All Products
const getAllProducts = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;

        // 🔍 Find brand IDs that match the search query
        const matchingBrands = await Brand.find({ name: { $regex: search, $options: "i" } }).select("_id");
        const brandIds = matchingBrands.map(brand => brand._id);

        const products = await Product.find({
            $or: [
                { productName: { $regex: search, $options: "i" } },
                { brand: { $in: brandIds } }  // 🔹 Match brand IDs instead of using regex
            ]
        })
        .populate("category")
        .populate("brand") // 🔹 Correct populate syntax
        .skip(skip)
        .limit(limit);

        const totalProducts = await Product.countDocuments({
            $or: [
                { productName: { $regex: search, $options: "i" } },
                { brand: { $in: brandIds } }
            ]
        });

        const totalPages = Math.ceil(totalProducts / limit);

        const categories = await Category.find({ isListed: true });
        const brands = await Brand.find({ isBlocked: false });

        if (categories && brands) {
            res.render("products", {
                data: products,
                currentPage: page,
                totalPages,
                cat: categories,
                brand: brands
            });
        } else {
            res.render("page_404");
        }
    } catch (error) {
        console.error("Error fetching products:", error);
        res.redirect('/pageError');
    }
};

// Add Product Offer
const addProductOffer = async (req, res) => {
    try {
        const { productId, percentage } = req.body;
        const product = await Product.findById(productId);

        if (!product) return res.json({ status: false, message: "Product not found" });

        const category = await Category.findById(product.category);

        if (category.categoryOffer > percentage) {
            return res.json({ status: false, message: "Category offer is higher" });
        }

        product.salePrice = product.regularPrice -Math.floor(product.regularPrice * (percentage / 100));
        console.log(product.salePrice)
        product.productOffer = percentage;

        await product.save();
        await Category.findByIdAndUpdate(product.category, { categoryOffer: 0 });

        res.json({ status: true });
    } catch (error) {
        console.error("Error adding product offer:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

// Remove Product Offer
const removeProductOffer = async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await Product.findById(productId);

        if (!product) return res.json({ status: false, message: "Product not found" });

        product.salePrice = product.salePrice + Math.floor(product.regularPrice * (product.productOffer / 100));
        product.productOffer = 0;

        await product.save();
        res.json({ status: true });
    } catch (error) {
        console.error("Error removing product offer:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

// Block Product
const blockProduct = async (req, res) => {
    try {
        const id = req.query.id;
        await Product.findByIdAndUpdate(id, { isBlocked: true });
        res.redirect('/admin/products');
    } catch (error) {
        console.error("Error blocking product:", error);
        res.redirect('/pageError');
    }
};

// Unblock Product
const unblockProduct = async (req, res) => {
    try {
        const id = req.query.id;
        await Product.findByIdAndUpdate(id, { isBlocked: false });
        res.redirect('/admin/products');
    } catch (error) {
        console.error("Error unblocking product:", error);
        res.redirect('/pageError');
    }
};

// Get Edit Product
const getEditProduct = async (req, res) => {
    try {
        const { id } = req.query;
        const product = await Product.findById(id);

        if (!product) return res.redirect("/pageError");

        const categories = await Category.find();
        const brands = await Brand.find();
        res.render("edit-Products", { product, cat: categories, brand: brands, currentPage: "edit-Products" });

        
    } catch (error) {
        console.error("Error fetching product for editing:", error);
        res.redirect('/admin-error');
    }
};



const editProducts = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;

        // Check if the product exists
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Check if another product already has the same name
        const existingProduct = await Product.findOne({
            productName: data.productName,
            _id: { $ne: id }
        }).lean();

        if (existingProduct) {
            return res.status(400).json({ error: "Product with this name already exists, please try another name" });
        }

        // Handle new images
        const images = req.files ? req.files.map(file => file.filename) : [];

        // Fields to update
        const updateFields = {
            productName: data.productName,
            description: data.description,
            brand: data.brand,
            category: data.category,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            quantity: data.quantity,
            size: data.size,
            color: data.color,
        };

        // Only update images if new ones are uploaded
        if (images.length > 0) {
            updateFields.$push = { productImages: { $each: images } };
        }

        await Product.findByIdAndUpdate(id, updateFields, { new: true });

        console.log("Product update completed");
        res.redirect('/admin/products');
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "Internal Server Error" }); 
    }
};

const deleteSingleImage = async (req, res) => {
    try {
        const { imageNameToServer, productToServer } = req.body;

        // Check if the product exists
        const product = await Product.findById(productToServer);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Remove image reference from product document
        await Product.findByIdAndUpdate(
            productToServer,
            { $pull: { productImages: imageNameToServer } }
        );

        // Remove image from the server
        const imagePath = path.join("public", "uploads", "product-images", imageNameToServer);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log(Image ${imageNameToServer} deleted successfully);
        } else {
            console.log(Image ${imageNameToServer} not found);
        }

        res.json({ status: true, message: "Image deleted successfully" });
    } catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


module.exports = { 
    getProductAddPage,
     addProducts,
      getAllProducts,
       addProductOffer,
        removeProductOffer,
         blockProduct,
          unblockProduct, 
          getEditProduct ,
          editProducts,
          deleteSingleImage
        };