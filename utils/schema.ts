import { z, ZodSchema } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters!",
    })
    .max(50, {
      message: "Name must be less than 50 characters!",
    }),
  company: z.string(),
  featured: z.coerce.boolean(),
  price: z.coerce.number().int().min(0, {
    message: "Price must be a positive number!",
  }),
  description: z.string().refine(
    (description) => {
      const wordCount = description.split(" ").length;
      return wordCount >= 5 && wordCount <= 300;
    },
    {
      message: "Description must be between 5 and 300 words!",
    }
  ),
});

export const cartSchema = z.object({
  productId: z.string(),
  amount: z.string(),
});

export const reviewSchema = z.object({
  productId: z.string().refine((value) => value !== "", {
    message: "Product Id cannot be empty",
  }),
  authorName: z.string().refine((value) => value !== "", {
    message: "Author Name cannot be empty",
  }),
  authorImageUrl: z.string().refine((value) => value !== "", {
    message: " Author Image cannot be empty",
  }),
  comment: z
    .string()
    .min(10, { message: "Comment must be at least 10 characters long" })
    .max(1000, { message: "Comment must be at most 1000 characters long" }),
  rating: z.coerce
    .number()
    .int()
    .min(1, { message: "Rating must be at least 1" })
    .max(5, { message: "Rating must be at most 5" }),
});

export const imageSchema = z.object({
  image: validateImageFile(),
});

function validateImageFile() {
  const maxUploadSize = 1024 * 1024;
  const acceptedFileType = ["image/"];

  return z
    .instanceof(File)
    .refine((file) => {
      return !file || file.size <= maxUploadSize;
    }, "File size must be less than 1MB")
    .refine((file) => {
      return (
        !file || acceptedFileType.some((type) => file.type.startsWith(type))
      );
    }, "File is not of type image");
}

export function validateWithZodSchema<T>(
  schema: ZodSchema<T>,
  data: unknown
): T {
  const response = schema.safeParse(data);
  if (!response.success) {
    const error = response.error.errors.map((item) => item.message);

    console.log("This is the error ", response.error.errors);

    throw new Error(error.join("\n"));
  }

  return response.data;
}
