import Quote from "../models/Quote.js";
import Project from "../models/Project.js";
import User from "../models/Users.js";
import House from "../models/House.js";

// House responds with a quotation
 
export const houseRespondToQuote = async (req, res, next) => {
    try {
const projectId= req.params.projectId;
        const { amount, note } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid quotation amount is required."
            });
        }

        const houseId= req.user.id;
        const quote = await Quote.findOne({
            projectId: projectId,
            houseId: houseId
        });

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote not found."
            });
        }

        
        if (quote.status !== "awaiting_house") {
            return res.status(400).json({
                success: false,
                message: "This quote has already been responded to."
            });
        }


        quote.amount = amount;
        quote.note = note;
        quote.status = "quoted";
        quote.respondedAt = new Date();

        await quote.save();

        
        const project = await Project.findById(quote.projectId);

        if (project) {
    project.status = "priced";
    await project.save();
}

        res.status(200).json({
            success: true,
            message: "Quotation sent successfully.",
            quote
        });
const customer = await User.findById(customerId).select("username name");
const house= await House.findById(houseId).select("name");
        
await createNotification({
    recipientId: project.userId,

    type: "quote_sent",

    title: `${house.name} sent a quote for your project`,

    body: `${house.name} sent you a quote for your project`,

    meta: {
        projectId: project._id,
        houseId: house._id,
        houseName: house.name,
        amount,
        currency
    },

    actionUrl: `/profile/${project.userId}/orders`
});
    } catch (error) {
        next(error);
    }
};

//Customer accepts or decline the quoted price

export const respondToQuotedPrice = async (req, res, next) => {
    try {

        const { response } = req.body;

        // Validate customer response
        if (!["accepted", "declined"].includes(response)) {
            return res.status(400).json({
                success: false,
                message: "Response must be either accepted or declined."
            });
        }

        // Find the quote
        const quote = await Quote.findOne({
            projectId: req.params.projectId
        });

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote not found."
            });
        }

        // Only quoted prices can be responded to
        if (quote.status !== "quoted") {
            return res.status(400).json({
                success: false,
                message: "This quote is no longer available for response."
            });
        }


        // Update quote
        quote.status = response;
        quote.customerRespondedAt = new Date();

        await quote.save();


        // Update project
        const project = await Project.findById(quote.projectId);

        if (project) {

            if (response === "accepted") {

                // Prevent changing an already finalized price
                if (project.pricing.finalized) {
                    return res.status(400).json({
                        success: false,
                        message: "This project's price has already been finalized."
                    });
                }

                // Save accepted quotation amount
                project.pricing.amount = quote.amount;

                // Lock the price
                project.pricing.finalized = true;

                project.pricing.finalizedAt = new Date();

                project.status = "accepted";


            } else if (response === "declined") {

                project.status = "declined";

            }


            await project.save();
        }


        res.status(200).json({
            success: true,
            message: `Quote ${response} successfully.`,
            quote
        });
await createNotification({
    recipientId: houseId,

    type: "quote_accepted",

    title: `@${customer.username} accepted your quote of ₦${amount}`,

    body: `@${customer.username} accepted your quote`,

    meta: {
        projectId: project._id,
        customerId: customer._id,
        customerName: customer.username,
        amount
    },

    actionUrl: "/projects"
});
await createNotification({
    recipientId: houseId,

    type: "quote_declined",

    title: `@${customer.username} declined your quote`,

    body: `@${customer.username} declined your quote`,

    meta: {
        projectId: project._id,
        customerId: customer._id,
        customerName: customer.username
    },

    actionUrl: "/projects"
});
    } catch (error) {
        next(error);
    }
};