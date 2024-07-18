const express = require('express');
const router = express.Router();
const passport = require("passport");
router.get("/login/success", (req, res) => {
	if (req.user) {
		res.status(200).json({
			error: false,
			message: "Successfully Loged In",
			user: req.user,
		});
	} else {
		res.status(403).json({ error: true, message: "Not Authorized" });
	}
});
router.get("/login/failed", (req, res) => {
	res.status(401).json({
		error: true,
		message: "Log in failure",
	});
});

router.get("/google", passport.authenticate("google", ["profile", "email"]));

router.get(
	"/google/callback",
	passport.authenticate("google", {
		successRedirect: "/auth/login/success",
		failureRedirect: "/auth/login/failed",
	})
);

router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
      if (err) {
        return next(err);
      }
      res.send('You have logged out successfully.');
    });
  });

module.exports = router;