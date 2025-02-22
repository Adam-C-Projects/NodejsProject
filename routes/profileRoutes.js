const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const session = require("express-session");
const util = require("util");
const { log } = require("console");

module.exports = (db) => {
    const query = util.promisify(db.query).bind(db);
    router.get('/', async (req, res) => {
        const UID = req.session.UID;
        try {
            // Fetch user info
            const userResults = await query('SELECT username, email FROM User WHERE UID = ?', [UID]);

            if (userResults.length === 0) {
                return res.status(404).send('User not found');
            }

            const userinfo = userResults[0]; // Extract user data

            // Fetch pending friend requests
            const friendResults = await query(`
                SELECT r.fromUserId, r.status, u.username 
                FROM relationships r
                JOIN User u ON r.fromUserId = u.UID
                WHERE r.toUserId = ? AND r.status = ?`, 
                [UID, 'pending']
            );

            const followingResults = await query(`
                SELECT r.fromUserId, u.username
                FROM relationships r
                JOIN User u ON r.fromUserId = u.UID
                WHERE r.toUserId = ? AND r.status = ?`,
                [UID, 'confirmed']
            );

            const followerResults = await query(`
                SELECT r.toUserId, u.username
                FROM relationships r
                JOIN User u ON r.fromUserId = u.UID
                WHERE r.toUserId = ? AND r.status = ?`,
                [UID, 'confirmed']
            );
            console.log(followerResults);
            console.log(followingResults);
            res.render('userProfile', {
                username: userinfo.username,
                friendRequests: friendResults.length ? friendResults : null,
                following: followingResults.length ? followingResults : null,
                followers: followerResults.length ? followerResults : null

            });

        } catch (err) {
            console.error('Database query error:', err);
            res.status(500).send('Database error');
        }
    }); 

    router.get('/logout', (req, res) => {
        req.session.destroy();
        res.redirect('/');
    });

    router.post('/sendFriendRequest', (req, res) => {
        const sendingUid = req.session.UID;
        const { receivingUsername } = req.body;
        console.log(req.body);
    
        // Query 1: Get receiving user's UID by their username
        db.query('SELECT UID FROM User WHERE username = ?', [receivingUsername], (err, results) => {
            if (err) {
                console.error('Database query error: ', err);
                return res.status(500).send('Database error');
            }
    
            if (results.length === 0) {
                return res.status(301).send('No user with that username');
            }
            if(results.UID == req.cookies.UID){
                return res.status(301).send('you cannot follow yourself');
            }
    
            const receivingUid = results[0].UID;
            console.log(receivingUid);
            // Query 2: Check if friend request already exists
            db.query('SELECT * FROM relationships WHERE fromUserId = ? AND toUserId = ?', [sendingUid, receivingUid], (err, results) => {
                if (err) {
                    console.error('Database query error: ', err);
                    return res.status(500).send('Database error');
                }
    
                if (results.length !== 0) {
                    return res.status(301).send('Friend request already sent');
                }
    
                // Query 3: Insert new friend request
                db.query('INSERT INTO relationships (fromUserId, toUserId, status) VALUES (?, ?, ?)', [sendingUid, receivingUid, 'pending'], (err) => {
                    if (err) {
                        console.error('Database query error: ', err);
                        return res.status(500).send('Database error');
                    }
    
                    return res.status(200).send('Friend request sent successfully');
                });
            });
        });
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
                    return res.status(500).json('Database error');
                }
                console.log("here2");
                return res.status(200).json({ status: 'success', message: 'Friend request accepted' });
            });
        });
    });
    

    return router;
};
