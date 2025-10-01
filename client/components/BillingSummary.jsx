// client/components/BillingSummary.jsx
import React from "react";

export default function BillingSummary({ totalBilling, totalBreakdown, billedEvents }) {
  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Billing summary</h3>

      <div className="mb-3">
        <div className="text-sm text-gray-600">Session total</div>
        <div className="text-2xl font-bold">${(totalBilling || 0).toFixed(6)}</div>
      </div>

      <div className="text-sm mb-2 font-medium">Accumulated breakdown</div>
      <div className="text-xs text-gray-700 mb-3">
        <div>in_text: ${totalBreakdown.costInText?.toFixed(6) ?? "0.000000"}</div>
        <div>in_audio: ${totalBreakdown.costInAudio?.toFixed(6) ?? "0.000000"}</div>
        <div>cached: ${totalBreakdown.costCached?.toFixed(6) ?? "0.000000"}</div>
        <div>out_text: ${totalBreakdown.costOutText?.toFixed(6) ?? "0.000000"}</div>
        <div>out_audio: ${totalBreakdown.costOutAudio?.toFixed(6) ?? "0.000000"}</div>
      </div>

      <div className="text-sm mb-2 font-medium">Recent billed events</div>
      <div className="text-xs max-h-48 overflow-y-auto">
        {billedEvents && billedEvents.length > 0 ? (
          billedEvents.map((ev) => (
            <div key={ev.event_id || ev.response?.id} className="border-b py-2">
              <div className="text-xs text-gray-600">{ev.timestamp || "—"}</div>
              <div className="text-sm">
                ${ev.billing.total.toFixed(6)} — <span className="text-gray-700">{ev.type}</span>
              </div>
              <div className="text-xs text-gray-500">
                tokens: in_text={ev.billing.tokens.inputText}, in_audio={ev.billing.tokens.inputAudio}, out_text={ev.billing.tokens.outputText}, out_audio={ev.billing.tokens.outputAudio}
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500">No billed events yet</div>
        )}
      </div>
    </div>
  );
}
