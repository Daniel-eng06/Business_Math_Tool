import { useState, useMemo, useEffect, useCallback } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// --- Currency definitions ---
const CURRENCIES = {
  USD: { symbol: '$',     name: 'US Dollar',           flag: '🇺🇸' },
  CAD: { symbol: 'CA$',  name: 'Canadian Dollar',      flag: '🇨🇦' },
  CNY: { symbol: '¥',    name: 'Chinese Yuan',         flag: '🇨🇳' },
  AUD: { symbol: 'A$',   name: 'Australian Dollar',    flag: '🇦🇺' },
  GBP: { symbol: '£',    name: 'British Pound',        flag: '🇬🇧' },
  AED: { symbol: 'AED ', name: 'UAE Dirham',           flag: '🇦🇪' },
  GHS: { symbol: 'GH₵',  name: 'Ghana Cedi',           flag: '🇬🇭' },
}

// --- Helpers ---
const n = (v) => parseFloat(v) || 0
const makeFmt = (sym) => (v) =>
  isNaN(v) || !isFinite(v) ? '-' : sym + Number(v.toFixed(2)).toLocaleString('en-US', { minimumFractionDigits: 2 })
const pct = (v) =>
  isNaN(v) || !isFinite(v) ? '-' : v.toFixed(1) + '%'
const plain = (v) =>
  isNaN(v) || !isFinite(v) ? '-' : Number(v.toFixed(4)).toLocaleString()

// --- Sub-components ---
function SectionCard({ number, title, children }) {
  return (
    <section className="card">
      <div className="card-header">
        <span className="section-num">{number}</span>
        <h2>{title}</h2>
      </div>
      <div className="card-body">{children}</div>
    </section>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="field">
      <label>{label}{hint && <span className="hint"> - {hint}</span>}</label>
      {children}
    </div>
  )
}

function NumInput({ value, onChange, prefix, suffix, placeholder = '0' }) {
  return (
    <div className="input-wrap">
      {prefix && <span className="affix">{prefix}</span>}
      <input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {suffix && <span className="affix">{suffix}</span>}
    </div>
  )
}

function Calc({ label, value, highlight }) {
  return (
    <div className={`calc-row${highlight ? ' calc-highlight' : ''}`}>
      <span className="calc-label">{label}</span>
      <span className="calc-value">{value}</span>
    </div>
  )
}

