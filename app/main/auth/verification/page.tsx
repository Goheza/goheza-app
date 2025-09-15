// app/main/auth/verification/page.tsx

import VerificationNotice from "@/components/components/main/auth/verification-notice";

export default function VerificationPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {


  
  return <VerificationNotice email={searchParams.email} />;
}
