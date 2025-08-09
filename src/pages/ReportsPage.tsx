import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar as CalendarIcon, FileText, Loader2, Printer } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { useFinancialReport } from "@/hooks/useFinancialReport";

export default function ReportsPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const reportMutation = useFinancialReport();

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateReport = () => {
    if (date?.from && date?.to) {
      reportMutation.mutate({
        startDate: format(date.from, 'yyyy-MM-dd'),
        endDate: format(date.to, 'yyyy-MM-dd'),
      });
    }
  };

  const paidTotal = reportMutation.data?.paidPayables.reduce((sum, item) => sum + item.amount, 0) || 0;
  const receivedTotal = reportMutation.data?.receivedReceivables.reduce((sum, item) => sum + item.amount, 0) || 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="print:hidden flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" />Relatórios Financeiros</h1>
          <p className="text-muted-foreground">Selecione um período para gerar os relatórios.</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button id="date" variant={"outline"} className="w-full md:w-[300px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (date.to ? `${format(date.from, "dd/MM/y")} - ${format(date.to, "dd/MM/y")}` : format(date.from, "dd/MM/y")) : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
            </PopoverContent>
          </Popover>
          <Button onClick={handleGenerateReport} disabled={reportMutation.isPending}>
            {reportMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar Relatório
          </Button>
          {reportMutation.isSuccess && (
            <Button onClick={handlePrint} variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          )}
        </div>
      </div>

      {reportMutation.isError && (
        <Card className="border-destructive"><CardHeader><CardTitle className="text-destructive">Erro ao Gerar Relatório</CardTitle></CardHeader><CardContent><p>{reportMutation.error.message}</p></CardContent></Card>
      )}

      {reportMutation.isSuccess && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Contas Pagas no Período</CardTitle><CardDescription>Total Pago: {paidTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Data Pag.</TableHead><TableHead>Descrição</TableHead><TableHead>Fornecedor</TableHead><TableHead>Valor</TableHead></TableRow></TableHeader>
                <TableBody>
                  {reportMutation.data.paidPayables.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.paid_date ? format(parseISO(item.paid_date), 'dd/MM/yyyy') : ''}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.supplier_name || 'N/A'}</TableCell>
                      <TableCell>{item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Contas Recebidas no Período</CardTitle><CardDescription>Total Recebido: {receivedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Data Rec.</TableHead><TableHead>Descrição</TableHead><TableHead>Cliente</TableHead><TableHead>Valor</TableHead></TableRow></TableHeader>
                <TableBody>
                  {reportMutation.data.receivedReceivables.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.received_date ? format(parseISO(item.received_date), 'dd/MM/yyyy') : ''}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.customer_name || 'N/A'}</TableCell>
                      <TableCell>{item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {!reportMutation.isIdle && !reportMutation.isSuccess && !reportMutation.isError && (
        <Card className="mt-6"><CardHeader><CardTitle>Relatório de Contas a Pagar e Receber</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Selecione um período e clique em "Gerar Relatório" para ver os dados.</p></CardContent></Card>
      )}

    </div>
  );
}