function SelectField({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

// --- Main App ---
export default function App() {
  // ── Currency & exchange rates ──
  const [displayCurrency, setDisplayCurrency] = useState(() => localStorage.getItem('displayCurrency') || 'USD')
  const [supplierCurrency, setSupplierCurrency] = useState(() => localStorage.getItem('supplierCurrency') || 'USD')
  const [rates, setRates] = useState({}) // rates vs USD
  const [ratesLoading, setRatesLoading] = useState(true)
  const [ratesError, setRatesError] = useState(false)
  const [ratesUpdated, setRatesUpdated] = useState('')

  const fetchRates = useCallback(async () => {
    setRatesLoading(true)
    setRatesError(false)
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD')
      const data = await res.json()
      if (data.result === 'success') {
        setRates(data.rates)
        setRatesUpdated(new Date(data.time_last_update_utc).toLocaleString())
      } else { setRatesError(true) }
    } catch { setRatesError(true) }
    setRatesLoading(false)
  }, [])

  useEffect(() => { fetchRates() }, [fetchRates])

  useEffect(() => { localStorage.setItem('displayCurrency', displayCurrency) }, [displayCurrency])
  useEffect(() => { localStorage.setItem('supplierCurrency', supplierCurrency) }, [supplierCurrency])

  // Conversion: how many display-currency units = 1 supplier-currency unit
  const supConvRate = useMemo(() => {
    if (!rates[displayCurrency] || !rates[supplierCurrency]) return 1
    return rates[displayCurrency] / rates[supplierCurrency]
  }, [rates, displayCurrency, supplierCurrency])

  const sym = CURRENCIES[displayCurrency]?.symbol || displayCurrency + ' '
  const supSym = CURRENCIES[supplierCurrency]?.symbol || supplierCurrency + ' '
  const fmt = useMemo(() => makeFmt(sym), [sym])

  // -- Section 1 - Real data --
  const [supplierPrice, setSupplierPrice] = useState('')
  const [quantity, setQuantity] = useState('')

  // -- Section 1b - Assumption --
  const [expensesPct, setExpensesPct] = useState('')
  const [activeScenario, setActiveScenario] = useState('real') // 'real' | 'assumption'

  // ── Section 2 ──
  const [boxLength, setBoxLength] = useState('')
  const [boxWidth, setBoxWidth] = useState('')
  const [boxHeight, setBoxHeight] = useState('')
  const [unitsPerBox, setUnitsPerBox] = useState('')
  const [cbmRate, setCbmRate] = useState('290')

  // ── Section 3 ──
  const [customsDutyPct, setCustomsDutyPct] = useState('')
  const [agentFee, setAgentFee] = useState('')
  const [harbourCharges, setHarbourCharges] = useState('')

  // ── Section 4 ──
  const [fumigation, setFumigation] = useState('')
  const [localTransport, setLocalTransport] = useState('')
  const [storage, setStorage] = useState('')
  const [packaging, setPackaging] = useState('')
  const [phoneAdmin, setPhoneAdmin] = useState('')
  const [other1Label, setOther1Label] = useState('')
  const [other1Amount, setOther1Amount] = useState('')
  const [other2Label, setOther2Label] = useState('')
  const [other2Amount, setOther2Amount] = useState('')

  // ── Section 6 ──
  const [margin, setMargin] = useState('45')

  // ── Section 7 ──
  const [grade, setGrade] = useState('')
  const [sampleTested, setSampleTested] = useState('')
  const [competitorPrice, setCompetitorPrice] = useState('')
  const [priceCompetitive, setPriceCompetitive] = useState('')
  const [itemSpeed, setItemSpeed] = useState('')
  const [isSeasonal, setIsSeasonal] = useState('')
  const [season, setSeason] = useState('')
  const [moq, setMoq] = useState('')

  // -- Section 9 log --
  const [log, setLog] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('importLog') || '[]')
    } catch { return [] }
  })
  const [logProduct, setLogProduct] = useState('')

  useEffect(() => {
    localStorage.setItem('importLog', JSON.stringify(log))
  }, [log])

  // -- Calculations --
  const calc = useMemo(() => {
    const supPriceRaw = n(supplierPrice) * supConvRate
    const supPriceAssumed = supPriceRaw * (1 + n(expensesPct) / 100)
    const supPrice = activeScenario === 'assumption' ? supPriceAssumed : supPriceRaw
    const qty = n(quantity)
    const totalSupplierCost = supPrice * qty
    const totalSupplierCostReal = supPriceRaw * qty
    const totalSupplierCostAssumed = supPriceAssumed * qty

    const L = n(boxLength), W = n(boxWidth), H = n(boxHeight)
    const upb = n(unitsPerBox)
    const rate = n(cbmRate) || 290
    const totalBoxes = upb > 0 ? qty / upb : 0
    const cbmPerBox = (L * W * H) / 1_000_000
    const totalCbm = cbmPerBox * totalBoxes
    const freightCost = totalCbm * rate

    const customsDuty = totalSupplierCost * (n(customsDutyPct) / 100)
    const currencyBuffer = totalSupplierCost * 0.07
    const damageBuffer = totalSupplierCost * 0.03
    const agentFeeN = n(agentFee)
    const harbourN = n(harbourCharges)
    const totalImportCosts = freightCost + customsDuty + agentFeeN + harbourN + currencyBuffer + damageBuffer

    const miscItems = [n(fumigation), n(localTransport), n(storage), n(packaging), n(phoneAdmin), n(other1Amount), n(other2Amount)]
    const totalMisc = miscItems.reduce((a, b) => a + b, 0)

    const totalLanded = totalSupplierCost + totalImportCosts + totalMisc
    const landedPerUnit = qty > 0 ? totalLanded / qty : 0

    const mg = n(margin) / 100
    const sellingPrice = mg < 1 && landedPerUnit > 0 ? landedPerUnit / (1 - mg) : 0
    const profitPerUnit = sellingPrice - landedPerUnit
    const totalProfit = profitPerUnit * qty
    const roi = totalLanded > 0 ? (totalProfit / totalLanded) * 100 : 0

    return {
      totalSupplierCost, totalBoxes, cbmPerBox, totalCbm, freightCost,
      customsDuty, currencyBuffer, damageBuffer, totalImportCosts,
      totalMisc, totalLanded, landedPerUnit,
      sellingPrice, profitPerUnit, totalProfit, roi,
      // Comparison data (always both)
      totalSupplierCostReal, totalSupplierCostAssumed,
      landedReal: (totalSupplierCostReal + totalImportCosts + totalMisc),
      landedAssumed: (totalSupplierCostAssumed + totalImportCosts + totalMisc),
      landedPerUnitReal: qty > 0 ? (totalSupplierCostReal + totalImportCosts + totalMisc) / qty : 0,
      landedPerUnitAssumed: qty > 0 ? (totalSupplierCostAssumed + totalImportCosts + totalMisc) / qty : 0,
    }
  }, [
    supplierPrice, quantity, boxLength, boxWidth, boxHeight, unitsPerBox, cbmRate,
    customsDutyPct, agentFee, harbourCharges, fumigation, localTransport, storage,
    packaging, phoneAdmin, other1Amount, other2Amount, margin, supConvRate,
    expensesPct, activeScenario,
  ])

  const downloadPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const blue = [37, 99, 235]
    const lightBlue = [239, 246, 255]
    const darkText = [30, 42, 74]
    const muted = [75, 90, 133]
    const pageW = doc.internal.pageSize.getWidth()
    let y = 0

    // ── Header banner ──
    doc.setFillColor(...blue)
    doc.rect(0, 0, pageW, 22, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(255, 255, 255)
    doc.text('Import Calculator: Summary', 14, 14)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageW - 14, 10, { align: 'right' })
    doc.text(`Currency: ${displayCurrency} (${sym}) | Supplier: ${supplierCurrency}${supplierCurrency !== displayCurrency ? ` @ ${supConvRate.toFixed(4)} rate` : ''}`, pageW - 14, 16, { align: 'right' })
    y = 30

    const section = (title) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...blue)
      doc.text(title, 14, y)
      doc.setDrawColor(...blue)
      doc.setLineWidth(0.4)
      doc.line(14, y + 1.5, pageW - 14, y + 1.5)
      y += 7
    }

    const row2col = (data) => {
      autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        head: [],
        body: data,
        styles: { fontSize: 9, cellPadding: 2.5, textColor: darkText, lineColor: [209, 217, 240], lineWidth: 0.2 },
        columnStyles: {
          0: { fontStyle: 'normal', textColor: muted, cellWidth: 90 },
          1: { fontStyle: 'bold', halign: 'right' },
        },
        theme: 'grid',
        alternateRowStyles: { fillColor: lightBlue },
        didParseCell: (data) => {
          if (data.row.index === data.table.body.length - 1 && data.row.raw?.[2] === 'highlight') {
            data.cell.styles.fillColor = [219, 234, 254]
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.textColor = blue
          }
        },
      })
      y = doc.lastAutoTable.finalY + 6
    }

    // ── Section 1 ──
    section('1a. Cost of Goods (Real)')
    row2col([
      [`Supplier price per unit (${supplierCurrency})`, supSym + n(supplierPrice).toFixed(2)],
      supplierCurrency !== displayCurrency ? [`Exchange rate (${supplierCurrency} to ${displayCurrency})`, supConvRate.toFixed(4)] : null,
      ['Quantity', `${n(quantity).toLocaleString()} units`],
      ['Total supplier cost (Real)', fmt(calc.totalSupplierCostReal), 'highlight'],
    ].filter(Boolean))

    if (n(expensesPct) > 0) {
      section('1b. Assumption - With Expenses %')
      row2col([
        ['Expenses % added', `${n(expensesPct)}%`],
        ['Total supplier cost (Assumption)', fmt(calc.totalSupplierCostAssumed), 'highlight'],
        ['Extra cost added', fmt(calc.totalSupplierCostAssumed - calc.totalSupplierCostReal)],
        ['A) Real landed/unit', fmt(calc.landedPerUnitReal)],
        ['B) Assumed landed/unit', fmt(calc.landedPerUnitAssumed), 'highlight'],
        ['Currently using in calc', activeScenario === 'real' ? 'A) Real' : 'B) Assumption'],
      ])
    }

    // ── Section 2 ──
    section('2. Shipping & Freight')
    row2col([
      ['Box dimensions (L × W × H)', `${n(boxLength)} × ${n(boxWidth)} × ${n(boxHeight)} cm`],
      ['Units per box', n(unitsPerBox).toLocaleString()],
      ['Total boxes', plain(calc.totalBoxes)],
      ['CBM per box', `${plain(calc.cbmPerBox)} CBM`],
      ['Total CBM', `${plain(calc.totalCbm)} CBM`],
      ['Rate per CBM', fmt(n(cbmRate) || 290)],
      ['Freight cost', fmt(calc.freightCost), 'highlight'],
    ])

    // ── Section 3 ──
    section('3. Import Costs')
    row2col([
      ['Freight', fmt(calc.freightCost)],
      [`Customs duty (${n(customsDutyPct)}%)`, fmt(calc.customsDuty)],
      ['Agent fee', fmt(n(agentFee))],
      ['Harbour / port charges', fmt(n(harbourCharges))],
      ['Currency buffer (7%)', fmt(calc.currencyBuffer)],
      ['Damage buffer (3%)', fmt(calc.damageBuffer)],
      ['Total import costs', fmt(calc.totalImportCosts), 'highlight'],
    ])

    // ── Section 4 ──
    const miscRows = [
      n(fumigation) && ['Fumigation', fmt(n(fumigation))],
      n(localTransport) && ['Local transport', fmt(n(localTransport))],
      n(storage) && ['Storage / warehousing', fmt(n(storage))],
      n(packaging) && ['Packaging / labelling', fmt(n(packaging))],
      n(phoneAdmin) && ['Phone calls / admin', fmt(n(phoneAdmin))],
      (other1Label || n(other1Amount)) && [other1Label || 'Other 1', fmt(n(other1Amount))],
      (other2Label || n(other2Amount)) && [other2Label || 'Other 2', fmt(n(other2Amount))],
      ['Total misc costs', fmt(calc.totalMisc), 'highlight'],
    ].filter(Boolean)
    if (miscRows.length) {
      section('4. Miscellaneous Costs')
      row2col(miscRows)
    }

    // ── Section 5 ──
    if (y > 230) { doc.addPage(); y = 15 }
    section('5. Landed Cost')
    row2col([
      ['Total supplier cost', fmt(calc.totalSupplierCost)],
      ['Total import costs', fmt(calc.totalImportCosts)],
      ['Total misc costs', fmt(calc.totalMisc)],
      ['TOTAL LANDED COST', fmt(calc.totalLanded), 'highlight'],
      ['Landed cost per unit', fmt(calc.landedPerUnit), 'highlight'],
    ])

    // ── Section 6 ──
    section('6. Selling Price & Profit')
    row2col([
      ['Target margin', `${n(margin)}%`],
      ['Selling price per unit', fmt(calc.sellingPrice), 'highlight'],
      ['Profit per unit', fmt(calc.profitPerUnit)],
      [`Total profit (${n(quantity).toLocaleString()} units)`, fmt(calc.totalProfit), 'highlight'],
      ['ROI', pct(calc.roi), 'highlight'],
    ])

    // ── Section 7 ──
    const checkRows = [
      grade && ['Product grade', `Grade ${grade}`],
      sampleTested && ['Sample tested', sampleTested === 'yes' ? 'Yes' : 'No'],
      n(competitorPrice) && ['Competitor price', fmt(n(competitorPrice))],
      itemSpeed && ['Item speed', itemSpeed === 'fast' ? 'Fast-moving' : 'Slow-moving'],
      isSeasonal && ['Seasonal', isSeasonal === 'yes' ? `Yes - ${season}` : 'No'],
      n(moq) && ['MOQ', `${n(moq).toLocaleString()} units`],
      ratesUpdated && [`Exchange rates as of`, ratesUpdated],
    ].filter(Boolean)
    if (checkRows.length) {
      if (y > 220) { doc.addPage(); y = 15 }
      section('7. Product Check')
      row2col(checkRows)
    }

    // ── Log table ──
    if (log.length > 0) {
      if (y > 200) { doc.addPage(); y = 15 }
      section('9. Running Calculations Log')
      autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        head: [['Date', 'Product', 'Qty', 'Landed/Unit', 'Sell Price', 'Margin']],
        body: log.map((r) => [
          r.date, r.product, r.qty.toLocaleString(),
          fmt(r.landedPerUnit), fmt(r.sellingPrice), `${r.margin}%`,
        ]),
        headStyles: { fillColor: blue, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 2.5, textColor: darkText },
        alternateRowStyles: { fillColor: lightBlue },
        theme: 'grid',
      })
      y = doc.lastAutoTable.finalY + 6
    }

    // ── Footer on every page ──
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(...muted)
      doc.text(`Page ${i} of ${pageCount}`, pageW / 2, 292, { align: 'center' })
    }

    doc.save(`import-calculation-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const addToLog = () => {
    if (!logProduct) return
    const entry = {
      date: new Date().toLocaleDateString('en-AU'),
      product: logProduct,
      qty: n(quantity),
      landedPerUnit: calc.landedPerUnit,
      sellingPrice: calc.sellingPrice,
      margin: n(margin),
      notes: '',
    }
    setLog((prev) => [entry, ...prev])
    setLogProduct('')
  }

  const deleteLogEntry = (idx) => {
    setLog((prev) => prev.filter((_, i) => i !== idx))
  }

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-inner">
          <div>
            <h1>Import Calculator</h1>
            <p>Fill in each section from top to bottom. Results calculate automatically.</p>
          </div>
          <div className="header-right">
            {calc.landedPerUnit > 0 && (
              <div className="header-summary">
                <div className="hs-scenario">
                  <div className="hs-scenario-label real-label">A) Real</div>
                  <div className="hs-item">
                    <span>Landed/unit</span>
                    <strong>{fmt(calc.landedPerUnitReal)}</strong>
                  </div>
                  <div className="hs-item">
                    <span>Sell price</span>
                    <strong>{fmt(n(expensesPct) > 0 ? calc.landedPerUnitReal / (1 - n(margin)/100) : calc.sellingPrice)}</strong>
                  </div>
                </div>
                {n(expensesPct) > 0 && (
                  <div className="hs-scenario hs-scenario-assumed">
                    <div className="hs-scenario-label assumed-label">B) +{n(expensesPct)}% Expenses</div>
                    <div className="hs-item">
                      <span>Landed/unit</span>
                      <strong className="assumed-num">{fmt(calc.landedPerUnitAssumed)}</strong>
                    </div>
                    <div className="hs-item">
                      <span>Sell price</span>
                      <strong className="assumed-num">{fmt(calc.landedPerUnitAssumed / (1 - n(margin)/100))}</strong>
                    </div>
                  </div>
                )}
                <div className="hs-divider" />
                <div className="hs-item hs-big">
                  <span>Total profit</span>
                  <strong className={calc.totalProfit >= 0 ? 'pos' : 'neg'}>{fmt(calc.totalProfit)}</strong>
                </div>
                <div className="hs-item hs-big">
                  <span>ROI</span>
                  <strong className={calc.roi >= 0 ? 'pos' : 'neg'}>{pct(calc.roi)}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* ── Currency Selector ── */}
        <section className="currency-card">
          <div className="currency-card-inner">
            <div className="currency-group">
              <label className="currency-label">Display currency</label>
              <div className="currency-select-wrap">
                <select
                  value={displayCurrency}
                  onChange={(e) => setDisplayCurrency(e.target.value)}
                  className="currency-select"
                >
                  {Object.entries(CURRENCIES).map(([code, { name, flag }]) => (
                    <option key={code} value={code}>{flag} {code}: {name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="currency-group">
              <label className="currency-label">Supplier quotes in</label>
              <div className="currency-select-wrap">
                <select
                  value={supplierCurrency}
                  onChange={(e) => setSupplierCurrency(e.target.value)}
                  className="currency-select"
                >
                  {Object.entries(CURRENCIES).map(([code, { name, flag }]) => (
                    <option key={code} value={code}>{flag} {code}: {name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="currency-rate-info">
              {ratesLoading && <span className="rate-loading">⟳ Fetching live rates…</span>}
              {ratesError && (
                <span className="rate-error">
                  ⚠ Could not fetch rates
                  <button className="rate-retry" onClick={fetchRates}>Retry</button>
                </span>
              )}
              {!ratesLoading && !ratesError && (
                <div className="rate-display">
                  {supplierCurrency !== displayCurrency ? (
                    <span className="rate-value">
                      1 {supplierCurrency} = <strong>{supConvRate.toFixed(4)} {displayCurrency}</strong>
                    </span>
                  ) : (
                    <span className="rate-value">Same currency - no conversion</span>
                  )}
                  <span className="rate-updated">Rates updated: {ratesUpdated}</span>
                  <button className="rate-retry" onClick={fetchRates}>↻ Refresh</button>
                </div>
              )}
            </div>
          </div>
          {/* Rate ticker for common currencies */}
          {!ratesLoading && !ratesError && Object.keys(rates).length > 0 && (
            <div className="rate-ticker">
              {['USD','AUD','CNY','GBP','CAD','AED','GHS'].filter(c => c !== displayCurrency).map(c => (
                <span key={c} className="ticker-item">
                  <span className="ticker-flag">{CURRENCIES[c]?.flag}</span>
                  {c}: <strong>{((rates[c] || 1) / (rates[displayCurrency] || 1)).toFixed(4)}</strong>
                </span>
              ))}
            </div>
          )}
        </section>
        {/* Section 1a: Real Data */}
        <SectionCard number="1a" title="Cost of Goods (Real)">
          <div className="field-grid">
            <Field label={`Supplier price per unit (${supplierCurrency})`}>
              <NumInput value={supplierPrice} onChange={setSupplierPrice} prefix={supSym} />
            </Field>
            <Field label="Quantity ordering">
              <NumInput value={quantity} onChange={setQuantity} suffix="units" />
            </Field>
          </div>
          {supplierCurrency !== displayCurrency && (
            <div className="conv-note">
              {supConvRate > 0 && n(supplierPrice) > 0
                ? `${supSym}${n(supplierPrice).toFixed(2)} ${supplierCurrency} = ${fmt(n(supplierPrice) * supConvRate)} ${displayCurrency} per unit`
                : `Enter supplier price in ${supplierCurrency} - will auto-convert to ${displayCurrency}`}
            </div>
          )}
          <div className="calc-block">
            <Calc label={`Total supplier cost (Real) (${displayCurrency})`} value={fmt(calc.totalSupplierCostReal)} highlight />
          </div>
        </SectionCard>

        {/* Section 1b: Assumption */}
        <SectionCard number="1b" title="Assumption - Add Expenses to Supplier Cost">
          <p className="section-note">
            Add an <strong>expenses %</strong> on top of the supplier cost to model additional pre-landing costs (e.g. factory handling, testing, prep). This gives you an assumed higher base cost so you can compare two scenarios side by side.
          </p>
          <div className="assumption-row">
            <div className="field">
              <label>Expenses % on supplier cost</label>
              <NumInput value={expensesPct} onChange={setExpensesPct} suffix="%" placeholder="e.g. 10" />
            </div>
            <div className="field">
              <label>Feed into main calculation</label>
              <div className="scenario-toggle">
                <button
                  className={`toggle-btn${activeScenario === 'real' ? ' active' : ''}`}
                  onClick={() => setActiveScenario('real')}
                >
                  A) Real
                </button>
                <button
                  className={`toggle-btn assumption${activeScenario === 'assumption' ? ' active' : ''}`}
                  onClick={() => setActiveScenario('assumption')}
                >
                  B) Assumption
                </button>
              </div>
            </div>
          </div>
          <div className="assumption-compare">
            <div className="asmp-col">
              <div className="asmp-label real-label">A) Real supplier cost</div>
              <div className="asmp-val">{fmt(calc.totalSupplierCostReal)}</div>
              <div className="asmp-sub">{fmt(n(supplierPrice) * supConvRate)} × {n(quantity).toLocaleString()} units</div>
            </div>
            {n(expensesPct) > 0 && (
              <>
                <div className="asmp-arrow">→</div>
                <div className="asmp-col assumed">
                  <div className="asmp-label assumed-label">B) With {n(expensesPct)}% expenses</div>
                  <div className="asmp-val assumed-val">{fmt(calc.totalSupplierCostAssumed)}</div>
                  <div className="asmp-sub">+{fmt(calc.totalSupplierCostAssumed - calc.totalSupplierCostReal)} added</div>
                </div>
              </>
            )}
          </div>
          {n(expensesPct) > 0 && (
            <div className="assumption-bottom">
              <div className="asmp-summary-row">
                <span>A) Real landed/unit</span>
                <strong>{fmt(calc.landedPerUnitReal)}</strong>
              </div>
              <div className="asmp-summary-row assumed-row">
                <span>B) Assumed landed/unit</span>
                <strong>{fmt(calc.landedPerUnitAssumed)}</strong>
              </div>
              <div className="asmp-summary-row">
                <span>Difference per unit</span>
                <strong className="neg">{fmt(calc.landedPerUnitAssumed - calc.landedPerUnitReal)}</strong>
              </div>
            </div>
          )}
          <div className="active-scenario-note">
            Sections 2-8 are currently using: <strong>{activeScenario === 'real' ? 'A) Real supplier cost' : `B) Assumption (+${n(expensesPct)}% expenses)`}</strong>
          </div>
        </SectionCard>

        {/* Section 2 */}
        <SectionCard number="2" title="Shipping & Freight (CBM Method)">
          <p className="section-note">Your shipping agent clears the goods - you just need to know your freight cost.</p>
          <h3>Box Dimensions</h3>
          <div className="field-grid field-grid-3">
            <Field label="Box length">
              <NumInput value={boxLength} onChange={setBoxLength} suffix="cm" />
            </Field>
            <Field label="Box width">
              <NumInput value={boxWidth} onChange={setBoxWidth} suffix="cm" />
            </Field>
            <Field label="Box height">
              <NumInput value={boxHeight} onChange={setBoxHeight} suffix="cm" />
            </Field>
            <Field label="Units per box">
              <NumInput value={unitsPerBox} onChange={setUnitsPerBox} suffix="units" />
            </Field>
            <Field label="Rate per CBM" hint={`default ${sym}290`}>
              <NumInput value={cbmRate} onChange={setCbmRate} prefix={sym} />
            </Field>
          </div>
          <div className="calc-block">
            <Calc label="Total boxes" value={`${plain(calc.totalBoxes)} boxes`} />
            <Calc label="CBM per box" value={`${plain(calc.cbmPerBox)} CBM`} />
            <Calc label="Total CBM" value={`${plain(calc.totalCbm)} CBM`} />
            <Calc label="Freight cost" value={fmt(calc.freightCost)} highlight />
          </div>
        </SectionCard>

        {/* ── Section 3 ── */}
        <SectionCard number="3" title="Import Costs">
          <p className="section-note">Since your agent clears the goods, you pay these costs. Always confirm duty, harbour and agent fee before each shipment. Pay duty directly to the bank - not through the agent.</p>
          <div className="field-grid">
            <Field label="Customs duty rate">
              <NumInput value={customsDutyPct} onChange={setCustomsDutyPct} suffix="%" placeholder="e.g. 10" />
            </Field>
            <Field label="Agent fee" hint="fixed fee your agent charges">
              <NumInput value={agentFee} onChange={setAgentFee} prefix={sym} />
            </Field>
            <Field label="Harbour / port charges" hint="confirm with agent">
              <NumInput value={harbourCharges} onChange={setHarbourCharges} prefix={sym} />
            </Field>
          </div>
          <div className="calc-block">
            <Calc label="Freight" value={fmt(calc.freightCost)} />
            <Calc label={`Customs duty (${n(customsDutyPct)}% of supplier cost)`} value={fmt(calc.customsDuty)} />
            <Calc label="Agent fee" value={fmt(n(agentFee))} />
            <Calc label="Harbour / port charges" value={fmt(n(harbourCharges))} />
            <Calc label="Currency buffer (7% - exchange rate protection)" value={fmt(calc.currencyBuffer)} />
            <Calc label="Damage buffer (3% - damaged goods protection)" value={fmt(calc.damageBuffer)} />
            <Calc label="Total import costs" value={fmt(calc.totalImportCosts)} highlight />
          </div>
        </SectionCard>

        {/* ── Section 4 ── */}
        <SectionCard number="4" title="Miscellaneous Costs">
          <p className="section-note">Things that often get forgotten - add anything that applies.</p>
          <div className="field-grid">
            <Field label="Fumigation (if required)">
              <NumInput value={fumigation} onChange={setFumigation} prefix={sym} />
            </Field>
            <Field label="Local transport (port to warehouse)">
              <NumInput value={localTransport} onChange={setLocalTransport} prefix={sym} />
            </Field>
            <Field label="Storage / warehousing">
              <NumInput value={storage} onChange={setStorage} prefix={sym} />
            </Field>
            <Field label="Packaging / labelling">
              <NumInput value={packaging} onChange={setPackaging} prefix={sym} />
            </Field>
            <Field label="Phone calls / admin">
              <NumInput value={phoneAdmin} onChange={setPhoneAdmin} prefix={sym} />
            </Field>
          </div>
          <div className="other-row">
            <div className="field flex-grow">
              <label>Other item 1 - label</label>
              <input
                type="text"
                value={other1Label}
                onChange={(e) => setOther1Label(e.target.value)}
                placeholder="e.g. Insurance"
                className="text-input"
              />
            </div>
            <div className="field">
              <label>Amount</label>
              <NumInput value={other1Amount} onChange={setOther1Amount} prefix={sym} />
            </div>
          </div>
          <div className="other-row">
            <div className="field flex-grow">
              <label>Other item 2 - label</label>
              <input
                type="text"
                value={other2Label}
                onChange={(e) => setOther2Label(e.target.value)}
                placeholder="e.g. Inspection fee"
                className="text-input"
              />
            </div>
            <div className="field">
              <label>Amount</label>
              <NumInput value={other2Amount} onChange={setOther2Amount} prefix={sym} />
            </div>
          </div>
          <div className="calc-block">
            <Calc label="Total misc costs" value={fmt(calc.totalMisc)} highlight />
          </div>
        </SectionCard>

        {/* ── Section 5 ── */}
        <SectionCard number="5" title="Landed Cost (Full Cost Before Profit)">
          <div className="calc-block">
            <Calc label="Total supplier cost" value={fmt(calc.totalSupplierCost)} />
            <Calc label="Total import costs" value={fmt(calc.totalImportCosts)} />
            <Calc label="Total misc costs" value={fmt(calc.totalMisc)} />
            <div className="calc-divider" />
            <Calc label="Total landed cost" value={fmt(calc.totalLanded)} highlight />
            <Calc label="Landed cost per unit" value={fmt(calc.landedPerUnit)} highlight />
          </div>
          <div className="breakeven-note">
            This is your breakeven price. <strong>Never sell below this.</strong>
          </div>
        </SectionCard>

        {/* ── Section 6 ── */}
        <SectionCard number="6" title="Selling Price & Profit">
          <div className="margin-guide">
            <div className="mg-item">
              <span>Fast-moving item</span>
              <span className="mg-range">40–50% margin</span>
            </div>
            <div className="mg-item">
              <span>Slow-moving item</span>
              <span className="mg-range">30% margin</span>
            </div>
          </div>
          <div className="field-grid">
            <Field label="Target margin">
              <NumInput value={margin} onChange={setMargin} suffix="%" />
            </Field>
          </div>
          <div className="calc-block">
            <Calc label={`Selling price (landed ÷ (1 − ${n(margin)}%))`} value={fmt(calc.sellingPrice)} highlight />
            <Calc label="Profit per unit" value={fmt(calc.profitPerUnit)} />
            <Calc label={`Total profit (${n(quantity).toLocaleString()} units)`} value={fmt(calc.totalProfit)} highlight />
            <Calc label="ROI" value={pct(calc.roi)} highlight />
          </div>
        </SectionCard>

        {/* ── Section 7 ── */}
        <SectionCard number="7" title="Grade & Product Check">
          <p className="section-note">Before finalising any order, confirm every item below.</p>
          <div className="checklist">
            <div className="check-row">
              <span>What grade is this product?</span>
              <SelectField
                value={grade}
                onChange={setGrade}
                options={[
                  { value: '', label: 'Select…' },
                  { value: '1', label: 'Grade 1' },
                  { value: '2', label: 'Grade 2' },
                  { value: '3', label: 'Grade 3' },
                ]}
              />
            </div>
            <div className="check-row">
              <span>Have you seen and tested a sample?</span>
              <SelectField
                value={sampleTested}
                onChange={setSampleTested}
                options={[
                  { value: '', label: 'Select…' },
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ]}
              />
            </div>
            <div className="check-row">
              <span>What are competitors selling this for?</span>
              <NumInput value={competitorPrice} onChange={setCompetitorPrice} prefix={sym} />
            </div>
            <div className="check-row">
              <span>Is your selling price competitive?</span>
              {n(competitorPrice) > 0 && calc.sellingPrice > 0 ? (
                <span className={calc.sellingPrice <= n(competitorPrice) ? 'badge-yes' : 'badge-no'}>
                  {calc.sellingPrice <= n(competitorPrice) ? 'Yes' : 'No - above competitor price'}
                </span>
              ) : (
                <SelectField
                  value={priceCompetitive}
                  onChange={setPriceCompetitive}
                  options={[
                    { value: '', label: 'Select…' },
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                  ]}
                />
              )}
            </div>
            <div className="check-row">
              <span>Fast or slow moving item?</span>
              <SelectField
                value={itemSpeed}
                onChange={setItemSpeed}
                options={[
                  { value: '', label: 'Select…' },
                  { value: 'fast', label: 'Fast' },
                  { value: 'slow', label: 'Slow' },
                ]}
              />
            </div>
            <div className="check-row">
              <span>Is this product seasonal?</span>
              <div className="inline-group">
                <SelectField
                  value={isSeasonal}
                  onChange={setIsSeasonal}
                  options={[
                    { value: '', label: 'Select…' },
                    { value: 'no', label: 'No' },
                    { value: 'yes', label: 'Yes' },
                  ]}
                />
                {isSeasonal === 'yes' && (
                  <input
                    type="text"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    placeholder="Season / timeframe"
                    className="text-input"
                    style={{ marginLeft: '0.5rem', width: '160px' }}
                  />
                )}
              </div>
            </div>
            <div className="check-row">
              <span>MOQ (minimum order qty)</span>
              <NumInput value={moq} onChange={setMoq} suffix="units" />
            </div>
          </div>
        </SectionCard>

        {/* ── Section 8 ── */}
        <SectionCard number="8" title="Quick Reference: Formulas">
          <div className="formula-grid">
            {[
              ['CBM per box', 'L × W × H ÷ 1,000,000'],
              ['Total CBM', 'CBM per box × number of boxes'],
              ['Freight cost', 'Total CBM × $290'],
              ['Landed cost', 'Supplier cost + all import costs + misc'],
              ['Landed cost per unit', 'Total landed ÷ quantity'],
              ['Selling price', 'Landed per unit ÷ (1 − margin%)'],
              ['Profit per unit', 'Selling price − landed per unit'],
              ['Total profit', 'Profit per unit × units sold'],
              ['ROI', 'Total profit ÷ total landed × 100'],
            ].map(([formula, calc]) => (
              <div key={formula} className="formula-row">
                <span className="formula-name">{formula}</span>
                <span className="formula-calc">{calc}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── PDF Download ── */}
        <div className="pdf-btn-wrap">
          <button
            className="btn-pdf"
            onClick={downloadPDF}
            disabled={calc.landedPerUnit === 0}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download PDF Summary
          </button>
        </div>

        {/* ── Section 9 ── */}
        <SectionCard number="9" title="Running Calculations Log">
          <p className="section-note">Record each product you calculate to compare over time.</p>
          <div className="log-add">
            <input
              type="text"
              value={logProduct}
              onChange={(e) => setLogProduct(e.target.value)}
              placeholder="Product name"
              className="text-input"
              onKeyDown={(e) => e.key === 'Enter' && addToLog()}
            />
            <button
              className="btn-add"
              onClick={addToLog}
              disabled={!logProduct || calc.landedPerUnit === 0}
            >
              Save current calc →
            </button>
          </div>
          {log.length === 0 ? (
            <p className="empty-log">No entries yet. Complete a calculation above and save it.</p>
          ) : (
            <div className="log-table-wrap">
              <table className="log-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Landed/unit</th>
                    <th>Sell price</th>
                    <th>Margin</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((row, i) => (
                    <tr key={i}>
                      <td>{row.date}</td>
                      <td>{row.product}</td>
                      <td>{row.qty.toLocaleString()}</td>
                      <td>{fmt(row.landedPerUnit)}</td>
                      <td>{fmt(row.sellingPrice)}</td>
                      <td>{row.margin}%</td>
                      <td>
                        <button className="btn-delete" onClick={() => deleteLogEntry(i)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </main>

      <footer className="app-footer">
        Every time you bring in a new product, start from Section 1 and work your way down.
      </footer>
    </div>
  )
}
