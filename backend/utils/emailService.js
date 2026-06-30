import nodemailer from 'nodemailer';

// Generate Ethereal test account credentials dynamically if missing
let testAccount = null;

const getTransporter = async () => {
  // If no SMTP settings are provided in env, use Ethereal (great for dev/testing)
  if (!process.env.SMTP_HOST) {
    if (!testAccount) {
      testAccount = await nodemailer.createTestAccount();
      console.log('--- ETHEREAL EMAIL ACCOUNT CREATED ---');
      console.log(`User: ${testAccount.user}`);
      console.log(`Pass: ${testAccount.pass}`);
    }
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // Production SMTP
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async (to, subject, html) => {
  try {
    const transporter = await getTransporter();
    
    const info = await transporter.sendMail({
      from: `"CoreInventory System" <${process.env.SMTP_FROM || 'noreply@coreinventory.app'}>`,
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent: ${info.messageId}`);
    
    // If using Ethereal, log the URL so developer can view the email in browser
    if (info.messageId && !process.env.SMTP_HOST) {
      console.log(`🔎 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

export const sendLowStockAlert = async (product, adminEmail = 'admin@coreinventory.app') => {
  const subject = `⚠️ LOW STOCK ALERT: ${product.name}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #d97706;">Low Stock Alert</h2>
      <p>The following product has dropped below its configured reorder level:</p>
      
      <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #d97706; margin: 20px 0;">
        <p><strong>Product:</strong> ${product.name} (${product.SKU})</p>
        <p><strong>Current Global Stock:</strong> <span style="color: #dc2626; font-weight: bold;">${product.stockQuantity}</span></p>
        <p><strong>Reorder Level:</strong> ${product.reorderLevel}</p>
      </div>
      
      <p>Please log in to CoreInventory to generate a new Purchase Order.</p>
    </div>
  `;
  return sendEmail(adminEmail, subject, html);
};

export const sendPurchaseOrder = async (po, supplierEmail) => {
  if (!supplierEmail) return false;
  
  const subject = `Purchase Order - ${po.poNumber} from CoreInventory`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #4f46e5;">Purchase Order: ${po.poNumber}</h2>
      <p>Dear Supplier,</p>
      <p>Please find the details of our new Purchase Order below.</p>
      
      <div style="background: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; margin: 20px 0;">
        <p><strong>PO Number:</strong> ${po.poNumber}</p>
        <p><strong>Date Issued:</strong> ${new Date(po.createdAt).toLocaleDateString()}</p>
        <p><strong>Target Delivery Date:</strong> ${po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : 'ASAP'}</p>
      </div>
      
      <h3>Order Items</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background: #f1f5f9; text-align: left;">
            <th style="padding: 10px; border-bottom: 1px solid #cbd5e1;">Item SKU</th>
            <th style="padding: 10px; border-bottom: 1px solid #cbd5e1;">Quantity</th>
            <th style="padding: 10px; border-bottom: 1px solid #cbd5e1;">Unit Cost</th>
          </tr>
        </thead>
        <tbody>
          ${po.items.map(item => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.product?.SKU || 'N/A'}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.quantity}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">$${item.unitCost.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <p style="margin-top: 30px;">Thank you for your business!</p>
      <p style="color: #64748b; font-size: 0.9em;">- The CoreInventory Team</p>
    </div>
  `;
  // In a real system, we might attach the PDF using nodemailer attachments
  // For this milestone, we'll send the formatted HTML email.
  
  return sendEmail(supplierEmail, subject, html);
};
