let chartTrend = null;
let chartPenjualan = null;
let chartStatus = null;
let chartTopKecamatan = null;
let chartTopKendaraan = null;
let chartPenjualanPie = null;
let chartPenjualanFinco = null;
let chartProdukTahun = null;
let chartSupervisor = null;
let chartPie = null;
let chartBar = null;
let chartTrendPekerjaan = null;
let chartPiePelanggan = null;
let chartBarPelanggan = null;
let chartTrendPelanggan = null;
let chartPenjualanWiraniaga = null;

const navItems = document.querySelectorAll(".nav-item");
const pageTitle = document.getElementById("page-title");
const breadcrumb = document.getElementById("breadcrumb");
const content = document.getElementById("content");

/* =====================
   NAV CLICK
===================== */
navItems.forEach(item => {
  item.addEventListener("click", () => {
    const page = item.dataset.page;
    loadPage(page);
  });
});

/* =====================
   LOAD PAGE (CORE)
===================== */
function loadPage(page) {

  navItems.forEach(i => i.classList.remove("active"));
  document
    .querySelector(`.nav-item[data-page="${page}"]`)
    ?.classList.add("active");

  const pageNames = {
    home: "Beranda",
    overview: "Ringkasan",
    "performa-sales": "Performa Sales",
    trend: "Tren",
    penjualan: "Penjualan",
    produk: "Produk",
    pekerja: "Pekerja",
    pelanggan: "Customer RO",
    wilayah: "Wilayah",
    unduhdata: "Unduh Data",
  };

  breadcrumb.innerHTML = `
    <span>Navigasi</span> - <span>${pageNames[page]}</span>
  `;


  pageTitle.innerText = pageNames[page];

  updatePage(page);

  switch (page) {
    case "home": loadHome(); break;
    case "overview": loadOverview(); break;
    case "performa-sales": loadPerformaSales(); break;
    case "trend": loadTrend(); break;
    case "penjualan": loadPenjualan(); break;
    case "produk": loadProduk(); break;
    case "pekerja": loadPekerja(); break;
    case "pelanggan": loadPelanggan(); break;
    case "wilayah": loadWilayah(); break;
    case "unduhdata": loadUnduhData(); break;
  }
}

function getGlobalFilters() {
  return {
    penjualan: document.getElementById("filter-penjualan")?.value,
    wiraniaga: document.getElementById("filter-wiraniaga")?.value,
    salesman_status: document.getElementById("filter-status")?.value,
    supervisor: document.getElementById("filter-supervisor")?.value,
    start_date: document.getElementById("startDate")?.value,
    end_date: document.getElementById("endDate")?.value
  };
}

function buildQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v && v !== "All") q.append(k, v);
  });
  return q.toString();
}

const BASE_URL = "https://dashboard-penjualan-krida-production.up.railway.app";

async function loadFilters() {
  const res = await fetch(`${BASE_URL}/filters`)
  const data = await res.json()

  fillSelect("filter-penjualan", data.penjualan)
  fillSelect("filter-wiraniaga", data.wiraniaga)
  fillSelect("filter-status", data.salesman_status)
  fillSelect("filter-supervisor", data.supervisor)
}

function fillSelect(id, items) {
  const select = document.getElementById(id);
  if (!select || !Array.isArray(items)) return;

  select.querySelectorAll("option:not(:first-child)").forEach(o => o.remove());

  items.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item;
    opt.textContent = item;
    select.appendChild(opt);
  });
}

function updatePage(page) {

  // BERANDA TANPA FILTER
  if (page === "home" || page === "unduhdata") {
    document.getElementById("filter-container").innerHTML = "";
    return;
  }

  // HALAMAN LAIN PAKAI FILTER
  if (!document.querySelector(".filter-bar")) {
    document.getElementById("filter-container").innerHTML =
      document.getElementById("filter-template").innerHTML;

    loadFilters();
    document.querySelectorAll(".global-filter").forEach(el => {
      el.addEventListener("change", () => {
        const active = document.querySelector(".nav-item.active")?.dataset.page;
        if (!active) return;

        switch (active) {
          case "overview": loadOverview(); break;
          case "trend": loadTrend(); break;
          case "performa-sales": loadPerformaSales(); break;
          case "penjualan": loadPenjualan(); break;
          case "produk": loadProduk(); break;
          case "pekerja": loadPekerja(); break;
          case "pelanggan": loadPelanggan(); break;
          case "wilayah": loadWilayah(); break;
        }

      });
    });
  }
}

/* =====================
   REFRESH
===================== */
async function refreshData() {
  try {
    const res = await fetch(`${BASE_URL}/refresh`, {
      method: "POST"
    });

    const data = await res.json();
    alert(data.message);
  } catch (err) {
    alert("Gagal refresh data");
  }
}

/* =====================
   PAGES
===================== */

function loadHome() {
  content.innerHTML = `
    <div class="home-page">

      <h2 class="home-title">
        Dirancang untuk Membuat Bisnis Lebih Efisien dan Lebih Menguntungkan
      </h2>

      <p>
        <strong>Dashboard Penjualan PT Krida Dinamik Autonusa Cabang Bima</strong>
        merupakan aplikasi visualisasi data yang dirancang untuk mendukung
        kebutuhan operasional harian dealer secara menyeluruh.
        Dashboard ini menjadi alat bantu utama dalam memantau performa
        penjualan secara cepat, akurat, dan terintegrasi.
      </p>

      <p>
        Sistem ini mengintegrasikan berbagai aspek penting dalam proses bisnis
        dealer, mulai dari transaksi penjualan, metode pembayaran, kinerja
        sales dan supervisor, hingga analisis pelanggan dan wilayah.
        Dengan pendekatan berbasis data, manajemen dapat melakukan evaluasi
        dan pengambilan keputusan secara lebih efektif.
      </p>

      <p>
        Dashboard ini dikembangkan menggunakan teknologi berbasis cloud
        sehingga tidak memerlukan investasi infrastruktur IT yang besar.
        Aplikasi dapat diakses melalui berbagai perangkat dan sistem operasi
        tanpa memerlukan lisensi tambahan.
      </p>

    </div>
  `;
}

async function loadOverview() {
  content.innerHTML = `
        <div class="overview-page">
            <div class="summary-grid">
                <div class="summary-card total-transaksi">
                    <h3>Total Penjualan</h3>
                    <div id="summary-total" class="summary-content">-</div>
                </div>

                <div class="summary-card">
                    <h3>Penjualan Bulanan</h3>
                    <div id="summary-bulanan" class="summary-content">-</div>
                </div>

                <div class="summary-card">
                    <h3>Tipe Kendaraan Terlaris</h3>
                    <div id="summary-kendaraan" class="summary-content">-</div>
                </div>

                <div class="summary-card">
                    <h3>Kecamatan Terlaris</h3>
                    <div id="summary-kecamatan" class="summary-content">-</div>
                </div>
            </div>

            <div class="card chart-card">
                <h3>Tren Penjualan</h3>
                <canvas id="trendChart"></canvas>
            </div>

            <div class="card">
                <h3>Penjualan per Wiraniaga</h3>
                <div class="dropdown-top-wiraniaga">
                    <select id="selectTopWiraniaga">
                        <option value="5" selected>Top 5</option>
                        <option value="10">Top 10</option>
                        <option value="all">All</option>
                    </select>
                </div>
                <canvas id="chartPenjualanWiraniaga"></canvas>
            </div>

            <div class="grid-2">
                <div class="card"><h3>Distribusi Metode Penjualan</h3><canvas id="piePenjualan"></canvas></div>
                <div class="card"><h3>Penjualan Per Status Sales</h3><canvas id="statusSales"></canvas></div>
            </div>

            <div class="grid-2">
                <div class="card"><h3>Top Kecamatan</h3><canvas id="topKecamatan"></canvas></div>
                <div class="card"><h3>Top Kendaraan</h3><canvas id="topKendaraan"></canvas></div>
            </div>
        </div>
    `;

  const filters = getGlobalFilters();
  const query = buildQuery(filters);
  const res = await fetch(`${BASE_URL}/overview?${query}`);
  const data = await res.json();
  const p = data.penjualan;

  document.getElementById("summary-total").innerHTML = `
        <div class="total-big-number">${p.total_all.toLocaleString()}</div>
        <div class="item border-top"><strong>Outlook Bulan Depan:</strong> <span>${p.prediksi_bulan_depan.toLocaleString()}</span></div>
  `;

  const deltaClass = p.selisih > 0 ? 'up' : p.selisih < 0 ? 'down' : 'neutral';
  const deltaIcon = p.selisih > 0 ? '▲' : p.selisih < 0 ? '▼' : '•';

  const prediksiBulanIni = p.prediksi_bulan_ini ?? 0;

  document.getElementById("summary-bulanan").innerHTML = `
      <div class="summary-list">
          <div class="item"><strong>M:</strong> <span>${p.total_ini}</span></div>
          <div class="item"><strong>-M:</strong> <span>${p.total_lalu}</span></div>
          <div class="delta-badge ${deltaClass}">
              ${deltaIcon} ${Math.abs(p.selisih)} Penjualan
          </div>
          <div class="item border-top"><strong>Outlook Bulan Ini:</strong> <span>${prediksiBulanIni.toLocaleString()}</span></div>
      </div>
  `;

  document.getElementById("summary-kendaraan").innerHTML = `
        <div class="summary-list">
            <div class="item-stack">
                <strong class="label-mini">M:</strong>
                <span class="value-main">${data.top_kendaraan.bulan_ini.label} <span>(${data.top_kendaraan.bulan_ini.jumlah})</span></span>
            </div>
            <div class="item-stack">
                <strong class="label-mini">-M:</strong>
                <span class="value-sub">${data.top_kendaraan.bulan_lalu.label} (${data.top_kendaraan.bulan_lalu.jumlah})</span>
            </div>
        </div>
    `;

  document.getElementById("summary-kecamatan").innerHTML = `
        <div class="summary-list">
            <div class="item-stack">
                <strong class="label-mini">M:</strong>
                <span class="value-main">${data.top_kecamatan.bulan_ini.label} <span>(${data.top_kecamatan.bulan_ini.jumlah})</span></span>
            </div>
            <div class="item-stack">
                <strong class="label-mini">-M:</strong>
                <span class="value-sub">${data.top_kecamatan.bulan_lalu.label} (${data.top_kecamatan.bulan_lalu.jumlah})</span>
            </div>
        </div>
    `;

  renderCharts(data);
}

