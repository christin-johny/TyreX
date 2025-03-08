const mongoose = require("mongoose");
const Brand = require("./models/brand"); // Ensure correct path

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/TyreX", { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// List of popular tire brands in India
const brands = [
    { name: "MRF", description: "One of India's largest tire manufacturers.", logo: "https://www.mrftyres.com/images/mrf-logo.png"},
    { name: "Apollo", description: "A leading Indian tire brand known for durability.", logo: "https://corporate.apollotyres.com/content/dam/orbit/apollo-corporate/brand-identity/atl-logo_transparent_208x80_textonly.png" },
    { name: "CEAT", description: "Offers a wide range of high-performance tires.", logo: "https://www.ceat.com/content/dam/ceat/website/logo.png" },
    { name: "JK Tyre", description: "A major player in the Indian tire industry.", logo: "" },
    { name: "Bridgestone", description: "A global tire manufacturer with a strong presence in India.", logo: ["bridgestone-logo.png"] },
    { name: "Goodyear", description: "An international brand with premium tires in India.", logo: ["goodyear-logo.png"] },
    { name: "Michelin", description: "A premium tire brand known for advanced technology.", logo: ["michelin-logo.png"] },
    { name: "Yokohama", description: "Japanese brand known for high-quality tires.", logo: ["yokohama-logo.png"] },
    { name: "Continental", description: "A global brand offering high-performance tires.", logo: ["continental-logo.png"] },
    { name: "Pirelli", description: "A premium tire brand known for sports and luxury cars.", logo: ["pirelli-logo.png"] },
  
];

// Function to insert brands
async function addBrands() {
  try {
    await Brand.insertMany(brands);
    console.log("✅ Brands inserted successfully");
  } catch (error) {
    console.error("❌ Error inserting brands:", error);
  } 
  console.log(Brand.logo)
}

addBrands();
