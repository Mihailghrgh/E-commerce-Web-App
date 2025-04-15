import db from "@/utils/db";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  imageSchema,
  productSchema,
  reviewSchema,
  validateWithZodSchema,
} from "@/utils/schema";
import { deleteImage, uploadImage } from "@/utils/supabase";
import { Cart, Prisma } from "@prisma/client";
import { cartSchema } from "@/utils/schema";
import { CartItem } from "@prisma/client";

////Logic kept in here for switch cases of different search params
////Instead of action because of issues with accessing base code on a request keeping it simple as an api request after an axios get request
////Axios get request will either be simple requests where searching for the params and setting them to the requested
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const search = searchParams.get("search");
  const id = searchParams.get("id");

  let result;

  switch (type) {
    case "isAdmin": {
      const userId = searchParams.get("userId");

      const isAdmin = userId === process.env.ADMIN_USER_ID;
      console.log(isAdmin);

      return NextResponse.json(isAdmin);
    }
    case "featured": {
      result = await db.product.findMany({
        where: { featured: true },
      });

      return NextResponse.json(result);
    }

    case "unique": {
      if (!id) {
        return new Response("Id is not available", { status: 400 });
      }
      result = await db.product.findUnique({
        where: { id: id },
      });
      return NextResponse.json(result);
    }

    case "searching": {
      if (!search) {
        result = await db.product.findMany({
          orderBy: { createdAt: "desc" },
        });
      } else {
        result = await db.product.findMany({
          where: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { company: { contains: search, mode: "insensitive" } },
            ],
          },
          orderBy: { createdAt: "desc" },
        });
      }
      break;
    }
    case "admin": {
      const { userId } = await auth();
      if (userId !== process.env.ADMIN_USER_ID) {
        return NextResponse.json("unidentified");
      }
      result = await db.product.findMany({
        orderBy: { createdAt: "desc" },
      });
      break;
    }
    case "favorite": {
      const { userId } = await auth();
      const prodId = searchParams.get("id");
      if (!userId) {
        return NextResponse.json("Not user Id provided in api call");
      }
      if (!prodId) {
        return NextResponse.json("No item Id detected or existing in api Call");
      }
      const newResult = await db.favorite.findFirst({
        where: { productId: prodId, clerkId: userId },
      });

      return NextResponse.json(newResult);
    }
    case "allFavorite": {
      const { userId } = await auth();

      if (!userId) {
        return NextResponse.json("No user Id present on this page");
      }

      const favorites: Prisma.FavoriteGetPayload<{
        include: { product: true };
      }>[] = await db.favorite.findMany({
        where: { clerkId: userId },
        include: {
          product: true,
        },
      });

      return NextResponse.json(favorites);
    }
    case "productReviews": {
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json(" No product Id provided to get reviews");
      }

      const reviews = await db.review.findMany({
        where: {
          productId: id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(reviews);
    }
    case "productReviewsByUser": {
      const { userId } = await auth();

      if (!userId) {
        return NextResponse.json("No userId detected to complete action");
      }

      const result = await db.review.findMany({
        where: { clerkId: userId },
        select: {
          createdAt: true,
          id: true,
          rating: true,
          comment: true,
          product: {
            select: {
              image: true,
              name: true,
            },
          },
        },
      });
      return NextResponse.json(result);
    }
    case "findExistingReview": {
      const { userId } = await auth();
      const id = searchParams.get("id");

      if (!userId || !id) {
        return NextResponse.json("No userId detected to complete action");
      }

      const result = await db.review.findFirst({
        where: { clerkId: userId, productId: id },
      });
      return NextResponse.json(result);
    }
    case "productRating": {
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json(" No product Id provided to get reviews");
      }

      const result = await db.review.groupBy({
        by: ["productId"],
        _avg: {
          rating: true,
        },
        _count: {
          rating: true,
        },
        where: {
          productId: id,
        },
      });

      const data = {
        rating: result[0]._avg.rating?.toFixed(1) ?? 0,
        count: result[0]._count.rating ?? 0,
      };

      return NextResponse.json(data);
    }

    case "getNumberOfCartItems": {
      const { userId } = await auth();

      if (!userId) {
        return NextResponse.json("No user Id present");
      }

      const result = await db.cart.findFirst({
        where: {
          clerkId: userId,
        },
        select: {
          numItemsInCart: true,
        },
      });

      console.log("Number of items in cart", result);

      if (!result?.numItemsInCart) {
        return NextResponse.json("No number of items in the cart");
      } else {
        return NextResponse.json(result);
      }
    }
    case "fetchOrCreateCart": {
      const { userId } = await auth();

      if (!userId) {
        return NextResponse.json("No user Id presented");
      }

      const result = await fetchOrCreateCart({ userId });
      console.log(result);

      return NextResponse.json(result);
    }

    default: {
      result = await db.product.findMany();
      break;
    }
  }

  return NextResponse.json(result);
}

