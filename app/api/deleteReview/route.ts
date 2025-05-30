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
    case "deleteReview": {
      try {
        const { userId } = await auth();

        if (!userId) {
          return NextResponse.json({
            message: "No userId present to complete this action",
          });
        }
        const bodyData = await request.json();
        const reviewId = bodyData.data;

        await db.review.delete({
          where: {
            id: reviewId,
            clerkId: userId,
          },
        });

        return NextResponse.json({ message: "Product Delete" });
      } catch (error: any) {
        console.log(error);
        return NextResponse.json({ message: error });
      }
    }
  }

  return NextResponse.json({ message: "Action done" });
}