function renderCharts(data) {
  const trendCtx = document.getElementById("trendChart").getContext("2d");

  // ===== GRADIENT =====
  const gradientBulanan = trendCtx.createLinearGradient(0, 0, 0, 300);
  gradientBulanan.addColorStop(0, "rgba(199,55,51,0.25)"); // #C73333
  gradientBulanan.addColorStop(1, "rgba(199,55,51,0)");

  const gradientMingguan = trendCtx.createLinearGradient(0, 0, 0, 300);
  gradientMingguan.addColorStop(0, "rgba(233,119,0,0.25)"); // #E97700
  gradientMingguan.addColorStop(1, "rgba(233,119,0,0)");

  const gradientHarian = trendCtx.createLinearGradient(0, 0, 0, 300);
  gradientHarian.addColorStop(0, "rgba(255,183,3,0.25)"); // #FFB703
  gradientHarian.addColorStop(1, "rgba(255,183,3,0)");

  // ===== SAFETY =====
  if (!data.trend_harian || data.trend_harian.length === 0) return;
  if (chartTrend) chartTrend.destroy();

  // ===== MODE =====
  const isMingguanMode = data.trend_mingguan && data.trend_mingguan.length > 0;

  // ===== LABEL & DATA =====
  const labels = data.trend_harian.map(d => d.tanggal);
  const values = data.trend_harian.map(d => d.jumlah);

  // ===== DATASETS =====
  const datasets = [];

  // ===== HARIAN / BULANAN =====
  datasets.push({
    label: isMingguanMode ? "Harian" : "Bulanan",
    data: values,

    borderColor: isMingguanMode ? "#FFB703" : "#C73333",
    backgroundColor: isMingguanMode ? gradientHarian : gradientBulanan,

    fill: true,
    tension: 0.35,
    borderWidth: 3,

    pointRadius: 4,
    pointHoverRadius: 7,
    pointBackgroundColor: isMingguanMode ? "#FFB703" : "#C73333",
    pointBorderColor: "#fff",
    pointBorderWidth: 2
  });

  // ===== MINGGUAN =====
  if (isMingguanMode) {
    const weeklySum = [];
    let tempSum = 0;

    values.forEach((val, i) => {
      tempSum += val;

      // Setiap 7 hari ATAU hari terakhir data
      if ((i + 1) % 7 === 0 || i === values.length - 1) {
        weeklySum.push(tempSum);
        tempSum = 0;
      } else {
        weeklySum.push(null);
      }
    });

    datasets.push({
      label: "Mingguan",
      data: weeklySum,

      borderColor: "#E97700",
      backgroundColor: gradientMingguan,

      fill: "-1",          // isi di atas harian
      spanGaps: true,
      tension: 0.35,
      borderWidth: 3,

      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: "#E97700",
      pointBorderColor: "#fff",
      pointBorderWidth: 2
    });
  }

  // ===== HOVER LINE =====
  const hoverLine = {
    id: "hoverLine",
    afterDraw(chart) {
      const act = chart.tooltip?.getActiveElements();
      if (!act?.length) return;

      const { ctx, chartArea } = chart;
      const x = act[0].element.x;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  };

  // ===== RENDER =====
  chartTrend = new Chart(trendCtx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#fff",
          titleColor: "#111",
          bodyColor: "#333",
          borderColor: "#CBD5E1",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          displayColors: false
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          grid: { color: "#f1f5f9" }
        }
      }
    },
    plugins: [hoverLine]
  });

  // PENJUALAN PER WIRANIAGA DENGAN TOP 5/10/ALL
  const wiraniagaLabelsFull = data.penjualan_wiraniaga.map(d => d.wiraniaga);
  const wiraniagaValuesFull = data.penjualan_wiraniaga.map(d => d.jumlah);

  const wiraniagaCtx = document.getElementById("chartPenjualanWiraniaga").getContext("2d");

  function updateWiraniagaChart(topN) {
      let labels, values;

      if (topN === "all") {
          labels = wiraniagaLabelsFull;
          values = wiraniagaValuesFull;
      } else {
          const n = parseInt(topN);
          labels = wiraniagaLabelsFull.slice(0, n);
          values = wiraniagaValuesFull.slice(0, n);
      }

      if (chartPenjualanWiraniaga) chartPenjualanWiraniaga.destroy();

      // Pakai 1 warna solid
      const wiraniagaColors = values.map(() => "#C73333");

      chartPenjualanWiraniaga = new Chart(wiraniagaCtx, {
          type: "bar",
          data: {
              labels: labels,
              datasets: [{
                  label: "Jumlah Penjualan",
                  data: values,
                  backgroundColor: wiraniagaColors, // warna solid
                  borderRadius: 10
              }]
          },
          options: {
              indexAxis: "y",
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: { display: false },
                  tooltip: {
                      callbacks: {
                          label: context => `Jumlah: ${context.parsed.x}`
                      }
                  },
                  datalabels: {
                      anchor: 'end',
                      align: 'end',
                      offset: 6,
                      color: '#333',
                      font: { weight: 'bold', size: 12 },
                      formatter: value => value.toLocaleString()
                  }
              },
              scales: {
                  x: { beginAtZero: true, grid: { display: false }, ticks: { font: { size: 11 } } },
                  y: { grid: { drawTicks: false, color: '#eee' }, ticks: { font: { size: 11 } } }
              },
              animation: { duration: 1500, easing: 'easeOutQuart' }
          },
          plugins: [ChartDataLabels]
      });
  }

  updateWiraniagaChart(document.getElementById("selectTopWiraniaga")?.value || 5);

  document.getElementById("selectTopWiraniaga").onchange = e => {
      updateWiraniagaChart(e.target.value);
  };

let chartPie = null; // global
let chartStatus = null;
let chartTopKecamatan = null;
let chartTopKendaraan = null;

async function renderPieChartModern(filters = {}) {
    try {
        const query = new URLSearchParams(filters).toString();
        const res = await fetch(`${BASE_URL}/overview?${query}`);
        const data = await res.json();
        if (!data.pie_penjualan) return;

        const allMethods = [
            ...new Set([
                ...data.pie_penjualan.bulan_ini.map(d => d.penjualan),
                ...data.pie_penjualan.bulan_lalu.map(d => d.penjualan)
            ])
        ];

        const COLORS = ["#E97700", "#FFB703", "#c73333", "#F97316"];

        const totalBulanLalu = data.pie_penjualan.bulan_lalu.reduce((sum, d) => sum + d.jumlah, 0);
        const totalBulanIni = data.pie_penjualan.bulan_ini.reduce((sum, d) => sum + d.jumlah, 0);

        // Dataset stacked, borderRadius atas saja untuk stack paling atas
        const datasets = allMethods.map((method, i) => ({
            label: method,
            data: [
                data.pie_penjualan.bulan_lalu.find(d => d.penjualan === method)?.jumlah || 0,
                data.pie_penjualan.bulan_ini.find(d => d.penjualan === method)?.jumlah || 0
            ],
            backgroundColor: COLORS[i % COLORS.length],
            borderRadius: { topLeft: i === allMethods.length - 1 ? 8 : 0, topRight: i === allMethods.length - 1 ? 8 : 0, bottomLeft: 0, bottomRight: 0 },
            borderSkipped: false,
            stack: "stack1"
        }));

        const ctx = document.getElementById("piePenjualan").getContext("2d");
        if (chartPie) chartPie.destroy();

        chartPie = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["Bulan Lalu", "Bulan Ini"],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: "index", intersect: false },
                    datalabels: {
                        display: true,
                        color: "#333",
                        font: { weight: "bold", size: 12 },
                        anchor: "end",
                        align: "end",
                        formatter: (_, context) => {
                            // Hanya tampilkan angka di stack paling atas
                            if (context.datasetIndex === allMethods.length - 1) {
                                return context.dataIndex === 0 ? totalBulanLalu : totalBulanIni;
                            }
                            return '';
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: { display: false }, // hilangkan garis horizontal
                        ticks: { font: { size: 11 } }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        grid: {
                            drawTicks: true,
                            drawBorder: true,
                            color: '#e5e7eb', // garis vertikal
                            borderDash: [2, 2]
                        },
                        ticks: { font: { size: 11 } }
                    }
                },
                animation: { duration: 1500, easing: "easeOutQuart" }
            },
            plugins: [ChartDataLabels]
        });

    } catch (err) {
        console.error(err);
    }
}

