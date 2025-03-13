import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { z } from "zod";
import Credentials from "next-auth/providers/credentials";
import postgres from "postgres";
import bcrypt from "bcrypt";
import { User } from "./app/lib/definitions";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User[]>`SELECT * FROM users WHERE email = ${email}`;
    return user[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          console.error("Invalid credentials", parsedCredentials.error);
          return null;
        }

        const { email, password } = parsedCredentials.data;

        const user = await getUser(email);

        if (!user) {
          console.log("User not found");
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          console.log("Password is invalid");
          return null;
        }

        return user;
      },
    }),
  ],
});
