const express = require("express");
const { google } = require("googleapis");
const cors = require("cors");
const credentials = require("./credentials.json"); // File kredensial dari Google Cloud

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 🔹 Fungsi untuk autentikasi Google Sheets API
async function authorize() {
    const auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        ["https://www.googleapis.com/auth/spreadsheets"]
    );
    return auth;
}

// 🔹 Fungsi untuk membaca data dari Google Sheets
async function readSheet(sheetName) {
    try {
        const auth = await authorize();
        const sheets = google.sheets({ version: "v4", auth });

        const spreadsheetId = "164L2UMb-T9noESkielSMdyBj3izEg2bDcv6oMysEZ9I";
        const range = `${sheetName}!A1:I`;

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) return [];

        // 🔹 Konversi array ke format JSON
        const headers = rows[0];
        const data = rows.slice(1).map((row) =>
            Object.fromEntries(headers.map((header, i) => [header, row[i] || "-"]))
        );

        return data;
    } catch (error) {
        console.error("❌ Error membaca Google Sheets:", error);
        throw new Error("Gagal membaca data");
    }
}

// 🔹 Endpoint untuk mengambil data dari Google Sheets
app.get("/api/data", async (req, res) => {
    const { sheet } = req.query;
    if (!sheet || !["PPPK", "PNS"].includes(sheet.toUpperCase())) {
        return res.status(400).json({ status: "error", message: "Sheet tidak valid" });
    }

    try {
        const data = await readSheet(sheet.toUpperCase());
        res.json(data);
    } catch (error) {
        res.status(500).json({ status: "error", message: "Gagal membaca data" });
    }
});

// 🔹 Menjalankan server
app.listen(PORT, () => {
    console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});