async function renderStatusSalesChart(filters = {}) {
    try {
        const query = new URLSearchParams(filters).toString();
        const res = await fetch(`${BASE_URL}/overview?${query}`);
        const data = await res.json();
        if (!data.status_sales) return;

        const allStatus = [
            ...new Set([
                ...data.status_sales.bulan_ini.map(d => d.salesman_status),
                ...data.status_sales.bulan_lalu.map(d => d.salesman_status)
            ])
        ];

        const bulanIni = allStatus.map(s => data.status_sales.bulan_ini.find(d => d.salesman_status === s)?.jumlah || 0);
        const bulanLalu = allStatus.map(s => data.status_sales.bulan_lalu.find(d => d.salesman_status === s)?.jumlah || 0);

        const totalBulanLalu = bulanLalu.reduce((a,b) => a+b, 0);
        const totalBulanIni = bulanIni.reduce((a,b) => a+b, 0);

        const COLORS = ["#E97700", "#FFB703", "#c73333", "#F97316"];

        const datasets = allStatus.map((s, i) => ({
            label: s,
            data: [bulanLalu[i], bulanIni[i]],
            backgroundColor: COLORS[i % COLORS.length],
            borderRadius: { topLeft: i === allStatus.length - 1 ? 8 : 0, topRight: i === allStatus.length - 1 ? 8 : 0, bottomLeft: 0, bottomRight: 0 },
            borderSkipped: false,
            stack: "stack1"
        }));

        const ctx = document.getElementById("statusSales").getContext("2d");
        if (chartStatus) chartStatus.destroy();

        chartStatus = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["Bulan Lalu", "Bulan Ini"],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: "index", intersect: false },
                    datalabels: {
                        display: true,
                        color: "#333",
                        font: { weight: "bold", size: 12 },
                        anchor: "end",
                        align: "end",
                        formatter: (_, context) => {
                            if (context.datasetIndex === allStatus.length - 1) {
                                return context.dataIndex === 0 ? totalBulanLalu : totalBulanIni;
                            }
                            return '';
                        }
                    }
                },
                scales: {
                    x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 } } },
                    y: { stacked: true, beginAtZero: true, grid: { color: "#e5e7eb", borderDash: [2,2] }, ticks: { font: { size: 11 } } }
                },
                animation: { duration: 1500, easing: "easeOutQuart" }
            },
            plugins: [ChartDataLabels]
        });

    } catch (err) {
        console.error(err);
    }
}

// Pemanggilan
const filters = getGlobalFilters(); 
renderStatusSalesChart(filters);
renderPieChartModern(filters);

document.querySelectorAll(".filter-input").forEach(el =>
    el.addEventListener("change", () => {
        const filters = getGlobalFilters();
        renderPieChartModern(filters);
        renderStatusSalesChart(filters);
    })
);

  // ===== Top Kecamatan =====
  const kecLabels = data.top10_kecamatan.map(d => d.kecamatan);
  const kecValues = data.top10_kecamatan.map(d => d.jumlah);

  if (chartTopKecamatan) chartTopKecamatan.destroy();

  const ctx = document.getElementById("topKecamatan").getContext("2d");

  const kecColors = kecValues.map(() => "#FFB703");

  chartTopKecamatan = new Chart(ctx, {
      type: "bar",
      data: {
          labels: kecLabels,
          datasets: [{
              data: kecValues,
              backgroundColor: kecColors, // warna solid
              borderRadius: 10
          }]
      },
      options: {
          indexAxis: "y",
          plugins: {
              legend: { display: false },
              tooltip: { enabled: true, mode: 'index', intersect: false },
              datalabels: {
                  anchor: 'end',
                  align: 'end',
                  offset: 6,
                  color: '#333',
                  font: { weight: 'bold', size: 12 },
                  formatter: value => value.toLocaleString()
              }
          },
          scales: {
              x: { grid: { display: false }, ticks: { font: { size: 11 } } },
              y: { grid: { drawTicks: false, color: '#eee' }, ticks: { font: { size: 11 } } }
          },
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 1500, easing: 'easeOutQuart' }
      },
      plugins: [ChartDataLabels]
  });

  // ===== Top Kendaraan =====
  const kenLabels = data.top10_kendaraan.map(d => d.type_kendaraan);
  const kenValues = data.top10_kendaraan.map(d => d.jumlah);

  if (chartTopKendaraan) chartTopKendaraan.destroy();

  const ctxKendaraan = document.getElementById("topKendaraan").getContext("2d");

  const kenColors = kenValues.map(() => "#FFB703");

  chartTopKendaraan = new Chart(ctxKendaraan, {
      type: "bar",
      data: { 
          labels: kenLabels, 
          datasets: [{ 
              data: kenValues, 
              backgroundColor: kenColors, // warna solid
              borderRadius: 10 
          }] 
      },
      options: {
          indexAxis: "y",
          plugins: {
              legend: { display: false },
              tooltip: {
                  enabled: true,
                  mode: 'index',
                  intersect: false,
                  callbacks: { label: context => `Jumlah: ${context.parsed.x}` }
              },
              datalabels: {
                  anchor: 'end',
                  align: 'end',
                  offset: 6,
                  color: '#333',
                  font: { weight: 'bold', size: 12 },
                  formatter: value => value.toLocaleString()
              }
          },
          scales: {
              x: { grid: { display: false }, ticks: { font: { size: 11 } } },
              y: { grid: { drawTicks: false, color: '#eee' }, ticks: { font: { size: 11 } } }
          },
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 1500, easing: 'easeOutQuart' }
      },
      plugins: [ChartDataLabels]
  });

  }

async function loadPerformaSales() {
  content.innerHTML = `
    <div class="card">
      <p style="font-size:13px;color:#666; margin-bottom:10px;">
        Tanggal Invoice Yang Dipilih Wajib 3 Bulan!
      </p>

      <h3 style="margin-bottom:10px;">Performa Sales 3 Bulan Terakhir</h3>

      <div style="overflow:auto;">
        <table class="table" id="tablePerformaSales">
          <thead>
            <tr>
              <th>No</th>
              <th>Sales</th>
              <th id="bulan1"></th>
              <th id="bulan2"></th>
              <th id="bulan3"></th>
              <th>Rata-Rata</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-top:25px;">
      <h3 style="margin-bottom:10px;">Performa Supervisor 3 Bulan Terakhir</h3>

      <div style="overflow:auto;">
        <table class="table" id="tablePerformaSupervisor">
          <thead>
            <tr>
              <th>No</th>
              <th>Supervisor</th>
              <th id="sup-bulan1"></th>
              <th id="sup-bulan2"></th>
              <th id="sup-bulan3"></th>
              <th>Rata-Rata</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  `;

  const filters = getGlobalFilters();
  const query = buildQuery(filters);

  const res = await fetch(`${BASE_URL}/performa-sales?${query}`);
  const data = await res.json();

  const [bulan1, bulan2, bulan3] = data.periode;

  // ================= SALES =================
  document.getElementById("bulan1").innerText = bulan1;
  document.getElementById("bulan2").innerText = bulan2;
  document.getElementById("bulan3").innerText = bulan3;

  const tbodySales = document.querySelector("#tablePerformaSales tbody");
  tbodySales.innerHTML = "";

  data.sales.forEach((d, i) => {
    const p2 = buildPerubahan(d.bulan_1, d.bulan_2);
    const p3 = buildPerubahan(d.bulan_2, d.bulan_3);

    tbodySales.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${d.sales}</td>

        <td style="text-align:center;">
          <div>${d.bulan_1}</div>
        </td>

        <td style="text-align:center;">
          <div>${d.bulan_2}</div>
          ${p2}
        </td>

        <td style="text-align:center;">
          <div>${d.bulan_3}</div>
          ${p3}
        </td>

        <td style="text-align:center;">
          <div>${d.rata_rata_3_bulan}</div>
        </td>
      </tr>
    `;
  });

  // ================= SUPERVISOR =================
  document.getElementById("sup-bulan1").innerText = bulan1;
  document.getElementById("sup-bulan2").innerText = bulan2;
  document.getElementById("sup-bulan3").innerText = bulan3;

  const tbodySup = document.querySelector("#tablePerformaSupervisor tbody");
  tbodySup.innerHTML = "";

  data.supervisor.forEach((d, i) => {
    const p2 = buildPerubahan(d.bulan_1, d.bulan_2);
    const p3 = buildPerubahan(d.bulan_2, d.bulan_3);

    tbodySup.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${d.supervisor}</td>

        <td style="text-align:center;">
          <div>${d.bulan_1}</div>
        </td>

        <td style="text-align:center;">
          <div>${d.bulan_2}</div>
          ${p2}
        </td>

        <td style="text-align:center;">
          <div>${d.bulan_3}</div>
          ${p3}
        </td>

        <td style="text-align:center;">
          <div>${d.rata_rata_3_bulan}</div>
        </td>
      </tr>
    `;
  });
}

