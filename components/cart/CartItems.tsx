import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import Image from "next/image";
import { Button } from "../ui/button";
import { Prisma } from "@prisma/client";
import { LuTrash2 } from "react-icons/lu";
import { formatCurrency } from "@/utils/format";
import Link from "next/link";
import FormContainer from "../form/FormContainer";
import CartProductAmount from "./CartProductAmount";
import { Separator } from "../ui/separator";

type CartWithProduct = Prisma.CartGetPayload<{
  include: {
    cartItems: { include: { product: true } };
  };
}>;

function CartItems({ cartItems }: { cartItems: CartWithProduct }) {
  const fetchCartData = () => {
    console.log("this works");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Total Items: </CardTitle>
      </CardHeader>
      <CardContent className="space-y-20 md:space-y-10">
        {cartItems?.cartItems?.map((item) => {
          const { amount, id } = item;
          const { image, name, price, id: productId } = item.product;

          return (
            <div key={item.id} className="flex items-start space-x-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-md border bg-gray-100">
                <Image
                  src={image || "/placeholder.svg"}
                  alt={name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 pb-2">
                <Link href={`/products/${id}`}>
                  <h3 className="font-medium">{name}</h3>
                </Link>

                <p className="text-sm text-muted-foreground ">
                  {formatCurrency(price)} each
                </p>
                <Separator className="my-2 bg-transparent" />
                <CartProductAmount id={id} quantity={amount} />
              </div>

              <div className="flex flex-col items-end space-y-2">
                <span className="font-medium">{formatCurrency(price)}</span>

                <FormContainer
                  type="removeCartItemAction"
                  productId=""
                  favoriteId=""
                >
                  <input type="hidden" name="id" />
                  <input type="hidden" name="cartId" />
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 mt-8 hover:text-red-600"
                    onClick={() => fetchCartData()}
                  >
                    <LuTrash2 />
                  </Button>
                </FormContainer>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
export default CartItems;
