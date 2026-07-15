// ==========================================================================
// Google Sheets Installable Trigger Script
// ==========================================================================
// INSTRUCTIONS FOR AUTO-SENDING EMAILS FROM GOOGLE CLOUD:
// 1. Open your Google Spreadsheet.
// 2. Click on "Extensions" -> "Apps Script" in the top menu.
// 3. Clear any default code in the editor, and paste this entire script.
// 4. Click the "Save" icon (floppy disk) at the top.
// 5. Click the "Clock" icon (Triggers) in the left sidebar menu.
// 6. Click the "+ Add Trigger" button in the bottom-right corner.
//    - Choose which function to run: "sendAdmissionEmailsOnRowChange"
//    - Choose which deployment should run: "Head"
//    - Select event source: "From spreadsheet"
//    - Select event type: "On change"
//    - Failure notification settings: "Notify me daily" (or immediately)
// 7. Click "Save". A Google popup will ask you to authorize permissions.
//    - Click your Gmail account.
//    - Click "Advanced" at the bottom of the popup.
//    - Click "Go to Untitled project (unsafe)" (this is standard for custom scripts).
//    - Click "Allow".
//
// Once saved, whenever Render appends a new row to the sheet, Google's servers
// will instantly trigger this script and send the emails. This bypasses Render's
// firewall completely and ensures 100% email delivery.

function sendAdmissionEmailsOnRowChange(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) return; // Skip if sheet has no rows or only headers

  // Prevent double sending. We check Column N (index 14) for status
  var emailStatusRange = sheet.getRange(lastRow, 14); // Column N
  if (emailStatusRange.getValue() === "Emails-Sent") {
    console.log("Emails already dispatched for row " + lastRow);
    return;
  }

  // Extract variables matching the user's exact reordered column layout:
  // A: Admission Number, B: Student Name, C: Surname, D: Mobile, E: Email, F: DOB, G: Aadhar Number,
  // H: Father Name, I: Class, J: Occupation, K: Address, L: Status, M: Timestamp
  var admissionNumber = sheet.getRange(lastRow, 1).getValue();
  var studentName = sheet.getRange(lastRow, 2).getValue();
  var surname = sheet.getRange(lastRow, 3).getValue();
  var mobileNumber = sheet.getRange(lastRow, 4).getValue();
  var emailId = sheet.getRange(lastRow, 5).getValue();
  var dob = sheet.getRange(lastRow, 6).getValue();
  var aadharNumber = sheet.getRange(lastRow, 7).getValue();
  var fatherName = sheet.getRange(lastRow, 8).getValue();
  var classJoining = sheet.getRange(lastRow, 9).getValue();
  var fatherOccupation = sheet.getRange(lastRow, 10).getValue();
  var address = sheet.getRange(lastRow, 11).getValue();
  var status = sheet.getRange(lastRow, 12).getValue();
  var timestamp = sheet.getRange(lastRow, 13).getValue();

  // Validate that it's a valid admission number (starts with SURYA-)
  if (!admissionNumber || String(admissionNumber).indexOf("SURYA-") === -1) {
    console.log("Row " + lastRow + " is not a valid admission registration. Skipping.");
    return;
  }

  // Date formatting helper
  if (dob instanceof Date) {
    dob = Utilities.formatDate(dob, Session.getScriptTimeZone() || "GMT+5:30", "yyyy-MM-dd");
  }

  var schoolEmail = "suryaschoolofficial@gmail.com";
  var principalContact = "8813256157";
  var spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
  var sheetLink = "https://docs.google.com/spreadsheets/d/" + spreadsheetId;

  // A: School Notification Email (Professional Luxury Card Layout)
  var schoolEmailHtml = `
    <div style="background-color: #FAFBFD; padding: 30px 15px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border: 2px solid #D4AF37; border-radius: 12px; box-shadow: 0 10px 30px rgba(11, 37, 64, 0.05); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0B2540 0%, #0F4C81 100%); padding: 30px 20px; text-align: center; border-bottom: 3px solid #D4AF37;">
          <img src="https://lh3.googleusercontent.com/d/1SKzgWpcne1ot126tq-sR3T9Wk07nqZV3" style="width: 80px; height: 80px; margin-bottom: 12px; border-radius: 50%; object-fit: cover;" alt="SURYA Logo" />
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
              <td style="padding: 12px 15px; border: 1px solid #E2E8F0; font-weight: bold;"><a href="tel:${mobileNumber}">${mobileNumber} 📞</a></td>
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

  // Send email to school admin
  GmailApp.sendEmail({
    to: schoolEmail,
    subject: "[New Admission] " + studentName + " " + surname + " - Joining Class " + classJoining + " [" + admissionNumber + "]",
    htmlBody: schoolEmailHtml
  });

  // B: Parent Confirmation Email (Premium Luxury Certificate Layout)
  if (emailId && emailId !== "N/A" && emailId !== "") {
    var parentEmailHtml = `
      <div style="background-color: #FAFBFD; padding: 30px 15px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border: 2px solid #D4AF37; border-radius: 12px; box-shadow: 0 10px 30px rgba(11, 37, 64, 0.05); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #0B2540 0%, #0F4C81 100%); padding: 35px 20px; text-align: center; border-bottom: 3px solid #D4AF37;">
            <img src="https://lh3.googleusercontent.com/d/1SKzgWpcne1ot126tq-sR3T9Wk07nqZV3" style="width: 80px; height: 80px; margin-bottom: 12px; border-radius: 50%; object-fit: cover;" alt="SURYA Logo" />
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
                Principal Contact: <a href="tel:8813256157" style="color: #0F4C81; text-decoration: none;">8813256157</a>
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

    GmailApp.sendEmail({
      to: emailId,
      subject: "Application Confirmation: SURYA E.M High School [" + admissionNumber + "]",
      htmlBody: parentEmailHtml
    });
  }

  // Set column N (index 14) value to SENT to mark row as complete
  sheet.getRange(lastRow, 14).setValue("Emails-Sent");
}
