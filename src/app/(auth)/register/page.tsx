import type { Metadata } from "next";
import AuthForm from "../AuthForm";

export const metadata: Metadata = {
  title: "Реєстрація",
};

export default function RegisterPage() {
  return <AuthForm signup />;
}
