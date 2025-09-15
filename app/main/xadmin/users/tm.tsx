// inside AdminDashboard component (client)
// helper to call server invoice API
async function createInvoiceForCampaign(campaign: { id: string; name: string; payout?: string; budget?: string }) {
  try {
    const amount = campaign.budget ? parseFloat(String(campaign.budget).replace(/[^0-9.-]+/g, '')) : 0
    const invoiceNumber = `INV-${Date.now()}`

    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoiceNumber,
        campaignId: campaign.id,
        brandId: campaign.created_by,
        amount,
        currency: 'USD',
        dueDate: null,
        notes: `Invoice for campaign ${campaign.name}`,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error(data)
      alert('Failed to create invoice: ' + (data.error || 'unknown'))
      return
    }

    // data.pdf_url may be null if bucket is private
    alert('Invoice created — PDF URL: ' + (data.pdf_url || 'private (signed urls required)'))
    // Optionally open new tab
    if (data.pdf_url) window.open(data.pdf_url, '_blank')
  } catch (err) {
    console.error(err)
    alert('Failed to create invoice')
  }
}