function buildPerubahan(prev, curr) {
  const diff = curr - prev;

  if (diff > 0) {
    return `<div style="color:#2ecc71;font-size:12px;">
      ▲ Naik ${diff}
    </div>`;
  }

  if (diff < 0) {
    return `<div style="color:#e74c3c;font-size:12px;">
      ▼ Turun ${Math.abs(diff)}
    </div>`;
  }

  return `<div style="color:#f1c40f;font-size:12px;">
    ― Stabil
  </div>`;
}

async function loadTrend() {
  content.innerHTML = `
    <div class="trend-page">
      <div class="card">
        <h3>Tren Jumlah Penjualan</h3>
        <canvas id="trendTotal"></canvas>
      </div>

      <div class="card">
        <h3>Tren Metode Penjualan</h3>
        <canvas id="trendMetode"></canvas>
      </div>

      <div class="card">
        <h3>Tren Penjualan Berdasarkan FinCo</h3>
        <div style="margin-bottom:10px;">
          <label>Pilih Top FinCo:</label>
          <select id="topFincoSelect">
            <option>Top 5</option>
            <option>Top 10</option>
            <option>Semua</option>
          </select>
        </div>
        <canvas id="trendFinco"></canvas>
      </div>
    </div>
  `;

  const topSelect = document.getElementById("topFincoSelect");

  let chartTotal, chartMetode, chartFinco;

  async function renderCharts(topOption = "Top 5") {
    const filters = getGlobalFilters();
    const query = buildQuery(filters);
    const res = await fetch(`${BASE_URL}/trend?top_n=${topOption}&${query}`);
    const data = await res.json();

    if (chartTotal) chartTotal.destroy();
    if (chartMetode) chartMetode.destroy();
    if (chartFinco) chartFinco.destroy();

    // ================= TREND TOTAL =================
    const totalCtx = document.getElementById("trendTotal").getContext("2d");

    const totalGradient = totalCtx.createLinearGradient(0, 0, 0, 300);
    totalGradient.addColorStop(0, "rgba(188, 38, 38, 0.25)");
    totalGradient.addColorStop(1, "rgba(188, 38, 38, 0)");

    const totalLabels = data.trend_total.map(d => d.periode);
    const totalValues = data.trend_total.map(d => d.jumlah_transaksi);

    const totalHoverLine = {
      id: "totalHoverLine",
      afterDraw(chart) {
        const active = chart.tooltip?.getActiveElements();
        if (!active || !active.length) return;
        const { ctx, chartArea } = chart;
        const x = active[0].element.x;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#C73333";
        ctx.stroke();
        ctx.restore();
      }
    };

    chartTotal = new Chart(totalCtx, {
      type: "line",
      data: {
        labels: totalLabels,
        datasets: [{
          label: "Jumlah",
          data: totalValues,
          borderColor: "#C73333",
          backgroundColor: totalGradient,
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: "#C73333",
          pointBorderColor: "#fff",
          pointBorderWidth: 2
        }]
      },
      options: baseLineOptions(false), 
      plugins: [totalHoverLine, {
        id: "customTooltip",
        beforeEvent: (chart, args) => {
          if (args.event.type === "tooltip") {
            const tooltip = chart.tooltip;
            tooltip.options.callbacks.label = ctx => `Jumlah: ${ctx.parsed.y}`;
          }
        }
      }]
    });

    // ================= TREND METODE =================
    const metodeCtx = document.getElementById("trendMetode").getContext("2d");
    const metodeLabels = [...new Set(data.trend_metode.map(d => d.periode))];
    const metodeTypes = [...new Set(data.trend_metode.map(d => d.penjualan))];

    const metodeDatasets = metodeTypes.map((type, i) => {
      const g = metodeCtx.createLinearGradient(0, 0, 0, 300);
      if (i === 0) { g.addColorStop(0,"rgba(233,119,0,0.35)"); g.addColorStop(1,"rgba(199,51,51,0)"); }
      else { g.addColorStop(0,"rgba(255,183,3,0.35)"); g.addColorStop(1,"rgba(233,119,0,0)"); }

      return {
        label: type,
        data: metodeLabels.map(p => {
          const x = data.trend_metode.find(d => d.periode === p && d.penjualan === type);
          return x ? x.jumlah_transaksi : 0;
        }),
        borderColor: i === 0 ? "#C73333" : "#E97700",
        backgroundColor: g,
        fill: "origin",
        tension: 0.35,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: i === 0 ? "#C73333" : "#E97700",
        pointBorderColor: "#fff",
        pointBorderWidth: 2
      };
    });

    const metodeHoverLine = {
      id: "metodeHoverLine",
      afterDraw(chart) {
        const active = chart.tooltip?.getActiveElements();
        if (!active || !active.length) return;
        const { ctx, chartArea } = chart;
        const x = active[0].element.x;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#e5e7eb";
        ctx.stroke();
        ctx.restore();
      }
    };

    chartMetode = new Chart(metodeCtx, {
      type: "line",
      data: { labels: metodeLabels, datasets: metodeDatasets },
      options: baseLineOptions(false),
      plugins: [metodeHoverLine]
    });

    // ================= TREND FINCO =================
    const fincoCtx = document.getElementById("trendFinco").getContext("2d");
    const fincoLabels = [...new Set(data.trend_finco.map(d => d.periode))];
    const fincoTypes = data.rank_finco;

    const fincoGradients = [
      ["#C73333","#D1470B"],
      ["#D1470B","#E97700"],
      ["#E97700","#FFB703"],
      ["#FFB703","#5dc3ab"],
      ["#5dc3ab","#218a71"]
    ];

    const datasetsFinco = fincoTypes.map((finco,i)=>{
      const g = fincoCtx.createLinearGradient(0,0,0,300);
      const [c1,c2] = fincoGradients[i % fincoGradients.length];
      g.addColorStop(0, `${c1}55`);
      g.addColorStop(1, `${c2}00`);
      return {
        label: finco,
        data: fincoLabels.map(p=>{
          const x = data.trend_finco.find(d=>d.periode===p && d.finco===finco);
          return x ? x.jumlah_transaksi : 0;
        }),
        borderColor: c2,
        backgroundColor: g,
        fill: "origin",
        tension: 0.35,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: c2,
        pointBorderColor: "#fff",
        pointBorderWidth: 2
      };
    });

    const fincoHoverLine = {
      id:"fincoHoverLine",
      afterDraw(chart){
        const active = chart.tooltip?.getActiveElements();
        if(!active||!active.length) return;
        const {ctx,chartArea}=chart;
        const x = active[0].element.x;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x,chartArea.top);
        ctx.lineTo(x,chartArea.bottom);
        ctx.lineWidth=1;
        ctx.strokeStyle="#e5e7eb";
        ctx.stroke();
        ctx.restore();
      }
    };

    chartFinco = new Chart(fincoCtx,{
      type:"line",
      data:{ labels:fincoLabels, datasets:datasetsFinco },
      options: baseLineOptions(false),
      plugins:[fincoHoverLine]
    });

  } // <-- akhir renderCharts

  renderCharts(topSelect.value);
  topSelect.addEventListener("change", () => renderCharts(topSelect.value));

} // <-- akhir loadTrend

// BaseLineOptions modern
function baseLineOptions(showLegend=true){
  return {
    responsive:true,
    maintainAspectRatio:false,
    interaction:{ mode:"index", intersect:false },
    plugins:{
      legend:{
        display:showLegend,
        position:"top",
        labels:{ usePointStyle:true, boxWidth:8 }
      },
      tooltip:{
        backgroundColor:"#fff",
        titleColor:"#111",
        bodyColor:"#333",
        borderColor:"#e5e7eb",
        borderWidth:1,
        padding:12,
        cornerRadius:10,
        displayColors:true,
        callbacks:{ label: ctx=>`${ctx.dataset.label}: ${ctx.parsed.y}` }
      }
    },
    scales:{
      x:{ grid:{ display:false }, ticks:{ color:"#9ca3af" } },
      y:{ beginAtZero:true, grid:{ color:"#f1f5f9", drawBorder:false }, ticks:{ color:"#9ca3af" } }
    }
  };
}

loadTrend();

