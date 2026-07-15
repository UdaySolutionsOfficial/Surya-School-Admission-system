/**
 * Google Apps Script for SURYA School Admission System
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Click Extensions -> Apps Script.
 * 3. Delete any default code and paste this script.
 * 4. Configure script properties (Gear Icon -> Script Properties) for:
 *    - SCHOOL_EMAIL
 *    - PRINCIPAL_CONTACT
 * 5. Click Deploy -> New Deployment.
 * 6. Select "Web app" as the deployment type.
 * 7. Set:
 *    - Description: Surya Admission API
 *    - Execute as: Me (your-email@gmail.com)
 *    - Who has access: Anyone (This is critical for Render to access it)
 * 8. Click Deploy, authorize permissions, and copy the Web App URL.
 * 9. Set this URL as the APPS_SCRIPT_URL environment variable in Render.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var studentName = data.studentName;
    var surname = data.surname;
    var mobileNumber = data.mobileNumber;
    var emailId = data.emailId;
    var dob = data.dob;
    var aadharNumber = data.aadharNumber;
    var fatherName = data.fatherName;
    var classJoining = data.classJoining;
    var fatherOccupation = data.fatherOccupation;
    var address = data.address;

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rows = sheet.getDataRange().getValues();
    var alreadySubmitted = false;
    var cleanAadhar = String(aadharNumber).trim();

    // Duplicate Check: Col G (index 6) is Aadhar Number
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      if (row && row[6] && String(row[6]).trim() === cleanAadhar) {
        alreadySubmitted = true;
        break;
      }
    }

    if (alreadySubmitted) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'duplicate_aadhar',
        message: 'This Aadhar number is already registered in the database.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var year = new Date().getFullYear();
    var nextIndex = rows.length > 0 ? rows.length : 1;
    var admissionNumber = "SURYA-" + year + "-" + String(nextIndex).padStart(5, '0');
    
    // Indian Standard Time (IST) timestamp
    var timestamp = Utilities.formatDate(new Date(), "GMT+5:30", "dd/MM/yyyy, hh:mm:ss a");

    // Append to sheet
    sheet.appendRow([
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
    ]);

    // Send notifications
    var schoolEmail = PropertiesService.getScriptProperties().getProperty('SCHOOL_EMAIL') || 'admissions@suryaschool.edu.in';
    var principalContact = PropertiesService.getScriptProperties().getProperty('PRINCIPAL_CONTACT') || '8813256157';

    var sheetLink = SpreadsheetApp.getActiveSpreadsheet().getUrl();

    // A: School Notification Email
    var schoolEmailHtml = `
      <div style="background-color: #FAFBFD; padding: 30px 15px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; min-height: 100%;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border: 2px solid #D4AF37; border-radius: 12px; box-shadow: 0 10px 30px rgba(11, 37, 64, 0.05); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #0B2540 0%, #0F4C81 100%); padding: 30px 20px; text-align: center; border-bottom: 3px solid #D4AF37;">
            <h2 style="color: #ffffff; margin: 0; font-family: Georgia, serif; font-size: 24px; letter-spacing: 0.5px;">SURYA E.M High School</h2>
            <span style="color: #D4AF37; font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; display: block; margin-top: 5px;">New Admission Registration</span>
          </div>
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
              <a href="${sheetLink}" style="background: linear-gradient(135deg, #0F4C81 0%, #0B2540 100%); color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 14px; display: inline-block; border: 1px solid #D4AF37; letter-spacing: 0.5px;">View Google Sheets Database</a>
            </div>
          </div>
          <div style="background-color: #F8FAFC; padding: 20px; text-align: center; font-size: 12px; color: #5C6E80; border-top: 1px solid #E2E8F0;">
            <strong>SURYA E.M High School</strong> • NANDIGAMPADU, UNAGATLA<br>
            Principal Contact: ${principalContact}
          </div>
        </div>
      </div>
    `;

    // Send email to school
    MailApp.sendEmail({
      to: schoolEmail,
      subject: `[New Admission] ${studentName} ${surname} - Joining Class ${classJoining} [${admissionNumber}]`,
      htmlBody: schoolEmailHtml
    });

    // B: Parent Confirmation Email
    if (emailId) {
      var parentEmailHtml = `
        <div style="background-color: #FAFBFD; padding: 30px 15px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; min-height: 100%;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; border: 2px solid #D4AF37; border-radius: 12px; box-shadow: 0 10px 30px rgba(11, 37, 64, 0.05); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0B2540 0%, #0F4C81 100%); padding: 35px 20px; text-align: center; border-bottom: 3px solid #D4AF37;">
              <h2 style="color: #ffffff; margin: 0; font-family: Georgia, serif; font-size: 26px; letter-spacing: 0.5px;">SURYA E.M High School</h2>
              <span style="color: #D4AF37; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; display: block; margin-top: 6px;">Building Bright Futures</span>
            </div>
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
                  Principal Contact: <a href="tel:${principalContact}" style="color: #0F4C81; text-decoration: none;">${principalContact}</a>
                </p>
              </div>
              <p style="font-size: 13px; font-style: italic; color: #94A6B8; margin-top: 30px;">Thank you for trusting SURYA E.M High School with your child's learning journey.</p>
            </div>
            <div style="background-color: #F8FAFC; padding: 20px; text-align: center; font-size: 12px; color: #5C6E80; border-top: 1px solid #E2E8F0;">
              <strong>SURYA E.M High School</strong><br>
              NANDIGAMPADU, UNAGATLA
            </div>
          </div>
        </div>
      `;

      MailApp.sendEmail({
        to: emailId,
        subject: `Application Confirmation: SURYA E.M High School [${admissionNumber}]`,
        htmlBody: parentEmailHtml
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      admissionNumber: admissionNumber
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
