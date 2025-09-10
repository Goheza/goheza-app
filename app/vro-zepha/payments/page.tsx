'use client'

import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { confirmAction } from '@/components/admin/Confirm'

type Payout = {
  id: string
  creator_id: string
  campaign_id: string | null
  amount_cents: number
  currency: string
  status: string
  note: string | null
  created_at: string
}

type Deposit = {
  id: string
  brand_user_id: string
  amount_cents: number
  currency: string
  status: string
  txn_ref: string | null
  received_at: string | null
}

export default function AdminPayments() {
  const [pending, setPending] = useState<Payout[]>([])
  const [approved, setApproved] = useState<Payout[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [{ data: pPending }, { data: pApproved }, { data: dep }] = await Promise.all([
      supabaseClient
        .from('creator_payouts')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabaseClient
        .from('creator_payouts')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false }),
      supabaseClient.from('brand_deposits').select('*').order('received_at', { ascending: false }),
    ])
    setPending((pPending as Payout[]) || [])
    setApproved((pApproved as Payout[]) || [])
    setDeposits((dep as Deposit[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const approve = async (id: string) => {
    const ok = await confirmAction('Approve this payout?')
    if (!ok) return
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()
    await supabaseClient
      .from('creator_payouts')
      .update({
        status: 'approved',
        approved_by: user?.id ?? null,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)
    await load()
  }

  const markPaid = async (id: string) => {
    const ok = await confirmAction('Mark this payout as paid?')
    if (!ok) return
    await supabaseClient
      .from('creator_payouts')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', id)
    await load()
  }

  const generateInvoice = (payout: Payout) => {
    const invoiceWindow = window.open("", "_blank")
    if (!invoiceWindow) return

    const amount = (payout.amount_cents / 100).toFixed(2)
    const date = new Date().toLocaleDateString()
    const html = `
      <html>
        <head>
          <title>Invoice</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { text-align: center; }
            .invoice-box { max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <h1>Invoice</h1>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Invoice To:</strong> Brand for Campaign ${payout.campaign_id || '-'}</p>
            <p><strong>Creator ID:</strong> ${payout.creator_id}</p>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Payout for Campaign ${payout.campaign_id || '-'}</td>
                  <td>${payout.currency} ${amount}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th>Total</th>
                  <th>${payout.currency} ${amount}</th>
                </tr>
              </tfoot>
            </table>

            <p>Note: ${payout.note || 'N/A'}</p>
          </div>
        </body>
      </html>
    `
    invoiceWindow.document.write(html)
    invoiceWindow.document.close()
    invoiceWindow.print()
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Payments</h1>

      {/* Payouts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b font-semibold">Creator Payouts – Pending</div>
          <ul>
            {loading ? (
              <li className="p-4 text-gray-600">Loading…</li>
            ) : pending.length === 0 ? (
              <li className="p-4 text-gray-600">No pending payouts.</li>
            ) : (
              pending.map((p) => (
                <li key={p.id} className="p-4 border-t flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      ${(p.amount_cents / 100).toFixed(2)} {p.currency}
                    </div>
                    <div className="text-sm text-gray-600">
                      Creator: {p.creator_id} • Campaign: {p.campaign_id || '-'}
                    </div>
                  </div>
                  <button
                    onClick={() => approve(p.id)}
                    className="px-3 py-2 rounded-lg text-white"
                    style={{ backgroundColor: '#E66262' }}
                  >
                    Approve
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b font-semibold">Creator Payouts – Approved</div>
          <ul>
            {approved.length === 0 ? (
              <li className="p-4 text-gray-600">No approved payouts.</li>
            ) : (
              approved.map((p) => (
                <li key={p.id} className="p-4 border-t flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      ${(p.amount_cents / 100).toFixed(2)} {p.currency}
                    </div>
                    <div className="text-sm text-gray-600">
                      Creator: {p.creator_id} • Campaign: {p.campaign_id || '-'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => markPaid(p.id)} className="px-3 py-2 rounded-lg border">
                      Mark Paid
                    </button>
                    <button
                      onClick={() => generateInvoice(p)}
                      className="px-3 py-2 rounded-lg border bg-blue-600 text-white"
                    >
                      Generate Invoice
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Deposits */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b font-semibold">Brand Deposits</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Brand</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Ref</th>
                <th className="px-4 py-3 text-left">Received</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="px-4 py-3">{d.brand_user_id}</td>
                  <td className="px-4 py-3">
                    ${(d.amount_cents / 100).toFixed(2)} {d.currency}
                  </td>
                  <td className="px-4 py-3 capitalize">{d.status}</td>
                  <td className="px-4 py-3">{d.txn_ref || '-'}</td>
                  <td className="px-4 py-3">
                    {d.received_at ? new Date(d.received_at).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
              {deposits.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-gray-600" colSpan={5}>
                    No deposits recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