async function loadPenjualan(filter = "top5") {
  content.innerHTML = `
    <div class="penjualan-page">
      <div class="grid-2">

        <!-- PIE METODE PENJUALAN -->
        <div class="card">
          <h3>Distribusi Metode Penjualan</h3>
          <canvas id="piePenjualan"></canvas>
        </div>

        <!-- FINCO -->
        <div class="card">
          <h3>FinCo (${filter.toUpperCase()})</h3>
          <select id="fincoFilter">
            <option value="top5" ${filter === "top5" ? "selected" : ""}>Top 5</option>
            <option value="top10" ${filter === "top10" ? "selected" : ""}>Top 10</option>
            <option value="all" ${filter === "all" ? "selected" : ""}>Semua</option>
          </select>
          <canvas id="barFinco"></canvas>
        </div>

      </div>
    </div>
  `;

  const COLORS = ["#218a71", "#4FB1A1", "#FCC055", "#EB8D50", "#DF6E5B"];

  // FETCH DATA PENJUALAN
  const filters = getGlobalFilters();
  const query = buildQuery(filters);

  const res = await fetch(`${BASE_URL}/penjualan?top=${filter}&${query}`);
  const data = await res.json();

  // PIE METODE PENJUALAN
  const pieLabels = data.pie_penjualan.map(d => d.penjualan);
  const pieValues = data.pie_penjualan.map(d => d.jumlah);

  if (chartPie) chartPie.destroy();

  const ctxPie = document.getElementById("piePenjualan").getContext("2d");

  // Pakai 2 warna solid
  const PIE_COLORS = ["#E97700", "#FFB703"];
  const pieColors = pieValues.map((_, i) => PIE_COLORS[i % PIE_COLORS.length]);

  chartPie = new Chart(ctxPie, {
      type: "bar",
      data: {
          labels: pieLabels,
          datasets: [{
              label: "Jumlah Penjualan",
              data: pieValues,
              backgroundColor: pieColors, // pakai warna solid
              borderRadius: 10
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
              legend: { display: false },
              tooltip: {
                  enabled: true,
                  mode: 'index',
                  intersect: false,
                  callbacks: {
                      label: context => `Jumlah: ${context.parsed.y}`
                  }
              },
              datalabels: {
                  anchor: 'end',
                  align: 'end',
                  offset: 6,
                  color: '#333',
                  font: { weight: 'bold', size: 12 },
                  formatter: value => value.toLocaleString()
              }
          },
          scales: {
              x: { ticks: { font: { size: 11 } } },
              y: { beginAtZero: true, grid: { display: false }, ticks: { font: { size: 11 } } }
          },
          animation: { duration: 1500, easing: 'easeOutQuart' }
      },
      plugins: [ChartDataLabels]
  });

  // BAR FINCO (HORIZONTAL)
  if (chartPenjualanFinco) chartPenjualanFinco.destroy();

  const ctxFinco = document.getElementById("barFinco").getContext("2d");
  const barCount = data.finco.data.length;

  const FINCO_COLORS = ["#C73333", "#D1470B", "#E97700", "#FFB703", "#5dc3ab"];

  // Warna solid untuk tiap Finco
  const fincoColors = data.finco.data.map((_, i) => FINCO_COLORS[i % FINCO_COLORS.length]);

  chartPenjualanFinco = new Chart(ctxFinco, {
      type: "bar",
      data: {
          labels: data.finco.data.map(d => d.finco),
          datasets: [{
              data: data.finco.data.map(d => d.jumlah_transaksi),
              backgroundColor: fincoColors, // pakai warna solid
              borderRadius: 10
          }]
      },
      options: {
          indexAxis: "y",
          plugins: {
              legend: { display: false },
              tooltip: {
                  enabled: true,
                  mode: "index",
                  intersect: false,
                  callbacks: { label: ctx => `Jumlah: ${ctx.parsed.x}` }
              },
              datalabels: {
                  anchor: 'end',
                  align: 'end',
                  color: '#333',
                  font: { weight: 'bold', size: 12 },
                  formatter: value => value.toLocaleString()
              }
          },
          scales: {
              x: { 
                  beginAtZero: true, 
                  grid: { display: false },
                  ticks: { font: { size: 11 } } 
              },
              y: { 
                  grid: { drawTicks: false, color: '#eee' }, 
                  ticks: { font: { size: 11 } } 
              }
          },
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 1500, easing: 'easeOutQuart' }
      },
      plugins: [ChartDataLabels]
  });

  // HANDLE FILTER FINCO
  document.getElementById("fincoFilter").addEventListener("change", async (e) => {
    await loadPenjualan(e.target.value);
  });
}

async function loadProduk() {
  content.innerHTML = `<div class="produk-page"></div>`;

  // FETCH DATA PRODUK
  const query = buildQuery(getGlobalFilters());

  const res = await fetch(`${BASE_URL}/produk?${query}`);
  const data = await res.json();

  const page = document.querySelector(".produk-page");

  // BAR PENJUALAN PER TAHUN RAKIT
  const cardTahun = document.createElement("div");
  cardTahun.classList.add("card");
  cardTahun.innerHTML = `<h3>Penjualan Per Tahun Rakit</h3><canvas id="barTahunRakit"></canvas>`;
  page.appendChild(cardTahun);

  if (chartProdukTahun) chartProdukTahun.destroy();

  const ctxTahun = document.getElementById("barTahunRakit").getContext("2d");
  const penjualanData = data.penjualan_tahun_rakit;

  const TAHUN_COLORS = ["#C73333", "#D1470B", "#E97700", "#FFB703", "#5dc3ab", "#218a71"];

  // Warna solid untuk tiap tahun
  const tahunColors = penjualanData.map((_, i) => TAHUN_COLORS[i % TAHUN_COLORS.length]);

  chartProdukTahun = new Chart(ctxTahun, {
    type: "bar",
    data: {
      labels: penjualanData.map(d => d.tahun_rakit),
      datasets: [{
        data: penjualanData.map(d => d.jumlah_transaksi),
        backgroundColor: tahunColors, // pakai warna solid
        borderRadius: 10
      }]
    },
    options: {
      indexAxis: "x",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: "nearest",
          intersect: false,
          callbacks: { label: ctx => `Jumlah: ${ctx.parsed.y}` }
        },
        datalabels: {
          color: "#333",
          anchor: "end",
          align: "end",
          offset: 6,
          font: { weight: "bold", size: 12 },
          formatter: value => value.toLocaleString()
        }
      },
      scales: {
        x: { 
          beginAtZero: true,
          grid: { color: "#eee", drawTicks: false, drawBorder: false, lineWidth: 1 }, 
          ticks: { font: { size: 11 } } 
        },
        y: { 
          grid: { display: false },
          ticks: { font: { size: 11 } } 
        }
      },
      animation: { duration: 1500, easing: "easeOutQuart" }
    },
    plugins: [ChartDataLabels]
  });

// TABEL PENJUALAN PER TIPE KENDARAAN
const cardTipe = document.createElement("div");
cardTipe.classList.add("card");
cardTipe.style.display = "flex";
cardTipe.style.flexDirection = "column";
cardTipe.style.padding = "12px";

// Judul
const title = document.createElement("h3");
title.innerText = "Penjualan Per Tipe Kendaraan";
title.style.fontSize = "14px";
title.style.marginBottom = "8px";
cardTipe.appendChild(title);

// Container tabel agar scroll otomatis 
const tableContainer = document.createElement("div");
tableContainer.style.overflowY = "auto";
tableContainer.style.maxHeight = "268px"; 

// Buat tabel
const table = document.createElement("table");
table.classList.add("table");
table.style.width = "100%";
table.style.borderCollapse = "collapse";
table.style.fontSize = "12px";

// Header
const thead = document.createElement("thead");
thead.innerHTML = `
  <tr>
    <th>No</th>
    <th>Tipe Kendaraan</th>
    <th>Jumlah Transaksi</th>
  </tr>
`;
table.appendChild(thead);

