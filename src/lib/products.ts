import pWatch1 from "../assets/p-watch1.jpg";
import pWatch2 from "../assets/p-watch2.jpg";
import pShirt1 from "../assets/p-shirt1.jpg";
import pShirt2 from "../assets/p-shirt2.jpg";
import pPants1 from "../assets/p-pants1.jpg";
import pPants2 from "../assets/p-pants2.jpg";
import pWallet from "../assets/p-wallet.jpg";
import pTie from "../assets/p-tie.jpg";

export interface Product {
  id: string;
  name: string;
  category: string;
  slug?: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  tag?: string;
  sizes?: string[];
  colors?: string[];
  colorVariants?: ColorVariant[];
}

export interface ColorVariant {
  name: string;
  image: string;
}

export const products: Product[] = [
  {
    id: "w1",
    name: "Aurelius Gold Chronograph",
    category: "Watches",
    price: 12500,
    rating: 4.9,
    reviews: 214,
    image: pWatch1,
    tag: "Best Seller",
  },
  {
    id: "w2",
    name: "Meridian Steel Classic",
    category: "Watches",
    price: 8900,
    rating: 4.8,
    reviews: 168,
    image: pWatch2,
    tag: "New Arrival",
  },
  {
    id: "s1",
    name: "Oxford White Dress Shirt",
    category: "Shirts",
    price: 2500,
    rating: 4.7,
    reviews: 342,
    image: pShirt1,
  },
  {
    id: "s2",
    name: "Lagoon Linen Casual Shirt",
    category: "Shirts",
    price: 1999,
    rating: 4.6,
    reviews: 189,
    image: pShirt2,
    tag: "New Arrival",
  },
  {
    id: "p1",
    name: "Charcoal Tailored Trousers",
    category: "Pants",
    price: 3200,
    rating: 4.8,
    reviews: 256,
    image: pPants1,
  },
  {
    id: "p2",
    name: "Midnight Slim Chinos",
    category: "Pants",
    price: 2499,
    rating: 4.5,
    reviews: 141,
    image: pPants2,
  },
  {
    id: "a1",
    name: "Onyx Leather Bifold Wallet",
    category: "Accessories",
    price: 1499,
    rating: 4.9,
    reviews: 402,
    image: pWallet,
    tag: "Best Seller",
  },
  {
    id: "a2",
    name: "Regent Silk Tie & Gold Clip",
    category: "Accessories",
    price: 1250,
    rating: 4.7,
    reviews: 98,
    image: pTie,
  },
];
