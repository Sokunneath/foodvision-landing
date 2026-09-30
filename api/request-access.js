export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed",
        });
    }

    try {
        const {
            fullName,
            email,
            company,
            plan,
            message,
        } = req.body;

        // -----------------------------
        // Basic validation
        // -----------------------------

        if (!fullName || !email || !company || !plan) {
            return res.status(400).json({
                success: false,
                message: "Please complete all required fields.",
            });
        }

        // Simple email validation
        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address.",
            });
        }

        // -----------------------------
        // Length protection
        // -----------------------------

        if (fullName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Full name is too long.",
            });
        }

        if (email.length > 150) {
            return res.status(400).json({
                success: false,
                message: "Email is too long.",
            });
        }

        if (company.length > 150) {
            return res.status(400).json({
                success: false,
                message: "Company name is too long.",
            });
        }

        if (message && message.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Message is too long.",
            });
        }

        // Only accept real FoodVision plans
        const allowedPlans = [
            "Starter",
            "Growth",
            "Business",
        ];

        if (!allowedPlans.includes(plan)) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan selected.",
            });
        }

        // -----------------------------
        // Get secret Apps Script URL
        // -----------------------------

        const googleScriptUrl =
            process.env.GOOGLE_SCRIPT_URL;

        if (!googleScriptUrl) {
            console.error(
                "GOOGLE_SCRIPT_URL is not configured"
            );

            return res.status(500).json({
                success: false,
                message: "Server configuration error.",
            });
        }

        // -----------------------------
        // Forward request to Google
        // -----------------------------

        const googleResponse = await fetch(
            googleScriptUrl,
            {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify({
                    token: process.env.FOODVISION_SCRIPT_TOKEN,
                    fullName: fullName.trim(),
                    email: email.trim().toLowerCase(),
                    company: company.trim(),
                    plan,
                    message: message?.trim() || "",
                }),
            }
        );

        const googleResult = await googleResponse.json();

        if (!googleResponse.ok || !googleResult.success) {
            console.error(
                "Apps Script error:",
                googleResult
            );

            return res.status(502).json({
                success: false,
                message:
                    googleResult.message ||
                    "Unable to save access request.",
            });
        }


        // -----------------------------
        // Success
        // -----------------------------

        return res.status(200).json({
            success: true,
            message:
                "Your FoodVision access request has been submitted.",
        });

    } catch (error) {
        console.error(
            "Request access error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Something went wrong. Please try again.",
        });
    }
}