"use server";

import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export type State = {
  message?: string | null;
  errors?: { customerId?: string[]; amount?: string[]; status?: string[] };
};

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    message: "Please select a customer.",
  }),
  amount: z.coerce.number().gt(0, {
    message: "Amount must be greater than 0.",
  }),
  status: z.enum(["pending", "paid"], {
    message: "Please select a status.",
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing fields. Failed to create Invoice",
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  try {
    await sql`
     INSERT INTO invoices (customer_id, amount, status, date)
     VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
     ON CONFLICT (id) DO NOTHING;
   `;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create invoice.");
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(
  prevState: State,
  id: string,
  formData: FormData
) {
  const validatedFields = UpdateInvoice.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing fields. Failed to update Invoice",
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
     UPDATE invoices
     SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
     WHERE id = ${id};
   `;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update invoice.");
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  try {
    await sql`
      DELETE FROM invoices
      WHERE id = ${id};
    `;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to delete invoice.");
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}
