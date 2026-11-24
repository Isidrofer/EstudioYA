import MyAccount from "./my-account";

export const metadata = {
  title: "Mi cuenta",
  robots: { index: false, follow: false },
};

export default function MiCuentaPage() {
  return <MyAccount />;
}
