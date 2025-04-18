"use server";
import { Button } from "@/components/ui/button";
import { faker } from "@faker-js/faker";
import FormInput from "@/components/form/FormInput";
import FormContainer from "@/components/form/FormContainer";
import PriceInput from "@/components/form/PriceInput";
import ImageInput from "@/components/form/ImageInput";
import TextAreaInput from "@/components/form/TextAreaInput";
import CheckboxInput from "@/components/form/CheckboxInput";
import SubmitButton from "@/components/form/Buttons";
import { Suspense } from "react";
import LoadingTable from "@/components/global/LoadingTable";

function CreateProductPage() {
  const name = faker.commerce.productName();
  const company = faker.company.name();
  const description = faker.lorem.paragraph({ min: 10, max: 12 });
  return (
    <Suspense fallback={<LoadingTable rows={10} />}>
      <section>
        <h1 className="text-2xl font-semibold mb-8 capitalize">
          create product
        </h1>
        <div className="border p-8 rounded-md bg-primary-foreground">
          <FormContainer type="create">
            <div className="grid gap-4 md:grid-cols-2 my-4">
              <FormInput
                type="text"
                name="name"
                label="product name"
                defaultValue={name}
              />
              <FormInput
                type="text"
                name="company"
                label="company"
                defaultValue={company}
              />
              <PriceInput />
              <ImageInput />
            </div>
            <TextAreaInput
              name="description"
              labelText="product description"
              defaultValue={description}
            />
            <div>
              <CheckboxInput name="featured" label="featured" />
            </div>
            <SubmitButton
              text="create product"
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
            />
          </FormContainer>
        </div>
      </section>
    </Suspense>
  );
}
export default CreateProductPage;
