const express = require('express');
const router = express.Router();
const passport = require("passport");
const jwt = require('jsonwebtoken');
router.get("/login/success", (req, res) => {
	if (req.user) {
        console.log(req.user.email)
    const token = jwt.sign({ name: req.user.name ,userId: req.user.id, email: req.user.email,role:req.user.role},process.env.JWT_SECRET);
		res.status(200).json({ token });
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