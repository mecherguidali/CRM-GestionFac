const Admin = require('../models/coreModel/admin.js'); // Adjust the path as necessary
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
    try {
        const existingAdmin = await Admin.findOne({ email: req.body.email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const newAdmin = new Admin({
            email: req.body.email,
            name: req.body.name,
            surname: req.body.surname,
            password : req.body.password
        });
        await newAdmin.save();

        const token = jwt.sign({ email: newAdmin.email }, process.env.JWT_SECRET, { expiresIn: '1d' });

        const transporter = nodemailer.createTransport({
            service: process.env.SERVICE,
            port: process.env.PORT_MAILER,
            secure: process.env.SECURE,
            auth: {
                user: process.env.USER_MAILER,
                pass: process.env.PASS_MAILER
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            from: 'YOUR SERVICE NAME',
            to: req.body.email,
            subject: 'Confirmation Email',
            text: 'Thank you for registering. Your account has been successfully created.',
            html: `<p>Thank you for registering. Please click <a href="${process.env.BASE_URL}confirm/${token}">here</a> to confirm your email address.</p>`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                res.status(500).json({ message: 'Error sending email', error: error.message });
            } else {
                console.log('Email sent: ' + info.response);
                res.status(201).json({ message: 'Admin added successfully', Admin: newAdmin });
            }
        });
    } catch (error) {
        res.status(400).json({ message: 'Failed to add admin', error: error.message });
    }
};

exports.confirmEmail = async (req, res) => {
    try {
        const token = req.params.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        await Admin.findOneAndUpdate({ email: decoded.email }, { enabled: true });
        
        res.sendFile(__dirname + '/mail_confirm.html'); // Adjust the path as necessary
    } catch (error) {
        res.status(400).json({ message: 'Invalid or expired token', error: error.message });
    }
};
exports.login =async (req, res) => {
    console.log('herrre'+ req.body.email)
     const { email, password } = req.body;
  
     try {
        const userData = await Admin.findOne({ email:req.body.email });
        if (!   userData) {
            return res.status(400).json({ message: 'Admin not found' });
        }
        if (userData.email !== email) {
            return res.status(401).json({ message: 'Incorrect email or password' });
        }
         // Check if email exists in database (replace this with your actual database query)
    
         if (userData.enabled === false) {
            return res.status(401).json({ message: 'this email not confirmed' });
        }
  
         // Check if password matches (replace this with bcrypt compare)
         const passwordMatch = await bcrypt.compare(password, userData.password);
         if (!passwordMatch) {
             return res.status(401).json({ message: 'Incorrect email or password' });
         }
  
         // Generate JWT
         const token = jwt.sign({ AdminID: userData.id, email: userData.email,role:userData.role },process.env.JWT_SECRET);
  
         // Send JWT to client
         res.status(200).json({ token });
     } catch (error) {
         console.error('Error during login:', error);
         res.status(500).json({ message: 'Internal server error' });
     }
  };
