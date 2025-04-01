//Required modules
const express = require("express");
const router = express.Router();
const util = require("util");
const multer = require("multer");
const path = require("path");

module.exports = (db) => {
    const query = util.promisify(db.query).bind(db);

    //  Multer Configuration for Profile Picture Uploads
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, "public/uploads"); // Save profile pictures in /public/uploads
        },
        filename: (req, file, cb) => {
            if (!req.session.UID) {
                return cb(new Error("User not authenticated"), null);
            }
            cb(null, `profile_${req.session.UID}${path.extname(file.originalname)}`);
        }
    });
    //Multer instance with file size
    const upload = multer({
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
        fileFilter: (req, file, cb) => {
            const allowedTypes = /jpeg|jpg|png/;
            const isValidExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const isValidMime = allowedTypes.test(file.mimetype);
            if (isValidExt && isValidMime) {
                cb(null, true);
            } else {
                cb(new Error("Only .jpeg, .jpg, and .png formats allowed!"));
            }
        }
    });

    //Fetch User Profile
    router.get("/", async (req, res) => {
        if (!req.session.UID) {
            return res.status(401).send("You must be logged in to view your profile.");
        }

        const UID = req.session.UID;
        try {
            const userResults = await query(
                "SELECT username, email, COALESCE(weight, 'Not Set') AS weight, COALESCE(height, 'Not Set') AS height, COALESCE(goal, 'Not Set') AS goal, profile_pic FROM User WHERE UID = ?", 
                [UID]
            );

            if (userResults.length === 0) {
                return res.status(404).send("User not found");
            }

            const userinfo = userResults[0];
            //  Fetch number of saved recipes
        const savedRecipesCount = await query(
            "SELECT COUNT(*) AS totalSavedRecipes FROM SavedRecipes WHERE UID = ?",
            [UID]
        );
        const savedRestaurantsCount = await query(
            "SELECT COUNT(*) AS totalSavedRestaurants FROM saved_restaurants WHERE user_id = ?",
            [UID]
        );

            // Fetch Friend Requests, Following & Followers
            const friendRequests = await query(`
                SELECT r.fromUserId, r.status, u.username 
                FROM relationships r
                JOIN User u ON r.fromUserId = u.UID
                WHERE r.toUserId = ? AND r.status = ?`, 
                [UID, "pending"]
            );

            const following = await query(`
                SELECT u.username FROM relationships r
                JOIN User u ON r.toUserId = u.UID
                WHERE r.fromUserId = ? AND r.status = ?`,
                [UID, "confirmed"]
            );

            const followers = await query(`
                SELECT u.username FROM relationships r
                JOIN User u ON r.fromUserId = u.UID
                WHERE r.toUserId = ? AND r.status = ?`,
                [UID, "confirmed"]
            );

            // If two users are following eachother make sure the correct entry is used.
            const filteredFollowing = following.filter(user => user.toUserId !== UID);
            const filteredFollowers = followers.filter(user => user.fromUserId !== UID);


            res.render("userProfile", {
                username: userinfo.username,
                email: userinfo.email,
                weight: userinfo.weight,
                height: userinfo.height,
                goal: userinfo.goal,
                profile_pic: userinfo.profile_pic ? `/uploads/${userinfo.profile_pic}` : "/images/default-user.png",
                savedRecipes: savedRecipesCount[0].totalSavedRecipes || 0,
                savedRestaurants: savedRestaurantsCount[0].totalSavedRestaurants || 0,
                friendRequests: friendRequests.length ? friendRequests : null,
                following: filteredFollowing.length ? following : null,
                followers: filteredFollowers.length ? followers : null
        
            });

        } catch (err) {
            console.error("Database query error:", err);
            res.status(500).send("Database error.");
        }
    });

    //  Logout Route
    router.get("/logout", (req, res) => {
        req.session.destroy();
        res.redirect("/");
    });

    //  Update Profile Information
    router.post("/update", async (req, res) => {
        if (!req.session.UID) {
            return res.status(401).send("You must be logged in to update your profile.");
        }

        let { email, weight, height, goal } = req.body;
        const UID = req.session.UID;

        try {
            // Convert empty values to NULL to avoid storing empty strings
            weight = weight ? parseFloat(weight) : null;
            height = height ? parseFloat(height) : null;
            goal = goal || null;

            await query(
                "UPDATE User SET email = ?, weight = ?, height = ?, goal = ? WHERE UID = ?", 
                [email, weight, height, goal, UID]
            );
            res.redirect("/userProfile"); 
        } catch (err) {
            console.error("Error updating profile:", err);
            res.status(500).send("Error updating profile.");
        }
    });
    

    //  Upload Profile Picture
    router.post("/uploadProfilePic", upload.single("profilePic"), async (req, res) => {
        if (!req.session.UID) {
            return res.status(401).send("You must be logged in to upload a profile picture.");
        }

        const UID = req.session.UID;
        const profilePicPath = req.file.filename;

        try {
            await query("UPDATE User SET profile_pic = ? WHERE UID = ?", [profilePicPath, UID]);
            res.redirect("/userProfile");
        } catch (err) {
            console.error("Image Upload Error:", err);
            res.status(500).send("Error uploading profile picture.");
        }
    });

    router.post('/acceptFriendRequest', (req, res) => {
        const sendingUid = req.session.UID; // This should be the UID of the logged-in user
        let { fromUserId } = req.body; // The sender of the friend request
        console.log(fromUserId);
        // Query to check if the friend request exists and is in 'pending' status
        db.query('SELECT * FROM relationships WHERE fromUserId = ? AND toUserId = ? AND status = ?', [fromUserId, sendingUid, 'pending'], (err, results) => {
            if (err) {
                console.error('Database query error: ', err);
                return res.status(500).json('Database error');
            }
            console.log("here1");
            if (results.length === 0) {
                return res.status(404).json('Friend request not found or already confirmed');
            }
    
            // Update the status to 'confirmed'
            db.query('UPDATE relationships SET status = ? WHERE fromUserId = ? AND toUserId = ?', ['confirmed', fromUserId, sendingUid], (err) => {
                if (err) {
                    console.error('Error updating friend request status: ', err);
                    console.log("im here");
                    return res.status(500).json('Database error');
                }
                console.log("here2");
                return res.status(200).json({ status: 'success', message: 'Friend request accepted' });
            });
        });
    });

    router.post('/sendFriendRequest', (req, res) => {
        const sendingUid = req.session.UID;
        const { receivingUsername } = req.body;
        console.log(req.body);
    
        // Query 1: Get receiving user's UID by their username
        db.query('SELECT UID FROM User WHERE username = ?', [receivingUsername], (err, results) => {
            if (err) {
                console.error('Database query error: ', err);
                return res.status(500).json({ status: 'error', message: 'Database error' });
            }
    
            if (results.length === 0) {
                return res.status(404).json({ status: 'error', message: 'No user with that username' });
            }
            if(results[0].UID == req.cookies.UID){
                console.log(req.cookies.UID);
                console.log(results.UID);
                return res.status(400).json({ status: 'error', message: 'You cannot follow yourself' });
            }
    
            const receivingUid = results[0].UID;
            console.log(receivingUid);
            // Query 2: Check if friend request already exists
            db.query('SELECT * FROM relationships WHERE fromUserId = ? AND toUserId = ?', [sendingUid, receivingUid], (err, results) => {
                if (err) {
                    console.error('Database query error: ', err);
                    return res.status(500).json({ status: 'error', message: 'Database error' });
                }
    
                if (results.length !== 0) {
                    return res.status(400).json({ status: 'error', message: 'Friend request already sent' });
                }
    
                // Query 3: Insert new friend request
                db.query('INSERT INTO relationships (fromUserId, toUserId, status) VALUES (?, ?, ?)', [sendingUid, receivingUid, 'pending'], (err) => {
                    if (err) {
                        console.error('Database query error: ', err);
                        return res.status(500).json({ status: 'error', message: 'Database error' });
                    }
    
                    return res.status(200).json({ status: 'success', message: 'Friend request accepted' });
                });
            });
        });
    });

    return router;
};
