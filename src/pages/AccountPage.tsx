import { Account } from "../components/Account";
import { DeleteAccount } from "../components/DeleteAccount";
import { ui } from "../components/ui";

export function AccountPage() {
  return (
    <div className={ui.page}>
      <h1 className={ui.title}>Me</h1>
      <Account startOpen />
      <DeleteAccount />
    </div>
  );
}
