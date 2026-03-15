import { useState, useMemo, useEffect, useCallback } from 'react'
import jsPDF from 'jspdf'

// --- Currency definitions ---
const CURRENCIES = {
  USD: { symbol: '$',     name: 'US Dollar',           flag: '🇺🇸' },
  CAD: { symbol: 'CA$',  name: 'Canadian Dollar',      flag: '🇨🇦' },
  CNY: { symbol: '¥',    name: 'Chinese Yuan',         flag: '🇨🇳' },
  AUD: { symbol: 'A$',   name: 'Australian Dollar',    flag: '🇦🇺' },
  GBP: { symbol: '£',    name: 'British Pound',        flag: '🇬🇧' },
  AED: { symbol: 'AED ', name: 'UAE Dirham',           flag: '🇦🇪' },
  GHS: { symbol: 'GHS',   name: 'Ghana Cedi',           flag: '🇬🇭' },
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
      const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' })
      const data = await res.json()
      if (data.result === 'success') {
        setRates(data.rates)
        setRatesUpdated(new Date().toLocaleString())
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

  // Conversion: USD -> display currency (cbmRate is always entered in USD)
  const usdToDisplayRate = useMemo(() => {
    if (!rates[displayCurrency]) return 1
    return rates[displayCurrency] // API base is USD so rates[X] = X per 1 USD
  }, [rates, displayCurrency])

  const sym = CURRENCIES[displayCurrency]?.symbol || displayCurrency + ' '
  const supSym = CURRENCIES[supplierCurrency]?.symbol || supplierCurrency + ' '
  const fmt = useMemo(() => makeFmt(sym), [sym])

  // -- Section 1 - Real data --
  const [supplierPrice, setSupplierPrice] = useState('')
  const [quantity, setQuantity] = useState('')

  // -- Section 1b - Assumption --
  const [expensesPct, setExpensesPct] = useState('')
  const [productName, setProductName] = useState('')

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
    const qty = n(quantity)
    const totalSupplierCostReal = supPriceRaw * qty
    const totalSupplierCostAssumed = supPriceAssumed * qty

    const L = n(boxLength), W = n(boxWidth), H = n(boxHeight)
    const upb = n(unitsPerBox)
    const rate = n(cbmRate) || 290
    const totalBoxes = upb > 0 ? Math.ceil(qty / upb) : 0 // Fractional boxes take up space of full boxes
    const cbmPerBox = (L * W * H) / 1_000_000
    const totalCbm = cbmPerBox * totalBoxes
    const freightCost = totalCbm * rate * usdToDisplayRate // rate is USD

    // Factors
    const dutyRate = n(customsDutyPct) / 100
    const agentFeeN = n(agentFee)
    const harbourN = n(harbourCharges)
    const miscItems = [n(fumigation), n(localTransport), n(storage), n(packaging), n(phoneAdmin), n(other1Amount), n(other2Amount)]
    const totalMisc = miscItems.reduce((a, b) => a + b, 0)

    // A) Real Scenario
    const customsDuty = totalSupplierCostReal * dutyRate
    const currencyBuffer = totalSupplierCostReal * 0.07
    const damageBuffer = totalSupplierCostReal * 0.03
    const totalImportCosts = freightCost + customsDuty + agentFeeN + harbourN + currencyBuffer + damageBuffer
    
    const totalLanded = totalSupplierCostReal + totalImportCosts + totalMisc
    const landedPerUnit = qty > 0 ? totalLanded / qty : 0

    const mg = n(margin) / 100
    // Support both Gross Margin (mg < 1) and Markup (mg >= 1) to prevent breaking if user enters 100% or more
    const sellingPrice = landedPerUnit > 0 ? (mg < 1 ? landedPerUnit / (1 - mg) : landedPerUnit * (1 + mg)) : 0
    const profitPerUnit = sellingPrice - landedPerUnit
    const totalProfit = profitPerUnit * qty
    const totalRevenue = sellingPrice * qty
    const roi = totalLanded > 0 ? (totalProfit / totalLanded) * 100 : 0

    // B) Assumption (+ expenses % Scenario)
    // Scale all variables that depend on supplier cost!
    const customsDutyAssumed = totalSupplierCostAssumed * dutyRate
    const currencyBufferAssumed = totalSupplierCostAssumed * 0.07
    const damageBufferAssumed = totalSupplierCostAssumed * 0.03
    const totalImportCostsAssumed = freightCost + customsDutyAssumed + agentFeeN + harbourN + currencyBufferAssumed + damageBufferAssumed
    const totalLandedAssumed = totalSupplierCostAssumed + totalImportCostsAssumed + totalMisc
    const landedPerUnitAssumed = qty > 0 ? totalLandedAssumed / qty : 0
    const sellingPriceAssumed = landedPerUnitAssumed > 0 ? (mg < 1 ? landedPerUnitAssumed / (1 - mg) : landedPerUnitAssumed * (1 + mg)) : 0

    // ── Agent's Quote Scenario (35% CIF Duty) ──
    const customsDutyAt35 = (totalSupplierCostAssumed + freightCost) * 0.35 // 35% of CIF (Cost + Freight)
    const totalImportCostsWith35 = customsDutyAt35 + agentFeeN + harbourN // Freight excluded from final addition as requested
    const totalLandedWith35 = totalSupplierCostAssumed + totalImportCostsWith35 + totalMisc
    const landedPerUnitWith35 = qty > 0 ? totalLandedWith35 / qty : 0
    
    // Agent's Quote Profit
    const sellingPriceWith35 = landedPerUnitWith35 > 0 ? (mg < 1 ? landedPerUnitWith35 / (1 - mg) : landedPerUnitWith35 * (1 + mg)) : 0
    const profitPerUnitWith35 = sellingPriceWith35 - landedPerUnitWith35
    const totalProfitWith35 = profitPerUnitWith35 * qty
    const roiWith35 = totalLandedWith35 > 0 ? (totalProfitWith35 / totalLandedWith35) * 100 : 0

    return {
      totalSupplierCostReal, totalSupplierCostAssumed, totalBoxes, cbmPerBox, totalCbm, freightCost,
      customsDuty, currencyBuffer, damageBuffer, totalImportCosts,
      totalMisc, totalLanded, landedPerUnit,
      sellingPrice, profitPerUnit, totalProfit, totalRevenue, roi,
      
      // Real aliases for UI
      landedPerUnitReal: landedPerUnit,
      sellingPriceReal: sellingPrice,

      // Assumed output
      landedPerUnitAssumed,
      sellingPriceAssumed,

      // 35% scenario
      customsDutyAt35, totalImportCostsWith35, totalLandedWith35, landedPerUnitWith35,
      sellingPriceWith35, profitPerUnitWith35, totalProfitWith35, roiWith35,
      
      // per box metrics
      landedPerBox: upb > 0 ? landedPerUnit * upb : 0,
      landedPerBoxWith35: upb > 0 ? landedPerUnitWith35 * upb : 0,
      unitsPerBoxN: upb,
    }
  }, [
    supplierPrice, quantity, boxLength, boxWidth, boxHeight, unitsPerBox, cbmRate,
    customsDutyPct, agentFee, harbourCharges, fumigation, localTransport, storage,
    packaging, phoneAdmin, other1Amount, other2Amount, margin, supConvRate,
    expensesPct, usdToDisplayRate,
  ])

  const buildPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const blue = [37, 99, 235]
    const lightBlue = [239, 246, 255]
    const darkText = [30, 42, 74]
    const muted = [100, 116, 139]
    const pageW = doc.internal.pageSize.getWidth()
    let y = 0

    // Header
    doc.setFillColor(...blue)
    doc.rect(0, 0, pageW, 30, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(160, 200, 255)
    doc.text('IMPORT CALCULATION REPORT', 14, 9)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(255, 255, 255)
    doc.text(productName || 'Unnamed Product', 14, 21)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(200, 220, 255)
    doc.text(new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' }), pageW - 14, 10, { align: 'right' })
    doc.text(`Currency: ${displayCurrency}  |  Supplier: ${supplierCurrency}${supplierCurrency !== displayCurrency ? `  |  1 ${supplierCurrency} = ${supConvRate.toFixed(4)} ${displayCurrency}` : ''}`, pageW - 14, 17, { align: 'right' })
    doc.text(`Qty: ${n(quantity).toLocaleString()} units  |  Margin: ${n(margin)}%`, pageW - 14, 24, { align: 'right' })
    y = 38

    // Key numbers box
    const boxH = 24
    doc.setFillColor(...lightBlue)
    doc.roundedRect(14, y, pageW - 28, boxH, 2, 2, 'F')
    doc.setDrawColor(...blue)
    doc.setLineWidth(0.4)
    doc.roundedRect(14, y, pageW - 28, boxH, 2, 2, 'S')
    const kpis = [
      ['LANDED / UNIT', fmt(calc.landedPerUnit)],
      ['SELL PRICE',    fmt(calc.sellingPrice)],
      ['TOTAL PROFIT',  fmt(calc.totalProfit)],
      ['ROI',           pct(calc.roi)],
    ]
    const colW = (pageW - 28) / 4
    kpis.forEach(([label, val], i) => {
      const x = 14 + i * colW + colW / 2
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(...muted)
      doc.text(label, x, y + 8, { align: 'center' })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(...blue)
      doc.text(val, x, y + 18, { align: 'center' })
    })
    y += boxH + 8

    // Row helpers
    const addSection = (title) => {
      if (y > 265) { doc.addPage(); y = 15 }
      y += 2
      doc.setFillColor(219, 234, 254)
      doc.rect(14, y - 1, pageW - 28, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(...blue)
      doc.text(title, 18, y + 4.5)
      y += 10
    }
    const addRow = (label, value, highlight = false) => {
      if (y > 272) { doc.addPage(); y = 15 }
      if (highlight) {
        doc.setFillColor(239, 246, 255)
        doc.rect(14, y - 2, pageW - 28, 7.5, 'F')
      }
      doc.setFont('helvetica', highlight ? 'bold' : 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...(highlight ? blue : darkText))
      doc.text(label, 18, y + 3)
      doc.setFont('helvetica', 'bold')
      doc.text(value, pageW - 18, y + 3, { align: 'right' })
      doc.setDrawColor(220, 226, 240)
      doc.setLineWidth(0.15)
      doc.line(14, y + 5.5, pageW - 14, y + 5.5)
      y += 8
    }

    // Section 1
    addSection('COST OF GOODS')
    addRow(`Supplier price / unit (${supplierCurrency})`, supSym + n(supplierPrice).toFixed(2))
    if (supplierCurrency !== displayCurrency) addRow(`Exchange rate (1 ${supplierCurrency})`, `= ${supConvRate.toFixed(4)} ${displayCurrency}`)
    addRow('Quantity', `${n(quantity).toLocaleString()} units`)
    addRow('Total supplier cost', fmt(calc.totalSupplierCostReal), true)
    if (n(expensesPct) > 0) {
      addRow(`Assumed cost (+${n(expensesPct)}% expenses)`, fmt(calc.totalSupplierCostAssumed))
    }

    // Section 2
    addSection('SHIPPING & FREIGHT')
    addRow('Box dimensions (L × W × H)', `${n(boxLength)} × ${n(boxWidth)} × ${n(boxHeight)} cm`)
    addRow('Units per box', plain(n(unitsPerBox)))
    addRow('Total boxes', plain(calc.totalBoxes))
    addRow('Total CBM', `${plain(calc.totalCbm)} CBM`)
    addRow('Rate per CBM (always USD)', `$${(n(cbmRate) || 290).toFixed(2)}`)
    addRow('Freight cost', fmt(calc.freightCost), true)

    const addEstimateSection = (title) => {
      if (y > 265) { doc.addPage(); y = 15 }
      y += 2
      doc.setFillColor(219, 234, 254)
      doc.rect(14, y - 1, pageW - 28, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(29, 78, 216)
      doc.text(`  ▸ ESTIMATE: ${title}`, 18, y + 4.5)
      y += 10
    }

    // Section 3
    addSection('IMPORT COSTS')
    if (n(customsDutyPct)) addRow(`Customs duty (${n(customsDutyPct)}% of supplier cost)`, fmt(calc.customsDuty))
    if (n(agentFee))       addRow('Agent fee', fmt(n(agentFee)))
    if (n(harbourCharges)) addRow('Harbour / port charges', fmt(n(harbourCharges)))
    addRow('Currency buffer (7%)', fmt(calc.currencyBuffer))
    addRow('Damage buffer (3%)', fmt(calc.damageBuffer))
    addRow('Total import costs', fmt(calc.totalImportCosts), true)

    // Section 3 — 35% estimate
      addEstimateSection('AGENT\'S ESTIMATED QUOTE (CLEARANCE & SHIPPING)')
      addRow('Agent flat rate (35% of Cost + Freight)', fmt(calc.customsDutyAt35))
      if (n(agentFee))       addRow('Agent fee', fmt(n(agentFee)))
      if (n(harbourCharges)) addRow('Harbour / port charges', fmt(n(harbourCharges)))
      addRow('Total Agent Quote Estimate', fmt(calc.totalImportCostsWith35), true)
    // Section 4 misc
    const hasMisc = [fumigation, localTransport, storage, packaging, phoneAdmin, other1Amount, other2Amount].some(v => n(v) > 0)
    if (hasMisc) {
      addSection('MISCELLANEOUS COSTS')
      if (n(fumigation))     addRow('Fumigation', fmt(n(fumigation)))
      if (n(localTransport)) addRow('Local transport', fmt(n(localTransport)))
      if (n(storage))        addRow('Storage / warehousing', fmt(n(storage)))
      if (n(packaging))      addRow('Packaging / labelling', fmt(n(packaging)))
      if (n(phoneAdmin))     addRow('Phone calls / admin', fmt(n(phoneAdmin)))
      if (n(other1Amount))   addRow(other1Label || 'Other 1', fmt(n(other1Amount)))
      if (n(other2Amount))   addRow(other2Label || 'Other 2', fmt(n(other2Amount)))
      addRow('Total misc costs', fmt(calc.totalMisc), true)
    }

    // Section 5
    addSection('LANDED COST')
    addRow('Supplier cost', fmt(calc.totalSupplierCostReal))
    addRow('Import costs', fmt(calc.totalImportCosts))
    if (hasMisc) addRow('Misc costs', fmt(calc.totalMisc))
    addRow('Total landed cost', fmt(calc.totalLanded), true)
    addRow('Landed cost per unit', fmt(calc.landedPerUnit), true)
    if (calc.unitsPerBoxN > 0) addRow(`Landed cost per box (${calc.unitsPerBoxN} units/box)`, fmt(calc.landedPerBox), true)

// Section 5 — Agent estimate
      addEstimateSection('LANDED COST (WITH AGENT\'S ESTIMATE)')
      addRow('Assumed Supplier cost', fmt(calc.totalSupplierCostAssumed))
      addRow('Agent Quote Estimate (Freight + Clearance)', fmt(calc.totalImportCostsWith35)) 
      if (hasMisc) addRow('Misc costs', fmt(calc.totalMisc))
      addRow('Total landed cost (Agent Estimate)', fmt(calc.totalLandedWith35), true)
      addRow('Landed cost per unit (Agent Estimate)', fmt(calc.landedPerUnitWith35), true)
      if (calc.unitsPerBoxN > 0) addRow(`Landed cost per box (${calc.unitsPerBoxN} units/box)`, fmt(calc.landedPerBoxWith35), true)

    // Section 6
    addSection('SELLING PRICE & PROFIT')
    addRow('Target margin', `${n(margin)}%`)
    addRow('Selling price per unit (Real)', fmt(calc.sellingPrice), true)
    if (calc.unitsPerBoxN > 0) addRow(`Selling price per box (${calc.unitsPerBoxN} units/box)`, fmt(calc.sellingPrice * calc.unitsPerBoxN), true)
    addRow('Profit per unit (Real)', fmt(calc.profitPerUnit))
    addRow(`Total profit (Real) (${n(quantity).toLocaleString()} units)`, fmt(calc.totalProfit), true)
    addRow('ROI (Real)  (Total profit ÷ Total landed cost)', pct(calc.roi), true)
    
    // Section 6 — Agent estimate
    addEstimateSection('PROFIT (WITH AGENT\'S ESTIMATE)')
    addRow('Selling price per unit (Agent Estimate)', fmt(calc.sellingPriceWith35), true)
    addRow('Profit per unit (Agent Estimate)', fmt(calc.profitPerUnitWith35))
    addRow(`Total profit (Agent Estimate) (${n(quantity).toLocaleString()} units)`, fmt(calc.totalProfitWith35), true)
    addRow('ROI (Agent Estimate)', pct(calc.roiWith35), true)

    // Footer
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(7.5)
      doc.setTextColor(...muted)
      doc.text(`Import Calculator  |  ${productName || 'Unnamed Product'}  |  Page ${i} of ${pageCount}`, pageW / 2, 292, { align: 'center' })
    }
    return doc
  }

  const downloadPDF = () => {
    const doc = buildPDF()
    const safeName = (productName || 'calculation').toLowerCase().replace(/\s+/g, '-')
    doc.save(`${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const downloadLogPDF = (entry) => {
    if (!entry.pdfData) return
    const link = document.createElement('a')
    link.href = entry.pdfData
    const safeName = entry.product.toLowerCase().replace(/\s+/g, '-')
    link.download = `${safeName}-${entry.date.replace(/\//g, '-')}.pdf`
    link.click()
  }

  const addToLog = () => {
    const name = productName.trim() || logProduct.trim()
    if (!name || calc.landedPerUnit === 0) return
    const doc = buildPDF()
    const pdfData = doc.output('datauristring')
    const entry = {
      date: new Date().toLocaleDateString('en-AU'),
      product: name,
      qty: n(quantity),
      landedPerUnit: calc.landedPerUnit,
      sellingPrice: calc.sellingPrice,
      margin: n(margin),
      totalProfit: calc.totalProfit,
      roi: calc.roi,
      pdfData,
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
          <div className="header-brand">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Import Calculator Logo" className="header-logo" />
            <div>
              <h1>Import Calculator</h1>
              <p>Fill in each section from top to bottom. Results calculate automatically.</p>
            </div>
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
                    <strong>{fmt(calc.sellingPrice)}</strong>
                  </div>
                  {calc.unitsPerBoxN > 0 && (
                    <div className="hs-item">
                      <span>Sell price/box</span>
                      <strong>{fmt(calc.sellingPrice * calc.unitsPerBoxN)}</strong>
                    </div>
                  )}
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
                      <strong className="assumed-num">{fmt(calc.sellingPriceAssumed)}</strong>
                    </div>
                    {calc.unitsPerBoxN > 0 && (
                      <div className="hs-item">
                        <span>Sell price/box</span>
                        <strong className="assumed-num">{fmt(calc.sellingPriceAssumed * calc.unitsPerBoxN)}</strong>
                      </div>
                    )}
                  </div>
                )}
                <div className="hs-divider" />
                <div className="hs-item hs-big">
                  <span>Total revenue</span>
                  <strong className="pos-rev">{fmt(calc.totalRevenue)}</strong>
                </div>
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
        {/* Product Name */}
        <div className="product-name-bar">
          <label className="product-name-label">Product Name</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. Stainless Steel Water Bottle"
            className="product-name-input"
          />
        </div>

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
            Sections 2-8 always use <strong>A) Real supplier cost</strong>. B) Assumption is shown in the header for comparison only.
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
            <Field label="Rate per CBM" hint="always USD (default $290)">
              <NumInput value={cbmRate} onChange={setCbmRate} prefix="$" />
            </Field>
          </div>
          <div className="calc-block">
            <Calc label="Total boxes" value={`${plain(calc.totalBoxes)} boxes`} />
            <Calc label="CBM per box" value={`${plain(calc.cbmPerBox)} CBM`} />
            <Calc label="Total CBM" value={`${plain(calc.totalCbm)} CBM`} />
            {displayCurrency !== 'USD' && (
              <Calc label={`USD rate used (1 USD = ${fmt(usdToDisplayRate)} ${displayCurrency})`} value={`$${(n(cbmRate)||290).toFixed(2)}/CBM`} />
            )}
            <Calc label={`Freight cost${displayCurrency !== 'USD' ? ` (converted to ${displayCurrency})` : ''}`} value={fmt(calc.freightCost)} highlight />
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
          {calc.totalSupplierCostReal > 0 && (
            <div className="scenario-35">
              <div className="scenario-35-header">Agent's Estimated Quote (Shipping & Clearance)</div>
              <div className="calc-block">
                <Calc label="Agent flat rate (35% of Cost + Freight)" value={fmt(calc.customsDutyAt35)} />
                <Calc label="Agent fee" value={fmt(n(agentFee))} />
                <Calc label="Harbour / port charges" value={fmt(n(harbourCharges))} />
                <Calc label="Total Agent Quote Estimate" value={fmt(calc.totalImportCostsWith35)} highlight />
              </div>
            </div>
          )}
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
            <Calc label="Total supplier cost (Real)" value={fmt(calc.totalSupplierCostReal)} />
            <Calc label="Total import costs" value={fmt(calc.totalImportCosts)} />
            <Calc label="Total misc costs" value={fmt(calc.totalMisc)} />
            <div className="calc-divider" />
            <Calc label="Total landed cost" value={fmt(calc.totalLanded)} highlight />
            <Calc label="Landed cost per unit" value={fmt(calc.landedPerUnit)} highlight />
            {calc.unitsPerBoxN > 0 && (
              <Calc label={`Landed cost per box (${calc.unitsPerBoxN} units/box)`} value={fmt(calc.landedPerBox)} highlight />
            )}
          </div>
          {calc.totalSupplierCostReal > 0 && (
            <div className="scenario-35">
              <div className="scenario-35-header">Landed cost (With Agent's Estimate)</div>
              <div className="calc-block">
                <Calc label="Assumed Supplier cost" value={fmt(calc.totalSupplierCostAssumed)} />
                <Calc label="Agent Quote Estimate" value={fmt(calc.totalImportCostsWith35)} />
                <Calc label="Total misc costs" value={fmt(calc.totalMisc)} />
                <div className="calc-divider" />
                <Calc label="Total landed cost (Agent Estimate)" value={fmt(calc.totalLandedWith35)} highlight />
                <Calc label="Landed cost per unit (Agent Estimate)" value={fmt(calc.landedPerUnitWith35)} highlight />
                {calc.unitsPerBoxN > 0 && (
                  <Calc label={`Landed cost per box (${calc.unitsPerBoxN} units/box)`} value={fmt(calc.landedPerBoxWith35)} highlight />
                )}
              </div>
            </div>
          )}
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
            <Field label="Target margin (supports both Margin & Markup %)">
              <NumInput value={margin} onChange={setMargin} suffix="%" />
            </Field>
          </div>
          <div className="calc-block">
            <Calc label={`Selling price (Real Landed)`} value={fmt(calc.sellingPrice)} highlight />
            <Calc label="Profit per unit (Real)" value={fmt(calc.profitPerUnit)} />
            <Calc label={`Total profit (Real) (${n(quantity).toLocaleString()} units)`} value={fmt(calc.totalProfit)} highlight />
            <Calc label="ROI (Real)" value={pct(calc.roi)} highlight />
          </div>
          {calc.totalSupplierCostReal > 0 && (
            <div className="scenario-35">
              <div className="scenario-35-header">Profit with Agent's Estimated Quote</div>
              <div className="calc-block">
                <Calc label="Selling price (Agent Estimate)" value={fmt(calc.sellingPriceWith35)} highlight />
                <Calc label="Profit per unit (Agent Estimate)" value={fmt(calc.profitPerUnitWith35)} />
                <Calc label={`Total profit (Agent Estimate)`} value={fmt(calc.totalProfitWith35)} highlight />
                <Calc label="ROI (Agent Estimate)" value={pct(calc.roiWith35)} highlight />
              </div>
            </div>
          )}
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
              ['Freight cost', 'Total CBM × rate'],
              ['Landed cost', 'Supplier cost + all import costs + misc'],
              ['Landed cost per unit', 'Total landed ÷ quantity'],
              ['Selling price', 'Landed per unit ÷ (1 − margin%) OR Landed × (1 + markup%)'],
              ['Profit per unit', 'Selling price − landed per unit'],
              ['Total profit', 'Profit per unit × qty'],
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
          <p className="section-note">Save each product calculation — a PDF is stored with each entry so you can re-download it any time.</p>
          <div className="log-add">
            <input
              type="text"
              value={productName.trim() ? '' : logProduct}
              onChange={(e) => setLogProduct(e.target.value)}
              placeholder={productName.trim() ? `Saving as: "${productName}"` : 'Product name (or set it at the top)'}
              className="text-input"
              disabled={!!productName.trim()}
              onKeyDown={(e) => e.key === 'Enter' && addToLog()}
            />
            <button
              className="btn-add"
              onClick={addToLog}
              disabled={(!productName.trim() && !logProduct.trim()) || calc.landedPerUnit === 0}
            >
              Save + store PDF →
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
                    <th>ROI</th>
                    <th>PDF</th>
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
                      <td>{row.roi != null ? pct(row.roi) : '-'}</td>
                      <td>
                        {row.pdfData
                          ? <button className="btn-dl-pdf" onClick={() => downloadLogPDF(row)} title="Download PDF">⬇ PDF</button>
                          : <span className="no-pdf">-</span>}
                      </td>
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
