import Project from "../models/Project.js";
import PriceList from "../models/PriceList.js";
import Product from "../models/Product.js";
import Quote from "../models/Quote.js";

export const createProject = async (req, res, next) => {
    try {

        const {
            type,
            houseId,

            sourcePostId,
            sourceProductId,
            sourceCollectionId,

            garmentType,
            wantsEmbellishment,
            references,

            measurementProfileId,

            fabricSource,

            eventDate,
            eventRole,

            notes

        } = req.body;


        const customerId = req.user.id;

        let pricing;


        if (sourceProductId) {

            const product = await Product.findById(sourceProductId);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Tagged product not found"
                });
            }

            pricing = {
                source: "product",
                amount: product.price,
                currency: product.currency || "NGN",
                productId: product._id
            };

        } else {

            const priceEntry = await PriceList.findOne({
                houseId,
                garmentType: garmentType?.toLowerCase()
            });

            if (priceEntry) {

                let finalAmount = priceEntry.basePrice;

                if (
                    wantsEmbellishment &&
                    priceEntry.premiumPrice
                ) {
                    finalAmount += priceEntry.premiumPrice;
                }

                pricing = {
                    source: "pricelist",
                    amount: finalAmount,
                    currency: priceEntry.currency,
                    priceListId: priceEntry._id
                };

            } else {

                pricing = {
                    source: "quote",
                    amount: null,
                    currency: "NGN"
                };

            }

        }
        
        const project = await Project.create({

            type,

            customerId,

            houseId,

            sourcePostId,
            sourceProductId,
            sourceCollectionId,

            garmentType: garmentType?.toLowerCase(),

            wantsEmbellishment,

            references,

            measurementProfileId,

            fabricSource,

            eventDate,
            eventRole,

            notes,

            pricing

        });


        

        if (pricing.source === "quote") {

            await Quote.create({

                projectId: project._id,

                houseId,

                userId: customerId,

                amount: null,

                status: "awaiting_house"

            });

        }


        return res.status(201).json({

            success: true,

            message:
                pricing.source === "quote"
                    ? "Project submitted. Waiting for House pricing."
                    : "Project submitted with fixed pricing.",

            project

        });

    } catch (error) {

        next(error);

    }
};



/**
 * Get Customer Projects
 */
export const getCustomerProjects = async (
    req,
    res,
    next
)=>{

    try{


        const projects =
            await Project.find({
                customerId:req.userId
            })

            .populate(
                "houseId",
                "name username avatar"
            )

            .sort({
                createdAt:-1
            });



        res.json({
            success:true,
            projects
        });


    }

    catch(error){

        next(error);

    }

};






/**
 * House Incoming Projects
 */
export const getHouseProjects = async (
    req,
    res,
    next
)=>{

    try{


        const projects =
            await Project.find({
                houseId:req.userId
            })

            .populate(
                "customerId",
                "name username avatar"
            )

            .sort({
                createdAt:-1
            });



        res.json({
            success:true,
            projects
        });


    }

    catch(error){

        next(error);

    }

};






/**
 * Update Project Status
 *
 * House lifecycle:
 * submitted
 * under_review
 * priced
 * accepted
 * declined
 * in_production
 * ready
 * delivered
 */
// Allow transition
const allowedTransitions = {
    submitted: [
        "under_review"
    ],

    under_review: [
        "priced",
        "declined"
    ],

    priced: [
        "accepted",
        "declined"
    ],

    accepted: [
        "in_production"
    ],

    in_production: [
        "ready"
    ],

    ready: [
        "delivered"
    ],

    delivered: []
};
export const updateProjectStatus = async (
    req,
    res,
    next
) => {

    try {

        const { status:newStatus } = req.body;


        const project = await Project.findOne({
            _id:req.params.id,
            houseId:req.userId
        });


        if(!project){
            return res.status(404).json({
                message:"Project not found"
            });
        }



        const allowed =
            allowedTransitions[project.status];


        if(!allowed.includes(newStatus)){

            return res.status(400).json({
                message:
                `Cannot move project from ${project.status} to ${newStatus}`
            });

        }



        project.status = newStatus;


        await project.save();



        res.json({
            success:true,
            project
        });


    } catch(error){

        next(error);

    }

};
/**
 * House responds to Quote
 *
 * Only used when PriceList does not exist.
 */
export const respondToQuote = async ( req, res,next)=>{
    try{


const { amount,note } = req.body;


const project =await Project.findOne({_id:req.params.id,houseId:req.userId});



        if(!project){

            return res.status(404)
            .json({
                message:"Project not found"
            });

        }



        if(project.pricing.source !== "quote"){

            return res.status(400)
            .json({
                message:
                "This project does not require a quote"
            });

        }




        project.quote = {

            amount,

            note,

            status:"quoted",

            respondedAt:
                new Date()

        };



        project.pricing.amount = amount;



        project.status="priced";



        await project.save();



        res.json({

            success:true,

            project

        });



    }

    catch(error){

        next(error);

    }

};