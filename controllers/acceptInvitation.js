import HouseMembership from "../models/HouseMembership.js";

export const acceptStaffInvitation = async (req, res, next) => {
    try {

        const { houseId } = req.params;

        // Logged-in invited user
        const userId = req.user.id;

        const membership = await HouseMembership.findOne({
            houseId,
            userId
        });

        if (!membership) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found"
            });
        }

        if (membership.status === "active") {
            return res.status(400).json({
                success: false,
                message: "You are already an active staff member"
            });
        }

        if (membership.status !== "invited") {
            return res.status(400).json({
                success: false,
                message: `Cannot accept an invitation with status '${membership.status}'`
            });
        }

        membership.status = "active";
        membership.joinedAt = new Date();

        await membership.save();

        return res.status(200).json({
            success: true,
            message: "Invitation accepted successfully",
            membership
        });

    } catch (error) {
        next(error);
    }
};