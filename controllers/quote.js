import Quote from "../models/Quote.js";
import Project from "../models/Project.js";

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

        
        const quote = await Quote.findOne({
            projectId: projectId,
            houseId: req.user.id
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


    } catch (error) {
        next(error);
    }
};