// Body
const tbody = document.createElement("tbody");
data.penjualan_tipe_kendaraan.forEach((item, idx) => {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${idx + 1}</td>
    <td>${item.type_kendaraan}</td>
    <td>${item.jumlah_transaksi}</td>
  `;
  tbody.appendChild(tr);
});
table.appendChild(tbody);

// Masukkan tabel ke container
tableContainer.appendChild(table);
cardTipe.appendChild(tableContainer);

// Masukkan card ke halaman
page.appendChild(cardTipe);
}

async function loadPekerja() {
  content.innerHTML = `
    <div class="pekerja-page">

      <!-- PENJUALAN PER SUPERVISOR -->
      <div class="card">
        <h3>Penjualan Per Supervisor</h3>
        <canvas id="barSupervisor"></canvas>
      </div>

      <!-- RINGKASAN WIRANIAGA -->
      <div class="card">
        <h3>Ringkasan Penjualan Wiraniaga</h3>
        <div class="table-wrapper">
          <table id="tableSummaryWiraniaga" class="table">
            <thead>
              <tr>
                <th>No</th>
                <th>Wiraniaga</th>
                <th>Total Penjualan</th>
                <th>Kecamatan Penjualan Terbanyak</th>
                <th>Jumlah Penjualan (Kec)</th>
                <th>Kelurahan Penjualan Terbanyak</th>
                <th>Jumlah Penjualan (Kel)</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>

      <!-- PENJUALAN WIRANIAGA PER KECAMATAN -->
      <div class="card">
        <h3>Penjualan Wiraniaga Per Kecamatan</h3>
        <div class="table-wrapper">
          <table id="tableWiraniagaKecamatan" class="table">
            <thead>
              <tr>
                <th>No</th>
                <th>Wiraniaga</th>
                <th>Kecamatan</th>
                <th>Jumlah Transaksi</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>

      <!-- PENJUALAN WIRANIAGA PER KELURAHAN -->
      <div class="card">
        <h3>Penjualan Wiraniaga Per Kelurahan</h3>
        <div class="table-wrapper">
          <table id="tableWiraniagaKelurahan" class="table">
            <thead>
              <tr>
                <th>No</th>
                <th>Wiraniaga</th>
                <th>Kelurahan</th>
                <th>Jumlah Transaksi</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>

    </div>
  `;

  // FETCH DATA PEKERJA
  const filters = getGlobalFilters();
  const query = buildQuery(filters);
  const res = await fetch(`${BASE_URL}/pekerja?${query}`);
  const data = await res.json();

  // BAR PENJUALAN PER SUPERVISOR
  const supLabels = data.penjualan_supervisor.map(d => d.supervisor);
  const supValues = data.penjualan_supervisor.map(d => d.jumlah_transaksi);

  if (chartSupervisor) chartSupervisor.destroy();

  const ctxSup = document.getElementById("barSupervisor").getContext("2d");
  const barCount = supLabels.length;

  const SUP_COLORS = ["#C73333", "#D1470B", "#E97700", "#FFB703", "#5dc3ab", "#218a71"];

  // Pilih warna solid untuk tiap supervisor
  const supColors = supLabels.map((_, i) => SUP_COLORS[i % SUP_COLORS.length]);

  chartSupervisor = new Chart(ctxSup, {
    type: "bar",
    data: {
      labels: supLabels,
      datasets: [{
        data: supValues,
        backgroundColor: supColors, // pakai warna solid
        borderRadius: 10
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false,
          callbacks: { label: ctx => `Jumlah: ${ctx.parsed.x}` }
        },
        datalabels: {
          anchor: "end",
          align: "end",
          offset: 6,
          color: "#333",
          font: { weight: "bold", size: 12 },
          formatter: value => value.toLocaleString()
        }
      },
      scales: {
        x: { 
          beginAtZero: true, 
          grid: { display: false }, 
          ticks: { font: { size: 11 } } 
        },
        y: { 
          grid: { drawTicks: false, color: "#eee", lineWidth: 1 },
          ticks: { font: { size: 11 } } 
        }
      },
      animation: { duration: 1500, easing: "easeOutQuart" }
    },
    plugins: [ChartDataLabels]
  });

  // TABEL RINGKASAN WIRANIAGA 
  const tbodyWiraniaga = document.querySelector("#tableSummaryWiraniaga tbody");
  tbodyWiraniaga.innerHTML = "";
  data.summary_wiraniaga.forEach((item, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${item.wiraniaga}</td>
      <td>${item.total_penjualan}</td>
      <td>${item.kecamatan_terbanyak}</td>
      <td>${item.jumlah_kecamatan}</td>
      <td>${item.kelurahan_terbanyak}</td>
      <td>${item.jumlah_kelurahan}</td>
    `;
    tbodyWiraniaga.appendChild(tr);
  });

  // TABEL WIRANIAGA PER KECAMATAN 
  const tbodyKec = document.querySelector("#tableWiraniagaKecamatan tbody");
  tbodyKec.innerHTML = "";
  data.wiraniaga_per_kecamatan.forEach((item, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${item.wiraniaga}</td>
      <td>${item.kecamatan}</td>
      <td>${item.jumlah_transaksi}</td>
    `;
    tbodyKec.appendChild(tr);
  });

  // TABEL WIRANIAGA PER KELURAHAN
  const tbodyKel = document.querySelector("#tableWiraniagaKelurahan tbody");
  tbodyKel.innerHTML = "";
  data.wiraniaga_per_kelurahan.forEach((item, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${item.wiraniaga}</td>
      <td>${item.kelurahan}</td>
      <td>${item.jumlah_transaksi}</td>
    `;
    tbodyKel.appendChild(tr);
  });
}

function buildQueryWithExtra(extra = {}) {
  const filters = getGlobalFilters();
  const params = new URLSearchParams(filters);

  Object.entries(extra).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });

  return params.toString();
}

