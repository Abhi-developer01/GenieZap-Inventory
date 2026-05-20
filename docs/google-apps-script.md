# Optional: Google Apps Script Web App

If you prefer not to use a service account in Node.js, you can expose your sheet via a **Google Apps Script** web app and call it from custom API routes. The default project uses the **Google Sheets API** directly (recommended for Next.js server routes).

## Minimal Apps Script example

1. Open your spreadsheet → **Extensions** → **Apps Script**.
2. Paste and deploy as **Web app** (execute as: Me, access: Anyone with the link — or restrict to your domain).

```javascript
const SHEET_ID = "YOUR_SPREADSHEET_ID";

function doGet(e) {
  const action = e.parameter.action;
  if (action === "products") {
    return json(getSheetData("Products"));
  }
  return json({ error: "Unknown action" });
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  // Handle create/update based on body.action
  return json({ success: true });
}

function getSheetData(name) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(name);
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift();
  return rows.map((row) =>
    Object.fromEntries(headers.map((h, i) => [h, row[i]]))
  );
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
```

3. Point a custom fetch client at your script URL from `lib/api-client.ts` instead of `/api/*` routes.

The built-in `lib/google-sheets.ts` integration does not require Apps Script.
