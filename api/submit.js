const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const {
    studentName,
    surname,
    mobileNumber,
    emailId,
    dob,
    aadharNumber,
    fatherName,
    classJoining,
    fatherOccupation,
    address
  } = req.body;

  // Basic Validation
  if (!studentName || !surname || !mobileNumber || !dob || !aadharNumber || !fatherName || !classJoining || !fatherOccupation || !address) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const year = new Date().getFullYear();

  // If mock mode is active, simulate API delays and return simulated details
  if (process.env.MOCK_MODE === 'true') {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const mockRef = `SURYA-${year}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    return res.status(200).json({
      success: true,
      admissionNumber: mockRef,
      message: 'Admission request successfully simulated (Mock Mode).'
    });
  }

  try {
    // 0. Google Apps Script Web App Delegation (Bypasses Render SMTP port blocking)
    if (process.env.APPS_SCRIPT_URL) {
      console.log('Delegating sheets insertion and email dispatch to Google Apps Script...');
      const response = await fetch(process.env.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentName,
          surname,
          mobileNumber,
          emailId,
          dob,
          aadharNumber,
          fatherName,
          classJoining,
          fatherOccupation,
          address
        })
      });

      const result = await response.json();
      if (result.success) {
        return res.status(200).json({
          success: true,
          admissionNumber: result.admissionNumber,
          message: 'Admission request submitted successfully.'
        });
      } else {
        if (result.error === 'duplicate_aadhar') {
          return res.status(409).json({
            success: false,
            error: 'duplicate_aadhar',
            message: 'This Aadhar number is already registered in the database. Please check your details properly.'
          });
        }
        throw new Error(result.error || 'Apps Script returned success=false');
      }
    }

    // 1. Google Sheets Integration & Duplicate Verification
    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY || '';
    const privateKey = rawPrivateKey
      .replace(/^"|"$/g, '')      // Clean enclosing quotes
      .replace(/\\n/g, '\n');      // Restore escaped newlines

    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    // Fetch existing records from Google Sheet up to Column M (index 12)
    let nextIndex = 1;
    let alreadySubmitted = false;
    let existingRecord = null;

    try {
      const getRows = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!A:M',
      });
      
      const rows = getRows.data.values || [];
      nextIndex = rows.length > 0 ? rows.length : 1;

      // Duplicate Check: compare input Aadhar with index 6 (Column G)
      const cleanAadhar = String(aadharNumber).trim();
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        // Col G is index 6. Col A is index 0. Col I is index 8.
        if (row && row[6] && String(row[6]).trim() === cleanAadhar) {
          alreadySubmitted = true;
          existingRecord = {
            admissionNumber: row[0], // Col A
            studentName: `${row[1]} ${row[2]}`, // Col B + Col C
            classJoining: row[8] // Col I
          };
          break;
        }
      }
    } catch (e) {
      console.warn("Could not query Google Sheet rows, default index sequence to 1", e);
    }

    // DUPLICATE RECORD ESCAPE PATH (Saves SMTP/Append API cycles, responds instantly)
    if (alreadySubmitted && existingRecord) {
      return res.status(409).json({
        success: false,
        error: 'duplicate_aadhar',
        message: 'This Aadhar number is already registered in the database. Please check your details properly.'
      });
    }


    // Sequence reference number formatting: SURYA-2026-00001
    const admissionNumber = `SURYA-${year}-${String(nextIndex).padStart(5, '0')}`;

    // Append to sheet matching user's exact columns:
    // A: Admission Number, B: Student Name, C: Surname, D: Mobile, E: Email, F: DOB, G: Aadhar Number,
    // H: Father Name, I: Class, J: Occupation, K: Address, L: Status, M: Timestamp
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:M',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [
            admissionNumber,     // Col A
            studentName,         // Col B
            surname,             // Col C
            mobileNumber,        // Col D
            emailId || 'N/A',    // Col E
            dob,                 // Col F
            aadharNumber,        // Col G
            fatherName,          // Col H
            classJoining,        // Col I
            fatherOccupation,    // Col J
            address,             // Col K
            'Received',          // Col L
            timestamp            // Col M
          ]
        ]
      }
    });

    // 2. Non-blocking Email Notifications using Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const sheetLink = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    // Resolve Logo path for inline email attachments
    const logoPath = path.join(process.cwd(), 'public/assets/logo.png');
    const logoExists = fs.existsSync(logoPath);
    
    const mailAttachments = [];
    if (logoExists) {
      mailAttachments.push({
        filename: 'logo.png',
        path: logoPath,
        cid: 'school-logo'
      });
    }

    // A: School Notification Email (Professional Luxury Card Layout)
    const schoolEmailHtml = `
      <div style="background-color: #FAFBFD; padding: 30px 15px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; min-height: 100%;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border: 2px solid #D4AF37; border-radius: 12px; box-shadow: 0 10px 30px rgba(11, 37, 64, 0.05); overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0B2540 0%, #0F4C81 100%); padding: 30px 20px; text-align: center; border-bottom: 3px solid #D4AF37;">
            ${logoExists ? '<img src="cid:school-logo" style="width: 80px; height: 80px; margin-bottom: 12px;" alt="SURYA Logo" />' : ''}
            <h2 style="color: #ffffff; margin: 0; font-family: Georgia, serif; font-size: 24px; letter-spacing: 0.5px;">SURYA E.M High School</h2>
            <span style="color: #D4AF37; font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; display: block; margin-top: 5px;">New Admission Registration</span>
          </div>

          <!-- Body -->
          <div style="padding: 30px; color: #1A2530; line-height: 1.6;">
            <p style="font-size: 16px; margin-top: 0; font-weight: bold; color: #0B2540;">Dear Administrator,</p>
            <p style="font-size: 14px; color: #5C6E80;">A new student has registered online. The registration details are as follows:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 14px; border: 1px solid #E2E8F0;">
              <tr style="background-color: #0B2540; color: #ffffff;">
                <th style="padding: 12px 15px; text-align: left; font-weight: bold; border: 1px solid #E2E8F0; width: 40%;">Field</th>
                <th style="padding: 12px 15px; text-align: left; font-weight: bold; border: 1px solid #E2E8F0;">Details</th>
              </tr>
              <tr>
                <td style="padding: 12px 15px; font-weight: bold; color: #0F4C81; border: 1px solid #E2E8F0; background-color: #F8FAFC;">Admission Reference</td>
                <td style="padding: 12px 15px; font-weight: bold; color: #0F4C81; border: 1px solid #E2E8F0; background-color: #F8FAFC; font-size: 16px;">${admissionNumber}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; font-weight: bold; border: 1px solid #E2E8F0;">Student Name</td>
                <td style="padding: 12px 15px; border: 1px solid #E2E8F0; font-weight: 500;">${studentName} ${surname}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; font-weight: bold; border: 1px solid #E2E8F0; background-color: #F8FAFC;">Class Joining For</td>
                <td style="padding: 12px 15px; border: 1px solid #E2E8F0; background-color: #F8FAFC; font-weight: bold; color: #D4AF37; font-size: 15px;">${classJoining}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; font-weight: bold; border: 1px solid #E2E8F0;">Aadhar Number</td>
                <td style="padding: 12px 15px; border: 1px solid #E2E8F0;">${aadharNumber}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; font-weight: bold; border: 1px solid #E2E8F0; background-color: #F8FAFC;">Father's Name</td>
                <td style="padding: 12px 15px; border: 1px solid #E2E8F0; background-color: #F8FAFC;">${fatherName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; font-weight: bold; border: 1px solid #E2E8F0;">Father's Occupation</td>
                <td style="padding: 12px 15px; border: 1px solid #E2E8F0;">${fatherOccupation}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; font-weight: bold; border: 1px solid #E2E8F0; background-color: #F8FAFC;">Date of Birth</td>
                <td style="padding: 12px 15px; border: 1px solid #E2E8F0; background-color: #F8FAFC;">${dob}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; font-weight: bold; border: 1px solid #E2E8F0;">Mobile Number</td>
                <td style="padding: 12px 15px; border: 1px solid #E2E8F0; font-weight: bold;"><a href="tel:${mobileNumber}" style="color: #0F4C81; text-decoration: none;">${mobileNumber} 📞</a></td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; font-weight: bold; border: 1px solid #E2E8F0; background-color: #F8FAFC;">Email ID</td>
                <td style="padding: 12px 15px; border: 1px solid #E2E8F0; background-color: #F8FAFC;">${emailId || 'Not Provided'}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; font-weight: bold; border: 1px solid #E2E8F0;">Address</td>
                <td style="padding: 12px 15px; border: 1px solid #E2E8F0; line-height: 1.4;">${address}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; font-weight: bold; border: 1px solid #E2E8F0; background-color: #F8FAFC;">Submission Timestamp</td>
                <td style="padding: 12px 15px; border: 1px solid #E2E8F0; background-color: #F8FAFC; color: #94A6B8;">${timestamp}</td>
              </tr>
            </table>

            <div style="text-align: center; margin: 30px 0 10px 0;">
              <a href="${sheetLink}" style="background: linear-gradient(135deg, #0F4C81 0%, #0B2540 100%); color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 10px rgba(11, 37, 64, 0.2); display: inline-block; border: 1px solid #D4AF37; letter-spacing: 0.5px;">View Google Sheets Database</a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #F8FAFC; padding: 20px; text-align: center; font-size: 12px; color: #5C6E80; border-top: 1px solid #E2E8F0;">
            <strong>SURYA E.M High School</strong> • NANDIGAMPADU, UNAGATLA<br>
            Principal Contact: 8813256157
          </div>
        </div>
      </div>
    `;

    // B: Parent Confirmation Email (Premium Luxury Certificate Layout)
    let parentEmailHtml = '';
    if (emailId) {
      parentEmailHtml = `
        <div style="background-color: #FAFBFD; padding: 30px 15px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; min-height: 100%;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; border: 2px solid #D4AF37; border-radius: 12px; box-shadow: 0 10px 30px rgba(11, 37, 64, 0.05); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0B2540 0%, #0F4C81 100%); padding: 35px 20px; text-align: center; border-bottom: 3px solid #D4AF37;">
              ${logoExists ? '<img src="cid:school-logo" style="width: 80px; height: 80px; margin-bottom: 12px;" alt="SURYA Logo" />' : ''}
              <h2 style="color: #ffffff; margin: 0; font-family: Georgia, serif; font-size: 26px; letter-spacing: 0.5px;">SURYA E.M High School</h2>
              <span style="color: #D4AF37; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; display: block; margin-top: 6px;">Building Bright Futures</span>
            </div>

            <!-- Body -->
            <div style="padding: 35px 30px; color: #1A2530; line-height: 1.6;">
              <p style="font-size: 16px; margin-top: 0; font-weight: bold; color: #0F4C81;">Dear Parent/Guardian,</p>
              <p style="font-size: 14px; color: #5C6E80;">Thank you for choosing SURYA E.M High School, NANDIGAMPADU, UNAGATLA for your child's education. We have successfully received your online admission request.</p>
              
              <div style="background-color: #F8FAFC; border-left: 4px solid #D4AF37; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; border-top: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0; border-bottom: 1px solid #E2E8F0;">
                <h4 style="margin: 0 0 10px 0; color: #0B2540; font-size: 15px; font-family: Georgia, serif;">Registration Summary</h4>
                <p style="margin: 0 0 5px 0; font-size: 14px; color: #5C6E80;"><strong>Student Name:</strong> ${studentName} ${surname}</p>
                <p style="margin: 0 0 5px 0; font-size: 14px; color: #5C6E80;"><strong>Class Joining For:</strong> ${classJoining}</p>
                <p style="margin: 0 0 5px 0; font-size: 14px; color: #5C6E80;"><strong>Aadhar Number:</strong> ${aadharNumber}</p>
                <p style="margin: 0 0 5px 0; font-size: 14px; color: #5C6E80;"><strong>Admission Reference:</strong> <span style="font-size: 15px; color: #0F4C81; font-weight: bold;">${admissionNumber}</span></p>
                <p style="margin: 0; font-size: 14px; color: #5C6E80;"><strong>Application Status:</strong> <span style="color: #10B981; font-weight: bold;">Received Successfully</span></p>
              </div>

              <p style="font-size: 14px; font-weight: bold; color: #0B2540; margin-top: 25px;">What happens next?</p>
              <ul style="padding-left: 20px; font-size: 13px; color: #5C6E80; line-height: 1.8; margin-top: 8px;">
                <li style="margin-bottom: 8px;"><strong>Review Process</strong>: The admissions desk will verify the details submitted.</li>
                <li style="margin-bottom: 8px;"><strong>Verification Call</strong>: A school representative will contact you on your registered mobile number (<strong>${mobileNumber}</strong>) to schedule a school tour and verify original documentation.</li>
                <li style="margin-bottom: 8px;"><strong>Principal Office</strong>: If you have any questions, you can reach out directly.</li>
              </ul>

              <div style="background: rgba(212, 175, 55, 0.04); border: 1px dashed #D4AF37; padding: 15px; border-radius: 8px; text-align: center; margin: 25px 0 10px 0;">
                <p style="margin: 0; font-size: 13px; color: #AA8417; font-weight: bold;">
                  Principal Contact: <a href="tel:8813256157" style="color: #0F4C81; text-decoration: none;">8813256157</a>
                </p>
              </div>

              <p style="font-size: 13px; font-style: italic; color: #94A6B8; margin-top: 30px;">Thank you for trusting SURYA E.M High School with your child's learning journey.</p>
            </div>

            <!-- Footer -->
            <div style="background-color: #F8FAFC; padding: 20px; text-align: center; font-size: 12px; color: #5C6E80; border-top: 1px solid #E2E8F0;">
              <strong>SURYA E.M High School</strong><br>
              NANDIGAMPADU, UNAGATLA
            </div>
          </div>
        </div>
      `;
    }

    // DISPATCH SMTP EMAILS ASYNCHRONOUSLY (Non-blocking: replies immediately to client)
    transporter.sendMail({
      from: `"SURYA School Admissions" <${process.env.SMTP_USER}>`,
      to: process.env.SCHOOL_EMAIL,
      subject: `[New Admission] ${studentName} ${surname} - Joining Class ${classJoining} [${admissionNumber}]`,
      html: schoolEmailHtml,
      attachments: mailAttachments
    }).then(info => {
      console.log('School notification email sent asynchronously in background:', info.messageId);
    }).catch(err => {
      console.error('Error sending school notification email in background:', err);
    });

    if (emailId && parentEmailHtml) {
      transporter.sendMail({
        from: `"SURYA E.M High School" <${process.env.SMTP_USER}>`,
        to: emailId,
        subject: `Application Confirmation: SURYA E.M High School [${admissionNumber}]`,
        html: parentEmailHtml,
        attachments: mailAttachments
      }).then(info => {
        console.log('Parent confirmation email sent asynchronously in background:', info.messageId);
      }).catch(err => {
        console.error('Error sending parent confirmation email in background:', err);
      });
    }

    // Immediately return the 200 response to client once the Google Sheet append completes
    return res.status(200).json({
      success: true,
      admissionNumber,
      message: 'Admission request submitted successfully.'
    });

  } catch (error) {
    console.error('Error during admission submission API:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while processing the admission request. Please try again or contact the principal directly.'
    });
  }
};
