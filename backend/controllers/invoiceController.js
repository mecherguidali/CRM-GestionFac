const Invoice = require('../models/appmodel/Invoice');
const PDFDocument = require('pdfkit');
const Company = require('../models/coreModel/EntrepriseSetting');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { DiffieHellmanGroup } = require('crypto');
// Create Invoice
exports.createInvoice = async (req, res) => {
  try {
    const { client, number, year, currency, status, type, date, expirationDate, note, items, subtotal, tax, taxAmount, total, paidAmount, createdBy } = req.body;

    const newInvoice = new Invoice({
      client,
      number,
      year,
      currency,
      status,
      type,  // This will be either 'Standard' or 'Proforma'
      date,
      expirationDate,
      note,
      items,
      subtotal,
      tax,
      taxAmount,
      total,
      paidAmount,
      createdBy,
    });

    await newInvoice.save();
    res.status(201).json(newInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Error creating invoice', error });
  }
};

// Get all invoices (with optional filtering by type and status)
exports.getInvoices = async (req, res) => {
  try {
    const { type, status } = req.query; // Query parameters for filtering by type and status
    const { createdBy } = req.params;   // Get createdBy from the request parameters

    // Initialize filter object
    let filter = {};

    // Add filters based on query params
    if (type) {
      filter.type = type; // Filter by 'Standard' or 'Proforma'
    }

    if (status) {
      filter.status = status; // Optionally filter by invoice status
    }

    // Add filter for createdBy if present in the request params
    if (createdBy) {
      filter.createdBy = createdBy; // Filter by the creator's ID
    }

    // Find invoices with applied filters and populate references
    const invoices = await Invoice.find(filter)
      .populate('client')
      .populate('currency')
      .populate('tax');

    // Return the filtered invoices in the response
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices', error });
  }
};

// Get a single invoice by its ID
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;  // Get the invoice ID from the request parameters

    // Find the invoice by ID and populate related fields (client, currency, tax)
    const invoice = await Invoice.findById(id)
      .populate('client')
      .populate('currency')
      .populate('tax');

    // If the invoice is not found, return a 404 error
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Return the invoice details in the response
    res.status(200).json(invoice);
  } catch (error) {
    // Handle any errors that occur during the query
    res.status(500).json({ message: 'Error fetching invoice', error });
  }
};

// Convert Proforma to Facture

exports.convertProformaToFacture = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the Proforma invoice
    const proformaInvoice = await Invoice.findById(id);
    if (!proformaInvoice) {
      return res.status(404).json({ message: 'Proforma invoice not found' });
    }

    if (proformaInvoice.type !== 'Proforma') {
      return res.status(400).json({ message: 'This invoice is not a Proforma invoice or has already been converted.' });
    }

    // Update the Proforma invoice to mark it as converted
    proformaInvoice.isConverted = true;
    await proformaInvoice.save();

    // Remove system-generated fields that should not be copied over
   // const { _id, type, isConverted, createdAt, updatedAt, ...rest } = proformaInvoice.toObject();

    // Create a new Facture invoice with the same details
    const factureInvoice = new Invoice({
      ...proformaInvoice.toObject(), // Copy over the remaining fields
      _id: new mongoose.Types.ObjectId(), // Generate a new ObjectId for the new invoice
      type: 'Standard', // Change the type to Standard (Facture)
      isConverted: false, // Reset the isConverted field for the new invoice
    });

    await factureInvoice.save();

    res.status(201).json({ message: 'Proforma invoice converted to Facture successfully', factureInvoice });

  } catch (error) {
    console.error('Error converting Proforma invoice to Facture:', error);
    res.status(500).json({ message: 'Error converting Proforma invoice to Facture', error });
  }
};


// Update Invoice
exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedInvoice = await Invoice.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedInvoice) return res.status(404).json({ message: 'Invoice not found' });
    res.status(200).json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Error updating invoice', error });
  }
};

// Delete Invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedInvoice = await Invoice.findByIdAndDelete(id);
    if (!deletedInvoice) return res.status(404).json({ message: 'Invoice not found' });
    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting invoice', error });
  }
};

