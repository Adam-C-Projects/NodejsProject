const express = require("express");
const router = express.Router();
const util = require("util");

module.exports = (db) => {

    const query = util.promisify(db.query.bind(db));
    router.get('/', async (req, res) => {
        const UID = req.session.UID;
        const username = req.session.username;
        const date = req.query.date || new Date().toISOString().split("T")[0];

        if (!UID) {
            return res.status(400).json({error: "Missing UID"});
        }

        try {
            let rows = await query(
                `SELECT totalcalories,
                        totalprotein,
                        totalfats,
                        totalcarbs,
                        breakfastCalories,
                        breakfastProtein,
                        breakfastFats,
                        breakfastCarbs,
                        lunchCalories,
                        lunchProtein,
                        lunchFats,
                        lunchCarbs,
                        dinnerCalories,
                        dinnerProtein,
                        dinnerFats,
                        dinnerCarbs
                 FROM dailymacros
                 WHERE UID = ? AND date = ?`,
                [UID, date]
            );

            //Create query
            if (rows.length === 0) {
                await query(
                    `INSERT INTO dailymacros
                     (date, UID, totalcalories, totalprotein, totalfats, totalcarbs,
                      breakfastCalories, breakfastProtein, breakfastFats, breakfastCarbs,
                      lunchCalories, lunchProtein, lunchFats, lunchCarbs,
                      dinnerCalories, dinnerProtein, dinnerFats, dinnerCarbs)
                     VALUES (?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`,
                    [date, UID]
                );
                //Retreive new query
                rows = await query(
                    `SELECT totalcalories,
                            totalprotein,
                            totalfats,
                            totalcarbs,
                            breakfastCalories,
                            breakfastProtein,
                            breakfastFats,
                            breakfastCarbs,
                            lunchCalories,
                            lunchProtein,
                            lunchFats,
                            lunchCarbs,
                            dinnerCalories,
                            dinnerProtein,
                            dinnerFats,
                            dinnerCarbs,
                            snacksCalories,
                            snacksProtein,
                            snacksFats,
                            snacksCarbs
                     FROM dailymacros
                     WHERE UID = ? AND date = ?`,
                    [UID, date]
                );
            }
            const chartData = rows[0];
            res.render('macroTracker', {username: username, chartData: rows[0]});
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).send("Internal Server Error");
        }
    });

    router.post("/insertDailyMacros", async (req, res) => {
        const UID = req.session.UID;
        if (!UID) {
            return res.status(400).json({error: "Missing UID"});
        }

        const today = new Date().toISOString().split("T")[0]; // Get today's date

        try {
            //Check if row for today esists
            const existing = await query(
                "SELECT 1 FROM dailymacros WHERE date = ? AND UID = ? LIMIT 1",
                [today, UID]
            );

            if (existing.length > 0) {
                return res.status(400).send("Today's entry already exists");
            }

            //Insert new daily macros
            await query(
                `INSERT INTO dailymacros
                 (date, UID, totalcalories, totalprotein, totalfats, totalcarbs,
                  breakfastCalories, breakfastProtein, breakfastFats, breakfastCarbs,
                  lunchCalories, lunchProtein, lunchFats, lunchCarbs,
                  dinnerCalories, dinnerProtein, dinnerFats, dinnerCarbs,snacksCalories,
                  snacksProtein, snacksFats, snacksCarbs)
                 VALUES (?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`,
                [today, UID]
            );

            return res.status(201).send("Daily macros inserted successfully");

        } catch (error) {
            console.error("Database error:", error);
            return res.status(500).send("Database error");
        }
    });

    router.post("/updateDailyMacros", async (req, res) => {
        console.log(req.body);
        const calories = parseInt(req.body.calories, 10);
        const protein = parseInt(req.body.protein, 10);
        const fats = parseInt(req.body.fats, 10);
        const carbs = parseInt(req.body.carbs, 10);
        const meal = req.body.meal;
        const UID = req.session.UID;
        const today = new Date().toISOString().split("T")[0];

        if (!meal || !["breakfast", "lunch", "dinner", "snacks"].includes(meal)) {
            return res.status(400).send("Invalid meal specified");
        }

        try {
            const sql = `SELECT totalcalories,
                                totalprotein,
                                totalfats,
                                totalcarbs,
                                breakfastCalories,
                                breakfastProtein,
                                breakfastFats,
                                breakfastCarbs,
                                lunchCalories,
                                lunchProtein,
                                lunchFats,
                                lunchCarbs,
                                dinnerCalories,
                                dinnerProtein,
                                dinnerFats,
                                dinnerCarbs,
                                snacksCalories,
                                snacksProtein,
                                snacksFats,
                                snacksCarbs
                         FROM dailymacros
                         WHERE date = ? AND UID = ? LIMIT 1`;
            const existing = await query(sql, [today, UID]);

            if (existing.length === 0) {
                return res.status(400).send("create an entry first!");
            }

            const current = existing[0];

            //Calculate updated totals
            const updatedCalories = current.totalcalories + calories;
            const updatedProtein = current.totalprotein + protein;
            const updatedFats = current.totalfats + fats;
            const updatedCarbs = current.totalcarbs + carbs;

            let updateQuery;
            let params;

            if (meal === "breakfast") {
                const updatedBreakfastCalories = current.breakfastCalories + calories;
                const updatedBreakfastProtein = current.breakfastProtein + protein;
                const updatedBreakfastFats = current.breakfastFats + fats;
                const updatedBreakfastCarbs = current.breakfastCarbs + carbs;
                updateQuery = `UPDATE dailymacros
                               SET totalcalories     = ?,
                                   totalprotein      = ?,
                                   totalfats         = ?,
                                   totalcarbs        = ?,
                                   breakfastCalories = ?,
                                   breakfastProtein  = ?,
                                   breakfastFats     = ?,
                                   breakfastCarbs    = ?
                               WHERE UID = ? AND date = ?`;
                params = [updatedCalories, updatedProtein, updatedFats, updatedCarbs,
                    updatedBreakfastCalories, updatedBreakfastProtein, updatedBreakfastFats, updatedBreakfastCarbs,
                    UID, today];
            } else if (meal === "lunch") {
                const updatedLunchCalories = current.lunchCalories + calories;
                const updatedLunchProtein = current.lunchProtein + protein;
                const updatedLunchFats = current.lunchFats + fats;
                const updatedLunchCarbs = current.lunchCarbs + carbs;
                updateQuery = `UPDATE dailymacros
                               SET totalcalories = ?,
                                   totalprotein  = ?,
                                   totalfats     = ?,
                                   totalcarbs    = ?,
                                   lunchCalories = ?,
                                   lunchProtein  = ?,
                                   lunchFats     = ?,
                                   lunchCarbs    = ?
                               WHERE UID = ? AND date = ?`;
                params = [updatedCalories, updatedProtein, updatedFats, updatedCarbs,
                    updatedLunchCalories, updatedLunchProtein, updatedLunchFats, updatedLunchCarbs,
                    UID, today];
            } else if (meal === "dinner") {
                const updatedDinnerCalories = current.dinnerCalories + calories;
                const updatedDinnerProtein = current.dinnerProtein + protein;
                const updatedDinnerFats = current.dinnerFats + fats;
                const updatedDinnerCarbs = current.dinnerCarbs + carbs;
                updateQuery = `UPDATE dailymacros
                               SET totalcalories  = ?,
                                   totalprotein   = ?,
                                   totalfats      = ?,
                                   totalcarbs     = ?,
                                   dinnerCalories = ?,
                                   dinnerProtein  = ?,
                                   dinnerFats     = ?,
                                   dinnerCarbs    = ?
                               WHERE UID = ? AND date = ?`;
                params = [updatedCalories, updatedProtein, updatedFats, updatedCarbs,
                    updatedDinnerCalories, updatedDinnerProtein, updatedDinnerFats, updatedDinnerCarbs,
                    UID, today];
            }
            else if (meal === "snacks") {
                const updatedSnacksCalories = current.snacksCalories + calories;
                const updatedSnacksProtein = current.snacksProtein + protein;
                const updatedSnacksFats = current.snacksFats + fats;
                const updatedSnacksCarbs = current.snacksCarbs + carbs;
                updateQuery = `UPDATE dailymacros
                 SET totalcalories = ?,
                     totalprotein  = ?,
                     totalfats     = ?,
                     totalcarbs    = ?,
                     snacksCalories = ?,
                     snacksProtein  = ?,
                     snacksFats     = ?,
                     snacksCarbs    = ?
                 WHERE UID = ? AND date = ?`;
                params = [updatedCalories, updatedProtein, updatedFats, updatedCarbs,
                    updatedSnacksCalories, updatedSnacksProtein, updatedSnacksFats, updatedSnacksCarbs,
                    UID, today];
            }
            await query(updateQuery, params);
            return res.status(201).json({
                totalcalories: updatedCalories,
                totalprotein: updatedProtein,
                totalfats: updatedFats,
                totalcarbs: updatedCarbs
            });

        } catch (error) {
            console.error("Database error:", error);
            return res.status(500).send("Database error");
        }
    });
    return router;
}
