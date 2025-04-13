"use client";

import CartTotals from "@/components/cart/CartTotals";
import SectionTitle from "@/components/global/SectionTitle";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { Prisma } from "@prisma/client";
import CartItems from "./CartItems";

type CartWithProduct = Prisma.CartGetPayload<{
  include: {
    cartItems: {
      include: {
        product: true;
      };
    };
  };
}>;

type Cart = Prisma.CartGetPayload<{}>;

function CartPageClient() {
  const { user } = useUser();
  const [cartItems, setCartItems] = useState<CartWithProduct>();
  const [cart, setCart] = useState<Cart>();

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const { data } = await axios.get(
          "/api/products?type=fetchOrCreateCart"
        );
        setCartItems(data);
        setCart(data);
      } catch (error: any) {
        console.log(error);
      }
    };

    fetchCart();
  }, []);

  if (cart?.numItemsInCart === 0) {
    return <SectionTitle text="Empty Cart" />;
  }

  return (
    <>
      <SectionTitle text="Shopping Cart" />
      {cart && (
        <div className="mt-8 grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <CartItems cartItems={cartItems!} />
          </div>
          <div className="lg:col-span-4">
            <CartTotals cart={cart} />
          </div>
        </div>
      )}
    </>
  );
}
export default CartPageClient;
