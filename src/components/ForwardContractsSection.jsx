import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, X, Handshake, Phone } from "lucide-react";
import { api } from "../services/api.js";
import { SkeletonGrid } from "./Skeleton.jsx";
import { staggerContainer, fadeSlideUp } from "../motion/variants.js";

const EMPTY_FORM = { cropType: "", totalQuantityKg: "", lockedPricePerKg: "", deliverByDate: "", district: "", note: "" };

// Forward / contract listings: a buyer locks in a price and quantity for a
// future harvest. Farmers "express interest" (step 1, phone shown), then a
// phone call happens, then either side confirms (step 2) — the same
// two-step, phone-first pattern used for crowdfunding pledges and lorry
// bookings. Nothing here is an automatic booking or an online payment.
export default function ForwardContractsSection({ showToast }) {
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await api.getMyForwardContracts();
    if (result.success) setContracts(result.data);
    else showToast(result.message || "Could not load your contracts.", "error");
    setIsLoading(false);
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.cropType || !form.totalQuantityKg || !form.lockedPricePerKg || !form.deliverByDate || !form.district) {
      showToast("Please fill in crop, quantity, price, delivery date and district.", "error");
      return;
    }
    setIsSubmitting(true);
    const result = await api.createForwardContract({
      cropType: form.cropType,
      totalQuantityKg: Number(form.totalQuantityKg),
      lockedPricePerKg: Number(form.lockedPricePerKg),
      deliverByDate: form.deliverByDate,
      district: form.district,
      note: form.note,
    });
    setIsSubmitting(false);
    if (result.success) {
      showToast(`Contract listed — farmers in ${form.district} can now express interest in supplying ${form.cropType}.`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } else {
      showToast(result.message || "Could not create contract.", "error");
    }
  }

  async function handleConfirmCommitment(contractId, commitmentId) {
    const result = await api.confirmForwardCommitment(contractId, commitmentId);
    if (result.success) {
      showToast("Commitment confirmed — this quantity now counts toward your contract.");
      load();
    } else {
      showToast(result.message || "Could not confirm commitment.", "error");
    }
  }

  async function handleCancel(contractId) {
    if (!confirm("Cancel this contract listing? Farmers who already committed will be notified.")) return;
    const result = await api.cancelForwardContract(contractId);
    if (result.success) {
      showToast("Contract cancelled.");
      load();
    } else {
      showToast(result.message || "Could not cancel contract.", "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink-900">Forward Contracts</h2>
          <p className="text-sm text-ink-400 mt-1">
            Lock in a price and quantity ahead of harvest. Farmers express interest, you call them to agree
            details, then confirm — no online payment, no automatic booking.
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 bg-forest-600 hover:bg-forest-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Close" : "New Contract"}
        </motion.button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleCreate}
          className="bg-white rounded-xl border border-forest-100 p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Crop type</label>
            <input
              value={form.cropType}
              onChange={(e) => setForm({ ...form, cropType: e.target.value })}
              placeholder="e.g. Carrot"
              className="w-full px-4 py-2.5 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">District</label>
            <input
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              placeholder="e.g. Nuwara Eliya"
              className="w-full px-4 py-2.5 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Total quantity (kg)</label>
            <input
              type="number"
              min="1"
              value={form.totalQuantityKg}
              onChange={(e) => setForm({ ...form, totalQuantityKg: e.target.value })}
              placeholder="e.g. 500"
              className="w-full px-4 py-2.5 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Locked price (LKR/kg)</label>
            <input
              type="number"
              min="1"
              value={form.lockedPricePerKg}
              onChange={(e) => setForm({ ...form, lockedPricePerKg: e.target.value })}
              placeholder="e.g. 120"
              className="w-full px-4 py-2.5 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Deliver by</label>
            <input
              type="date"
              value={form.deliverByDate}
              onChange={(e) => setForm({ ...form, deliverByDate: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Note (optional)</label>
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="e.g. Grade A only"
              className="w-full px-4 py-2.5 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>
          <div className="md:col-span-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-forest-600 hover:bg-forest-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Listing…" : "List Contract"}
            </motion.button>
          </div>
        </motion.form>
      )}

      {isLoading ? (
        <SkeletonGrid />
      ) : contracts.length === 0 ? (
        <div className="text-center py-20 text-ink-400 max-w-md mx-auto">
          You haven't listed any forward contracts yet. Create one above to let farmers commit to supplying you
          ahead of harvest at a price you both agree on.
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {contracts.map((c) => (
            <motion.div key={c._id} variants={fadeSlideUp} className="bg-white rounded-xl border border-forest-100 p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink-900 flex items-center gap-1.5">
                    <Handshake size={16} className="text-forest-600" />
                    {c.cropType}
                  </h3>
                  <p className="text-xs text-ink-400 mt-0.5">{c.district}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide bg-forest-50 text-forest-600 capitalize">
                  {c.status}
                </span>
              </div>
              <p className="font-mono text-sm text-ink-700 mb-1">
                LKR {c.lockedPricePerKg}/kg · {c.committedKg || 0}/{c.totalQuantityKg} kg committed
              </p>
              <p className="text-xs text-ink-400 mb-3">Deliver by {new Date(c.deliverByDate).toLocaleDateString()}</p>

              {c.commitments && c.commitments.length > 0 && (
                <div className="space-y-2 mb-3">
                  {c.commitments.map((cm) => (
                    <div key={cm._id} className="flex items-center justify-between bg-forest-50/60 rounded-lg px-3 py-2">
                      <div className="text-xs">
                        <p className="font-medium text-ink-700">{cm.farmer?.fullName || "Farmer"} · {cm.quantityKg}kg</p>
                        <p className="capitalize text-ink-400">{cm.status}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {cm.status === "interested" && cm.farmer?.phone && (
                          <a href={`tel:${cm.farmer.phone}`} className="text-forest-600" title={`Call ${cm.farmer.phone}`}>
                            <Phone size={14} />
                          </a>
                        )}
                        {cm.status === "interested" ? (
                          <button
                            onClick={() => handleConfirmCommitment(c._id, cm._id)}
                            className="text-xs font-medium text-white bg-forest-600 hover:bg-forest-700 rounded-lg px-2.5 py-1 transition-colors"
                          >
                            Confirm
                          </button>
                        ) : (
                          <span className="text-xs text-forest-600 font-medium capitalize">{cm.status}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {c.status === "open" && (
                <button
                  onClick={() => handleCancel(c._id)}
                  className="text-xs font-medium text-clay-600 border border-clay-200 hover:bg-clay-50 rounded-lg px-3 py-1.5 transition-colors"
                >
                  Cancel contract
                </button>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
