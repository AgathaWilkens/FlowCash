// Relatórios view — monthly summary + Chart.js receitas x despesas.
import {
  allMovements,
  getIncomes,
  getExpenses,
  monthTotals,
  totals,
  getCategory,
  paymentIcon,
} from '../store.js';
import {
  formatCurrency,
  monthLabel,
  monthKey,
  currentMonthKey,
  escapeHtml,
  formatDate,
} from '../utils.js';

let chartInstance = null;

export function renderReports(root, { user }) {
  let selectedMonth = currentMonthKey();

  root.innerHTML = `
    <div class="fc-section-head">
      <div>
        <h2 class="fc-page-title"><i class="bi bi-bar-chart-fill me-1"></i>Relatórios</h2>
        <p class="fc-page-subtitle">Acompanhe seu desempenho financeiro</p>
      </div>
      <div class="d-flex align-items-center gap-2">
        <label class="fc-filter-chip mb-0">Mês</label>
        <input type="month" class="form-control" id="monthPicker" value="${selectedMonth}" style="max-width:170px" />
      </div>
    </div>

    <div id="reportBody"></div>
  `;

  const body = root.querySelector('#reportBody');
  const picker = root.querySelector('#monthPicker');

  function draw() {
    selectedMonth = picker.value || currentMonthKey();
    const mt = monthTotals(user.id, selectedMonth);
    const t = totals(user.id);
    const monthMoves = allMovements(user.id).filter(
      (m) => monthKey(m.date) === selectedMonth
    );
    const totalMoves = allMovements(user.id).length;

    body.innerHTML = `
      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-xl-3">
          <div class="fc-stat fc-stat-income">
            <div class="fc-stat-icon"><i class="bi bi-arrow-down-circle"></i></div>
            <p class="fc-stat-label">Receitas do mês</p>
            <p class="fc-stat-value text-income">${formatCurrency(mt.income)}</p>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="fc-stat fc-stat-expense">
            <div class="fc-stat-icon"><i class="bi bi-arrow-up-circle"></i></div>
            <p class="fc-stat-label">Despesas do mês</p>
            <p class="fc-stat-value text-expense">${formatCurrency(mt.expense)}</p>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="fc-stat fc-stat-profit">
            <div class="fc-stat-icon"><i class="bi bi-graph-up-arrow"></i></div>
            <p class="fc-stat-label">Lucro do mês</p>
            <p class="fc-stat-value ${mt.profit < 0 ? 'text-expense' : 'text-income'}">${formatCurrency(mt.profit)}</p>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="fc-stat fc-stat-balance">
            <div class="fc-stat-icon"><i class="bi bi-wallet2"></i></div>
            <p class="fc-stat-label">Saldo atual</p>
            <p class="fc-stat-value ${t.balance < 0 ? 'text-expense' : 'text-income'}">${formatCurrency(t.balance)}</p>
            <p class="fc-stat-sub">${totalMoves} movimentações no total</p>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-lg-7">
          <div class="fc-card fc-card-pad h-100">
            <h5 class="fw-bold mb-1">Receitas x Despesas</h5>
            <p class="fc-sub-text mb-3">${monthLabel(selectedMonth)}</p>
            <div class="fc-chart-wrap"><canvas id="cmpChart"></canvas></div>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="fc-card fc-card-pad h-100">
            <h5 class="fw-bold mb-3">Movimentações do mês</h5>
            <p class="fc-sub-text mb-3">${monthMoves.length} lançamento(s)</p>
            <div class="fc-chart-wrap"><canvas id="trendChart"></canvas></div>
          </div>
        </div>
      </div>

      <div class="fc-card mt-4">
        <div class="fc-card-pad pb-0">
          <h5 class="fw-bold mb-3">Detalhamento do mês</h5>
        </div>
        <div class="fc-table-wrap">
          <table class="table table-hover align-middle">
            <thead>
              <tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Categoria</th><th>Pagamento</th><th class="text-end">Valor</th></tr>
            </thead>
            <tbody>
              ${
                monthMoves.length === 0
                  ? `<tr><td colspan="6"><div class="fc-empty"><i class="bi bi-inboxes"></i><h5>Sem movimentações</h5><p class="mb-0">Nenhum lançamento em ${monthLabel(selectedMonth)}.</p></div></td></tr>`
                  : monthMoves.map(rowHTML).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    renderCharts(user, selectedMonth);
  }

  function rowHTML(m) {
    const cat = getCategory(user.id, m.categoryId);
    const isIn = m.type === 'income';
    return `
      <tr>
        <td class="fc-sub-text">${formatDate(m.date)}</td>
        <td><span class="fc-badge ${isIn ? 'fc-badge-income' : 'fc-badge-expense'}">${isIn ? 'Receita' : 'Despesa'}</span></td>
        <td class="fc-desc">${escapeHtml(m.description)}</td>
        <td>${escapeHtml(cat?.name || '—')}</td>
        <td><span class="fc-pay"><i class="bi ${paymentIcon(m.payment)}"></i> ${m.payment}</span></td>
        <td class="text-end fc-mono ${isIn ? 'text-income' : 'text-expense'}">${isIn ? '+' : '−'} ${formatCurrency(m.value)}</td>
      </tr>
    `;
  }

  picker.addEventListener('change', draw);
  draw();
}

function renderCharts(user, selectedMonth) {
  if (chartInstance) {
    chartInstance.forEach((c) => c && c.destroy());
  }
  chartInstance = [];

  const mt = monthTotals(user.id, selectedMonth);
  const ctx1 = document.getElementById('cmpChart');
  if (ctx1 && window.Chart) {
    chartInstance.push(
      new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: ['Receitas', 'Despesas', 'Lucro'],
          datasets: [
            {
              data: [mt.income, mt.expense, mt.profit],
              backgroundColor: ['#16a34a', '#dc2626', '#0891b2'],
              borderRadius: 8,
              maxBarThickness: 70,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (v) =>
                  'R$ ' + Number(v).toLocaleString('pt-BR'),
              },
            },
          },
        },
      })
    );
  }

  // last 6 months trend
  const months = [];
  const labels = [];
  let y = Number(selectedMonth.slice(0, 4));
  let mo = Number(selectedMonth.slice(5, 7));
  for (let i = 5; i >= 0; i--) {
    let tm = mo - i;
    let ty = y;
    while (tm <= 0) {
      tm += 12;
      ty -= 1;
    }
    const key = `${ty}-${String(tm).padStart(2, '0')}`;
    months.push(key);
    labels.push(monthLabel(key).split(' ')[0].slice(0, 3));
  }
  const incData = months.map((k) => monthTotals(user.id, k).income);
  const expData = months.map((k) => monthTotals(user.id, k).expense);

  const ctx2 = document.getElementById('trendChart');
  if (ctx2 && window.Chart) {
    chartInstance.push(
      new Chart(ctx2, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Receitas',
              data: incData,
              borderColor: '#16a34a',
              backgroundColor: 'rgba(22,163,74,0.12)',
              fill: true,
              tension: 0.35,
              pointRadius: 3,
            },
            {
              label: 'Despesas',
              data: expData,
              borderColor: '#dc2626',
              backgroundColor: 'rgba(220,38,38,0.12)',
              fill: true,
              tension: 0.35,
              pointRadius: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12 } },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (v) => 'R$ ' + Number(v).toLocaleString('pt-BR'),
              },
            },
          },
        },
      })
    );
  }
}
