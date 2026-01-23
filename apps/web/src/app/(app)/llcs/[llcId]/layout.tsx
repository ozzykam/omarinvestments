import { ReactNode } from 'react';

interface LlcLayoutProps {
  children: ReactNode;
  params: Promise<{ llcId: string }>;
}

export default async function LlcLayout({ children, params }: LlcLayoutProps) {
  const { llcId } = await params;

  return (
    <div>
      {/* TODO: LLC-scoped sidebar with sections:
          - Properties
          - Tenants
          - Billing
          - Payments
          - Legal
          - Work Orders
          - Accounting
      */}
      <div className="mb-4 text-sm text-muted-foreground">LLC: {llcId}</div>
      {children}
    </div>
  );
}
