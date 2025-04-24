const Banner = require("../../models/bannerSchema");
const path = require('path');
const fs = require('fs');
const { title } = require("process");
const StatusCodes = require("../../helpers/stausCodes");
const Messages = require("../../helpers/messages");

const loadBannerPage = async (req,res)=>{
    try {
        const findBanner =  await Banner.find({});
        res.render('banner',{data:findBanner});
    }catch (error){
        console.error(error)
        res.redirect("/admin/pageerror")
    }
}

const loadAddBannerPage = async (req,res) => {
    try {
        res.render("addBanner");
    } catch (error) {
        console.error(error);
        res.redirect('/admin/pageerror'); 
    }
}

const addBanner = async (req,res)=>{
    try {
        const data = req.body;
        const image=req.file;

        const newBanner=new Banner({
            image:image.filename,
            title:data.title,
            description:data.description,
            startDate: new Date(data.startDate+"T00:00:00"),
            endDate:new Date(data.endDate+"T00:00:00"),
        })

        await newBanner.save()
        res.redirect("/admin/banner");
    } catch (error) {
        console.error(error);
        res.redirect('/admin/pageerror'); 
    }
}

const deleteBanner = async (req,res) => {
    try {
    const id = req.query.id;

    await Banner.findByIdAndDelete(id)
    res.status(StatusCodes.SUCCESS).json({ success: true, message: Messages.BANNER_DELETED });
    
    } catch (error) {
        console.error(error);
        res.redirect('/admin/pageerror');
    }
    
}

module.exports={
    loadBannerPage,
    loadAddBannerPage,
    addBanner,
    deleteBanner

}