// Function to update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid } = req.body; // The amount that has been paid

    // Find the invoice by ID
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Update the paidAmount
    invoice.paidAmount += amountPaid;

    // Determine the payment status
    if (invoice.paidAmount >= invoice.total) {
      invoice.paymentStatus = 'Paid';
      invoice.paidAmount = invoice.total; // Ensure that paidAmount doesn't exceed the total
    } else if (invoice.paidAmount > 0 && invoice.paidAmount < invoice.total) {
      invoice.paymentStatus = 'Partially Paid';
    } else {
      invoice.paymentStatus = 'Unpaid';
    }

    await invoice.save();

    res.status(200).json({ message: 'Payment status updated', invoice });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Error updating payment status', error });
  }
};



// Function to generate an invoice PDF with dynamic company and invoice information
exports.generateInvoicePDF = async (req, res) => {
  const { id, createdBy } = req.params;

  try {
    // Fetch company details using createdBy
    const company = await Company.findOne({ createdBy });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Fetch invoice details using id
    const invoice = await Invoice.findById(id).populate('client').populate('currency').populate('tax');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set the response to download the PDF
    res.setHeader('Content-disposition', `attachment; filename=invoice-${invoice.number}.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    if(invoice.client.person!=null){
        res.setHeader('Content-disposition', `attachment; filename=invoice- ${invoice.client.person.nom} ${invoice.client.person.prenom} ${invoice.number}.pdf`);
        res.setHeader('Content-type', 'application/pdf');
       
     }
     if(invoice.client.entreprise!=null){
        res.setHeader('Content-disposition', `attachment; filename=invoice- ${invoice.client.entreprise.nom}${invoice.number}.pdf`);
        res.setHeader('Content-type', 'application/pdf');
    
     }
    // Pipe the PDF into the response
    doc.pipe(res);

    // Add the company logo
    if (company.logo!==null) {
      doc.image(company.logo, 50, 45, { width: 100 });
    } else {
      doc.text('Logo Placeholder', 50, 45, { width: 100 });
    }

    // Add company information
    doc.fontSize(20).text(company.name.toUpperCase(), 160, 57).moveDown();
    doc.fontSize(10)
      .text(company.address, 200, 65, { align: 'right' })
      .text(company.state, 200, 80, { align: 'right' })
      .text(company.country, 200, 95, { align: 'right' })
      .text(`Tax Number: ${company.taxNumber}`, 200, 110, { align: 'right' })
      .text(`VAT Number: ${company.vatNumber}`, 200, 125, { align: 'right' })
      .text(`Registration Number: ${company.registrationNumber}`, 200, 140, { align: 'right' });

    // Add invoice title
    doc.fontSize(20).fillColor('#5F259F').text('Facture', 50, 160);

    // Add invoice details
    doc.fontSize(10).fillColor('black')
      .text(`Date : ${invoice.date.toLocaleDateString()}`, 50, 200)
      .text(`Date d'expiration : ${invoice.expirationDate ? invoice.expirationDate.toLocaleDateString() : 'N/A'}`, 50, 215)
      .text(`Numéro : # ${invoice.number}/${invoice.year}`, 50, 230)
      .moveDown();

      doc.text(`Client type : ${invoice.client.type}`, 200, 200, { align: 'right' });
     if(invoice.client.person!=null){
        doc.text(`Client Name : ${invoice.client.person.nom} ${invoice.client.person.prenom} `, 200, 220, { align: 'right' });
     }
     if(invoice.client.entreprise!=null){
        doc.text(`Client Name : ${invoice.client.entreprise.nom}`, 200, 220, { align: 'right' });
     }
  
  

    // Add table headers
    doc.moveDown().fillColor('#5F259F').fontSize(12)
      .text('Article', 50, 270)
      .text('Quantité', 200, 270, { align: 'center' })
      .text('Prix', 300, 270, { align: 'center' })
      .text('Total', 400, 270, { align: 'center' })
      .moveTo(50, 285).lineTo(550, 285).stroke();

    // Add items
    let yPosition = 300;
    invoice.items.forEach(item => {
      doc.fillColor('black').fontSize(10)
        .text(item.article, 50, yPosition)
        .text(item.quantity, 200, yPosition, { align: 'center' })
        .text(`${invoice.currency.symbol} ${item.price.toFixed(2)}`, 300, yPosition, { align: 'center' })
        .text(`${invoice.currency.symbol} ${item.total.toFixed(2)}`, 400, yPosition, { align: 'center' });

      yPosition += 20;
    });

   // Add subtotal, tax, and total
doc.fontSize(10).fillColor('black');

// Subtotal
doc.text('Sous-total :', 350, yPosition, { align: 'left' });
doc.text(`${invoice.currency.symbol} ${invoice.subtotal.toFixed(2)}`, 450, yPosition, { align: 'right' });

// Tax
yPosition += 15; // Adjust yPosition to move down for the next line
doc.text(`Tax ${invoice.tax.name} (${invoice.tax.value}%) :`, 350, yPosition, { align: 'left' });
doc.text(`${invoice.currency.symbol} ${invoice.taxAmount.toFixed(2)}`, 450, yPosition, { align: 'right' });

// Total
yPosition += 15; // Adjust yPosition to move down for the next line
doc.text('Total :', 350, yPosition, { align: 'left' });
doc.text(`${invoice.currency.symbol} ${invoice.total.toFixed(2)}`, 450, yPosition, { align: 'right' });
    // Add footer
    doc.moveDown().fontSize(10).fillColor('gray')
      .text('Invoice was created on a computer and is valid without the signature and seal', 50, yPosition + 60, { align: 'center', width: 500 });

    // Finalize the PDF and end the stream
    doc.end();

  } catch (error) {
    res.status(500).json({ message: 'Error generating PDF', error });
  }
};



//send invoice par email
exports.generateInvoicePDFandSendEmail = async (req, res) => {
  const { id, createdBy } = req.params;
console.log("generateInvoicePDFandSendEmail")
  try {
    
    // Fetch company details using createdBy
    const company = await Company.findOne({ createdBy });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Fetch invoice details using id
    const invoice = await Invoice.findById(id).populate('client').populate('currency').populate('tax');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Define the file path where the PDF will be temporarily saved
    let pdfFileName = `invoice-${invoice.number}.pdf`;
    if (invoice.client.person != null) {
      pdfFileName = `invoice-${invoice.client.person.nom}-${invoice.client.person.prenom}-${invoice.number}.pdf`;
    } else if (invoice.client.entreprise != null) {
      pdfFileName = `invoice-${invoice.client.entreprise.nom}-${invoice.number}.pdf`;
    }
    const pdfPath = path.join('Invoices', pdfFileName);
console.log(pdfPath)
    // Create a new PDF document and save it to the file system
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(fs.createWriteStream(pdfPath));

    // Add the company logo
    if (company.logo !== null) {
      doc.image(company.logo, 50, 45, { width: 100 });
    } else {
      doc.text('Logo Placeholder', 50, 45, { width: 100 });
    }

    // Add company information
    doc.fontSize(20).text(company.name.toUpperCase(), 160, 57).moveDown();
    doc.fontSize(10)
      .text(company.address, 200, 65, { align: 'right' })
      .text(company.state, 200, 80, { align: 'right' })
      .text(company.country, 200, 95, { align: 'right' })
      .text(`Tax Number: ${company.taxNumber}`, 200, 110, { align: 'right' })
      .text(`VAT Number: ${company.vatNumber}`, 200, 125, { align: 'right' })
      .text(`Registration Number: ${company.registrationNumber}`, 200, 140, { align: 'right' });

    // Add invoice title
    doc.fontSize(20).fillColor('#5F259F').text('Facture', 50, 160);

    // Add invoice details
    doc.fontSize(10).fillColor('black')
      .text(`Date : ${invoice.date.toLocaleDateString()}`, 50, 200)
      .text(`Date d'expiration : ${invoice.expirationDate ? invoice.expirationDate.toLocaleDateString() : 'N/A'}`, 50, 215)
      .text(`Numéro : # ${invoice.number}/${invoice.year}`, 50, 230)
      .moveDown();

    doc.text(`Client type : ${invoice.client.type}`, 200, 200, { align: 'right' });
    if (invoice.client.person != null) {
      doc.text(`Client Name : ${invoice.client.person.nom} ${invoice.client.person.prenom} `, 200, 220, { align: 'right' });
    } else if (invoice.client.entreprise != null) {
      doc.text(`Client Name : ${invoice.client.entreprise.nom}`, 200, 220, { align: 'right' });
    }

    // Add table headers
    doc.moveDown().fillColor('#5F259F').fontSize(12)
      .text('Article', 50, 270)
      .text('Quantité', 200, 270, { align: 'center' })
      .text('Prix', 300, 270, { align: 'center' })
      .text('Total', 400, 270, { align: 'center' })
      .moveTo(50, 285).lineTo(550, 285).stroke();

    // Add items
    let yPosition = 300;
    invoice.items.forEach(item => {
      doc.fillColor('black').fontSize(10)
        .text(item.article, 50, yPosition)
        .text(item.quantity, 200, yPosition, { align: 'center' })
        .text(`${invoice.currency.symbol} ${item.price.toFixed(2)}`, 300, yPosition, { align: 'center' })
        .text(`${invoice.currency.symbol} ${item.total.toFixed(2)}`, 400, yPosition, { align: 'center' });

      yPosition += 20;
    });

    // Add subtotal, tax, and total
    doc.fontSize(10).fillColor('black');

    // Subtotal
    doc.text('Sous-total :', 350, yPosition, { align: 'left' });
    doc.text(`${invoice.currency.symbol} ${invoice.subtotal.toFixed(2)}`, 450, yPosition, { align: 'right' });

    // Tax
    yPosition += 15; // Adjust yPosition to move down for the next line
    doc.text(`Tax ${invoice.tax.name} (${invoice.tax.value}%) :`, 350, yPosition, { align: 'left' });
    doc.text(`${invoice.currency.symbol} ${invoice.taxAmount.toFixed(2)}`, 450, yPosition, { align: 'right' });

    // Total
    yPosition += 15; // Adjust yPosition to move down for the next line
    doc.text('Total :', 350, yPosition, { align: 'left' });
    doc.text(`${invoice.currency.symbol} ${invoice.total.toFixed(2)}`, 450, yPosition, { align: 'right' });

    // Add footer
    doc.moveDown().fontSize(10).fillColor('gray')
      .text('Invoice was created on a computer and is valid without the signature and seal', 50, yPosition + 60, { align: 'center', width: 500 });

    // Finalize the PDF and save the file
    doc.end();

    // Wait until the PDF is saved, then send the email
    doc.on('finish', async () => {
     
    });
    await sendInvoiceByEmail(invoice, pdfPath,company.name, res);
    // After sending the email, delete the PDF file from the server
    fs.unlinkSync(pdfPath);


  } catch (error) {
    res.status(500).json({ message: 'Error generating and sending PDF', error });
  }
};


async function sendInvoiceByEmail(invoice, pdfPath,companyName, res) {
  console.log("sendinvoice")
  try {
    // Set up Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: process.env.SERVICE,
      port: process.env.PORT_MAILER,
      secure: process.env.SECURE === 'true',
      auth: {
          user: process.env.USER_MAILER,
          pass: process.env.PASS_MAILER
      },
      tls: {
          rejectUnauthorized: false
      }
  });

    // Determine the email recipient
   
    if (invoice.client.person != null) {
       recipientEmail = invoice.client.person.email;
       recipientName = invoice.client.person.nom;
    } else if (invoice.client.entreprise != null) {
       recipientEmail = invoice.client.entreprise.email;
       recipientName = invoice.client.entreprise.nom;
    }
console.log(recipientEmail)
console.log(recipientName)
    // Email content
    let mailOptions = {
      from: 'TreeFacture', // Sender address
      to: recipientEmail, // Receiver's email address
      subject: `Invoice #${invoice.number}/${invoice.year} from Your Company`,
      text: `Dear ${recipientName},\n\nPlease find attached your invoice.\n\nTotal Amount: ${invoice.currency.symbol}${invoice.total.toFixed(2)}\n\nThank you for your business.\n\nBest Regards,\n${companyName}`,
      attachments: [
        {
          filename: path.basename(pdfPath), // Use the PDF file name
          path: pdfPath, // The path to the PDF file
        },
      ],
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Update invoice status to "Envoyé"
    invoice.status = 'Envoyé';
    await invoice.save();

    // Respond to the API call
    res.status(200).json({ message: 'Invoice generated and sent via email successfully' });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email', error });
  }
}
