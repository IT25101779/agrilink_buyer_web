import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { api } from "../services/api.js";
import { SkeletonGrid } from "./Skeleton.jsx";
import { staggerContainer, fadeSlideUp } from "../motion/variants.js";

// Anti-abuse redesign: this tab shows ONLY the listings THIS buyer rejected
// themselves — never a global discount feed for everyone. Rejecting never
// changes the price automatically; only the farmer can decide to lower it.
// This is just a second look, with a call button to re-discuss directly.
export default function SecondChanceSection({ showToast }) {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await api.getMySecondChance();
    if (result.success) setListings(result.data);
    else showToast(result.message || "Could not load your rejected listings.", "error");
    setIsLoading(false);
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold text-ink-900">Second Chance (mine)</h2>
        <p className="text-sm text-ink-400 mt-1">
          Listings you rejected earlier. The price hasn't moved on its own — only the farmer can choose to lower
          it. Call them to talk it through, or just keep an eye on it in case they adjust the price themselves.
        </p>
      </div>

      {isLoading ? (
        <SkeletonGrid />
      ) : listings.length === 0 ? (
        <div className="text-center py-20 text-ink-400 max-w-md mx-auto">
          You haven't rejected any listings — or the farmers haven't re-listed them yet. Anything you reject from
          the marketplace will show up here, just for you.
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {listings.map((listing) => (
            <motion.div
              key={listing._id}
              variants={fadeSlideUp}
              className="bg-white rounded-xl border border-forest-100 p-5"
            >
              <h3 className="font-display text-lg font-semibold text-ink-900">{listing.cropType}</h3>
              <p className="text-xs text-ink-400 mb-3">
                {listing.farmer?.fullName || "Farmer"} · {listing.farmer?.farmerProfile?.district || "Sri Lanka"}
              </p>
              <p className="font-mono text-xl font-semibold text-ink-900 mb-1">
                LKR {listing.currentPricePerKg}
                <span className="text-sm font-normal text-ink-400">/kg</span>
              </p>
              <p className="font-mono text-sm text-ink-700 mb-3">{listing.quantityKg} kg</p>
              {listing.myRejectionReasons && listing.myRejectionReasons.length > 0 && (
                <p className="text-xs text-clay-600 bg-clay-50 rounded-lg px-2.5 py-1.5 mb-3">
                  Your reason: {listing.myRejectionReasons[listing.myRejectionReasons.length - 1]}
                </p>
              )}
              {listing.farmer?.phone ? (
                <a
                  href={`tel:${listing.farmer.phone}`}
                  className="w-full flex items-center justify-center gap-1.5 bg-forest-600 hover:bg-forest-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  <Phone size={14} />
                  Call {listing.farmer.phone}
                </a>
              ) : (
                <span className="text-xs text-ink-400">No phone on file</span>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
