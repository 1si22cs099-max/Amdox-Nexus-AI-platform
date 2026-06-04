import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { InventoryItem, Vendor, PurchaseOrder } from '../types';
import { 
  Package, Truck, Plus, CheckCircle, RefreshCw, AlertCircle, ShoppingCart, 
  Settings, DollarSign, ExternalLink, ShieldCheck, HelpCircle
} from 'lucide-react';

export default function InventoryModule() {
  const { apiFetch, user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // New item form state
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState({
    sku: '',
    name: '',
    description: '',
    category: 'Semiconductors',
    unit: 'pcs',
    quantityInStock: '50',
    minThreshold: '20',
    costPrice: '10',
    sellingPrice: '15',
    vendorId: ''
  });

  // New vendor form state
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    contactEmail: '',
    contactPhone: '',
    address: ''
  });

  // Reorder template states
  const [showReorderForm, setShowReorderForm] = useState(false);
  const [reorderParams, setReorderParams] = useState({
    vendorId: '',
    itemSku: '',
    qty: '100',
    unitPrice: '10'
  });

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      const [invData, vndData, poData] = await Promise.all([
        apiFetch('/api/inventory'),
        apiFetch('/api/vendors'),
        apiFetch('/api/inventory/purchase-orders')
      ]);
      setInventory(invData);
      setVendors(vndData);
      setPos(poData);
      
      // Select default vendor / item for forms
      if (vndData.length > 0 && invData.length > 0) {
        setItemForm(prev => ({ ...prev, vendorId: vndData[0].id }));
        setReorderParams(prev => ({
          ...prev,
          vendorId: vndData[0].id,
          itemSku: invData[0].sku,
          unitPrice: invData[0].costPrice.toString()
        }));
      }
    } catch (err) {
      console.error('Failed loading supply chain databases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.sku || !itemForm.name || !itemForm.vendorId) {
      alert('Provide SKU, item name and supplier selection.');
      return;
    }
    try {
      await apiFetch('/api/inventory', {
        method: 'POST',
        body: JSON.stringify(itemForm)
      });
      setShowItemForm(false);
      loadInventoryData();
    } catch (err: any) {
      alert(err.message || 'Product cataloging failed.');
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.name || !vendorForm.contactEmail) {
      alert('Provide supplier name and email account.');
      return;
    }
    try {
      await apiFetch('/api/vendors', {
        method: 'POST',
        body: JSON.stringify(vendorForm)
      });
      setShowVendorForm(false);
      loadInventoryData();
    } catch (err: any) {
      alert(err.message || 'Vendor onboarding failed.');
    }
  };

  const handlePlaceReplenishPO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reorderParams.vendorId || !reorderParams.itemSku || !reorderParams.qty) {
      alert('Fill in replenishment quantity, item sku and vendor parameters.');
      return;
    }
    try {
      await apiFetch('/api/inventory/purchase-orders', {
        method: 'POST',
        body: JSON.stringify({
          vendorId: reorderParams.vendorId,
          items: [{
            itemSku: reorderParams.itemSku,
            qty: Number(reorderParams.qty),
            unitPrice: Number(reorderParams.unitPrice)
          }],
          expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      });
      alert('Purchase Order initiated. Supplier mail queued on background.');
      setShowReorderForm(false);
      loadInventoryData();
    } catch (err: any) {
      alert(err.message || 'Failed dispatching replenishment order.');
    }
  };

  const handleApprovePO = async (poId: string) => {
    if (!window.confirm('Mark this purchase layout completed and received? This instantly increments physical warehouse registers and decodes credit disbursements under Materials Ledger.')) {
      return;
    }
    try {
      await apiFetch(`/api/inventory/purchase-orders/${poId}/approve`, {
        method: 'POST'
      });
      alert('Warehouse replenishment logged. Ledger sheets debited.');
      loadInventoryData();
    } catch (err: any) {
      alert(err.message || 'Approval processing failed.');
    }
  };

  const handleItemSkuChange = (sku: string) => {
    const targetItem = inventory.find(i => i.sku === sku);
    if (targetItem) {
      setReorderParams({
        ...reorderParams,
        itemSku: sku,
        unitPrice: targetItem.costPrice.toString()
      });
    }
  };

  const isWarehouseStaff = ['super_admin', 'tenant_admin', 'supply_chain_manager'].includes(user?.role || '');

  if (!isWarehouseStaff) {
    return (
      <div className="bg-red-50/50 border border-red-100 p-6 rounded-2xl max-w-xl mx-auto text-center space-y-4 my-8">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto stroke-[1.5]" />
        <h3 className="text-base font-semibold text-red-950 font-sans">Warehouse Clearance Restricted</h3>
        <p className="text-sm text-red-700 leading-relaxed font-sans">
          Stock tracking and supplier logistics queues are restricted to **Tenant Admins** and **Supply Chain Managers** access clearances.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-sans font-medium text-gray-900 tracking-tight flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-600" />
            Supply Chain & Warehouse Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">Audit warehouse registers, organize vendor communications, and track replenishment purchase orders.</p>
        </div>
        <button
          onClick={loadInventoryData}
          className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg"
        >
          <RefreshCw className="h-3 w-3" /> Refresh Registers
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-7 w-7 border-3 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Main Controls row */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => { setShowItemForm(!showItemForm); setShowVendorForm(false); setShowReorderForm(false); }}
              className="px-3.5 py-2 text-xs bg-indigo-900 font-medium hover:bg-indigo-800 text-white rounded-lg transition"
            >
              + Catalog Product item
            </button>
            <button
              onClick={() => { setShowVendorForm(!showVendorForm); setShowItemForm(false); setShowReorderForm(false); }}
              className="px-3.5 py-2 text-xs text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition"
            >
              + Register Supplier Vendor
            </button>
            <button
              onClick={() => { setShowReorderForm(!showReorderForm); setShowItemForm(false); setShowVendorForm(false); }}
              className="px-3.5 py-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-lg font-medium transition"
            >
              Trigger Replenishment PO
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              {/* Product catalog form overlay */}
              {showItemForm && (
                <form onSubmit={handleCreateItem} className="bg-dashed bg-gray-50/60 p-5 border border-gray-200 rounded-2xl space-y-4 animate-fade-in">
                  <h4 className="text-xs font-mono font-bold text-indigo-950 uppercase">Product Specifications Blueprint</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase">SKU Code</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. SKU-CH-90"
                        className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                        value={itemForm.sku}
                        onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Product Name</label>
                      <input
                        type="text"
                        required
                        placeholder="AX Module"
                        className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                        value={itemForm.name}
                        onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Asset Category</label>
                      <select
                        className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200 mt-1"
                        value={itemForm.category}
                        onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                      >
                        <option value="Semiconductors">Semiconductors</option>
                        <option value="Electronics">Electronics Board</option>
                        <option value="Passive Components">Passive Components</option>
                        <option value="Raw Materials">Raw Materials</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Quantity In Stock</label>
                      <input
                        type="number"
                        required
                        className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                        value={itemForm.quantityInStock}
                        onChange={(e) => setItemForm({ ...itemForm, quantityInStock: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Safety Threshold</label>
                      <input
                        type="number"
                        className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                        value={itemForm.minThreshold}
                        onChange={(e) => setItemForm({ ...itemForm, minThreshold: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Cost Price ($)</label>
                      <input
                        type="number"
                        required
                        className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                        value={itemForm.costPrice}
                        onChange={(e) => setItemForm({ ...itemForm, costPrice: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Selling Price ($)</label>
                      <input
                        type="number"
                        required
                        className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                        value={itemForm.sellingPrice}
                        onChange={(e) => setItemForm({ ...itemForm, sellingPrice: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Assigned Vendor</label>
                      <select
                        className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                        value={itemForm.vendorId}
                        onChange={(e) => setItemForm({ ...itemForm, vendorId: e.target.value })}
                        required
                      >
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Unit of Measure</label>
                      <input
                        type="text"
                        className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                        value={itemForm.unit}
                        onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-950 hover:bg-slate-800 text-white text-xs font-mono font-bold uppercase rounded-lg"
                  >
                    Commit catalog Entry
                  </button>
                </form>
              )}

              {/* Vendor catalog form overlay */}
              {showVendorForm && (
                <form onSubmit={handleCreateVendor} className="bg-dashed bg-gray-50/60 p-5 border border-gray-200 rounded-2xl space-y-4 animate-fade-in">
                  <h4 className="text-xs font-mono font-bold text-indigo-950 uppercase">Supplier Registration Profile</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Vendor Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Acme Tech supply"
                        className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                        value={vendorForm.name}
                        onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Contact Email</label>
                      <input
                        type="email"
                        required
                        placeholder="orders@acmetech.com"
                        className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                        value={vendorForm.contactEmail}
                        onChange={(e) => setVendorForm({ ...vendorForm, contactEmail: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Contact Phone</label>
                      <input
                        type="text"
                        placeholder="+1-555-4089"
                        className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                        value={vendorForm.contactPhone}
                        onChange={(e) => setVendorForm({ ...vendorForm, contactPhone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-gray-500 uppercase">Physical Address</label>
                    <input
                      type="text"
                      className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200"
                      value={vendorForm.address}
                      onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="w-full py-2 bg-indigo-950 hover:bg-slate-800 text-white text-xs font-mono font-bold uppercase rounded-lg">Onboard Vendor</button>
                </form>
              )}

              {/* Replenish purchase order form overlay */}
              {showReorderForm && (
                <form onSubmit={handlePlaceReplenishPO} className="bg-dashed bg-indigo-50/50 p-5 border border-indigo-200 rounded-2xl space-y-4 animate-fade-in">
                  <h4 className="text-xs font-mono font-bold text-indigo-900 uppercase">Replenish Purchase Order layout</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-indigo-900 uppercase">Target SKU</label>
                      <select
                        className="w-full text-xs p-2 rounded-lg bg-white border border-indigo-200"
                        value={reorderParams.itemSku}
                        onChange={(e) => handleItemSkuChange(e.target.value)}
                        required
                      >
                        {inventory.map(i => <option key={i.id} value={i.sku}>{i.sku} ({i.name})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-indigo-900 uppercase">Target Supplier</label>
                      <select
                        className="w-full text-xs p-2 rounded-lg bg-white border border-indigo-200"
                        value={reorderParams.vendorId}
                        onChange={(e) => setReorderParams({ ...reorderParams, vendorId: e.target.value })}
                        required
                      >
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-indigo-900 uppercase">Quantity</label>
                      <input
                        type="number"
                        className="w-full text-xs p-2 rounded-lg bg-white border border-indigo-200"
                        value={reorderParams.qty}
                        onChange={(e) => setReorderParams({ ...reorderParams, qty: e.target.value })}
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-indigo-900 uppercase">Unit Cost ($)</label>
                      <input
                        type="number"
                        className="w-full text-xs p-2 rounded-lg bg-white border border-indigo-200"
                        value={reorderParams.unitPrice}
                        onChange={(e) => setReorderParams({ ...reorderParams, unitPrice: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2 bg-indigo-900 hover:bg-indigo-850 text-white text-xs font-mono font-bold uppercase rounded-lg">Submit Procurement Queue</button>
                </form>
              )}

              {/* Warehouse Table */}
              <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-semibold text-gray-950 font-sans">Physical Warehouse Inventory</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead>
                      <tr className="border-b uppercase font-mono text-gray-400">
                        <th className="py-2.5">SKU / Product</th>
                        <th>Category</th>
                        <th>warehouse registers</th>
                        <th>Finances</th>
                        <th>Margin</th>
                        <th className="text-right">Risk Factor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-sans">
                      {inventory.map(item => {
                        const isUnderThreshold = item.quantityInStock < item.minThreshold;
                        const grossMargin = item.sellingPrice - item.costPrice;
                        const marginPercent = ((grossMargin / item.sellingPrice) * 100).toFixed(0);
                        return (
                          <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="py-3">
                              <div className="font-mono font-semibold text-gray-900">{item.sku}</div>
                              <div className="font-medium text-gray-600 font-sans text-xs">{item.name}</div>
                              {item.description && <p className="text-[10px] text-gray-400 truncate max-w-xs">{item.description}</p>}
                            </td>
                            <td><span className="font-medium">{item.category}</span></td>
                            <td className="font-mono">
                              <div className="font-semibold text-gray-900 text-[13px]">{item.quantityInStock} {item.unit}</div>
                              <div className="text-[10px] text-gray-400">Threshold: {item.minThreshold}</div>
                            </td>
                            <td className="font-mono text-[11px]">
                              <div>Cost: <span className="text-gray-900 font-medium">${item.costPrice}</span></div>
                              <div>Selling: <span className="text-indigo-600 font-medium">${item.sellingPrice}</span></div>
                            </td>
                            <td className="font-mono">
                              <span className="font-medium text-emerald-600">+${grossMargin}</span>
                              <div className="text-[9px] text-gray-400">{marginPercent}% markup</div>
                            </td>
                            <td className="text-right py-3.5">
                              {isUnderThreshold ? (
                                <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] px-2.5 py-0.5 rounded font-mono font-semibold">
                                  CRITICAL LOW STOCK
                                </span>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] px-2.5 py-0.5 rounded font-mono font-bold">
                                  SAFETY SECURE
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Box: Supplier Purchase Orders workflow */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-base font-semibold text-gray-950 font-sans">Supplier Purchase Orders</h3>
                
                <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                  {pos.map(po => {
                    const vendor = vendors.find(v => v.id === po.vendorId);
                    return (
                      <div 
                        key={po.id}
                        className="bg-slate-50 border border-gray-150 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-xs text-indigo-900">{po.poNumber}</span>
                          <span className={`px-2 py-0.5 text-[9px] font-mono rounded uppercase tracking-wide ${
                            po.status === 'completed' 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                              : 'bg-indigo-50 text-indigo-600 border border-indigo-200 animate-pulse'
                          }`}>
                            {po.status}
                          </span>
                        </div>

                        <div className="text-xs">
                          <div className="font-semibold text-gray-800">{vendor ? vendor.name : 'Apex Chips'}</div>
                          <div className="text-gray-400 text-[10px] font-mono mt-0.5">Ordered: {po.orderDate} | Due: {po.expectedDate}</div>
                        </div>

                        {/* List PO items */}
                        <div className="border-t border-b border-gray-100 py-2 space-y-1 text-[10px] text-gray-500 font-mono">
                          {po.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>SKU: {it.itemSku} (x{it.qty})</span>
                              <span className="text-gray-900 font-medium">${it.total.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center pt-1">
                          <span className="text-xs font-semibold text-slate-800">Payout Value:</span>
                          <span className="text-sm font-bold font-mono text-indigo-900">${po.totalAmount.toLocaleString()}</span>
                        </div>

                        {po.status !== 'completed' && (
                          <button
                            onClick={() => handleApprovePO(po.id)}
                            className="w-full mt-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 transition text-white text-xs font-mono font-medium rounded-lg inline-flex items-center justify-center gap-1.5"
                          >
                            <ShieldCheck className="h-4 w-4" /> Receive & Appraise Stock
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
