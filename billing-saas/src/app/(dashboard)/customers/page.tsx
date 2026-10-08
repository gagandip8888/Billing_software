import { Users, Plus, Search } from "lucide-react";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers (Khata)</h1>
          <p className="text-sm text-slate-500">Manage customer contacts, outstanding balances & history</p>
        </div>
        <button disabled className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-xs font-semibold text-white opacity-60">
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
        <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
        <h3 className="font-bold text-slate-700">Customer Directory Ready</h3>
        <p className="text-xs text-slate-500 mt-1">
          Udhar/Khata tracking and customer loyalty will be activated in the next step.
        </p>
      </div>
    </div>
  );
}
