import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProductCard({ product }: { product: any }) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <h3 className="font-semibold text-lg">{product?.name || "Product"}</h3>
      <p className="text-gray-600 mb-4">{product?.price ? `BDT ${product.price}` : "Price unavailable"}</p>
      <Link
        to={`/product/${product?.id || 1}`}
        className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded"
      >
        <ShoppingBag size={16} /> View Details
      </Link>
    </div>
  );
}
