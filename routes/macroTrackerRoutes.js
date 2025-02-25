const express = require("express");
const router = express.Router();
const util = require("util");

module.exports = (db) => {
   
    const query = util.promisify(db.query).bind(db);
    router.get('/', (req, res) => {
        const username = req.session.username || null;
        const UID = req.session.UID;
        if (!UID) {
            return res.status(400).json({ error: "Missing UID" });
        }

        res.render('macroTracker.ejs', {username: username} );    
    });

    router.post("/insertDailyMacros", async (req, res) => {
        const UID = req.session.UID;
        if (!UID) {
            return res.status(400).json({ error: "Missing UID" });
        }
    
        const today = new Date().toISOString().split("T")[0]; // Get today's date
    
        try {
            // Check if a record for today already exists
            const existing = await query(
                "SELECT 1 FROM dailymacros WHERE date = ? AND UID = ? LIMIT 1",
                [today, UID]
            );
    
            if (existing.length > 0) {
                return res.status(400).json({ message: "Today's entry already exists" });
            }
    
            // Insert new daily macros record
            await query(
                "INSERT INTO dailymacros (date, UID, totalcalories, totalprotein, totalfats, totalcarbs) VALUES (?, ?, 0, 0, 0, 0)",
                [today, UID]
            );
    
            return res.status(201).json({ message: "Daily macros inserted successfully" });
    
        } catch (error) {
            console.error("Database error:", error);
            return res.status(500).json({ error: "Database error" });
        }
    });

    router.post("/updateDailyMacros", async (req, res) => {
        console.log(req.body)
        const calories = parseInt(req.body.calories, 10);
        const protein = parseInt(req.body.protein, 10);
        const fats = parseInt(req.body.fats, 10);
        const carbs = parseInt(req.body.carbs, 10);
        const UID = req.session.UID;
        const today = new Date().toISOString().split("T")[0];

        try {
            // Check if a record for today already exists
            const existing = await query(
                "SELECT totalcalories, totalprotein, totalfats, totalcarbs FROM dailymacros WHERE date = ? AND UID = ? LIMIT 1",
                [today, UID]
            );
    
            if (existing.length === 0) {
                return res.status(400).json({ message: "create an entry first!" });
            }
            
            //update the macros
            console.log(calories);
            const currentMacros = existing[0];
            console.log(currentMacros);
            const updatedCalories = currentMacros.totalcalories + calories;
            const updatedProtein = currentMacros.totalprotein + protein;
            const updatedFats = currentMacros.totalfats + fats;
            const updatedCarbs = currentMacros.totalcarbs + carbs;

            console.log(updatedCalories);

            // Insert new daily macros record
            await query(
                "UPDATE dailymacros SET totalcalories = ?, totalprotein = ?, totalfats = ?, totalcarbs = ? WHERE UID = ? AND date = ?",
                [updatedCalories, updatedProtein, updatedFats, updatedCarbs, UID, today]
            );
    
            return res.status(201).json({ message: "Daily macros updated successfully" });
    
        } catch (error) {
            console.error("Database error:", error);
            return res.status(500).json({ error: "Database error" });
        }    
    });

    return router;
};
