const Admin = require('../models/coreModel/admin.js'); // Adjust the path as necessary
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
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
            html: `<p>Thank you for registering. Please click <a href="${process.env.BASE_URL}api/confirm/${token}">here</a> to confirm your email address.</p>`
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
         const passwordMatch = await bcrypt.compare(password,userData.password);
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

  /////forget password 
  const generateNumericOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit numeric OTP
    return otp.toString();
  };
  exports.sendotp= async (req, res) => {

    const { email } = req.body;
    const user = await Admin.findOne({ email });
    if (!user) return res.status(404).json({message : 'User not found'});
    if (user.enabled==false) return res.status(404).json({message:'User not verified yet'});
    
    if (user.lastOtpRequest &&  Date.now() - user.lastOtpRequest.getTime() < 2 * 60 * 1000) {
      return res.status(429).json({error:'Please wait 2 minutes before requesting a new OTP'});
    }
    const otp = generateNumericOTP(); // Generate a 6-digit OTP
    user.otp = otp;
    user.otpExpires = Date.now() + 3600000; // OTP expires in 1 hour
    user.lastOtpRequest = Date.now(); 
    await user.save();
  
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
        from: 'reset password',
        to: user.email,
        subject: 'Password Reset OTP',
        text: `Your OTP for password reset is: ${otp}`,
      };
    
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(500).json({error: 'Error sending email'});
        }
        res.status(200).json({message: 'OTP sent to email'});
      });
    }
    exports.resetpassword = async (req, res) => {
        const { email, newpassword } = req.body;
        const user = await Admin.findOne({ email });
        user.password = newpassword;
        user.otp = undefined;
        user.otpExpires = undefined;    
        await user.save();
        res.status(500).json({message : 'Password has been reset'});
      }
      exports.verfierOTP = async (req, res) => {
        const { email, otp } = req.body;
        const user = await Admin.findOne({ email });
      
        if (!user || user.otp !== otp || Date.now() > user.otpExpires) {
          return res.status(400).json({error: 'Invalid or expired OTP'});
        }
    
        res.status(200).json({message : 'otp is correct'});
      }


      ////upadte admin
      exports.updateAdmsin = async (req, res) => {
        console.log(req.params.id)
        const { adminId } = req.params.id; // Assuming admin ID is passed as a URL parameter
        const { name, surname, password } = req.body;
      
        try {
          // Prepare the update data
          let updateData = { name, surname, password };
          if (req.file) {
        
            const normalizedPath = req.file.path.replace(/\\/g, '/');
            updateData.photo = env.process.BASE_URL+normalizedPath; 
            // Store the file path in the database
          }
          // Find admin by ID and update
          const admin = await Admin.find(
            adminId
          );
          console.log(admin)
          console.log(admin)

          if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
          }
      
          res.status(200).json({ message: 'Admin updated successfully', admin });
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Server error', error });
        }
      };

      exports.updateAdmin = async (req, res) => {

        const {name, surname, password } = req.body;
        try {
            let updateData = { name, surname, password };
            if (req.file) {
                updateData.photo = req.file.path;
                console.log(req.file.path);
              }
            const admin = await Admin.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
            
            if (!admin) {
                return res.status(404).json({ error: 'Person not found' });
            }
            res.status(200).json(admin);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };