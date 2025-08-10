import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

const SIMILARITY_THRESHOLD = 0.6

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]) as number[][]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
    }
  }
  return matrix[b.length][a.length]
}

function similarity(a: string, b: string): number {
  const distance = levenshtein(a.toLowerCase(), b.toLowerCase())
  return 1 - distance / Math.max(a.length, b.length, 1)
}

function findBestMatch<T>(
  list: T[],
  getString: (item: T) => string,
  term: string,
  threshold: number
): { best?: T; candidates?: T[] } {
  let bestScore = 0
  let bestItems: T[] = []
  for (const item of list) {
    const score = similarity(getString(item), term)
    if (score > bestScore) {
      bestScore = score
      bestItems = [item]
    } else if (score === bestScore) {
      bestItems.push(item)
    }
  }
  if (bestScore >= threshold) {
    if (bestItems.length === 1) return { best: bestItems[0] }
    return { candidates: bestItems }
  }
  return {}
}

interface Supplier { id: string; name: string; cnpj?: string }
interface Ingredient { id: string; name: string; unit: string }

interface ParsedItem {
  description: string
  quantity: number
  unit_price: number
  total_price: number
  ingredient_id?: string
  candidates?: Ingredient[]
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  suppliers: Supplier[]
  ingredients: Ingredient[]
  onImported?: () => void
}

