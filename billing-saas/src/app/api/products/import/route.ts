import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (formErr: any) {
      console.error("[Excel Import] Failed to parse multipart form data:", formErr);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to read uploaded file",
          imported: 0,
          skipped: 0,
          errors: ["Invalid form submission"],
        },
        { status: 400 }
      );
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
          imported: 0,
          skipped: 0,
          errors: ["No file was uploaded"],
        },
        { status: 400 }
      );
    }

    let workbook: XLSX.WorkBook;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      workbook = XLSX.read(buffer, { type: "buffer" });
    } catch (parseErr: any) {
      console.error("[Excel Import] Error reading spreadsheet buffer:", parseErr);
      return NextResponse.json(
        {
          success: false,
          error: "Could not read spreadsheet file. Please upload a valid .xlsx, .xls, or .csv file.",
          imported: 0,
          skipped: 0,
          errors: ["Invalid spreadsheet file"],
        },
        { status: 400 }
      );
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        {
          success: false,
          error: "The provided spreadsheet has no sheets",
          imported: 0,
          skipped: 0,
          errors: ["Spreadsheet contains no sheets"],
        },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        skipped: 0,
        errors: ["Spreadsheet is empty. No data rows found."],
      });
    }

    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    // Helper to extract value case-insensitively and ignore non-alphanumeric chars
    const getVal = (row: any, ...keys: string[]) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
          return row[k];
        }
        const lowerK = k.toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const rowKey of Object.keys(row)) {
          if (rowKey.toLowerCase().replace(/[^a-z0-9]/g, "") === lowerK) {
            if (row[rowKey] !== undefined && row[rowKey] !== null && String(row[rowKey]).trim() !== "") {
              return row[rowKey];
            }
          }
        }
      }
      return undefined;
    };

    // Process each spreadsheet row
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNum = i + 2; // Row number in Excel (header is row 1)

      try {
        const name = getVal(row, "name", "productname", "itemname", "title");
        const priceRaw = getVal(row, "price", "saleprice", "rate", "sellingprice");
        const costPriceRaw = getVal(row, "costprice", "purchaseprice", "cost");
        const mrpRaw = getVal(row, "mrp", "maximumretailprice");
        const taxRateRaw = getVal(row, "taxrate", "gst", "gsttaxrate", "tax");
        const categoryRaw = getVal(row, "category", "cat");
        const sizeRaw = getVal(row, "size");
        const colorRaw = getVal(row, "color", "colour");
        const stockQtyRaw = getVal(row, "stockqty", "stock", "quantity", "qty");
        const barcodeRaw = getVal(row, "barcode", "code", "sku");

        // 1. Missing Name: skip and log warning (do not crash)
        const trimmedName = name !== undefined && name !== null ? String(name).trim() : "";
        if (!trimmedName) {
          console.warn(`[Excel Import Warning] Row ${rowNum}: Skipped due to missing product Name.`);
          errors.push(`Row ${rowNum}: Skipped - missing product Name`);
          skipped++;
          continue;
        }

        // 2. Missing or invalid Price: skip and log warning (do not crash)
        const price = priceRaw !== undefined && priceRaw !== null && String(priceRaw).trim() !== "" ? Number(priceRaw) : NaN;
        if (isNaN(price) || price <= 0) {
          console.warn(`[Excel Import Warning] Row ${rowNum} ("${trimmedName}"): Skipped due to missing or invalid positive Price (got "${priceRaw ?? ''}").`);
          errors.push(`Row ${rowNum} ("${trimmedName}"): Skipped - missing or invalid Price`);
          skipped++;
          continue;
        }

        // Parse optional fields
        const costPrice =
          costPriceRaw !== undefined && costPriceRaw !== null && String(costPriceRaw).trim() !== "" && !isNaN(Number(costPriceRaw))
            ? Number(costPriceRaw)
            : null;

        const mrp =
          mrpRaw !== undefined && mrpRaw !== null && String(mrpRaw).trim() !== "" && !isNaN(Number(mrpRaw))
            ? Number(mrpRaw)
            : null;

        const taxRate =
          taxRateRaw !== undefined && taxRateRaw !== null && String(taxRateRaw).trim() !== "" && !isNaN(Number(taxRateRaw))
            ? Number(taxRateRaw)
            : 18;

        const stockQty =
          stockQtyRaw !== undefined && stockQtyRaw !== null && String(stockQtyRaw).trim() !== "" && !isNaN(Number(stockQtyRaw))
            ? Number(stockQtyRaw)
            : 0;

        const category = categoryRaw ? String(categoryRaw).trim() : null;
        const size = sizeRaw ? String(sizeRaw).trim() : null;
        const color = colorRaw ? String(colorRaw).trim() : null;
        const barcode = barcodeRaw ? String(barcodeRaw).trim() : null;

        // 3. Check if a product with the same name already exists for this tenant
        const existingProduct = await prisma.product.findFirst({
          where: {
            tenantId: tenant.id,
            name: { equals: trimmedName, mode: "insensitive" },
          },
        });

        if (existingProduct) {
          // Update existing product without creating duplicate
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              price,
              ...(costPrice !== null ? { costPrice } : {}),
              ...(mrp !== null ? { mrp } : {}),
              ...(taxRate !== undefined ? { taxRate } : {}),
              ...(category !== null ? { category } : {}),
              ...(size !== null ? { size } : {}),
              ...(color !== null ? { color } : {}),
              ...(barcode !== null ? { barcode } : {}),
              stockQty: stockQty !== null ? stockQty : existingProduct.stockQty,
              isActive: true,
            },
          });
          imported++;
        } else {
          // Create new product with sequential productId
          await prisma.$transaction(async (tx) => {
            const t = await tx.tenant.findUnique({
              where: { id: tenant.id },
              select: { nextProductNo: true },
            });

            let candidateNo = t?.nextProductNo ?? 1001;
            while (await tx.product.findUnique({ where: { productId: String(candidateNo) } })) {
              candidateNo++;
            }
            const productId = String(candidateNo);

            await tx.tenant.update({
              where: { id: tenant.id },
              data: { nextProductNo: candidateNo + 1 },
            });

            await tx.product.create({
              data: {
                tenantId: tenant.id,
                productId,
                name: trimmedName,
                price,
                costPrice,
                mrp,
                taxRate,
                category,
                size,
                color,
                stockQty,
                barcode,
                unit: "pc",
                isActive: true,
              },
            });
          });
          imported++;
        }
      } catch (rowErr: any) {
        console.error(`[Excel Import Error] Row ${rowNum}:`, rowErr);
        errors.push(`Row ${rowNum}: ${rowErr?.message || "Failed to process product"}`);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors,
    });
  } catch (error: any) {
    console.error("POST /api/products/import error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", imported: 0, skipped: 0, errors: ["Unauthorized"] },
        { status: 401 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to process import file",
        imported: 0,
        skipped: 0,
        errors: [error?.message || "Internal server error"],
      },
      { status: 500 }
    );
  }
}
