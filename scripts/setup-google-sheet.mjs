/**
 * Creates the GenieZap inventory spreadsheet (4 tabs + header rows).
 * Run: node --env-file=.env.local scripts/setup-google-sheet.mjs
 * Optional: GOOGLE_SHARE_EMAIL=you@gmail.com to grant yourself Editor access
 */
import { google } from "googleapis";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const TABS = [
  {
    title: "Products",
    headers: [
      "id",
      "name",
      "sku",
      "category",
      "quantity",
      "price",
      "barcode",
      "image",
      "low_stock_threshold",
      "created_at",
      "updated_at",
    ],
  },
  {
    title: "InventoryHistory",
    headers: [
      "id",
      "product_id",
      "product_name",
      "type",
      "quantity",
      "previous_qty",
      "new_qty",
      "notes",
      "created_at",
    ],
  },
  {
    title: "Purchases",
    headers: [
      "id",
      "product_id",
      "product_name",
      "supplier",
      "quantity",
      "unit_cost",
      "total_cost",
      "date",
      "notes",
      "created_at",
    ],
  },
  {
    title: "Sales",
    headers: [
      "id",
      "product_id",
      "product_name",
      "customer",
      "quantity",
      "unit_price",
      "total_price",
      "date",
      "notes",
      "created_at",
    ],
  },
];

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) {
    throw new Error(
      "Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env.local",
    );
  }
  return new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

async function main() {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const drive = google.drive({ version: "v3", auth });

  console.log("Creating spreadsheet…");
  const created = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: "GenieZap Inventory" },
      sheets: TABS.map((t) => ({ properties: { title: t.title } })),
    },
  });

  const spreadsheetId = created.data.spreadsheetId;
  if (!spreadsheetId) throw new Error("No spreadsheet ID returned");

  for (const tab of TABS) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tab.title}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [tab.headers] },
    });
    console.log(`  ✓ ${tab.title} headers`);
  }

  const shareEmail = process.env.GOOGLE_SHARE_EMAIL?.trim();
  if (shareEmail) {
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        type: "user",
        role: "writer",
        emailAddress: shareEmail,
      },
      sendNotificationEmail: true,
    });
    console.log(`  ✓ Shared with ${shareEmail}`);
  } else {
    console.log(
      "\n  Tip: Set GOOGLE_SHARE_EMAIL=your@gmail.com and re-run to open the sheet in your Google account.",
    );
  }

  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  console.log("\nSpreadsheet created:");
  console.log("  ID:", spreadsheetId);
  console.log("  URL:", url);

  const envPath = resolve(process.cwd(), ".env.local");
  try {
    let env = readFileSync(envPath, "utf8");
    if (/^GOOGLE_SHEET_ID=/m.test(env)) {
      env = env.replace(/^GOOGLE_SHEET_ID=.*$/m, `GOOGLE_SHEET_ID=${spreadsheetId}`);
    } else {
      env += `\nGOOGLE_SHEET_ID=${spreadsheetId}\n`;
    }
    writeFileSync(envPath, env);
    console.log("\n  ✓ Updated .env.local GOOGLE_SHEET_ID");
  } catch {
    console.log(`\n  Add to .env.local:\n  GOOGLE_SHEET_ID=${spreadsheetId}`);
  }
}

main().catch((err) => {
  console.error("Setup failed:", err.message || err);
  process.exit(1);
});