async function loadPelanggan() {
  content.innerHTML = `
    <div class="pelanggan-page">

      <!-- TABEL TRANSAKSI PER CUSTOMER -->
      <div class="card">
        <h3>Jumlah Transaksi dan Total Pengeluaran Per Customer</h3>
        <div class="table-wrapper" style="max-height:300px; overflow:auto;">
          <table id="tableTransaksiCustomer" class="table">
            <thead>
              <tr>
                <th>No</th>
                <th>Customer Key</th>
                <th>Nama Customer</th>
                <th>Jumlah Transaksi</th>
                <th>Total Pengeluaran</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>

      <!-- SEGMENTASI & TREND CUSTOMER LOYAL -->
      <div class="card" style="display:flex; gap:20px; flex-wrap:wrap;">

        <!-- PIE CHART SEGMENTASI -->
        <div style="flex:1; min-width:300px;">
          <h3>Segmentasi Pelanggan</h3>
          <canvas id="pieSegmentasi"></canvas>
        </div>

        <!-- TREND CUSTOMER LOYAL -->
        <div style="flex:2; min-width:300px;">
          <h3>Tren Bulanan Customer Loyal</h3>
          <select id="dropdownCustomerLoyal" style="margin-bottom:10px; width:100%; padding:5px;"></select>
          <canvas id="lineTrendCustomer"></canvas>
        </div>

      </div>

      <!-- DISTRIBUSI PENJUALAN BERDASARKAN PEKERJAAN -->
      <div class="card">
        <h3>Distribusi Penjualan Berdasarkan Pekerjaan</h3>
        <canvas id="barPekerjaan"></canvas>
      </div>

      <!-- TREND BULANAN BERDASARKAN PEKERJAAN -->
      <div class="card">
        <h3>Tren Bulanan Berdasarkan Pekerjaan</h3>
        <select id="dropdownPekerjaan" style="margin-bottom:10px; width:100%; padding:5px;"></select>
        <canvas id="lineTrendPekerjaan"></canvas>
      </div>

    </div>
  `;

  // Ambil data dari backend
  const query = buildQueryWithExtra();
  const res = await fetch(`${BASE_URL}/pelanggan?${query}`);
  const data = await res.json();

  // TABEL TRANSAKSI PER CUSTOMER
  const tbodyCustomer = document.querySelector("#tableTransaksiCustomer tbody");
  tbodyCustomer.innerHTML = "";
  data.transaksi_per_customer.forEach((item, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${item.customer_key}</td>
      <td>${item.nama_customer}</td>
      <td>${item.jumlah_transaksi}</td>
      <td style="text-align:right;">
        Rp ${Number(item.total_pengeluaran).toLocaleString("id-ID")}
      </td>
    `;
    tbodyCustomer.appendChild(tr);
  });

  // PIE CHART SEGMENTASI
  if (chartPie) chartPie.destroy();

  const ctxSegmentasi = document.getElementById("pieSegmentasi").getContext("2d");
  const segLabels = data.segmentasi.map(d => d.segment);
  const segValues = data.segmentasi.map(d => d.jumlah_customer);

  // Pakai 3 warna solid
  const SEGMENT_COLORS = ["#E97700", "#FFB703", "#5dc3ab"];
  const colors = segValues.map((_, i) => SEGMENT_COLORS[i % SEGMENT_COLORS.length]);

  chartPie = new Chart(ctxSegmentasi, {
    type: "bar",
    data: {
      labels: segLabels,
      datasets: [{
        data: segValues,
        backgroundColor: colors, // pakai 3 warna solid
        borderRadius: 10
      }]
    },
    options: {
      indexAxis: "x", 
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `Jumlah: ${ctx.parsed.y}`
          }
        },
        datalabels: {
          anchor: "end",
          align: "top",
          color: "#333",
          font: { weight: "bold", size: 12 }
        }
      },
      scales: {
        x: {
          grid: {
            display: true,     
            color: "#eee",
            lineWidth: 1
          },
          ticks: {
            font: { size: 11 }
          }
        },
        y: {
          beginAtZero: true,
          grid: { display: false },
          ticks: { font: { size: 11 } }
        }
      }
    },
    plugins: [ChartDataLabels]
  });

  // ===== DROPDOWN CUSTOMER LOYAL MODERN =====
  const loyalCustomers = data.transaksi_per_customer
    .filter(c => c.jumlah_transaksi > 3) // Loyal = >3 transaksi
    .map(c => ({ key: c.customer_key, name: c.nama_customer }));

  const dropdownCustomer = document.getElementById("dropdownCustomerLoyal");
  dropdownCustomer.innerHTML = `<option value="">-- Pilih Customer --</option>`;
  loyalCustomers.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.key;
    opt.textContent = c.name;
    dropdownCustomer.appendChild(opt);
  });

  dropdownCustomer.addEventListener("change", async (e) => {
    const customerKey = e.target.value;

    // Destroy chart lama jika ada
    if (chartTrend) {
      chartTrend.destroy();
      chartTrend = null;
    }

    if (!customerKey) return;

    try {
      const queryCustomer = buildQueryWithExtra({ customer_key: customerKey });
      const res = await fetch(`${BASE_URL}/pelanggan?${queryCustomer}`);
      const data2 = await res.json();

      const trend = data2.trend_customer_loyal || [];
      const ctx = document.getElementById("lineTrendCustomer").getContext("2d");

      if (trend.length === 0) {
        if (chartTrend) chartTrend.destroy();
        chartTrend = new Chart(ctx, {
          type: "line",
          data: { labels: [], datasets: [] },
          options: {
            plugins: {
              legend: { display: false },
              title: { display: true, text: "Data kosong" }
            },
            responsive: true,
            maintainAspectRatio: false
          }
        });
        return;
      }

      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, "rgba(255, 3, 3, 0.35)");
      gradient.addColorStop(1, "rgba(230, 142, 142, 0)");

      const hoverLine = {
        id: "hoverLine",
        afterDraw(chart) {
          const active = chart.tooltip?.getActiveElements();
          if (!active || !active.length) return;
          const { ctx, chartArea } = chart;
          const x = active[0].element.x;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x, chartArea.top);
          ctx.lineTo(x, chartArea.bottom);
          ctx.lineWidth = 1;
          ctx.strokeStyle = "#C73333";
          ctx.stroke();
          ctx.restore();
        }
      };

      if (chartTrend) chartTrend.destroy();
      chartTrend = new Chart(ctx, {
        type: "line",
        data: {
          labels: trend.map(d => d.bulan),
          datasets: [{
            label: "Jumlah",
            data: trend.map(d => d.jumlah_transaksi),
            borderColor: "#C73333",
            backgroundColor: gradient,
            fill: "origin",
            tension: 0.35,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: "#C73333",
            pointBorderColor: "#fff",
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "index",
            intersect: false
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#fff",
              titleColor: "#111",
              bodyColor: "#333",
              borderColor: "#C73333",
              borderWidth: 1,
              padding: 12,
              cornerRadius: 10,
              displayColors: false,
              callbacks: { label: ctx => `Jumlah: ${ctx.parsed.y}` }
            },
            title: {
              display: false,
              text: `Tren Transaksi Customer: ${dropdownCustomer.selectedOptions[0].text}`,
              font: { size: 16 }
            }
          },
          scales: {
            x: { grid: { color: "#f0f2f5" }, ticks: { font: { size: 12 } } },
            y: { beginAtZero: true, grid: { color: "#f0f2f5" }, ticks: { font: { size: 12 }, stepSize: 5 } }
          }
        },
        plugins: [hoverLine]
      });

    } catch (err) {
      console.error("Gagal fetch data customer loyal:", err);
      alert("Gagal mengambil data customer loyal");
    }
  });

  //BAR CHART DISTRIBUSI PEKERJAAN
  if (chartBar) chartBar.destroy();

  const ctxBar = document.getElementById("barPekerjaan").getContext("2d");
  const pekerjaanData = data.distribusi_pekerjaan;

  const PEKERJA_COLORS = ["#C73333", "#D1470B", "#E97700", "#FFB703", "#5dc3ab", "#218a71"];

  const barColors = pekerjaanData.map((_, i) => PEKERJA_COLORS[i % PEKERJA_COLORS.length]);

  /* ===== CHART ===== */
  chartBar = new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: pekerjaanData.map(d => d.pekerjaan),
      datasets: [{
        data: pekerjaanData.map(d => d.jumlah_transaksi),
        backgroundColor: barColors, // pakai warna solid
        borderRadius: 10
      }]
    },
    options: {
      indexAxis: "x", 
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: "end",
          align: "end",
          color: "#333",
          font: { weight: "bold", size: 12 },
          formatter: v => v.toLocaleString()
        }
      },
      scales: {
        x: {
          grid: {
            display: true,     
            color: "#eee",
            lineWidth: 1
          },
          ticks: {
            font: { size: 11 }
          }
        },
        y: {
          beginAtZero: true,
          grid: { display: false },
          ticks: { font: { size: 11 } }
        }
      }
    },
    plugins: [ChartDataLabels]
  });

  // ===== DROPDOWN PEKERJAAN MODERN =====
  const dropdownPekerjaan = document.getElementById("dropdownPekerjaan");
  dropdownPekerjaan.innerHTML = `<option value="">-- Pilih Pekerjaan --</option>`;
  const pekerjaanList = [...new Set(data.distribusi_pekerjaan.map(d => d.pekerjaan))];
  pekerjaanList.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    dropdownPekerjaan.appendChild(opt);
  });

  dropdownPekerjaan.addEventListener("change", async (e) => {
    const pekerjaan = e.target.value;

    // Destroy chart lama jika ada
    if (chartTrendPekerjaan) {
      chartTrendPekerjaan.destroy();
      chartTrendPekerjaan = null;
    }

    if (!pekerjaan) return;

    try {
      const res = await fetch(`${BASE_URL}/pelanggan?pekerjaan=${encodeURIComponent(pekerjaan)}&${query}`);
      const data3 = await res.json();

      const trend = data3.trend_pekerjaan || [];
      const ctx = document.getElementById("lineTrendPekerjaan").getContext("2d");

      if (trend.length === 0) {
        chartTrendPekerjaan = new Chart(ctx, {
          type: "line",
          data: { labels: [], datasets: [] },
          options: {
            plugins: { legend: { display: false }, title: { display: false, text: "Data kosong" } },
            responsive: true,
            maintainAspectRatio: false
          }
        });
        return;
      }

      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, "rgba(230, 142, 142, 0.35)");
      gradient.addColorStop(1, "rgba(188, 38, 38, 0)");

      const hoverLine = {
        id: "hoverLine",
        afterDraw(chart) {
          const active = chart.tooltip?.getActiveElements();
          if (!active || !active.length) return;
          const { ctx, chartArea } = chart;
          const x = active[0].element.x;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x, chartArea.top);
          ctx.lineTo(x, chartArea.bottom);
          ctx.lineWidth = 1;
          ctx.strokeStyle = "#C73333";
          ctx.stroke();
          ctx.restore();
        }
      };

      chartTrendPekerjaan = new Chart(ctx, {
        type: "line",
        data: {
          labels: trend.map(d => d.bulan),
          datasets: [{
            label: pekerjaan,
            data: trend.map(d => d.jumlah_transaksi),
            borderColor: "#C73333",
            backgroundColor: gradient,
            fill: "origin",
            tension: 0.35,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: "#C73333",
            pointBorderColor: "#fff",
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "index",
            intersect: false
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#fff",
              titleColor: "#111",
              bodyColor: "#333",
              borderColor: "#C73333",
              borderWidth: 1,
              padding: 12,
              cornerRadius: 10,
              displayColors: false,
              callbacks: { label: ctx => `Jumlah: ${ctx.parsed.y}` }
            },
            title: {
              display: false,
              text: `Tren Bulanan Pekerjaan: ${pekerjaan}`,
              font: { size: 16 }
            }
          },
          scales: {
            x: {
              grid: { display: false }, 
              ticks: { font: { size: 12 } }
            },
            y: { beginAtZero: true, grid: { color: "#f0f2f5" }, ticks: { font: { size: 12 }, stepSize: 5 } }
          }
        },
        plugins: [hoverLine]
      });

    } catch (err) {
      console.error("Gagal fetch data pekerjaan:", err);
      alert("Gagal mengambil data pekerjaan");
    }
});
}

async function loadWilayah(filter = "top5") {
content.innerHTML = `
  <!-- FILTER TOP -->
  <div style="margin-bottom:10px; display:flex; align-items:center;">
    <label style="margin-right:8px;">Top:</label>
    <select id="topFilter">
      <option value="top5" ${filter === "top5" ? "selected" : ""}>Top 5</option>
      <option value="top10" ${filter === "top10" ? "selected" : ""}>Top 10</option>
      <option value="top15" ${filter === "top15" ? "selected" : ""}>Top 15</option>
      <option value="all" ${filter === "all" ? "selected" : ""}>Semua</option>
    </select>
  </div>

  <!-- PENJUALAN -->
  <div class="grid-2">
    <div class="card">
      <h3>Penjualan Per Kecamatan</h3>
      <canvas id="barPenjualanKecamatan" style="height:180px;"></canvas>
    </div>
    <div id="tablePenjualan"></div>
  </div>

  <!-- METODE -->
  <div class="grid-2" style="margin-top:20px;">
    <div class="card">
      <h3>Metode Penjualan Per Kecamatan</h3>
      <canvas id="barMetodeKecamatan" style="height:180px;"></canvas>
    </div>
    <div id="tableMetode"></div>
  </div>

  <!-- FINCO (FULL WIDTH) -->
  <div style="margin-top:20px;">
    <div class="card">
      <h3>FinCo Per Kecamatan</h3>
      <canvas id="barFincoKecamatan" style="height:220px;"></canvas>
    </div>
  </div>
`;
  document.getElementById("topFilter").addEventListener("change", e => {
    loadWilayah(e.target.value);
  });

  const filters = getGlobalFilters();
  const query = buildQuery(filters);

  const res = await fetch(`${BASE_URL}/wilayah?top=${filter}&${query}`);
  const data = await res.json();

  /* =====================================================
     PENJUALAN KECAMATAN
  ===================================================== */
  const penKec = data.penjualan_kecamatan
    .sort((a, b) => b.total_transaksi - a.total_transaksi);

  const ctxKec = document
    .getElementById("barPenjualanKecamatan")
    .getContext("2d");

  const GRAD_KEC_COLORS = ["#C73333", "#D1470B", "#E97700", "#FFB703", "#5dc3ab", "#218a71"];

  const kecColors = penKec.map((_, i) => GRAD_KEC_COLORS[i % GRAD_KEC_COLORS.length]);

  new Chart(ctxKec, {
    type: "bar",
    data: {
      labels: penKec.map(d => d.kecamatan),
      datasets: [{
        data: penKec.map(d => d.total_transaksi),
        backgroundColor: kecColors,
        borderRadius: 10
      }]
    },
    options: {
      indexAxis: "x",
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: items => items?.[0]?.label ?? "",
            label: ctx => `Total: ${(ctx.parsed.y ?? 0).toLocaleString()}`
          }
        },
        datalabels: {
          anchor: "end",
          align: "end",
          offset: 2,
          color: "#333",
          font: { weight: "bold", size: 12 },
          formatter: v => v.toLocaleString()
        }
      },
      scales: {
        x: {
          grid: {
            display: true,     
            color: "#eee",
            lineWidth: 1
          },
          ticks: { font: { size: 11 } }
        },
        y: {
          beginAtZero: true,
          grid: { display: false },
          ticks: { font: { size: 11 } }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
  
  document.getElementById("tablePenjualan").innerHTML = buildAutoTable(
    "Penjualan Per Kelurahan",
    ["Kelurahan","Jumlah"],
    data.penjualan_kelurahan
      .sort((a,b)=>b.jumlah_transaksi-a.jumlah_transaksi)
      .map(d=>[d.kelurahan, d.jumlah_transaksi])
  );

  /* =====================================================
     METODE
  ===================================================== */
  const metodeGrouped = {};
  data.metode_penjualan_kecamatan.forEach(d => {
    metodeGrouped[d.kecamatan] =
      (metodeGrouped[d.kecamatan] || 0) + d.jumlah_transaksi;
  });

  const kecMetode = Object.entries(metodeGrouped)
    .sort((a, b) => b[1] - a[1])
    .map(d => d[0]);

  const metodeList = [...new Set(
    data.metode_penjualan_kecamatan.map(d => d.penjualan)
  )];

  const ctxMetode = document
    .getElementById("barMetodeKecamatan")
    .getContext("2d");

  const METODE_COLORS = ["#FFB703", "#E97700"];

  const datasetMetode = metodeList.map((metode, i) => {
    const color = METODE_COLORS[i % METODE_COLORS.length]; // pakai warna solid
    return {
      label: metode,
      data: kecMetode.map(kec =>
        data.metode_penjualan_kecamatan
          .filter(d => d.kecamatan === kec && d.penjualan === metode)
          .reduce((sum, x) => sum + x.jumlah_transaksi, 0)
      ),
      backgroundColor: color,
      borderRadius: 10
    };
  });

  new Chart(ctxMetode, {
    type: "bar",
    data: {
      labels: kecMetode,
      datasets: datasetMetode
    },
    options: {
      indexAxis: "x",
      responsive: true,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: items => items?.[0]?.label ?? "",
            label: ctx =>
              `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toLocaleString()}`
          }
        },
        datalabels: {
          anchor: "end",
          align: "end",
          offset: 2,
          color: "#333",
          font: { weight: "bold", size: 12 },
          formatter: v => v.toLocaleString()
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: {
            display: true,
            color: "#e5e7eb",
            drawBorder: false
          },
          ticks: { padding: 6 }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { display: false }
        }
      }
    },
    plugins: [ChartDataLabels]
  });

  document.getElementById("tableMetode").innerHTML = buildAutoTable(
    "Metode Penjualan Per Kelurahan",
    ["Kelurahan","Metode","Jumlah"],
    data.metode_penjualan_kelurahan
      .map(d=>[d.kelurahan, d.penjualan, d.jumlah_transaksi])
  );

  /* =====================================================
     FINCO (FULL BAR – TANPA TABEL)
  ===================================================== */
  const fincoGrouped = {};
  data.finco_kecamatan.forEach(d => {
    fincoGrouped[d.kecamatan] =
      (fincoGrouped[d.kecamatan] || 0) + d.jumlah_transaksi;
  });

  const kecFinco = Object.entries(fincoGrouped)
    .sort((a, b) => b[1] - a[1])
    .map(d => d[0]);

  const fincoList = [...new Set(
    data.finco_kecamatan.map(d => d.finco)
  )];

  const ctxFinco = document
    .getElementById("barFincoKecamatan")
    .getContext("2d");

  const FINCO_COLORS = ["#C73333", "#D1470B", "#E97700", "#FFB703", "#5dc3ab", "#218a71"];

  const datasetFinco = fincoList.map((finco, i) => {
    const color = FINCO_COLORS[i % FINCO_COLORS.length]; // pakai warna solid
    return {
      label: finco,
      data: kecFinco.map(kec =>
        data.finco_kecamatan
          .filter(d => d.kecamatan === kec && d.finco === finco)
          .reduce((sum, x) => sum + x.jumlah_transaksi, 0)
      ),
      backgroundColor: color,
      borderRadius: ctx => {
        const datasets = ctx.chart.data.datasets;
        return ctx.datasetIndex === datasets.length - 1 ? 10 : 0;
      },
      borderSkipped: false
    };
  });

  new Chart(ctxFinco, {
    type: "bar",
    data: {
      labels: kecFinco,
      datasets: datasetFinco
    },
    options: {
      indexAxis: "x",
      responsive: true,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: items => items?.[0]?.label ?? "",
            label: ctx =>
              `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toLocaleString()}`,
            footer: items => {
              let total = 0;
              (items ?? []).forEach(i => {
                total += i?.parsed?.y ?? 0;
              });
              return `Total: ${total.toLocaleString()}`;
            }
          }
        },
        datalabels: {
          color: "#333",
          font: { weight: "bold", size: 13 },
          anchor: "end",
          align: "end",
          formatter: function (value, context) {
            const datasets = context.chart.data.datasets;
            const idx = context.dataIndex;
            if (context.datasetIndex !== datasets.length - 1) return null;
            let total = 0;
            datasets.forEach(ds => {
              total += ds.data?.[idx] ?? 0;
            });
            return total.toLocaleString();
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: {
            display: true,
            color: "#e5e7eb"
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: {
            display: false
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

/* =====================================================
   HELPER TABLE
===================================================== */
function buildAutoTable(title, headers, rows){
  let html = `
    <div class="card" style="padding:12px; display:flex; flex-direction:column; height:100%;">
      <h3 style="font-size:14px;margin-bottom:8px">${title}</h3>
      <div style="flex:1; max-height:200px; overflow-y:auto;">
        <table class="table" style="width:100%; font-size:12px;">
          <thead style="position:sticky; top:0; background:#fff;">
            <tr><th>No</th>${headers.map(h=>`<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
  `;
  rows.forEach((r,i)=>{
    html += `<tr><td>${i+1}</td>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`;
  });
  html += `</tbody></table></div></div>`;
  return html;
}

function loadUnduhData() {
  content.innerHTML = `
    <div class="card">

      <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:15px;">
        <div>
          <label>Jenis Data</label>
          <select id="jenisData">
            <option value="penjualan">Penjualan</option>
            <option value="status_sales">Rekap DKH</option>
          </select>
        </div>

        <div>
          <label>Tanggal Awal</label>
          <input type="date" id="tanggalAwal">
        </div>

        <div>
          <label>Tanggal Akhir</label>
          <input type="date" id="tanggalAkhir">
        </div>

        <div style="align-self:flex-end;">
          <button id="btnUnduh" class="btn-primary">Unduh XLSX</button>
        </div>
      </div>

      <p style="font-size:13px;color:#666">
        Data yang diunduh adalah <b>FULL DATASET</b> dari database sesuai rentang tanggal.
      </p>
    </div>
  `;

  document.getElementById("btnUnduh").addEventListener("click", () => {
    const jenis = document.getElementById("jenisData").value;
    const awal = document.getElementById("tanggalAwal").value;
    const akhir = document.getElementById("tanggalAkhir").value;

    if (!awal || !akhir) {
      alert("Tanggal harus diisi");
      return;
    }

    // YYYY-MM-DD → DD/MM/YYYY (AMAN & KONSISTEN)
    const format = (d) => {
      const [y, m, day] = d.split("-");
      return `${day}/${m}/${y}`;
    };

    const url = `${BASE_URL}/unduh-data?` +
      `jenis_data=${jenis}` +
      `&tanggal_awal=${format(awal)}` +
      `&tanggal_akhir=${format(akhir)}`;

    // Trigger download XLSX
    window.open(url, "_blank");
  });
}

/* =====================
   UTIL
===================== */
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* =====================
   INITIAL LOAD
===================== */
document.addEventListener("DOMContentLoaded", () => {
  loadPage("home");
});

/* =====================
   SIDEBAR TOGGLE
===================== */
function toggleSidebar() {
  document.querySelector(".sidebar").classList.toggle("collapsed");
  document.querySelector(".main").classList.toggle("expanded");

  // Paksa Chart.js resize ulang
  window.dispatchEvent(new Event("resize"));
}
