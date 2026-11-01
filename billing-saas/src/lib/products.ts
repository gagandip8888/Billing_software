/**
 * Serializes Prisma Product Decimal and Date objects into standard JSON primitives
 */
export function serializeProduct(product: any) {
  if (!product) return product;

  return {
    ...product,
    price: Number(product.price),
    mrp:
      product.mrp !== null && product.mrp !== undefined
        ? Number(product.mrp)
        : null,
    costPrice:
      product.costPrice !== null && product.costPrice !== undefined
        ? Number(product.costPrice)
        : null,
    taxRate: Number(product.taxRate),
    stockQty:
      product.stockQty !== null && product.stockQty !== undefined
        ? Number(product.stockQty)
        : null,
    lowStockAlert:
      product.lowStockAlert !== null && product.lowStockAlert !== undefined
        ? Number(product.lowStockAlert)
        : null,
    createdAt:
      product.createdAt instanceof Date
        ? product.createdAt.toISOString()
        : product.createdAt,
    updatedAt:
      product.updatedAt instanceof Date
        ? product.updatedAt.toISOString()
        : product.updatedAt,
  };
}
