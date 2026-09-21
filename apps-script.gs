/**
 * Institute of Sleep Science — Consent form backend
 *
 * SETUP
 * 1. Create a new Google Sheet. Extensions → Apps Script.
 * 2. Delete any starter code, paste this file's contents in.
 * 3. Run `setup` once from the Apps Script editor (Run ▶) to create the
 *    sheet tabs and grant permissions. Approve the permission prompts —
 *    this script only touches this one Sheet and sends email as you.
 * 4. Deploy → New deployment → type "Web app".
 *      Execute as:  Me
 *      Who has access:  Anyone
 * 5. Copy the deployment URL into APPS_SCRIPT_URL in index.html.
 * 6. Re-deploy (Manage deployments → Edit → New version) any time you
 *    change this file — Apps Script won't pick up edits otherwise.
 *
 * DATA
 * Two tabs are created in the bound Sheet:
 *   - "Consents"   one row per completed, signed consent
 *   - "_otp"       transient OTP codes (auto-expire after 10 min)
 * Restrict sharing on this Sheet to the research team only — it holds
 * participant identity, signatures, and IP addresses.
 */

const OTP_TTL_MINUTES = 10;
const SHEET_CONSENTS = "Consents";
const SHEET_OTP = "_otp";

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(SHEET_CONSENTS)) {
    const s = ss.insertSheet(SHEET_CONSENTS);
    s.appendRow([
      "Consent ID", "Timestamp", "Name", "Email", "Phone", "Study ID",
      "IP Address", "User Agent", "Signature (image)"
    ]);
  }
  if (!ss.getSheetByName(SHEET_OTP)) {
    const s = ss.insertSheet(SHEET_OTP);
    s.appendRow(["Email", "Code", "Expires At", "Verified"]);
    s.hideSheet();
  }
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut({ ok: false, error: "Malformed request." });
  }

  switch (body.action) {
    case "sendOtp":
      return sendOtp(body);
    case "verifyOtp":
      return verifyOtp(body);
    case "submitConsent":
      return submitConsent(body);
    default:
      return jsonOut({ ok: false, error: "Unknown action." });
  }
}

function sendOtp(body) {
  const email = (body.email || "").trim();
  const name = (body.name || "participant").trim();
  if (!email) return jsonOut({ ok: false, error: "Email is required." });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  const sheet = getSheet(SHEET_OTP);
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === email) { rowIndex = i + 1; break; }
  }
  const row = [email, code, expires.toISOString(), false];
  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, 4).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  try {
    MailApp.sendEmail({
      to: email,
      subject: "Your verification code — Institute of Sleep Science",
      body:
        `Hello ${name},\n\n` +
        `Your verification code is: ${code}\n\n` +
        `This code expires in ${OTP_TTL_MINUTES} minutes. If you didn't request this, you can ignore this email.\n\n` +
        `— Institute of Sleep Science, Kolkata`
    });
  } catch (err) {
    return jsonOut({ ok: false, error: "Couldn't send the email. Try again shortly." });
  }

  return jsonOut({ ok: true });
}

function verifyOtp(body) {
  const email = (body.email || "").trim();
  const code = (body.code || "").trim();
  const sheet = getSheet(SHEET_OTP);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === email) {
      const storedCode = String(data[i][1]);
      const expires = new Date(data[i][2]);
      if (new Date() > expires) {
        return jsonOut({ ok: false, error: "That code has expired. Request a new one." });
      }
      if (storedCode !== code) {
        return jsonOut({ ok: false, error: "Incorrect code." });
      }
      sheet.getRange(i + 1, 4).setValue(true); // mark verified
      return jsonOut({ ok: true });
    }
  }
  return jsonOut({ ok: false, error: "No code found for that email. Request one first." });
}

function submitConsent(body) {
  const email = (body.email || "").trim();

  // require a verified OTP row for this email before accepting a signature
  const otpSheet = getSheet(SHEET_OTP);
  const otpData = otpSheet.getDataRange().getValues();
  let verified = false;
  for (let i = 1; i < otpData.length; i++) {
    if (otpData[i][0] === email && otpData[i][3] === true) { verified = true; break; }
  }
  if (!verified) {
    return jsonOut({ ok: false, error: "Email not verified. Please complete verification first." });
  }

  const consentId = "SLEEP-" + Utilities.formatDate(new Date(), "GMT", "yyyyMMdd") +
    "-" + Math.floor(1000 + Math.random() * 9000);

  const sheet = getSheet(SHEET_CONSENTS);
  sheet.appendRow([
    consentId,
    body.timestamp || new Date().toISOString(),
    body.name || "",
    email,
    body.phone || "",
    body.studyId || "",
    body.ip || "",
    body.userAgent || "",
    body.signature || ""   // base64 PNG data URL — kept in this restricted-access sheet only
  ]);

  return jsonOut({ ok: true, consentId: consentId });
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    setup();
    sheet = ss.getSheetByName(name);
  }
  return sheet;
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
