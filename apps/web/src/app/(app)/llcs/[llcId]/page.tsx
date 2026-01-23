interface LlcDashboardProps {
  params: Promise<{ llcId: string }>;
}

export default async function LlcDashboardPage({ params }: LlcDashboardProps) {
  const { llcId } = await params;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">LLC Dashboard</h1>
      {/* TODO: Stats cards:
          - Total properties
          - Active leases
          - Outstanding balance
          - Open legal cases
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground">Properties</div>
          <div className="text-2xl font-bold">--</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground">Active Leases</div>
          <div className="text-2xl font-bold">--</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground">Outstanding Balance</div>
          <div className="text-2xl font-bold">$--</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground">Open Cases</div>
          <div className="text-2xl font-bold">--</div>
        </div>
      </div>
    </div>
  );
}
