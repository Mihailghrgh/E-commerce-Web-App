import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/utils/db";

export async function POST(
  request: NextRequest
): Promise<
  NextResponse<{ message: string; orderId?: string; cartId?: string }>
> {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  switch (type) {
    case "delete": {
      try {
        const { userId } = await auth();
        if (!userId) {
          return NextResponse.json({ message: "Error on delete" });
        }
        ////Simple deleting process , passing the {data: data} and not {headers: } required
        const bodyData = await request.json();
        console.log(bodyData.data);

        const productId = bodyData.data;

        await db.product.delete({
          where: { id: productId },
        });

        return NextResponse.json({ message: "Product Deleted" });
      } catch (error: any) {
        console.log(error);
        return NextResponse.json({ message: error });
      }
    }
  }

  return NextResponse.json({ message: "Action done" });
}
