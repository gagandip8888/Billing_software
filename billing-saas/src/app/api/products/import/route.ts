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

    // Step 1: Pre-fetch existing products and tenant counters in parallel (1 round-trip)
    const [existingProducts, tenantRecord, globalUsedProductIds] = await Promise.all([
      prisma.product.findMany({
        where: { tenantId: tenant.id },
        select: {
          id: true,
          productId: true,
          name: true,
          barcode: true,
          stockQty: true,
        },
      }),
      prisma.tenant.findUnique({
        where: { id: tenant.id },
        select: { nextProductNo: true },
      }),
      prisma.product.findMany({
        select: { productId: true },
      }),
    ]);

    // Build fast O(1) in-memory lookup maps
    const nameMap = new Map<string, any>();
    const barcodeMap = new Map<string, any>();
    const usedProductIds = new Set<string>();

    for (const p of existingProducts) {
      if (p.name) nameMap.set(p.name.trim().toLowerCase(), p);
      if (p.barcode) barcodeMap.set(p.barcode.trim().toLowerCase(), p);
      if (p.productId) usedProductIds.add(p.productId);
    }

    for (const p of globalUsedProductIds) {
      if (p.productId) usedProductIds.add(p.productId);
    }

    let candidateNo = tenantRecord?.nextProductNo ?? 1001;

    // Fast helper to extract values case-insensitively
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

    const toCreate: any[] = [];
    const toUpdate: Array<{ id: string; data: any }> = [];
    const errors: string[] = [];
    let skipped = 0;

    // Step 2: Instant in-memory parsing without DB calls inside the loop
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNum = i + 2;

      const rawName = getVal(row, "name", "productname", "itemname", "title");
      const trimmedName = rawName !== undefined && rawName !== null ? String(rawName).trim() : "";

      if (!trimmedName) {
        errors.push(`Row ${rowNum}: Skipped - missing product Name`);
        skipped++;
        continue;
      }

      const priceRaw = getVal(row, "price", "saleprice", "rate", "sellingprice");
      let price = priceRaw !== undefined && priceRaw !== null && String(priceRaw).trim() !== "" ? Number(priceRaw) : NaN;
      if (isNaN(price) || price < 0) {
        price = 0; // Safe fallback so import doesn't fail unnecessarily
      }

      const costPriceRaw = getVal(row, "costprice", "purchaseprice", "cost");
      const costPrice =
        costPriceRaw !== undefined && costPriceRaw !== null && String(costPriceRaw).trim() !== "" && !isNaN(Number(costPriceRaw))
          ? Number(costPriceRaw)
          : null;

      const mrpRaw = getVal(row, "mrp", "maximumretailprice");
      const mrp =
        mrpRaw !== undefined && mrpRaw !== null && String(mrpRaw).trim() !== "" && !isNaN(Number(mrpRaw))
          ? Number(mrpRaw)
          : null;

      const taxRateRaw = getVal(row, "taxrate", "gst", "gsttaxrate", "tax");
      const taxRate =
        taxRateRaw !== undefined && taxRateRaw !== null && String(taxRateRaw).trim() !== "" && !isNaN(Number(taxRateRaw))
          ? Number(taxRateRaw)
          : 18;

      const stockQtyRaw = getVal(row, "stockqty", "stock", "quantity", "qty");
      const stockQty =
        stockQtyRaw !== undefined && stockQtyRaw !== null && String(stockQtyRaw).trim() !== "" && !isNaN(Number(stockQtyRaw))
          ? Number(stockQtyRaw)
          : 0;

      const categoryRaw = getVal(row, "category", "cat");
      const sizeRaw = getVal(row, "size");
      const colorRaw = getVal(row, "color", "colour");
      const barcodeRaw = getVal(row, "barcode", "code", "sku");

      const category = categoryRaw ? String(categoryRaw).trim() : null;
      const size = sizeRaw ? String(sizeRaw).trim() : null;
      const color = colorRaw ? String(colorRaw).trim() : null;
      const barcode = barcodeRaw ? String(barcodeRaw).trim() : null;

      // Check for existing product in memory
      const nameKey = trimmedName.toLowerCase();
      const barcodeKey = barcode ? barcode.toLowerCase() : null;
      const existing = nameMap.get(nameKey) || (barcodeKey ? barcodeMap.get(barcodeKey) : undefined);

      if (existing) {
        toUpdate.push({
          id: existing.id,
          data: {
            price,
            ...(costPrice !== null ? { costPrice } : {}),
            ...(mrp !== null ? { mrp } : {}),
            taxRate,
            ...(category !== null ? { category } : {}),
            ...(size !== null ? { size } : {}),
            ...(color !== null ? { color } : {}),
            ...(barcode !== null ? { barcode } : {}),
            stockQty,
            isActive: true,
          },
        });
      } else {
        // Pre-allocate unique candidate productId
        while (usedProductIds.has(String(candidateNo))) {
          candidateNo++;
        }
        const productId = String(candidateNo);
        usedProductIds.add(productId);
        candidateNo++;

        toCreate.push({
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
        });

        // Register in nameMap so duplicate rows in the same spreadsheet don't conflict
        nameMap.set(nameKey, { id: productId, productId, name: trimmedName, barcode, stockQty });
      }
    }

    // Step 3: Fast bulk database operations
    // 3a. Bulk Insert new products in 1 single command
    if (toCreate.length > 0) {
      await prisma.product.createMany({
        data: toCreate,
        skipDuplicates: true,
      });

      // Update tenant sequence in 1 update
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { nextProductNo: candidateNo },
      });
    }

    // 3b. Batch update existing products concurrently in small chunks
    if (toUpdate.length > 0) {
      const BATCH_SIZE = 50;
      for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
        const chunk = toUpdate.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(
          chunk.map((item) =>
            prisma.product.update({
              where: { id: item.id },
              data: item.data,
            })
          )
        );
      }
    }

    const totalImported = toCreate.length + toUpdate.length;

    return NextResponse.json({
      success: true,
      imported: totalImported,
      created: toCreate.length,
      updated: toUpdate.length,
      skipped,
      errors: errors.slice(0, 10), // Limit error list size
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
