import { z } from "zod";

export const registerSchema = z
  .object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    documentType: z.string().min(1),
    documentNumber: z.string().min(4),
    email: z.string().email(),
    phone: z.string().min(7),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contrasenas no coinciden",
  });