export function ImportNFeDialog({ open, onOpenChange, suppliers, ingredients, onImported }: Props) {
  const { toast } = useToast()
  const [, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [supplierName, setSupplierName] = useState("")
  const [supplierCNPJ, setSupplierCNPJ] = useState("")
  const [nfeNumber, setNfeNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<ParsedItem[]>([])
  const [ocrRaw, setOcrRaw] = useState("")

  const [supplierOptions, setSupplierOptions] = useState<Supplier[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>(undefined)

  useEffect(() => {
    if (!supplierName || supplierCNPJ) {
      setSupplierOptions([])
      setSelectedSupplier(undefined)
      return
    }
    const { best, candidates } = findBestMatch(suppliers, (s) => s.name, supplierName, SIMILARITY_THRESHOLD)
    if (candidates?.length) {
      setSupplierOptions(candidates)
      setSelectedSupplier(undefined)
    } else if (best) {
      setSupplierOptions([])
      setSelectedSupplier(best)
    } else {
      setSupplierOptions([])
      setSelectedSupplier(undefined)
    }
  }, [supplierName, supplierCNPJ, suppliers])

  const matchedSupplier = useMemo(() => {
    if (!supplierCNPJ && !supplierName) return undefined
    const clean = (v: string) => v.replace(/\D/g, "")
    const byCnpj = suppliers.find(
      (s) => s.cnpj && supplierCNPJ && clean(s.cnpj) === clean(supplierCNPJ)
    )
    if (byCnpj) return byCnpj
    return selectedSupplier
  }, [suppliers, supplierCNPJ, supplierName, selectedSupplier])

  const handleFile = async (f: File) => {
    setFile(f)
    setIsLoading(true)
    try {
      const isXml = f.name.toLowerCase().endsWith(".xml") || f.type.includes("xml")
      if (isXml) {
        const text = await f.text()
        parseXml(text)
      } else {
        // PDF/Image via Edge Function (OCR.space)
        const form = new FormData()
        form.append("file", f, f.name)
        form.append("language", "por")

        const supa = supabase as unknown as { supabaseUrl?: string; _url?: string }
        const baseUrl = supa.supabaseUrl || supa._url || "https://wfzgvuscivyzwuoaumto.supabase.co"
        const url = `${baseUrl}/functions/v1/ocrspace-proxy`
        const res = await fetch(url, { method: "POST", body: form })
        const data = await res.json()
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Falha ao processar OCR")
        }
        const text: string = data.text || ""
        setOcrRaw(text)
        // Heurística simples: tenta achar CNPJ e número da NFe
        const cnpjMatch = text.match(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b|\b\d{14}\b/)
        if (cnpjMatch) setSupplierCNPJ(cnpjMatch[0])
        const nfeMatch = text.match(/NFe\s*(\d{6,})/i)
        if (nfeMatch) setNfeNumber(nfeMatch[1])
        // Deixa itens em branco para edição manual
        setItems([{ description: "", quantity: 0, unit_price: 0, total_price: 0 }])
      }
      toast({ title: "Arquivo lido", description: "Revise os dados e confirme" })
      } catch (e) {
        console.error(e)
        const message = e instanceof Error ? e.message : String(e)
        toast({ title: "Erro", description: message || "Falha ao importar arquivo", variant: "destructive" })
      } finally {
      setIsLoading(false)
    }
  }

  const parseXml = (xmlText: string) => {
    try {
      const parser = new DOMParser()
      const xml = parser.parseFromString(xmlText, "text/xml")
      const emit = xml.getElementsByTagName("emit")[0]
      const dets = Array.from(xml.getElementsByTagName("det"))
      const ide = xml.getElementsByTagName("ide")[0]

      setSupplierName(emit?.getElementsByTagName("xNome")[0]?.textContent || "")
      setSupplierCNPJ(emit?.getElementsByTagName("CNPJ")[0]?.textContent || "")
      setNfeNumber(ide?.getElementsByTagName("nNF")[0]?.textContent || "")

      const parsed: ParsedItem[] = dets.map((det) => {
        const prod = det.getElementsByTagName("prod")[0]
        const desc = prod?.getElementsByTagName("xProd")[0]?.textContent || ""
        const qCom = parseFloat(prod?.getElementsByTagName("qCom")[0]?.textContent || "0")
        const vUn = parseFloat(prod?.getElementsByTagName("vUnCom")[0]?.textContent || "0")
        const vProd = parseFloat(prod?.getElementsByTagName("vProd")[0]?.textContent || (qCom*vUn).toString())

        const { best, candidates } = findBestMatch(
          ingredients,
          (ing) => ing.name,
          desc,
          SIMILARITY_THRESHOLD
        )
        return {
          description: desc,
          quantity: qCom,
          unit_price: vUn,
          total_price: vProd,
          ingredient_id: best?.id,
          candidates,
        }
      })
      setItems(parsed.length ? parsed : [{ description: "", quantity: 0, unit_price: 0, total_price: 0 }])
    } catch (e) {
      console.error("XML parse error", e)
      toast({ title: "Erro", description: "XML inválido", variant: "destructive" })
    }
  }

  const updateItem = <K extends keyof ParsedItem>(idx: number, field: K, value: ParsedItem[K]) => {
    const copy = [...items]
    copy[idx] = { ...copy[idx], [field]: value }
    if (field === "quantity" || field === "unit_price") {
      const q = Number(copy[idx].quantity || 0)
      const u = Number(copy[idx].unit_price || 0)
      copy[idx].total_price = q * u
    }
    if (field === "ingredient_id") {
      copy[idx].candidates = undefined
    }
    setItems(copy)
  }

  const addRow = () => setItems([...items, { description: "", quantity: 0, unit_price: 0, total_price: 0 }])

  const confirmImport = async () => {
    try {
      setIsLoading(true)

      // garante fornecedor
      let supplierId = matchedSupplier?.id
      if (!supplierId) {
        const { data: inserted, error: supErr } = await supabase
          .from("suppliers")
          .insert([{ name: supplierName || "Fornecedor", cnpj: supplierCNPJ || null }])
          .select()
          .single()
        if (supErr) throw supErr
        supplierId = inserted.id
      }

      const total = items.reduce((s, it) => s + (Number(it.total_price) || 0), 0)

      // cria compra pendente
      const { data: purchase, error: pErr } = await supabase
        .from("purchases")
        .insert([{ supplier_id: supplierId, nfe_number: nfeNumber || null, notes, total_amount: total, status: "pending" }])
        .select()
        .single()
      if (pErr) throw pErr

      // itens (somente com ingrediente mapeado)
      const itemsToInsert = items
        .filter((i) => i.ingredient_id)
        .map((i) => ({
          purchase_id: purchase.id,
          ingredient_id: i.ingredient_id!,
          quantity: Number(i.quantity) || 0,
          unit_price: Number(i.unit_price) || 0,
          total_price: Number(i.total_price) || 0,
        }))
      if (itemsToInsert.length) {
        const { error: itErr } = await supabase.from("purchase_items").insert(itemsToInsert)
        if (itErr) throw itErr
      }

      toast({ title: "Importado", description: "Compra criada. Revise e confirme para atualizar estoque." })
      onOpenChange(false)
      onImported?.()
      } catch (e) {
        console.error(e)
        const message = e instanceof Error ? e.message : String(e)
        toast({ title: "Erro", description: message || "Falha ao lançar compra", variant: "destructive" })
      } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl animate-fade-in">
        <DialogHeader>
          <DialogTitle>Importar Compra (XML/PDF)</DialogTitle>
          <DialogDescription>Leia XML da NFe ou PDF (via OCR). Edite e confirme.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Arquivo</Label>
            <Input type="file" accept=".xml,application/xml,application/pdf,image/*" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Fornecedor</Label>
              <Input placeholder="Nome" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
              {supplierOptions.length > 1 && (
                <Select
                  value={selectedSupplier?.id}
                  onValueChange={(v) => {
                    const s = supplierOptions.find((o) => o.id === v)
                    setSelectedSupplier(s)
                    if (s) {
                      setSupplierName(s.name)
                      setSupplierCNPJ(s.cnpj || "")
                    }
                    setSupplierOptions([])
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Input placeholder="CNPJ" value={supplierCNPJ} onChange={(e) => setSupplierCNPJ(e.target.value)} />
              <Input placeholder="Número da NFe" value={nfeNumber} onChange={(e) => setNfeNumber(e.target.value)} />
              <Textarea placeholder="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Texto OCR (somente PDF)</Label>
              <Textarea value={ocrRaw} onChange={(e) => setOcrRaw(e.target.value)} className="min-h-[160px]" placeholder="Conteúdo extraído do PDF aparecerá aqui" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Itens</Label>
            <div className="space-y-3">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Input placeholder="Descrição" value={it.description} onChange={(e) => updateItem(idx, "description", e.target.value)} />
                  </div>
                  <div className="col-span-3">
                    <Select value={it.ingredient_id} onValueChange={(v) => updateItem(idx, "ingredient_id", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ingrediente" />
                      </SelectTrigger>
                      <SelectContent>
                        {it.candidates?.map((ing) => (
                          <SelectItem key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </SelectItem>
                        ))}
                        {ingredients
                          .filter((ing) => !it.candidates?.some((c) => c.id === ing.id))
                          .map((ing) => (
                            <SelectItem key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input type="number" step="0.001" placeholder="Qtd" value={it.quantity} onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value)||0)} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" step="0.01" placeholder="V.Unit" value={it.unit_price} onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value)||0)} />
                  </div>
                  <div className="col-span-1 text-right font-medium">
                    R$ {(Number(it.total_price)||0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center">
                <Button type="button" variant="outline" onClick={addRow}>Adicionar item</Button>
                <div className="font-semibold">Total: R$ {items.reduce((s,i)=>s+(Number(i.total_price)||0),0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={confirmImport} disabled={isLoading}>{isLoading ? 'Processando...' : 'Confirmar e Lançar Compra'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
