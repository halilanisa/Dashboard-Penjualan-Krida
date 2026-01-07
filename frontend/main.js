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
    trend: "Tren",
    penjualan: "Penjualan",
    produk: "Produk",
    pekerja: "Pekerja",
    pelanggan: "Pelanggan",
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

async function loadFilters() {
  const res = await fetch("http://localhost:8000/filters")
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
    const res = await fetch("http://localhost:8000/refresh", {
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
  // 1. Setup the basic layout grid
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
                <h3>Tren Penjualan Bulanan</h3>
                <canvas id="trendChart"></canvas>
            </div>

            <div class="grid-2">
                <div class="card"><h3>Distribusi Metode Penjualan</h3><canvas id="piePenjualan"></canvas></div>
                <div class="card"><h3>Status Sales</h3><canvas id="statusSales"></canvas></div>
            </div>

            <div class="card">
                <h3>Lead Prospek Sistem</h3>
                <canvas id="chartTransaksiSales"></canvas>
            </div>

            <div class="grid-2">
                <div class="card"><h3>Top Kecamatan</h3><canvas id="topKecamatan"></canvas></div>
                <div class="card"><h3>Top Kendaraan</h3><canvas id="topKendaraan"></canvas></div>
            </div>
        </div>
    `;

  // 2. Fetch Data
  const filters = getGlobalFilters();
  const query = buildQuery(filters);
  const res = await fetch(`http://localhost:8000/overview?${query}`);
  const data = await res.json();
  const p = data.penjualan;

  // --- CARD 1: TOTAL ---
  document.getElementById("summary-total").innerHTML = `
        <div class="total-big-number">${p.total_all.toLocaleString()}</div>
    `;

  // --- CARD 2: BULANAN ---
  const deltaClass = p.selisih > 0 ? 'up' : p.selisih < 0 ? 'down' : 'neutral';
  const deltaIcon = p.selisih > 0 ? '▲' : p.selisih < 0 ? '▼' : '•';

  document.getElementById("summary-bulanan").innerHTML = `
        <div class="summary-list">
            <div class="item"><strong>Bulan ini:</strong> <span>${p.total_ini}</span></div>
            <div class="item"><strong>Bulan lalu:</strong> <span>${p.total_lalu}</span></div>
            <div class="delta-badge ${deltaClass}">
                ${deltaIcon} ${Math.abs(p.selisih)} Penjualan
            </div>
            <div class="item border-top"><strong>Prediksi Bulan Ini:</strong> <span>${p.prediksi}</span></div>
        </div>
    `;

  // --- CARD 3: KENDARAAN ---
  document.getElementById("summary-kendaraan").innerHTML = `
        <div class="summary-list">
            <div class="item-stack">
                <strong class="label-mini">Bulan Ini:</strong>
                <span class="value-main">${data.top_kendaraan.bulan_ini.label} <span>(${data.top_kendaraan.bulan_ini.jumlah})</span></span>
            </div>
            <div class="item-stack">
                <strong class="label-mini">Bulan Lalu:</strong>
                <span class="value-sub">${data.top_kendaraan.bulan_lalu.label} (${data.top_kendaraan.bulan_lalu.jumlah})</span>
            </div>
        </div>
    `;

  // --- CARD 4: KECAMATAN ---
  document.getElementById("summary-kecamatan").innerHTML = `
        <div class="summary-list">
            <div class="item-stack">
                <strong class="label-mini">Bulan Ini:</strong>
                <span class="value-main">${data.top_kecamatan.bulan_ini.label} <span>(${data.top_kecamatan.bulan_ini.jumlah})</span></span>
            </div>
            <div class="item-stack">
                <strong class="label-mini">Bulan Lalu:</strong>
                <span class="value-sub">${data.top_kecamatan.bulan_lalu.label} (${data.top_kecamatan.bulan_lalu.jumlah})</span>
            </div>
        </div>
    `;

  // 3. Initialize Charts
  renderCharts(data);
}

// Helper function to keep loadOverview clean
function renderCharts(data) {

  const COLORS = ["#326199", "#4FB1A1", "#FCC055", "#EB8D50", "#DF6E5B"];

  const labels = data.trend_bulanan.map(d => d.bulan);
  const values = data.trend_bulanan.map(d => d.jumlah);

  if (chartTrend) chartTrend.destroy();

  chartTrend = new Chart(trendChart, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        data: values,
        borderColor: "#326199",
        backgroundColor: "rgba(82, 174, 214, 1)", // area lembut
        tension: 0,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: ctx => `Jumlah: ${ctx.parsed.y}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false }   // ⬅️ bersih
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "#f0f2f5"         // ⬅️ grid halus
          },
          ticks: {
            stepSize: 10
          }
        }
      }
    }
  });


  const pieLabels = data.pie_penjualan.map(d => d.penjualan);
  const pieValues = data.pie_penjualan.map(d => d.jumlah);

  if (chartPie) chartPie.destroy();

  chartPie = new Chart(piePenjualan, {
    type: "bar",
    data: {
      labels: pieLabels,
      datasets: [{
        data: pieValues,
        backgroundColor: COLORS
      }]
    },
    options: {
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,       // pastikan tooltip aktif
          mode: 'index',       // tooltip per index (bar)
          intersect: false,    // muncul walau kursor agak di samping bar
          callbacks: {
            label: function (context) {
              return `Jumlah: ${context.parsed.y}`; // teks tooltip
            }
          }
        }
      },
      hover: {
        mode: 'index',
        intersect: false
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });

  const statusLabels = data.status_sales.map(d => d.salesman_status);
  const statusValues = data.status_sales.map(d => d.jumlah);

  if (chartStatus) chartStatus.destroy();

  chartStatus = new Chart(statusSales, {
    type: "bar",
    data: {
      labels: statusLabels,
      datasets: [{
        data: statusValues,
        backgroundColor: COLORS
      }]
    },
    options: {
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,       // pastikan tooltip aktif
          mode: 'index',       // tooltip per index (bar)
          intersect: false,    // muncul walau kursor agak di samping bar
          callbacks: {
            label: function (context) {
              return `Jumlah: ${context.parsed.y}`; // teks tooltip
            }
          }
        }
      },
      hover: {
        mode: 'index',
        intersect: false
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });
    
  // --- LEAD PROSPEK SISTEM: DISTRIBUSI PER STATUS 
  let chartTransaksiSales = null;

  // Filter data yang bukan Deal
  const transaksiSalesFiltered = data.transaksi_sales.filter(d => d.status !== "Deal");

  // Hitung total per status
  const leadPerStatus = transaksiSalesFiltered.reduce((acc, cur) => {
    if (!acc[cur.status]) acc[cur.status] = 0;
    acc[cur.status] += cur.jumlah;
    return acc;
  }, {});

  const leadStatusSorted = Object.entries(leadPerStatus)
                                .map(([status, jumlah]) => ({ status, jumlah }))
                                .sort((a, b) => b.jumlah - a.jumlah);

  const leadLabels = leadStatusSorted.map(d => d.status);
  const leadValues = leadStatusSorted.map(d => d.jumlah);

  const STATUS_COLORS_14 = ["#DF6E5B", "#EB8D50", "#FCC055", "#326199", "#4FB1A1"];

  if (chartTransaksiSales) chartTransaksiSales.destroy();

  chartTransaksiSales = new Chart(document.getElementById("chartTransaksiSales"), {
    type: "bar",
    data: {
      labels: leadLabels,
      datasets: [{
        label: "Jumlah Prospek",
        data: leadValues,
        backgroundColor: STATUS_COLORS_14.slice(0, leadLabels.length),
        borderRadius: 0,   
        barPercentage: 0.6
      }]
    },
    options: {
      indexAxis: "y", 
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: ctx => `${ctx.parsed.x}`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "#f0f2f5" },
          ticks: { font: { size: 11 } }
        },
        y: {
          grid: { color: "#f0f2f5" },
          ticks: { font: { size: 11 } }
        }
      }
    }
  });

  const kecLabels = data.top10_kecamatan.map(d => d.kecamatan);
  const kecValues = data.top10_kecamatan.map(d => d.jumlah);

  if (chartTopKecamatan) chartTopKecamatan.destroy();

  chartTopKecamatan = new Chart(document.getElementById("topKecamatan"), {
    type: "bar",
    data: {
      labels: kecLabels,
      datasets: [{
        data: kecValues,
        backgroundColor: "#326199"
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
          callbacks: {
            label: function (context) {
              return `Jumlah: ${context.parsed.x}`;
            }
          }
        }
      },
      scales: {
        x: { ticks: { font: { size: 11 } } },
        y: { ticks: { font: { size: 11 } } }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });

  const kenLabels = data.top10_kendaraan.map(d => d.type_kendaraan);
  const kenValues = data.top10_kendaraan.map(d => d.jumlah);

  if (chartTopKendaraan) chartTopKendaraan.destroy();

  chartTopKendaraan = new Chart(document.getElementById("topKendaraan"), {
    type: "bar",
    data: {
      labels: kenLabels,
      datasets: [{
        data: kenValues,
        backgroundColor: "#EB8D50"
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
          callbacks: {
            label: function (context) {
              return `Jumlah: ${context.parsed.x}`;
            }
          }
        }
      },
      scales: {
        x: { ticks: { font: { size: 11 } } },
        y: { ticks: { font: { size: 11 } } }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });

}

async function loadTrend() {
  content.innerHTML = `
    <div class="trend-page">

      <div class="card">
        <h3>Trend Jumlah Penjualan</h3>
        <canvas id="trendTotal"></canvas>
      </div>

      <div class="card">
        <h3>Trend Metode Penjualan</h3>
        <canvas id="trendMetode"></canvas>
      </div>

      <div class="card">
        <h3>Trend Penjualan Berdasarkan FinCo</h3>
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

  const COLORS = [
    "#326199","#4fb1a1","#fcc055","#eb8d50","#df6e5b",
    "#2d5496","#3ba298","#fcd77b","#f29e6b","#d96957","#8ab17d",
    "#e9c46a","#f4a261"
  ];

  const topSelect = document.getElementById("topFincoSelect");

  let chartTotal, chartMetode, chartFinco;

  async function renderCharts(topOption = "Top 5") {
    const filters = getGlobalFilters();
    const query = buildQuery(filters);
    const res = await fetch(`http://localhost:8000/trend?top_n=${topOption}&${query}`);
    const data = await res.json();

    if (chartTotal) chartTotal.destroy();
    if (chartMetode) chartMetode.destroy();
    if (chartFinco) chartFinco.destroy();

    const totalLabels = data.trend_total.map(d => d.periode);
    const totalValues = data.trend_total.map(d => d.jumlah_transaksi);

    chartTotal = new Chart(
      document.getElementById("trendTotal"),
      {
        type: "line",
        data: {
          labels: totalLabels,
          datasets: [{
            data: totalValues,
            borderColor: "#326199",
            backgroundColor: "rgba(51, 155, 199, 1)",
            borderWidth: 3,
            tension: 0,
            fill: false,
            pointRadius: 3,
            pointHoverRadius: 3
          }]
        },
        options: baseLineOptions(false)
      }
    );

    const metodeLabels = [...new Set(data.trend_metode.map(d => d.periode))];
    const metodeTypes = [...new Set(data.trend_metode.map(d => d.penjualan))];

    const datasetsMetode = metodeTypes.map((type, i) => ({
      label: type,
      data: metodeLabels.map(p => {
        const x = data.trend_metode.find(d => d.periode === p && d.penjualan === type);
        return x ? x.jumlah_transaksi : 0;
      }),
      borderColor: COLORS[i % COLORS.length],
      backgroundColor: COLORS[i % COLORS.length] + "22",
      borderWidth: 2,
      tension: 0,
      fill: false,
      pointRadius: 2
    }));

    chartMetode = new Chart(
      document.getElementById("trendMetode"),
      {
        type: "line",
        data: {
          labels: metodeLabels,
          datasets: datasetsMetode
        },
        options: baseLineOptions(false)
      }
    );

    const fincoLabels = [...new Set(data.trend_finco.map(d => d.periode))];
    const fincoTypes = data.rank_finco;

    const datasetsFinco = fincoTypes.map((finco, i) => ({
      label: finco,
      data: fincoLabels.map(p => {
        const x = data.trend_finco.find(d => d.periode === p && d.finco === finco);
        return x ? x.jumlah_transaksi : 0;
      }),
      borderColor: COLORS[i % COLORS.length],
      backgroundColor: COLORS[i % COLORS.length] + "22",
      borderWidth: 2,
      tension: 0,
      fill: false,
      pointRadius: 3
    }));

    chartFinco = new Chart(
      document.getElementById("trendFinco"),
      {
        type: "line",
        data: {
          labels: fincoLabels,
          datasets: datasetsFinco
        },
        options: baseLineOptions(false)
      }
    );
  }

  renderCharts(topSelect.value);
  topSelect.addEventListener("change", () => renderCharts(topSelect.value));
}

function baseLineOptions(showLegend = true) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: "top",
        labels: {
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        mode: "index",
        intersect: false
      }
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

  const COLORS = ["#326199", "#4FB1A1", "#FCC055", "#EB8D50", "#DF6E5B"];

  // =====================
  // FETCH DATA PENJUALAN
  // =====================
  const filters = getGlobalFilters();
  const query = buildQuery(filters);

  const res = await fetch(`http://localhost:8000/penjualan?top=${filter}&${query}`);
  const data = await res.json();

  // PIE METODE PENJUALAN
  const pieLabels = data.pie_penjualan.map(d => d.penjualan);
  const pieValues = data.pie_penjualan.map(d => d.jumlah);

  if (chartPie) chartPie.destroy();

  chartPie = new Chart(piePenjualan, {
    type: "bar",
    data: {
      labels: pieLabels,
      datasets: [{
        data: pieValues,
        backgroundColor: COLORS
      }]
    },
    options: {
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,       
          mode: 'index',       
          intersect: false,    
          callbacks: {
            label: function (context) {
              return `Jumlah: ${context.parsed.y}`; 
            }
          }
        }
      },
      hover: {
        mode: 'index',
        intersect: false
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });

  // BAR FINCO (HORIZONTAL)
  if (chartPenjualanFinco) chartPenjualanFinco.destroy();

  chartPenjualanFinco = new Chart(
    document.getElementById("barFinco"),
    {
      type: "bar",
      data: {
        labels: data.finco.data.map(d => d.finco),
        datasets: [{
          data: data.finco.data.map(d => d.jumlah_transaksi),
          backgroundColor: COLORS
        }]
      },
      options: {
        indexAxis: "y",   
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            mode: "nearest",
            intersect: false,
            callbacks: {
              label: ctx => `Jumlah: ${ctx.parsed.x}` 
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: "#eef2f7" }
          },
          y: {
            grid: { display: false }
          }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    }
  );


  // HANDLE FILTER FINCO
  document.getElementById("fincoFilter").addEventListener("change", async (e) => {
    await loadPenjualan(e.target.value);
  });
}

async function loadProduk() {
  content.innerHTML = `<div class="produk-page"></div>`;

  const COLORS = ["#326199", "#4FB1A1", "#FCC055", "#EB8D50", "#DF6E5B"];

  // FETCH DATA PRODUK
  const query = buildQuery(getGlobalFilters());

  const res = await fetch(`http://localhost:8000/produk?${query}`);
  const data = await res.json();

  const page = document.querySelector(".produk-page");

  // BAR PENJUALAN PER TAHUN RAKIT
  const cardTahun = document.createElement("div");
  cardTahun.classList.add("card");
  cardTahun.innerHTML = `<h3>Penjualan Per Tahun Rakit</h3><canvas id="barTahunRakit"></canvas>`;
  page.appendChild(cardTahun);

  if (chartProdukTahun) chartProdukTahun.destroy();

  chartProdukTahun = new Chart(document.getElementById("barTahunRakit"), {
    type: "bar",
    data: {
      labels: data.penjualan_tahun_rakit.map(d => d.tahun_rakit),
      datasets: [{
        data: data.penjualan_tahun_rakit.map(d => d.jumlah_transaksi),
        backgroundColor: COLORS
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,        
          mode: 'nearest',      
          intersect: false,   
          callbacks: {
            label: function (context) {
              return `Jumlah: ${context.parsed.y}`;  
            }
          }
        }
      },
      interaction: {
        mode: 'nearest',
        intersect: false
      },
      scales: {
        x: { ticks: { font: { size: 11 } } },
        y: { ticks: { font: { size: 11 } } }
      },
      responsive: true,
      maintainAspectRatio: false
    }
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

  const COLORS = ["#326199", "#4FB1A1", "#FCC055", "#EB8D50", "#DF6E5B"];

  // FETCH DATA PEKERJA
  const filters = getGlobalFilters();
  const query = buildQuery(filters);
  const res = await fetch(`http://localhost:8000/pekerja?${query}`);
  const data = await res.json();

  // BAR PENJUALAN PER SUPERVISOR
  const supLabels = data.penjualan_supervisor.map(d => d.supervisor);
  const supValues = data.penjualan_supervisor.map(d => d.jumlah_transaksi);

  if (chartSupervisor) chartSupervisor.destroy();

  chartSupervisor = new Chart(document.getElementById("barSupervisor"), {
    type: "bar",
    data: {
      labels: supLabels,
      datasets: [{
        data: supValues,
        backgroundColor: COLORS
      }]
    },
    options: {
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,      
          mode: 'index',       
          intersect: false,    
          callbacks: {
            label: function (context) {
              return `Jumlah: ${context.parsed.y}`; // teks tooltip
            }
          }
        }
      },
      hover: {
        mode: 'index',
        intersect: false
      },
      responsive: true,
      maintainAspectRatio: false
    }
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
        <h3>Jumlah Transaksi per Customer</h3>
        <div class="table-wrapper" style="max-height:300px; overflow:auto;">
          <table id="tableTransaksiCustomer" class="table">
            <thead>
              <tr>
                <th>No</th>
                <th>Customer Key</th>
                <th>Nama Customer</th>
                <th>Jumlah Transaksi</th>
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

  const COLORS = ["#326199", "#4FB1A1", "#FCC055", "#EB8D50", "#DF6E5B",
    "#2D5496", "#3BA298", "#FCD77B", "#F29E6B", "#D96957"];

  // Ambil data dari backend
  const query = buildQueryWithExtra();
  const res = await fetch(`http://localhost:8000/pelanggan?${query}`);
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
    `;
    tbodyCustomer.appendChild(tr);
  });

  // PIE CHART SEGMENTASI
  if (chartPie) chartPie.destroy();
  chartPie = new Chart(document.getElementById("pieSegmentasi"), {
    type: "bar",
    data: {
      labels: data.segmentasi.map(d => d.segment),
      datasets: [{
        data: data.segmentasi.map(d => d.jumlah_customer),
        backgroundColor: COLORS
      }]
    },
    options: {
      indexAxis: "y", 
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function (context) {
              return `Jumlah: ${context.parsed.x}`; 
            }
          }
        }
      },
      hover: {
        mode: 'index',
        intersect: false
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "#eef2f7" }
        },
        y: {
          grid: { display: false }
        }
      }
    }
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

      const res = await fetch(`http://localhost:8000/pelanggan?${queryCustomer}`);
      const data2 = await res.json();

      const trend = data2.trend_customer_loyal || [];
      const ctx = document.getElementById("lineTrendCustomer").getContext("2d");

      if (trend.length === 0) {
        // Data kosong
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

      chartTrend = new Chart(ctx, {
        type: "line",
        data: {
          labels: trend.map(d => d.bulan),
          datasets: [{
            label: "Jumlah Transaksi",
            data: trend.map(d => d.jumlah_transaksi),
            borderColor: "#4FB1A1",
            backgroundColor: "rgba(79, 177, 161, 0.2)",
            fill: true,
            tension: 0.5,      
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: "#326199"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'nearest',
            intersect: false
          },
          plugins: {
            legend: { display: false, position: "top" },
            tooltip: {
              mode: "index",
              intersect: false,
              callbacks: { label: ctx => `Jumlah: ${ctx.parsed.y}` }
            },
            title: { display: false, text: `Tren Transaksi Customer: ${dropdownCustomer.selectedOptions[0].text}`, font: { size: 16 } }
          },
          scales: {
            x: { grid: { color: "#f0f2f5" }, ticks: { font: { size: 12 } } },
            y: { beginAtZero: true, grid: { color: "#f0f2f5" }, ticks: { font: { size: 12 }, stepSize: 5 } }
          }
        }
      });

    } catch (err) {
      console.error("Gagal fetch data customer loyal:", err);
      alert("Gagal mengambil data customer loyal");
    }
  });

  //BAR CHART DISTRIBUSI PEKERJAAN VERTICAL SIMPLE
  if (chartBar) chartBar.destroy();

  const ctxBar = document.getElementById("barPekerjaan").getContext("2d");

  chartBar = new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: data.distribusi_pekerjaan.map(d => d.pekerjaan),
      datasets: [{
        label: "Jumlah Transaksi",
        data: data.distribusi_pekerjaan.map(d => d.jumlah_transaksi),
        backgroundColor: COLORS, 
        borderRadius: 0           
      }]
    },
    options: {
      indexAxis: 'x',         
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
        title: {
          display: false,
          text: "Distribusi Transaksi per Pekerjaan",
          font: { size: 16 }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 12 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: "#f0f2f5" },
          ticks: { font: { size: 12 }, stepSize: 5 }
        }
      },
      hover: {
        mode: 'nearest',
        intersect: true
      }
    }
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

    if (!pekerjaan) return; // Jika kosong, keluar

    try {
      const res = await fetch(`http://localhost:8000/pelanggan?pekerjaan=${encodeURIComponent(pekerjaan)}&${query}`);
      const data3 = await res.json();

      if (!data3.trend_pekerjaan || data3.trend_pekerjaan.length === 0) {
        // Data kosong → tampilkan alert atau chart kosong
        const ctx = document.getElementById("lineTrendPekerjaan").getContext("2d");
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

      // Data ada → buat chart baru
      const ctx = document.getElementById("lineTrendPekerjaan").getContext("2d");
      chartTrendPekerjaan = new Chart(ctx, {
        type: "line",
        data: {
          labels: data3.trend_pekerjaan.map(d => d.bulan),
          datasets: [{
            label: pekerjaan,
            data: data3.trend_pekerjaan.map(d => d.jumlah_transaksi),
            borderColor: "#4FB1A1",
            backgroundColor: "rgba(79, 177, 161, 0.2)",
            fill: false,
            tension: 0,        // garis smooth modern
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: "#326199"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'nearest',
            intersect: false
          },
          plugins: {
            legend: {
              display: false,
              position: "top",
              labels: { usePointStyle: true, boxWidth: 8 }
            },
            tooltip: {
              mode: "index",
              intersect: false,
              callbacks: {
                label: ctx => `Jumlah: ${ctx.parsed.y}`
              }
            },
            title: {
              display: false,
              text: `Tren Bulanan Pekerjaan: ${pekerjaan}`,
              font: { size: 16 }
            }
          },
          scales: {
            x: {
              grid: { color: "#f0f2f5" },
              ticks: { font: { size: 12 } }
            },
            y: {
              beginAtZero: true,
              grid: { color: "#f0f2f5" },
              ticks: { font: { size: 12 }, stepSize: 5 }
            }
          }
        }
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

  <!-- FINCO -->
  <div class="grid-2" style="margin-top:20px;">
    <div class="card">
      <h3>FinCo Per Kecamatan</h3>
      <canvas id="barFincoKecamatan" style="height:180px;"></canvas>
    </div>
    <div id="tableFinco"></div>
  </div>
`;

  const COLORS = ["#326199","#4FB1A1","#FCC055","#EB8D50","#DF6E5B"];

  const filters = getGlobalFilters();
  const query = buildQuery(filters);

  const res = await fetch(`http://localhost:8000/wilayah?top=${filter}&${query}`);
  const data = await res.json();

  /* =====================================================
     PENJUALAN KECAMATAN (BAR – URUT TERBANYAK)
  ===================================================== */
  const penKec = data.penjualan_kecamatan
    .sort((a,b)=>b.total_transaksi-a.total_transaksi);

  new Chart(document.getElementById("barPenjualanKecamatan"), {
    type:"bar",
    data:{
      labels: penKec.map(d=>d.kecamatan),
      datasets:[{
        data: penKec.map(d=>d.total_transaksi),
        backgroundColor: COLORS,
        borderRadius:0
      }]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{ display:false },
        tooltip:{
          callbacks:{ label:c=>`Jumlah: ${c.parsed.y}` }
        }
      },
      scales:{ y:{ beginAtZero:true }}
    }
  });

  /* =====================================================
     TABEL PENJUALAN KELURAHAN (OTOMATIS SESUAI CARD)
  ===================================================== */
  document.getElementById("tablePenjualan").innerHTML = buildAutoTable(
    "Penjualan Per Kelurahan",
    ["Kelurahan","Jumlah"],
    data.penjualan_kelurahan
      .sort((a,b)=>b.jumlah_transaksi-a.jumlah_transaksi)
      .map(d=>[d.kelurahan, d.jumlah_transaksi])
  );

  /* =====================================================
     METODE – BAR (URUT BERDASARKAN TOTAL TRANSAKSI)
  ===================================================== */
  const metodeGrouped = {};
  data.metode_penjualan_kecamatan.forEach(d=>{
    metodeGrouped[d.kecamatan] = (metodeGrouped[d.kecamatan]||0) + d.jumlah_transaksi;
  });

  const kecMetode = Object.entries(metodeGrouped)
    .sort((a,b)=>b[1]-a[1])
    .map(d=>d[0]);

  const metodeList = [...new Set(data.metode_penjualan_kecamatan.map(d=>d.penjualan))];

  const datasetMetode = metodeList.map((m,i)=>({
    data: kecMetode.map(k =>
      data.metode_penjualan_kecamatan
        .filter(d=>d.kecamatan===k && d.penjualan===m)
        .reduce((s,x)=>s+x.jumlah_transaksi,0)
    ),
    backgroundColor: COLORS[i%COLORS.length]
  }));

  new Chart(document.getElementById("barMetodeKecamatan"), {
    type:"bar",
    data:{ labels:kecMetode, datasets:datasetMetode },
    options:{
      responsive:true,
      plugins:{
        legend:{ display:false },
        tooltip:{
          callbacks:{ label:c=>`${metodeList[c.datasetIndex]}: ${c.parsed.y}` }
        }
      },
      scales:{
        x:{ stacked:true },
        y:{ stacked:true, beginAtZero:true }
      }
    }
  });

  /* =====================================================
     TABEL METODE KELURAHAN (OTOMATIS SESUAI CARD)
  ===================================================== */
  document.getElementById("tableMetode").innerHTML = buildAutoTable(
    "Metode Penjualan Per Kelurahan",
    ["Kelurahan","Metode","Jumlah"],
    data.metode_penjualan_kelurahan
      .sort((a,b)=>b.jumlah_transaksi-a.jumlah_transaksi)
      .map(d=>[d.kelurahan, d.penjualan, d.jumlah_transaksi])
  );

  /* =====================================================
     FINCO – BAR (URUT TOTAL TERBANYAK)
  ===================================================== */
  const fincoGrouped = {};
  data.finco_kecamatan.forEach(d=>{
    fincoGrouped[d.kecamatan] = (fincoGrouped[d.kecamatan]||0) + d.jumlah_transaksi;
  });

  const kecFinco = Object.entries(fincoGrouped)
    .sort((a,b)=>b[1]-a[1])
    .map(d=>d[0]);

  const fincoList = [...new Set(data.finco_kecamatan.map(d=>d.finco))];

  const datasetFinco = fincoList.map((f,i)=>({
    data: kecFinco.map(k =>
      data.finco_kecamatan
        .filter(d=>d.kecamatan===k && d.finco===f)
        .reduce((s,x)=>s+x.jumlah_transaksi,0)
    ),
    backgroundColor: COLORS[i%COLORS.length]
  }));

  new Chart(document.getElementById("barFincoKecamatan"), {
    type:"bar",
    data:{ labels:kecFinco, datasets:datasetFinco },
    options:{
      responsive:true,
      plugins:{
        legend:{ display:false },
        tooltip:{
          callbacks:{ label:c=>`${fincoList[c.datasetIndex]}: ${c.parsed.y}` }
        }
      },
      scales:{
        x:{ stacked:true },
        y:{ stacked:true, beginAtZero:true }
      }
    }
  });

  /* =====================================================
     TABEL FINCO KELURAHAN (OTOMATIS SESUAI CARD)
  ===================================================== */
  document.getElementById("tableFinco").innerHTML = buildAutoTable(
    "FinCo Per Kelurahan",
    ["Kelurahan","FinCo","Jumlah"],
    data.finco_kelurahan
      .sort((a,b)=>b.jumlah_transaksi-a.jumlah_transaksi)
      .map(d=>[d.kelurahan, d.finco, d.jumlah_transaksi])
  );

  document.getElementById("topFilter").addEventListener("change", e=>{
    loadWilayah(e.target.value);
  });
}

/* =====================================================
   HELPER: TABLE OTOMATIS SESUAI CARD
===================================================== */
function buildAutoTable(title, headers, rows){
  let html = `
    <div class="card" style="padding:12px; display:flex; flex-direction:column; height:100%;">
      <h3 style="font-size:14px;margin-bottom:8px">${title}</h3>
      <div style="flex:1; max-height:200px; overflow-y:auto;">
        <table class="table" style="width:100%; font-size:12px; border-collapse:collapse;">
          <thead style="position:sticky; top:0; background:#fff; z-index:1;">
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
            <option value="status_sales">Status Transaksi Sales</option>
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

    const url = `http://localhost:8000/unduh-data?` +
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