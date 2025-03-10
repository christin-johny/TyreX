const mongoose = require("mongoose");
const Size = require("./models/size"); // Adjust the path as needed


const sizes = [
  "R10", "R12", "R13", "R14", "R15", "R16", "R17", "R18", "R19", "R20",
  "R21", "R22", "R23", "R24", "R25", "R26"
].map(size => ({ name: size }));

// Function to insert sizes
const addSizesToDB = async () => {
  try {
    await Size.insertMany(sizes);
    console.log("Tire sizes added successfully!");
  } catch (error) {
    console.error("Error adding sizes:", error);
  } finally {
    mongoose.connection.close();
  }
};

// Call the function
addSizesToDB();
