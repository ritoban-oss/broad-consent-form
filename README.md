# Consent e-signature app — setup

Two pieces: `index.html` (the form, hosted on GitHub Pages) and
`apps-script.gs` (the backend, hosted free on Google Apps Script). No paid
services required.

## 1. Backend (Google Apps Script)

1. Create a new Google Sheet — this will hold your consent records and
   should be owned by an institutional Google account, not a personal one.
2. **Extensions → Apps Script**. Delete the starter code and paste in
   `apps-script.gs`.
3. In the function dropdown, select `setup` and click **Run** once. Approve
   the permission prompts (it only needs access to this Sheet and to send
   email as you).
4. **Deploy → New deployment → Web app.**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the deployment URL — you'll need it in step 2.
6. **Restrict sharing on the Sheet itself** to the research team only. It
   will contain names, emails, phone numbers, IP addresses, and signature
   images — treat it as you would any participant data file.

Any time you edit `apps-script.gs`, go to **Manage deployments → Edit →
New version**, or the live form won't see your changes.

## 2. Frontend (GitHub Pages)

1. Open `index.html` and replace `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE`
   with the URL from step 1.5.
2. Fill in the remaining bracketed placeholders in the `consent-text`
   section (procedures, storage details, risks/benefits, commercial-use
   position, PI/EC contact) with your actual, ethics-committee-approved
   language. The broad-consent framing, scope, and safeguard language are
   already drafted per ICMR's 2017 guidelines — see the note below before
   you finalize it.
3. Push `index.html` to a GitHub repo, then **Settings → Pages → Deploy
   from branch**, pick `main` and `/root`.
4. Your form will be live at `https://<username>.github.io/<repo>/`.
   GitHub issues the HTTPS certificate automatically — no extra
   configuration or cost.

## On "one-time consent for all future research"

Two corrections against the original brief, worth keeping in mind before
this goes to your Ethics Committee:

- **There's no "maximum validity term" for consent under the IT Act,
  2000.** The Act doesn't set an expiry on electronic consent or
  signatures. The only validity window in the eSign world is the signing
  certificate used in a PKI transaction (destroyed after use) — unrelated
  to how long a consent record stays in effect. Nothing in this form
  claims or relies on a statutory expiry.
- **ICMR's 2017 guidelines permit "broad consent," not unconditional
  blanket consent.** It's specifically for future secondary use of
  already-collected data/samples, and it only holds up if three things
  are actually in place: (1) the initial consent, (2) Ethics Committee
  review of *each* future use before it proceeds, and (3) a working way
  to keep in touch with participants, plus a standing right to withdraw.
  The consent text in `index.html` is written to include all three — an
  EC is much more likely to accept a scoped, safeguarded broad consent
  than an open-ended "consent to anything, forever" clause.

## Notes on what this does and doesn't cover

- **Identity verification** is email-OTP based, not Aadhaar. This avoids
  the ASP/ESP licensing requirement (only NSDL and C-DAC are authorized
  eSign providers) and the unresolved legal question of whether a private
  research institute can require Aadhaar authentication at all post-
  *Puttaswamy*.
- **Legal basis**: this is a standard electronic signature under Section
  3A of the IT Act, 2000, admissible under Section 63 of the Bharatiya
  Sakshya Adhiniyam, 2023 — the same category as most consent, contract,
  and onboarding e-signatures used in India, just without the Aadhaar
  layer.
- **Before going live**, have your Institutional Ethics Committee and
  legal counsel review the consent text and this workflow. This tool
  handles the signing mechanics; it doesn't substitute for ethics
  approval of the consent language itself.
- **Data retention**: nothing sensitive is stored in the GitHub repo or
  page — only in the Google Sheet, which you control. Consider periodic
  export/archival per your data management plan, and enable 2-factor
  auth on the Google account that owns the Sheet and script.
