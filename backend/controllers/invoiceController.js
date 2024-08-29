const Invoice = require('../models/appmodel/Invoice');
const PDFDocument = require('pdfkit');
const Company = require('../models/coreModel/EntrepriseSetting');
// Create a new invoice
exports.createInvoice = async (req, res) => {
  const { client, number, year, currency, status, date, expirationDate, note, items, subtotal, tax, taxAmount, total, createdBy } = req.body;

  try {
    const newInvoice = new Invoice({
      client,
      number,
      year,
      currency,
      status,
      date,
      expirationDate,
      note,
      items,
      subtotal,
      tax,
      taxAmount,
      total,
      createdBy,
    });

    const savedInvoice = await newInvoice.save();
    res.status(201).json(savedInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Error creating invoice', error });
  }
};

// Get all invoices or filter by createdBy
exports.getInvoices = async (req, res) => {
  const { createdBy } = req.query;

  try {
    const filter = createdBy ? { createdBy } : {};
    const invoices = await Invoice.find(filter);
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices', error });
  }
};

// Get a single invoice by ID
exports.getInvoiceById = async (req, res) => {
  const { id } = req.params;

  try {
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoice', error });
  }
};

// Update an invoice by ID
exports.updateInvoice = async (req, res) => {
  const { id } = req.params;
  const { client, number, year, currency, status, date, expirationDate, note, items, subtotal, tax, taxAmount, total } = req.body;

  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      { client, number, year, currency, status, date, expirationDate, note, items, subtotal, tax, taxAmount, total },
      { new: true }
    );

    if (!updatedInvoice) return res.status(404).json({ message: 'Invoice not found' });

    res.status(200).json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Error updating invoice', error });
  }
};

// Delete an invoice by ID
exports.deleteInvoice = async (req, res) => {
  const { id } = req.params;

  try {
    const invoice = await Invoice.findByIdAndDelete(id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting invoice', error });
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

