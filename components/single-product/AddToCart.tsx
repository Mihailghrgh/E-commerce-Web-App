import { Button } from "../ui/button";

function AddToCart({ productId }: { productId: string }) {
  return (
    <Button className="capitalize mt-8 rounded-none" size="lg">
      Add To Cart
    </Button>
  );
}
export default AddToCart;
