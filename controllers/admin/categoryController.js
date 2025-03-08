const Category=require('../../models/category')



const categoryInfo=async (req,res) => {
    try {
        const page=parseInt(req.query.page)||1;
        const limit=4;
        const skip=(page-1)*limit;

        const categoryData = await Category.find({})
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit);
        const totalCategories= await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);
        res.render("category",{
            cat:categoryData,
            currentPage:page,
            totalPages:totalPages,
            totalCategories:totalCategories
        });
    } catch (error) {
        
        console.error(error);
        res.redirect("/pageerror")
    }
}



const addCategory = async (req, res) => {
    const { name, description } = req.body;

    // Validate input
    if (!name || !description) {
        return res.status(400).json({ error: "Name and description are required" });
    }

    try {
        // Check if a category with the same name already exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ error: "Category already exists" });
        }

        // Create a new category
        const newCategory = new Category({
            name,
            description
        });

        // Save the new category to the database
        await newCategory.save();

        // Return success response
        return res.json({ message: "Category added successfully" });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).json({ error: "Internal server error" });
    }
};

const addCategoryOffer = async(req,res)=>{
    try {
        const percentage = parseInt(req.body.percentage);
        const categoryId=req.body.categoryId;
        const category= await Category.findById(categoryId);
        if(!category){
            return res.status(404).json({status:false,message:"Catefory not found"});
        }
    } catch (error) {
        
    }
}


module.exports={categoryInfo,addCategory,addCategoryOffer

}