export async function POST(
  request: Request
): Promise<NextResponse<{ message: string }>> {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  let result: string = "Empty message";

  switch (type) {
    case "create": {
      try {
        ////Getting the ADMIN Id to check if we have the wrong user making requests
        const { userId } = await auth();
        if (!userId) {
          result = "Not allowed";
          redirect("/");
        }

        ////Formatting and Getting the key:data received in the request from the FormContainer
        const newData = await request.formData();
        const data = Object.fromEntries(newData);

        ////This is the part where we check the image File as being correct
        // ---- correct size and file type with imageSchema
        // ---- and upload it to the supabase Bucket
        const file = data.image as File;
        const validatedFile = validateWithZodSchema(imageSchema, {
          image: file,
        });
        const fullPath = await uploadImage(validatedFile.image);
        ////Special function that takes schema and the data to Validate and Create the error messages correctly
        const validateFields = validateWithZodSchema(productSchema, data);

        await db.product.create({
          data: {
            ...validateFields,
            image: fullPath,
            clerkId: userId,
          },
        });

        // await db.product.create({
        //   data: {
        //     name,
        //     company,
        //     description,
        //     price,
        //     image: "/images/jacket.png",
        //     featured,
        //     clerkId: userId,
        //   },
        // });
        result = "New Product Created";
      } catch (error: any) {
        result = error.message;
      }
    }

    case "delete": {
      try {
        const { userId } = await auth();
        if (!userId) {
          result = "Not allowed";
          redirect("/");
        }
        ////Simple deleting process , passing the {data: data} and not {headers: } required
        const product = await request.json();
        const productId = product.data;

        const deletedItems = await db.product.delete({
          where: { id: productId },
        });

        result = "Product Delete";
      } catch (error: any) {
        console.log(error);
        result = error.message;
      }
    }
    case "deleteReview": {
      const { userId } = await auth();

      if (!userId) {
        return NextResponse.json({
          message: "No userId present to complete this action",
        });
      }
      const { data } = await request.json();
      console.log(data);
      const reviewId = data;

      await db.review.delete({
        where: {
          id: reviewId,
          clerkId: userId,
        },
      });
      try {
      } catch (error) {
        console.log(error);
      }
    }

    case "edit": {
      try {
        const { userId } = await auth();
        if (!userId) {
          result = "Not allowed";
          redirect("/");
        }
        //This way if you want to pass the data as { data: name, company, price , description , image}
        // const { data } = await request.json();
        // const { name, price, description, company, id } = data;

        //Post method using the Object form a form and extracting it
        const newData = await request.formData();
        const formData = Object.fromEntries(newData);
        console.log(formData);

        const validateData = validateWithZodSchema(productSchema, formData);

        if (!id) {
          result = "Not allowed";
          redirect("/");
        }
        await db.product.update({
          where: { id: id },
          data: {
            ...validateData,
          },
        });

        break;
      } catch (error: any) {
        console.log(error);
        result = error.message;
      }
    }

    case "updatedImage": {
      try {
        const { userId } = await auth();
        if (!userId) {
          result = "Not allowed";
          redirect("/");
        }

        if (!id) {
          result = "No Id Detected for Product";
          redirect("/");
        }

        const newData = await request.formData();
        const data = Object.fromEntries(newData);

        const imageUrl = data.url as string;
        const image = data.image as File;
        console.log(image);

        //Validate Image
        const validateFile = validateWithZodSchema(imageSchema, { image });

        const fullPath = await uploadImage(validateFile.image);

        await deleteImage(imageUrl);

        await db.product.update({
          where: {
            id: id,
          },
          data: {
            image: fullPath,
          },
        });
      } catch (error: any) {
        console.log(error);
        result = error.message;
      }
    }

    case "createFavorite": {
      try {
        const { userId } = await auth();
        const id = searchParams.get("id");

        if (!id) {
          result = "Not allowed";
          break;
        }

        if (!userId) {
          result = "Not allowed";
          redirect("/");
        }

        await db.favorite.create({
          data: {
            productId: id,
            clerkId: userId,
          },
        });
      } catch (error: any) {
        console.log(error);
        result = error.message;
      }
    }
    case "deleteFavorite": {
      try {
        const favoriteId = searchParams.get("id");
        console.log("Fav Id To Delete: ", favoriteId);

        if (!favoriteId) {
          break;
        }
        await db.favorite.delete({
          where: {
            id: favoriteId,
          },
        });
      } catch (error: any) {
        console.log(error);
        result = error.message;
      }
    }
    case "createReview": {
      try {
        const { userId } = await auth();

        if (!userId) {
          return NextResponse.json({
            message: "No user active please login to create a review ",
          });
        }
        const newData = await request.formData();
        const data = Object.fromEntries(newData);

        const validateFields = validateWithZodSchema(reviewSchema, data);

        await db.review.create({
          data: { ...validateFields, clerkId: userId },
        });
      } catch (error: any) {
        console.log(error);

        return NextResponse.json(error);
      }
    }

    //Cart Api requests
    case "addToCartItems": {
      try {
        const { userId } = await auth();

        if (!userId) {
          return NextResponse.json({
            message: "no user detected to complete action",
          });
        }
        const newData = await request.formData();
        const data = Object.fromEntries(newData);
        const amount = Number(data.amount);

        const validateData = validateWithZodSchema(cartSchema, data);

        const product = await db.product.findUnique({
          where: {
            id: validateData.productId,
          },
        });

        const newCart = await fetchOrCreateCart({ userId });

        if (!newCart) {
          return NextResponse.json({
            message: "newCart not existing in the ",
          });
        }
        if (!product) {
          return NextResponse.json({
            message: "Product not existing in the data base",
          });
        }

        await updateCartOrCreateCartItem({
          productId: product.id,
          cartId: newCart.id,
          amount,
        });

        await updateCart(newCart);
      } catch (error: any) {
        console.log(error);
      }
      return NextResponse.json({ message: "Product Added to the Cart" });
    }
    case "removeCartItemAction": {
      try {
        return NextResponse.json({ message: "delete message" });
      } catch (error: any) {
        console.log(error);
      }
    }
  }

  return NextResponse.json({ message: result });
}

