// app/api/invoices/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import PDFDocument from 'pdfkit'
import { supabaseClient } from '@/lib/supabase/client'

const supabaseAdmin = supabaseClient;

type ReqBody = {
    invoiceNumber: string
    campaignId?: string | null
    brandId?: string | null
    creatorId?: string | null
    amount: number
    currency?: string
    dueDate?: string | null // ISO string
    notes?: string | null
}

// Helper: create PDF buffer using pdfkit
async function generateInvoicePdfBuffer(payload: ReqBody & { issuedAt: string }) {
    return new Promise<Buffer>((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 })
            const chunks: Buffer[] = []

            doc.on('data', (chunk: Buffer<ArrayBufferLike>) => chunks.push(chunk))
            doc.on('end', () => resolve(Buffer.concat(chunks)))
            doc.on('error', (err: any) => reject(err))

            // --- PDF content (simple, tweak to taste) ---
            doc.fontSize(20).text('INVOICE', { align: 'right' })
            doc.moveDown()

            doc.fontSize(12)
            doc.text(`Invoice #: ${payload.invoiceNumber}`)
            doc.text(`Issued: ${new Date(payload.issuedAt).toLocaleString()}`)
            if (payload.dueDate) doc.text(`Due: ${new Date(payload.dueDate).toLocaleDateString()}`)
            doc.moveDown()

            doc.fontSize(14).text('Bill to', { underline: true })
            if (payload.brandId) doc.text(`Brand ID: ${payload.brandId}`)
            if (payload.creatorId) doc.text(`Creator ID: ${payload.creatorId}`)
            doc.moveDown()

            doc.fontSize(12).text('Details:', { underline: true })
            doc.text(`Campaign ID: ${payload.campaignId || '—'}`)
            doc.text(`Notes: ${payload.notes || '—'}`)
            doc.moveDown()

            doc.fontSize(14).text('Amount', { underline: true })
            doc.text(`${payload.currency || 'USD'} ${payload.amount.toFixed(2)}`)
            doc.moveDown(2)

            doc.fontSize(10).text('Thank you for using Goheza.', { align: 'center' })

            doc.end()
        } catch (err) {
            reject(err)
        }
    })
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as ReqBody
        if (!body.invoiceNumber || !body.amount) {
            return NextResponse.json({ error: 'invoiceNumber and amount required' }, { status: 400 })
        }

        const issuedAt = new Date().toISOString()
        const pdfBuffer = await generateInvoicePdfBuffer({ ...body, issuedAt })

        // create invoice DB record first to reserve an id and path
        const { data: inserted, error: insertErr } = await supabaseAdmin
            .from('invoices')
            .insert({
                invoice_number: body.invoiceNumber,
                campaign_id: body.campaignId || null,
                brand_id: body.brandId || null,
                creator_id: body.creatorId || null,
                amount: body.amount,
                currency: body.currency || 'USD',
                status: 'unpaid',
                issued_at: issuedAt,
                due_date: body.dueDate ? new Date(body.dueDate).toISOString() : null,
                notes: body.notes || null,
            })
            .select('id')
            .single()

        if (insertErr || !inserted) {
            console.error('Error inserting invoice row', insertErr)
            return NextResponse.json({ error: 'Failed to create invoice record' }, { status: 500 })
        }

        const invoiceId = inserted.id as string
        const filePath = `invoices/${invoiceId}.pdf`

        // Upload PDF buffer to storage (bucket name "invoices")
        const { error: uploadErr } = await supabaseAdmin.storage.from('invoices').upload(filePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true,
        })

        if (uploadErr) {
            console.error('Storage upload error', uploadErr)
            // rollback DB row? optional. We'll return error.
            return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 })
        }

        // Make a public URL (or create signed URL if your bucket is private)
        const { data: publicUrlData } = supabaseAdmin.storage.from('invoices').getPublicUrl(filePath)
        const pdfUrl = publicUrlData?.publicUrl ?? null

        // Update invoice row with path + url
        const { error: updateErr } = await supabaseAdmin
            .from('invoices')
            .update({
                pdf_path: filePath,
                pdf_url: pdfUrl,
            })
            .eq('id', invoiceId)

        if (updateErr) {
            console.error('Failed to update invoice with pdf path', updateErr)
        }

        // Return created invoice info
        const response = {
            id: invoiceId,
            invoiceNumber: body.invoiceNumber,
            pdf_url: pdfUrl,
        }

        return NextResponse.json(response)
    } catch (err: any) {
        console.error('Invoice create error', err)
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
    }
}
