# Staff guide

A short guide for The Ivory Cradle School team: uploading lesson videos, publishing courses, and managing certificates. Open the staff area from the **Staff** link in the site header after you sign in, or go to `/admin`.

## Who can do what

* **Staff** can edit, preview and publish courses, and view enrollments, viewing progress, quiz attempts, completions and certificates.
* **Administrators** can also manage founder signatures, correct, revoke and reissue certificates, change expiration policies and enrollment settings, and give staff access.
* To add a team member, ask them to create a student account first. Then an administrator opens **Staff access**, enters their email, and chooses Staff or Administrator.

## Upload or connect a lesson video

1. Open **Courses** and choose the course.
2. Under **Lesson video**, either upload the finished HyperFrames MP4 or connect a video that is already hosted.
3. **Upload:** choose the MP4 file. The page reads the video length automatically and stores the file privately. Only enrolled, signed in students can stream it. Uploads need private Blob storage to be connected to the site.
4. **Connect:** paste the https address of the MP4 file and enter its length in seconds. Use this when the video is hosted elsewhere. A linked video is only as private as the place it is hosted.
5. Check the length. Required viewing is measured against it, so it must match the real video. Use **Correct the length** if needed.
6. Under **Captions and worksheet**, upload a WebVTT caption file (`.vtt`). Captions are required to publish.
7. Choose **Preview lesson and quiz as a student** to watch the draft in the student player. Nothing is saved in preview.

## Worksheets

* Each course has a single one page PDF worksheet. Students can download it as soon as they enroll.
* Use **Replace the one page worksheet** to upload a new PDF, then use the **Preview** link to check it.
* A replaced worksheet reaches students who enroll after you publish. Students already enrolled keep the worksheet from their version.
* Before uploading, print a test copy in black and white to check it stays readable and fits on one US Letter page.

## Edit course details and the quiz

1. Under **Course details and quiz**, update the title, category, catalog summary, description, who it is for, learning objectives, and what is included. Put one item per line in the list boxes.
2. The quiz always has exactly five questions worth one point each. A score of 4 out of 5 passes.
3. For each question, enter two to four answers and select the radio button next to the correct one. Explanations are optional and are only shown to a student after they pass.
4. Choose **Save draft**. Students keep seeing the published version until you publish.

## Publish a course

1. The **Publish** panel lists anything still missing: description, audience, objectives, video and length, captions, worksheet, and five complete questions.
2. When the list is clear, choose **Publish draft as version N**. New enrollments use the new version right away.
3. Students who enrolled earlier stay on the version they enrolled in, including its video, worksheet and quiz.
4. **Change visibility** lets you show a course as a catalog preview without enrollment, hide it from the site, or archive it. **Reopen live version** puts the last published version back on sale.
5. Price is stored for the payment phase. Live payments are not active, and staging enrollment stays free.

## Student records

* **Students & progress** lists every enrollment with the current viewing, quiz attempts, status and certificate. Search by name or email.
* Open a student to see each viewing of the lesson, every quiz attempt with which questions were correct, and their certificates.
* After three failed attempts a student must rewatch the full lesson. Their earlier viewings and attempts stay on the record.
* **Accessible alternative:** if a student cannot complete the video and finishes the lesson another way with you, open their record and use **Complete required viewing** with a short reason. This unlocks the quiz for that viewing and is logged with your name.
* Requests for accessible alternatives and other questions arrive under **Messages**. Reply by email, then choose **Mark handled**.

## Certificates

* A Certificate of Completion is issued automatically the moment a student passes. Each completed enrollment gets one certificate.
* The certificate prints the name the student confirmed before the quiz, the course title, the completion date, a unique serial number, a QR code, the verification address, and both founders’ signatures.
* The issued record and PDF are frozen. Later changes to a student’s profile, the course, the signatures or the expiration policy never change a certificate that was already issued. Downloading again always returns the same file and serial.
* **Find a certificate:** open **Certificates** and search by serial, name or email. The public verification page only accepts a full serial number.

### Correct and reissue (administrators)

1. Open the certificate and fill in **Correct and reissue** with the corrected name, course title or completion date, plus a private reason.
2. Choose **Issue corrected replacement**. The replacement gets a new serial. The original now verifies as **Replaced**, and the student downloads the new one from their dashboard.

### Revoke (administrators)

1. Open the certificate, enter a private reason under **Revoke**, and choose **Revoke credential**.
2. Verification now shows **Revoked**. Reasons and staff notes are never shown publicly.

Every correction, replacement and revocation appears in the certificate’s **Audit trail** with who did it and when.

### What the public sees

Anyone with the full serial can check a credential on **Verify a Certificate** without signing in. They see the status (Valid, Expired, Revoked, Replaced, or Not valid), the name and course title exactly as printed, the credential type, the issue date, the expiration (or Does not expire), and the completion date when it differs from the issue date. Email addresses, scores, PDFs and other records stay private.

## Signatures (administrators)

* **Signatures** shows the active founder signature set and earlier versions. Signature artwork is private.
* To update the artwork, upload two transparent PNG files and give the version a name. The new set becomes active for new certificates only.

## Expiration policies and settings (administrators)

* Certificates of Completion do not expire. Each credential type can have its own expiration in months, for example a future policy for the flagship program once it is approved.
* The policy in place at the moment of issue is saved with each credential.
* **Staging enrollment** lets testers enroll without paying. **Payments** and **Flagship enrollment** are reserved for later phases and should stay off.

## Staging notes

* On the staging site every certificate is labeled **Sample** and points to the staging verification address.
* Sample serials for testing verification: `ICS7KQ4M2XD9PRT` (valid, does not expire), `ICSE3VN8HC5WQ2A` (expired), `ICSR6TJ9BK4ZM7F` (revoked), `ICSP2GH5WN8DX3K` (replaced) and `ICSV9MC3QT6YB4J` (its corrected replacement).
* Accreditation, continuing education credit or professional certification wording is not used anywhere on the site. Add it only after approved wording is supplied.