//For creating a new Cart instance in DB
const fetchOrCreateCart = async ({
  userId,
  errorOnFailure = false,
}: {
  userId: string;
  errorOnFailure?: boolean;
}) => {
  //Helper function 1: find existing cart that is made using the same userId
  let cart = await db.cart.findFirst({
    where: {
      clerkId: userId,
    },
    include: {
      cartItems: {
        include: {
          product: true,
        },
      },
    },
  });

  //Helper function 2: if not cart found with the userId, create this new cart to include the fetched product
  if (!cart) {
    if (errorOnFailure) {
      throw new Error("Cart not found");
    }

    return (cart = await db.cart.create({
      data: { clerkId: userId },
      include: {
        cartItems: {
          include: {
            product: true,
          },
        },
      },
    }));
  }

  return cart;
};

//For sending the Cart info to DB
const updateCartOrCreateCartItem = async ({
  productId,
  cartId,
  amount,
}: {
  productId: string;
  cartId: string;
  amount: number;
}) => {
  //fetching the existing cart to update or create
  let cartItem = await db.cartItem.findFirst({
    where: {
      productId,
      cartId,
    },
  });

  // cartItem exists ? update the amount if you add more , works for Single Page only for Cart Page different functionality
  if (cartItem) {
    cartItem = await db.cartItem.update({
      where: {
        id: cartItem.id,
      },
      data: {
        amount: cartItem.amount + amount,
      },
    });

    //No cart Item present in the cart ? add the Item to the CartItem array in the DB for Cart
  } else {
    cartItem = await db.cartItem.create({
      data: {
        amount,
        productId,
        cartId,
      },
    });
  }
};

//Update the cart at the end , Total , Shipping , Tax if existent
const updateCart = async (cart: Cart) => {
  const cartItems = await db.cartItem.findMany({
    where: {
      cartId: cart.id,
    },
    include: {
      product: true,
    },
  });

  let numItemsInCart = 0;
  let cartTotal = 0;

  for (const item of cartItems) {
    numItemsInCart += item.amount;
    cartTotal += item.amount * item.product.price;
  }

  const tax = cart.taxRate * cartTotal;
  const shippingTotal = cartTotal ? cart.shipping : 0;
  const orderTotal = cartTotal + tax + shippingTotal;

  const currentCart = await db.cart.update({
    where: {
      id: cart.id,
    },
    data: {
      numItemsInCart,
      cartTotal,
      tax,
      orderTotal,
    },
    include: {
      cartItems: {
        include: {
          product: true,
        },
      },
    },
  });

  return currentCart;
};
