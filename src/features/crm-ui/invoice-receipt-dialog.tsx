import { Download, FileText, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

type ReceiptPayment = { id: string; student: string; group: string; course: string; amount: number; method: string; date: string; status: string }
const money = (value: number) => `${new Intl.NumberFormat('uz-UZ').format(value)} UZS`

export function InvoiceReceiptDialog({ payment }: { payment: ReceiptPayment }) {
  const print = () => window.print()
  const paid = payment.status === 'paid'
  return (
    <Dialog>
      <DialogTrigger asChild><Button size='icon' variant='ghost' className='size-8' title='Kvitansiyani ko‘rish' aria-label='Kvitansiyani ko‘rish'><FileText className='size-3.5' /></Button></DialogTrigger>
      <DialogContent className='max-w-xl rounded-2xl p-0 print:static print:block print:max-w-none print:border-0 print:shadow-none'>
        <DialogHeader className='border-b border-border/70 px-6 py-5 print:hidden'><DialogTitle className='flex items-center gap-2 text-base'><FileText className='size-4 text-primary' />To‘lov kvitansiyasi</DialogTitle></DialogHeader>
        <div className='invoice-print-surface p-6 sm:p-8'>
          <div className='flex items-start justify-between gap-4 border-b border-border/70 pb-6'><div><p className='text-[11px] font-black uppercase tracking-[0.2em] text-primary'>SFERA ACADEMY</p><h2 className='mt-2 text-2xl font-black tracking-tight'>Payment receipt</h2><p className='mt-1 text-xs text-muted-foreground'>Rasmiy to‘lov hujjati</p></div><Badge className={paid ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-amber-500/20 bg-amber-500/10 text-amber-700'}>{paid ? 'PAID' : payment.status.toUpperCase()}</Badge></div>
          <div className='grid gap-5 py-6 sm:grid-cols-2'><div><p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>To‘lovchi</p><p className='mt-1 font-bold'>{payment.student}</p><p className='text-xs text-muted-foreground'>{payment.group}</p><p className='text-xs text-muted-foreground'>{payment.course}</p></div><div className='sm:text-right'><p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>Receipt ID</p><p className='mt-1 font-mono text-sm font-bold'>{payment.id}</p><p className='text-xs text-muted-foreground'>{payment.date}</p></div></div>
          <div className='rounded-2xl border border-border/70 bg-muted/30 p-4'><div className='flex items-center justify-between text-sm'><span className='text-muted-foreground'>Ta’lim xizmati</span><span className='font-semibold'>{payment.course}</span></div><div className='mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-sm'><span className='text-muted-foreground'>To‘lov usuli</span><span className='font-semibold capitalize'>{payment.method}</span></div><div className='mt-5 flex items-end justify-between border-t border-border/60 pt-4'><span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>Jami</span><span className='text-2xl font-black tracking-tight'>{money(payment.amount)}</span></div></div>
          <p className='mt-6 text-center text-[11px] text-muted-foreground'>Ushbu hujjat elektron shaklda yaratildi · Sfera Academy CRM</p>
        </div>
        <div className='flex justify-end gap-2 border-t border-border/70 px-6 py-4 print:hidden'><Button variant='outline' className='gap-2' onClick={print}><Printer className='size-4' />Chop etish / PDF</Button><Button className='gap-2' onClick={print}><Download className='size-4' />PDF sifatida saqlash</Button></div>
      </DialogContent>
    </Dialog>
  )
}
