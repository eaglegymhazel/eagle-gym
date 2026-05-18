import { redirect } from "next/navigation";

export default function AdminSummerCampRegisterPage() {
  redirect("/admin?tab=summer-camp-register");
}
