import { SectionTitle } from "@/components/ui";
import { CheckinScanner } from "./CheckinScanner";

export default function CheckinPage() {
  return (
    <div>
      <SectionTitle title="当日受付（QRチェックイン）" description="利用者が提示するQRコードを読み取り、来場確認を行います。" />
      <CheckinScanner />
    </div>
  );
}
