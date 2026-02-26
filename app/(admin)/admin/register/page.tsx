import { redirect } from "next/navigation";

export default function AdminRegisterPage() {
  redirect("/admin?tab=register");
}
