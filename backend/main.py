from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
import pandas as pd
from fastapi import HTTPException
from fastapi import FastAPI, HTTPException
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
from fastapi import Query
from fastapi.responses import StreamingResponse
import io
from openpyxl import Workbook
from fastapi.responses import StreamingResponse
from io import BytesIO
import holidays
import os
import json

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL belum diset")

engine = create_engine(DATABASE_URL)
app = FastAPI()

from fastapi.staticfiles import StaticFiles
import os

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount frontend folder
app.mount("/frontend", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "../frontend")), name="frontend")

SCOPE = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive"
]

SERVICE_ACCOUNT_INFO = json.loads(
    os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
)

def get_gs_client():
    creds = ServiceAccountCredentials.from_json_keyfile_dict(
        SERVICE_ACCOUNT_INFO,
        SCOPE
    )
    return gspread.authorize(creds)

def update_database_from_gs():
    try:
        client = get_gs_client()
        sheet = client.open_by_key(
            "1YhFv5B02bsmvoXYCVBfVL9bFEC2Y67xMnrjyNhwWzPQ"
        ).sheet1

        df = pd.DataFrame(sheet.get_all_records())

        if df.empty:
            return False

        df.columns = (
            df.columns
            .str.strip()
            .str.lower()
            .str.replace(" ", "_")
            .str.replace("(", "", regex=False)
            .str.replace(")", "", regex=False)
            .str.replace(".", "", regex=False)
        )

        df = df.rename(columns={
            "tglinvoice": "tgl_invoice",
            "dp_pricelist": "dp_pricelist",
            "dp_konsumen": "dp_konsumen",
            "disc_nonppn": "disc_non_ppn",
            "har_ga": "harga",
            "d_p_p": "dpp",
            "p_p_n": "ppn",
            "b_b_n": "bbn"
        })

        for col in ["tgl_invoice", "tanggal_so"]:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors="coerce")

        df.to_sql("penjualan", engine, if_exists="replace", index=False)
        return True

    except Exception as e:
        print("Error penjualan:", e)
        return False

def update_transaksi_sales_from_gs():
    try:
        client = get_gs_client()
        sheet = client.open_by_key(
            "1XgqIw4adyG4AoNNXhNdu4YcI7gF8N9OrkvPI5vcQLNk"
        ).sheet1

        df = pd.DataFrame(sheet.get_all_records())

        if df.empty:
            return False

        df.columns = df.columns.str.strip().str.lower()

        if "tanggal" in df.columns:
            df["tanggal"] = pd.to_datetime(df["tanggal"], errors="coerce")

        df.to_sql("transaksi_sales", engine, if_exists="replace", index=False)
        return True

    except Exception as e:
        print("Error transaksi sales:", e)
        return False

def safe_top(df, col):
    if df.empty:
        return {"label": "-", "jumlah": 0}

    temp = (
        df.groupby(col)["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah")
        .sort_values("jumlah", ascending=False)
    )

    return {
        "label": temp.iloc[0][col],
        "jumlah": int(temp.iloc[0]["jumlah"])
    }

def apply_global_filter(
    df,
    penjualan=None,
    wiraniaga=None,
    salesman_status=None,
    supervisor=None
):
    if penjualan:
        df = df[df["penjualan"] == penjualan]

    if wiraniaga:
        df = df[df["wiraniaga"] == wiraniaga]

    if salesman_status:
        df = df[df["salesman_status"] == salesman_status]

    if supervisor:
        df = df[df["supervisor"] == supervisor]

    return df

def apply_date_filter(df, start_date=None, end_date=None):
    df = df.copy()
    
    # Pastikan kolom datetime
    df["tgl_invoice"] = pd.to_datetime(df["tgl_invoice"], errors="coerce")
    
    if start_date:
        start = pd.to_datetime(start_date, errors="coerce").normalize()
        df = df[df["tgl_invoice"] >= start]
        
    if end_date:
        end = pd.to_datetime(end_date, errors="coerce").normalize()
        df = df[df["tgl_invoice"] <= end]
    
    return df

def filter_visual(df, col):
    """
    Buang data kosong, null, dan nol
    Untuk keperluan BAR / TABLE
    """
    return df[
        df[col].notna() &
        (df[col] != "") &
        (df[col] != 0) &
        (df[col] != "0")
    ]

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "Dashboard Penjualan Krida API"
    }

@app.get("/filters")
def get_filters():
    """
    Endpoint untuk dropdown filter global
    """
    df = pd.read_sql("""
        SELECT
            penjualan,
            wiraniaga,
            salesman_status,
            supervisor
        FROM penjualan
        WHERE tgl_invoice IS NOT NULL
    """, engine)

    return {
        "penjualan": sorted(df["penjualan"].dropna().unique().tolist()),
        "wiraniaga": sorted(df["wiraniaga"].dropna().unique().tolist()),
        "salesman_status": sorted(df["salesman_status"].dropna().unique().tolist()),
        "supervisor": sorted(df["supervisor"].dropna().unique().tolist())
    }

@app.post("/refresh")
def refresh_data():
    try:
        ok1 = update_database_from_gs()
        ok2 = update_transaksi_sales_from_gs()

        if ok1 and ok2:
            return {"status": "success", "message": "Semua data diperbarui"}
        elif ok1:
            return {"status": "partial", "message": "Penjualan OK, transaksi gagal"}
        elif ok2:
            return {"status": "partial", "message": "Transaksi OK, penjualan gagal"}
        else:
            raise HTTPException(status_code=500, detail="Gagal update data")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/home")
def home():
    return {
        "breadcrumb": ["Home", "Home"],
        "title": "Dirancang untuk Membuat Bisnis Lebih Efisien dan Lebih Menguntungkan",

        "content": [
            "Dashboard Penjualan PT Krida Dinamik Autonusa Cabang Bima merupakan aplikasi visualisasi data yang dirancang untuk mendukung kebutuhan operasional harian dealer secara menyeluruh. Dashboard ini menjadi alat bantu utama dalam memantau performa penjualan secara cepat, akurat, dan terintegrasi.",

            "Sistem ini mengintegrasikan berbagai aspek penting dalam proses bisnis dealer, mulai dari transaksi penjualan, metode pembayaran, kinerja sales dan supervisor, hingga analisis pelanggan dan wilayah. Dengan pendekatan berbasis data, manajemen dapat melakukan evaluasi dan pengambilan keputusan secara lebih efektif.",

            "Dashboard ini dikembangkan menggunakan teknologi berbasis cloud sehingga tidak memerlukan investasi infrastruktur IT yang besar. Aplikasi dapat diakses melalui berbagai perangkat dan sistem operasi tanpa memerlukan lisensi tambahan."
        ]
    }

@app.get("/overview")
def overview(
    penjualan: str | None = None,
    wiraniaga: str | None = None,
    salesman_status: str | None = None,
    supervisor: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    sales_start_date: str | None = None,
    sales_end_date: str | None = None
):

    # LOAD DATA
    df = pd.read_sql("""
        SELECT
            tgl_invoice,
            nomor_invoice,
            type_kendaraan,
            kecamatan,
            penjualan,
            wiraniaga,
            salesman_status,
            supervisor
        FROM penjualan
        WHERE tgl_invoice IS NOT NULL
    """, engine)

    df["tgl_invoice"] = pd.to_datetime(df["tgl_invoice"])
    df["bulan"] = df["tgl_invoice"].dt.to_period("M")

    # FILTER GLOBAL
    df = apply_date_filter(df, start_date, end_date)
    df = apply_global_filter(
        df,
        penjualan,
        wiraniaga,
        salesman_status,
        supervisor
    )

    # RENTANG FILTER AKTUAL
    start_filter = df["tgl_invoice"].min()
    end_filter = df["tgl_invoice"].max()
    delta_days = (end_filter - start_filter).days + 1

    # Tentukan bulan lalu sesuai panjang filter
    start_lalu = start_filter - pd.DateOffset(months=1)
    end_lalu = start_lalu + pd.Timedelta(days=delta_days - 1)

    # Data bulan ini dari df hasil filter
    df_ini = df[(df["tgl_invoice"] >= start_filter) & (df["tgl_invoice"] <= end_filter)]

    # Ambil data bulan lalu dari DB penuh
    df_all = pd.read_sql("""
        SELECT
            tgl_invoice,
            nomor_invoice,
            type_kendaraan,
            kecamatan,
            penjualan,
            wiraniaga,
            salesman_status,
            supervisor
        FROM penjualan
        WHERE tgl_invoice IS NOT NULL
    """, engine)
    df_all["tgl_invoice"] = pd.to_datetime(df_all["tgl_invoice"])

    # Filter bulan lalu proporsional
    df_lalu = df_all[
        (df_all["tgl_invoice"] >= start_lalu) &
        (df_all["tgl_invoice"] <= end_lalu)
    ]

    pakai_filter_tanggal = start_date is not None or end_date is not None

    # TOTAL TRANSAKSI
    if not pakai_filter_tanggal:
        # TANPA FILTER TANGGAL
        total_all = df_all["nomor_invoice"].nunique()
        total_ini = total_all
        total_lalu = total_all
        selisih = 0
        status = "tetap"

    else:
        # DENGAN FILTER TANGGAL
        total_all = df["nomor_invoice"].nunique()
        total_ini = df_ini["nomor_invoice"].nunique()
        total_lalu = df_lalu["nomor_invoice"].nunique() if not df_lalu.empty else 0

        selisih = total_ini - total_lalu
        if selisih > 0:
            status = "naik"
        elif selisih < 0:
            status = "turun"
        else:
            status = "tetap"

    # PREDIKSI BULAN INI 

    # Ambil bulan terakhir dari data hasil filter
    if df.empty:
        prediksi_bulan_ini = 0
        real_so_far = 0
        hk_berjalan = 0
        total_hk_sebulan = 0
    else:
        bulan_filter = df["bulan"].max()  # periode terakhir dari data filter
        tahun_filter = bulan_filter.year
        bulan_filter_month = bulan_filter.month

        # Filter semua data DB untuk bulan yang sama
        df_prediksi = pd.read_sql(f"""
            SELECT tgl_invoice, nomor_invoice, penjualan, wiraniaga, salesman_status, supervisor
            FROM penjualan
            WHERE EXTRACT(YEAR FROM tgl_invoice) = {tahun_filter}
            AND EXTRACT(MONTH FROM tgl_invoice) = {bulan_filter_month}
        """, engine)

        df_prediksi["tgl_invoice"] = pd.to_datetime(df_prediksi["tgl_invoice"])

        # Terapkan filter global
        df_prediksi = apply_global_filter(
            df_prediksi,
            penjualan,
            wiraniaga,
            salesman_status,
            supervisor
        )

        if df_prediksi.empty:
            prediksi_bulan_ini = 0
            real_so_far = 0
            hk_berjalan = 0
            total_hk_sebulan = 0
        else:
            # Realisasi transaksi saat ini (filtered)
            real_so_far = df_prediksi["nomor_invoice"].nunique()

            # Tanggal terakhir yang ada datanya
            last_date_data = df_prediksi["tgl_invoice"].max()

            # Hitung Hari Kerja (Senin-Sabtu)
            first_day = last_date_data.replace(day=1)
            last_day_month = first_day + pd.offsets.MonthEnd(0)

            # Total hari kerja sebulan penuh
            month_range = pd.date_range(first_day, last_day_month)
            total_hk_sebulan = sum(1 for d in month_range if d.weekday() < 6)

            # Hari kerja yang sudah berlalu sampai tanggal terakhir data
            passed_range = pd.date_range(first_day, last_date_data)
            hk_berjalan = sum(1 for d in passed_range if d.weekday() < 6)

            # Hitung prediksi bulan ini
            pembagi = max(hk_berjalan, 1)
            rata_rata = real_so_far / pembagi
            prediksi_bulan_ini = int(rata_rata * total_hk_sebulan)

    # PREDIKSI BULAN DEPAN BERDASARKAN FILTER
    # Ambil bulan terakhir dari data filter
    bulan_terakhir_filter = df["bulan"].max()
    tahun_terakhir_filter = bulan_terakhir_filter.year
    bulan_terakhir = bulan_terakhir_filter.month

    # Tentukan bulan depan
    if bulan_terakhir == 12:
        bulan_depan_month = 1
        tahun_depan = tahun_terakhir_filter + 1
    else:
        bulan_depan_month = bulan_terakhir + 1
        tahun_depan = tahun_terakhir_filter

    # Ambil semua data bulan depan dari DB penuh supaya tetap ada walau filter cuma 1 bulan
    df_all = pd.read_sql("""
        SELECT tgl_invoice, nomor_invoice
        FROM penjualan
        WHERE tgl_invoice IS NOT NULL
    """, engine)
    df_all["tgl_invoice"] = pd.to_datetime(df_all["tgl_invoice"])

    # Filter data bulan depan dari DB penuh
    df_bulan_depan = df_all[df_all["tgl_invoice"].dt.month == bulan_depan_month]

    if not df_bulan_depan.empty:
        # Ambil hanya tahun <= tahun_depan untuk menghitung rata-rata per tahun
        df_bulan_depan = df_bulan_depan[df_bulan_depan["tgl_invoice"].dt.year <= tahun_depan]
        rata_bulan_depan = df_bulan_depan.groupby(df_bulan_depan["tgl_invoice"].dt.year)["nomor_invoice"].nunique().mean()
        prediksi_bulan_depan = int(rata_bulan_depan)
    else:
            prediksi_bulan_depan = 0

    # TREND
    if start_date and end_date:
        start_dt = pd.to_datetime(start_date)
        end_dt = pd.to_datetime(end_date)
        delta_month = (end_dt.year - start_dt.year) * 12 + (end_dt.month - start_dt.month) + 1
    else:
        delta_month = 12  # default 12 bulan
        
    trend_mingguan = pd.DataFrame(columns=["minggu", "jumlah"])
    if delta_month <= 5:
        # Trend harian
        trend_harian = (
            df.groupby(df["tgl_invoice"].dt.date)["nomor_invoice"]
            .nunique()
            .reset_index(name="jumlah")
        )
        trend_harian["tanggal"] = trend_harian["tgl_invoice"].astype(str)
        trend_harian = trend_harian[["tanggal", "jumlah"]]

        # Trend mingguan: 1 titik per minggu (Senin sebagai start)
        trend_mingguan = (
            df.groupby(df["tgl_invoice"].dt.to_period("W-MON"))["nomor_invoice"]
            .nunique()
            .reset_index(name="jumlah")
        )
        # Ambil tanggal awal minggu
        trend_mingguan["minggu"] = trend_mingguan["tgl_invoice"].dt.start_time.dt.date.astype(str)
        trend_mingguan = trend_mingguan[["minggu", "jumlah"]]

    else:
        # Trend bulanan
        df["bulan_str"] = df["tgl_invoice"].dt.to_period("M").astype(str)
        trend_harian = (
            df.groupby("bulan_str")["nomor_invoice"]
            .nunique()
            .reset_index(name="jumlah")
        )
        trend_harian.rename(columns={"bulan_str": "tanggal"}, inplace=True)

    # PIE & STATUS 
    label_bulan_ini = f"{start_filter.date()} s/d {end_filter.date()}"

    # Periode "lalu" proporsional sama panjangnya dengan periode filter ini
    delta_days = (end_filter - start_filter).days + 1
    start_lalu = start_filter - pd.Timedelta(days=delta_days)
    end_lalu = start_filter - pd.Timedelta(days=1)
    label_bulan_lalu = f"{start_lalu.date()} s/d {end_lalu.date()}"

    # DATA PERIODE INI
    df_ini = df[(df["tgl_invoice"] >= start_filter) & (df["tgl_invoice"] <= end_filter)]
    df_ini = apply_global_filter(
        df_ini,
        penjualan,
        wiraniaga,
        salesman_status,
        supervisor
    )

    # DATA PERIODE LALU 
    # Ambil semua data dari DB
    df_all = pd.read_sql("""
        SELECT
            tgl_invoice,
            nomor_invoice,
            type_kendaraan,
            kecamatan,
            penjualan,
            wiraniaga,
            salesman_status,
            supervisor
        FROM penjualan
        WHERE tgl_invoice IS NOT NULL
    """, engine)
    df_all["tgl_invoice"] = pd.to_datetime(df_all["tgl_invoice"])

    # Filter periode lalu proporsional
    df_lalu = df_all[
        (df_all["tgl_invoice"] >= start_lalu) &
        (df_all["tgl_invoice"] <= end_lalu)
    ]

    # Terapkan filter global agar konsisten
    df_lalu = apply_global_filter(
        df_lalu,
        penjualan,
        wiraniaga,
        salesman_status,
        supervisor
    )

    # PIE PENJUALAN
    pie_penjualan_ini = (
        df_ini
        .groupby("penjualan")["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah")
    )

    pie_penjualan_lalu = (
        df_lalu
        .groupby("penjualan")["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah")
    )

    # STATUS SALES
    status_sales_ini = (
        df_ini
        .groupby("salesman_status")["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah")
    )

    status_sales_lalu = (
        df_lalu
        .groupby("salesman_status")["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah")
    )

    # TOP KENDARAAN & KECAMATAN
    if (
        start_date is None and end_date is None and
        penjualan is None and wiraniaga is None and
        salesman_status is None and supervisor is None
    ):
        df_ini_top = df_all.copy()
        df_lalu_top = df_all.copy()
    else:
        df_ini_top = df_ini.copy()
        df_lalu_top = df_lalu.copy()

    agg_kendaraan = (
        df_ini_top
        .groupby("type_kendaraan")["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah")
        .sort_values(
            ["jumlah", "type_kendaraan"],  
            ascending=[False, True]
        )
    )

    agg_kecamatan = (
        df_ini_top
        .groupby("kecamatan")["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah")
        .sort_values(
            ["jumlah", "kecamatan"],      
            ascending=[False, True]
        )
    )

    def safe_top(df, col):
        if df.empty:
            return {"label": "-", "jumlah": 0}

        x = (
            df.groupby(col)["nomor_invoice"]
            .nunique()
            .reset_index(name="jumlah")
            .sort_values(
                ["jumlah", col],
                ascending=[False, True]
            )
            .iloc[0]
        )

        return {"label": x[col], "jumlah": int(x["jumlah"])}

    top_kendaraan = {
        "bulan_ini": (
            {"label": agg_kendaraan.iloc[0]["type_kendaraan"],
            "jumlah": int(agg_kendaraan.iloc[0]["jumlah"])}
            if not agg_kendaraan.empty
            else {"label": "-", "jumlah": 0}
        ),
        "bulan_lalu": safe_top(df_lalu_top, "type_kendaraan")
    }

    top_kecamatan = {
        "bulan_ini": (
            {"label": agg_kecamatan.iloc[0]["kecamatan"],
            "jumlah": int(agg_kecamatan.iloc[0]["jumlah"])}
            if not agg_kecamatan.empty
            else {"label": "-", "jumlah": 0}
        ),
        "bulan_lalu": safe_top(df_lalu_top, "kecamatan")
    }

    top10_kendaraan = agg_kendaraan.head(10)
    top10_kecamatan = agg_kecamatan.head(10)

    # TRANSAKSI SALES - STACKED BAR
    df_sales = pd.read_sql("""
        SELECT
            salesman,
            status,
            nomor,
            tanggal    
        FROM transaksi_sales
        WHERE status != 'Deal'
        AND tanggal IS NOT NULL
    """, engine)

    df_sales["tanggal"] = pd.to_datetime(df_sales["tanggal"]).dt.date

    if sales_start_date:
        df_sales = df_sales[
            df_sales["tanggal"] >= pd.to_datetime(sales_start_date).date()
        ]

    if sales_end_date:
        df_sales = df_sales[
            df_sales["tanggal"] <= pd.to_datetime(sales_end_date).date()
        ]

    transaksi_sales = (
        df_sales
        .groupby(["salesman", "status"])["nomor"]
        .nunique()
        .reset_index(name="jumlah")
    )

    df_pivot = transaksi_sales.pivot(
        index="salesman",
        columns="status",
        values="jumlah"
    ).fillna(0)

    df_pivot["total"] = df_pivot.sum(axis=1)
    df_pivot = df_pivot.sort_values("total", ascending=False).drop(columns="total")

    labels_sales = df_pivot.index.tolist()
    datasets_sales = [
        {
            "label": status,
            "data": df_pivot[status].astype(int).tolist()
        }
        for status in df_pivot.columns
    ]
    # JUMLAH PENJUALAN PER WIRANIAGA
    penjualan_wiraniaga = (
        df
        .groupby("wiraniaga")["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah")
        .sort_values("jumlah", ascending=False)
    )

    # RESPONSE
    return {
        "bulan_ini": label_bulan_ini,
        "bulan_lalu": label_bulan_lalu,

        "penjualan": {
            "total_all": int(total_all),
            "total_ini": int(total_ini),
            "total_lalu": int(total_lalu),
            "selisih": int(selisih),
            "status": status,
            "prediksi_bulan_ini": prediksi_bulan_ini,
            "prediksi_bulan_depan": prediksi_bulan_depan
        },

        "top_kendaraan": top_kendaraan,
        "top_kecamatan": top_kecamatan,

        "trend_harian": trend_harian.to_dict("records"),
        "trend_mingguan": trend_mingguan.to_dict("records")if delta_month <= 5 else [],
        "pie_penjualan": {
            "bulan_ini": pie_penjualan_ini.to_dict("records"),
            "bulan_lalu": pie_penjualan_lalu.to_dict("records")
        },
        "status_sales": {
            "bulan_ini": status_sales_ini.to_dict(orient="records"),
            "bulan_lalu": status_sales_lalu.to_dict(orient="records")
        },

        "penjualan_wiraniaga": penjualan_wiraniaga.to_dict("records"),

        "top10_kecamatan": top10_kecamatan.to_dict("records"),
        "top10_kendaraan": top10_kendaraan.to_dict("records"),

        "transaksi_sales": {
            "labels": labels_sales,
            "datasets": datasets_sales
        }
    }

@app.get("/performa-sales")
def performa_sales(
    penjualan: str | None = None,
    wiraniaga: str | None = None,
    salesman_status: str | None = None,
    supervisor: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None
):

    # LOAD DATA
    df = pd.read_sql("""
        SELECT
            tgl_invoice,
            nomor_invoice,
            wiraniaga,
            penjualan,
            salesman_status,
            supervisor
        FROM penjualan
        WHERE tgl_invoice IS NOT NULL
    """, engine)

    df["tgl_invoice"] = pd.to_datetime(df["tgl_invoice"])

    df = apply_date_filter(df, start_date, end_date)

    df = apply_global_filter(
        df,
        penjualan,
        wiraniaga,
        salesman_status,
        supervisor
    )

    # TENTUKAN 3 BULAN BERDASARKAN END_DATE
    if end_date:
        end_month = pd.to_datetime(end_date).to_period("M").to_timestamp()
    else:
        end_month = pd.Timestamp.today().to_period("M").to_timestamp()

    last_3_months = [
        end_month - pd.DateOffset(months=2),
        end_month - pd.DateOffset(months=1),
        end_month
    ]

    df["bulan"] = df["tgl_invoice"].dt.to_period("M").dt.to_timestamp()
    df = df[df["bulan"].isin(last_3_months)]

    bulan_labels = {
        last_3_months[0]: "bulan_1",
        last_3_months[1]: "bulan_2",
        last_3_months[2]: "bulan_3"
    }

    # AGREGASI PER SALES
    sales_df = (
        df
        .groupby(["wiraniaga", "bulan"])["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah_transaksi")
    )

    pivot = (
        sales_df
        .pivot(index="wiraniaga", columns="bulan", values="jumlah_transaksi")
        .fillna(0)
        .reset_index()
        .rename(columns=bulan_labels)
    )

    for col in ["bulan_1", "bulan_2", "bulan_3"]:
        if col not in pivot:
            pivot[col] = 0

    # HITUNG PERUBAHAN
    pivot["perubahan_1_2"] = pivot["bulan_2"] - pivot["bulan_1"]
    pivot["perubahan_2_3"] = pivot["bulan_3"] - pivot["bulan_2"]

    def status(delta):
        if delta > 0:
            return {"status": "naik", "warna": "green", "icon": "▲"}
        if delta < 0:
            return {"status": "turun", "warna": "red", "icon": "▼"}
        return {"status": "stabil", "warna": "yellow", "icon": "▬"}

    pivot["status_1_2"] = pivot["perubahan_1_2"].apply(status)
    pivot["status_2_3"] = pivot["perubahan_2_3"].apply(status)

    pivot["rata_rata_3_bulan"] = pivot[["bulan_1", "bulan_2", "bulan_3"]].mean(axis=1)

    # FORMAT OUTPUT
    result = []
    for _, r in pivot.iterrows():
        result.append({
            "sales": r["wiraniaga"],
            "bulan_1": int(r["bulan_1"]),
            "bulan_2": int(r["bulan_2"]),
            "bulan_3": int(r["bulan_3"]),
            "rata_rata_3_bulan": round(r["rata_rata_3_bulan"], 2),
            "perubahan_1_2": {
                "nilai": int(r["perubahan_1_2"]),
                **r["status_1_2"]
            },
            "perubahan_2_3": {
                "nilai": int(r["perubahan_2_3"]),
                **r["status_2_3"]
            }
        })

    return {
        "periode": [
            last_3_months[0].strftime("%B %Y"),
            last_3_months[1].strftime("%B %Y"),
            last_3_months[2].strftime("%B %Y")
        ],
        "data": sorted(result, key=lambda x: x["bulan_3"], reverse=True)
    }

@app.get("/trend")
def trend(
    top_n: str = Query("Top 5", description="Top FinCo: Top 5 / Top 10 / Semua"),
    penjualan: str | None = None,
    wiraniaga: str | None = None,
    salesman_status: str | None = None,
    supervisor: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None
):
    # LOAD DATA
    df_trend = pd.read_sql("""
        SELECT
            tgl_invoice,
            nomor_invoice,
            penjualan,
            finco,
            wiraniaga,
            salesman_status,
            supervisor
        FROM penjualan
        WHERE tgl_invoice IS NOT NULL
    """, engine)

    df_trend["tgl_invoice"] = pd.to_datetime(df_trend["tgl_invoice"])

    # FILTER DATA
    df_trend = apply_date_filter(df_trend, start_date, end_date)
    df_trend = apply_global_filter(
        df_trend,
        penjualan,
        wiraniaga,
        salesman_status,
        supervisor
    )

    # TENTUKAN RENTANG & TREND
    if start_date and end_date:
        start_dt = pd.to_datetime(start_date)
        end_dt = pd.to_datetime(end_date)
        total_months = (end_dt.year - start_dt.year) * 12 + (end_dt.month - start_dt.month) + 1
    else:
        total_months = 12  

    # TREND TOTAL
    if total_months <= 5:

        trend_total = (
            df_trend
            .groupby(df_trend["tgl_invoice"].dt.date)["nomor_invoice"]
            .nunique()
            .reset_index(name="jumlah_transaksi")
        )
        trend_total["periode"] = trend_total["tgl_invoice"].astype(str)
    else:
        # trend bulanan
        trend_total = (
            df_trend
            .groupby(df_trend["tgl_invoice"].dt.to_period("M"))["nomor_invoice"]
            .nunique()
            .reset_index(name="jumlah_transaksi")
        )
        trend_total["periode"] = trend_total["tgl_invoice"].astype(str)

    # TREND METODE PENJUALAN
    if total_months <= 5:
        trend_metode = (
            df_trend
            .groupby([df_trend["tgl_invoice"].dt.date, "penjualan"])["nomor_invoice"]
            .nunique()
            .reset_index(name="jumlah_transaksi")
        )
        trend_metode["periode"] = trend_metode["tgl_invoice"].astype(str)
    else:
        trend_metode = (
            df_trend
            .groupby([df_trend["tgl_invoice"].dt.to_period("M"), "penjualan"])["nomor_invoice"]
            .nunique()
            .reset_index(name="jumlah_transaksi")
        )
        trend_metode["periode"] = trend_metode["tgl_invoice"].astype(str)

    # TREND FINCO
    df_finco = df_trend[
        df_trend["finco"].notna() &
        (df_trend["finco"] != "") &
        (df_trend["finco"] != "0") &
        (df_trend["finco"] != 0)
    ]

    if total_months <= 5:
        trend_finco = (
            df_finco
            .groupby([df_finco["tgl_invoice"].dt.date, "finco"])["nomor_invoice"]
            .nunique()
            .reset_index(name="jumlah_transaksi")
        )
        trend_finco["periode"] = trend_finco["tgl_invoice"].astype(str)
    else:
        trend_finco = (
            df_finco
            .groupby([df_finco["tgl_invoice"].dt.to_period("M"), "finco"])["nomor_invoice"]
            .nunique()
            .reset_index(name="jumlah_transaksi")
        )
        trend_finco["periode"] = trend_finco["tgl_invoice"].astype(str)

    # RANK FINCO
    rank_finco = (
        trend_finco.groupby("finco")["jumlah_transaksi"]
        .sum()
        .sort_values(ascending=False)
        .index.tolist()
    )

    if top_n == "Top 5":
        top_finco = rank_finco[:5]
    elif top_n == "Top 10":
        top_finco = rank_finco[:10]
    else:
        top_finco = rank_finco

    trend_finco = trend_finco[trend_finco["finco"].isin(top_finco)]

    # RESPONSE JSON
    return {
        "trend_total": trend_total[["periode", "jumlah_transaksi"]].to_dict("records"),
        "trend_metode": trend_metode[["periode", "penjualan", "jumlah_transaksi"]].to_dict("records"),
        "trend_finco": trend_finco[["periode", "finco", "jumlah_transaksi"]].to_dict("records"),
        "rank_finco": top_finco
    }

# ENDPOINT PENJUALAN
@app.get("/penjualan")
def penjualan(
    top: str = "top5",
    penjualan: str | None = None,
    wiraniaga: str | None = None,
    salesman_status: str | None = None,
    supervisor: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None
):

    """
    Endpoint analisis penjualan:
    - Pie distribusi metode penjualan (CASH vs KREDIT)
    - Bar FinCo (Top 5 / Top 10 / All)
    """

    # LOAD DATA
    df = pd.read_sql("""
        SELECT
            tgl_invoice,
            nomor_invoice,
            penjualan,
            finco,
            wiraniaga,
            salesman_status,
            supervisor
        FROM penjualan
        WHERE tgl_invoice IS NOT NULL
    """, engine)
    df = apply_date_filter(df, start_date, end_date)
    df = apply_global_filter(
        df,
        penjualan,
        wiraniaga,
        salesman_status,
        supervisor
    )


    # PIE METODE PENJUALAN
    pie_penjualan = (
        df
        .groupby("penjualan")["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah")
    )

    # FINCO (TOP N)
    df_finco = filter_visual(df, "finco")

    finco = (
        df_finco
        .groupby("finco")["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah_transaksi")
        .sort_values("jumlah_transaksi", ascending=False)
    )

    if top.lower() == "top5":
        finco = finco.head(5)
    elif top.lower() == "top10":
        finco = finco.head(10)

    # RESPONSE JSON
    return {
        "breadcrumb": ["Analisis Penjualan", "Analisis Penjualan"],
        "title": "Analisis Penjualan",

        "pie_penjualan": pie_penjualan.to_dict("records"),

        "finco": {
            "filter": top,
            "data": finco.to_dict("records")
        }
    }

# ENDPOINT PRODUK
@app.get("/produk")
def produk(
    # filter global 
    penjualan: str | None = None,
    wiraniaga: str | None = None,
    salesman_status: str | None = None,
    supervisor: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None
):
    """
    Analisis Produk:
    - Distribusi penjualan berdasarkan tahun rakit
    - Distribusi penjualan berdasarkan tipe kendaraan
    """

    # LOAD DATA
    df = pd.read_sql("""
        SELECT
            tgl_invoice,
            nomor_invoice,
            tahun_rakit,
            type_kendaraan,
            penjualan,
            wiraniaga,
            salesman_status,
            supervisor
        FROM penjualan
        WHERE tgl_invoice IS NOT NULL
    """, engine)
    df = apply_date_filter(df, start_date, end_date)
    df = apply_global_filter(
        df,
        penjualan,
        wiraniaga,
        salesman_status,
        supervisor
    )

    # PENJUALAN PER TAHUN RAKIT
    tahun_rakit = (
        df
        .groupby("tahun_rakit")["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah_transaksi")
        .sort_values("tahun_rakit", ascending=True)
    )

    # PENJUALAN PER TIPE KENDARAAN
    df_kendaraan = filter_visual(df, "type_kendaraan")

    tipe_kendaraan = (
        df_kendaraan
        .groupby("type_kendaraan")["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah_transaksi")
        .sort_values("jumlah_transaksi", ascending=False)
    )

    # RESPONSE JSON
    return {
        "breadcrumb": ["Analisis Produk", "Analisis Produk"],
        "title": "Analisis Produk",

        "penjualan_tahun_rakit": tahun_rakit.to_dict("records"),

        "penjualan_tipe_kendaraan": tipe_kendaraan.to_dict("records")
    }

# ENDPOINT PEKERJA
@app.get("/pekerja")
def pekerja(
    # filter global 
    penjualan: str | None = None,
    wiraniaga: str | None = None,
    salesman_status: str | None = None,
    supervisor: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None
):

    """
    Endpoint Analisis Pekerja:
    - Bar penjualan per supervisor
    - Ringkasan penjualan wiraniaga
    - Penjualan wiraniaga per kecamatan
    - Penjualan wiraniaga per kelurahan
    """

    # LOAD DATA
    df = pd.read_sql("""
        SELECT
            tgl_invoice,
            nomor_invoice,
            supervisor,
            wiraniaga,
            kecamatan,
            kelurahan,
            penjualan,
            salesman_status
        FROM penjualan
        WHERE tgl_invoice IS NOT NULL
    """, engine)
    df = apply_date_filter(df, start_date, end_date)
    df = apply_global_filter(
        df,
        penjualan,
        wiraniaga,
        salesman_status,
        supervisor
    )

    # BAR: PENJUALAN PER SUPERVISOR
    supervisor_df = (
        df
        .groupby("supervisor")["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah_transaksi")
        .sort_values("jumlah_transaksi", ascending=False)
    )

    # HELPER FUNCTION
    def top_area(df, col):
        if df.empty:
            return "-", 0
        tmp = (
            df.groupby(col)["nomor_invoice"]
            .nunique()
            .reset_index(name="jumlah")
            .sort_values("jumlah", ascending=False)
        )
        return tmp.iloc[0][col], int(tmp.iloc[0]["jumlah"])

    # SUMMARY WIRANIAGA
    summary_wiraniaga = []

    for w in df["wiraniaga"].dropna().unique():
        df_w = df[df["wiraniaga"] == w]

        total_transaksi = df_w["nomor_invoice"].nunique()
        top_kec, jml_kec = top_area(df_w, "kecamatan")
        top_kel, jml_kel = top_area(df_w, "kelurahan")

        summary_wiraniaga.append({
            "wiraniaga": w,
            "total_penjualan": int(total_transaksi),
            "kecamatan_terbanyak": top_kec,
            "jumlah_kecamatan": jml_kec,
            "kelurahan_terbanyak": top_kel,
            "jumlah_kelurahan": jml_kel
        })

    summary_wiraniaga_df = (
        pd.DataFrame(summary_wiraniaga)
        .sort_values("total_penjualan", ascending=False)
    )

    # PENJUALAN WIRANIAGA PER KECAMATAN
    wiraniaga_kecamatan = (
        df
        .groupby(["wiraniaga", "kecamatan"])["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah_transaksi")
        .sort_values(["wiraniaga", "jumlah_transaksi"], ascending=[True, False])
    )

    # PENJUALAN WIRANIAGA PER KELURAHAN
    wiraniaga_kelurahan = (
        df
        .groupby(["wiraniaga", "kelurahan"])["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah_transaksi")
        .sort_values(["wiraniaga", "jumlah_transaksi"], ascending=[True, False])
    )

    # RESPONSE JSON
    return {
        "breadcrumb": ["Analisis Pekerja", "Analisis Pekerja"],
        "title": "Analisis Pekerja",

        "penjualan_supervisor": supervisor_df.to_dict("records"),

        "summary_wiraniaga": summary_wiraniaga_df.to_dict("records"),

        "wiraniaga_per_kecamatan": wiraniaga_kecamatan.to_dict("records"),

        "wiraniaga_per_kelurahan": wiraniaga_kelurahan.to_dict("records")
    }

@app.get("/pelanggan")
def pelanggan(
    start_date: str | None = None,
    end_date: str | None = None,
    customer_key: str | None = None,
    pekerjaan: str | None = None,
    penjualan: str | None = None,
    wiraniaga: str | None = None,
    salesman_status: str | None = None,
    supervisor: str | None = None
):

    df = pd.read_sql("""
        SELECT
            tgl_invoice,
            nomor_invoice,
            no_ktp,
            nama_customer,
            alamat,
            pekerjaan,
            penjualan,
            wiraniaga,
            salesman_status,
            supervisor,
            h_a_r_g_a
        FROM penjualan
        WHERE tgl_invoice IS NOT NULL
    """, engine)

    df["tgl_invoice"] = pd.to_datetime(df["tgl_invoice"])
    df = apply_date_filter(df, start_date, end_date)
    df = apply_global_filter(df, penjualan, wiraniaga, salesman_status, supervisor)

    df["customer_key"] = df.apply(
        lambda x: str(x["no_ktp"]) if pd.notna(x["no_ktp"]) and x["no_ktp"] != ""
        else f'{x["nama_customer"]}_{x["alamat"]}',
        axis=1
    )

    df["h_a_r_g_a"] = (
        df["h_a_r_g_a"]
        .astype(str)
        .str.replace(".", "", regex=False)
        .str.replace(",", ".", regex=False)
        .astype(float)
    )

    customer_df = (
        df.groupby(["customer_key", "nama_customer"])
        .agg(
            jumlah_transaksi=("nomor_invoice", "nunique"),
            total_pengeluaran=("h_a_r_g_a", "sum")
        )
        .reset_index()
        .sort_values("total_pengeluaran", ascending=False)
    )

    def segment_customer(jml):
        if jml == 1:
            return "Baru"
        elif jml <= 3:
            return "Menengah"
        return "Loyal"

    customer_df["segment"] = customer_df["jumlah_transaksi"].apply(segment_customer)

    segmen = (
        customer_df["segment"]
        .value_counts()
        .reindex(["Baru", "Menengah", "Loyal"])
        .fillna(0)
        .reset_index()
    )
    segmen.columns = ["segment", "jumlah_customer"]

    trend_customer = []
    if customer_key:
        df["bulan"] = df["tgl_invoice"].dt.to_period("M").astype(str)
        trend_customer = (
            df[df["customer_key"] == customer_key]
            .groupby("bulan")["nomor_invoice"]
            .nunique()
            .reset_index(name="jumlah_transaksi")
            .to_dict("records")
        )

    df_pekerjaan = df[df["pekerjaan"].notna() & (df["pekerjaan"] != "")]
    pekerjaan_df = (
        df_pekerjaan.groupby("pekerjaan")["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah_transaksi")
        .sort_values("jumlah_transaksi", ascending=False)
    )

    trend_pekerjaan = []
    if pekerjaan:
        df_p = df_pekerjaan[df_pekerjaan["pekerjaan"] == pekerjaan].copy()
        df_p["bulan"] = df_p["tgl_invoice"].dt.to_period("M").astype(str)
        trend_pekerjaan = (
            df_p.groupby("bulan")["nomor_invoice"]
            .nunique()
            .reset_index(name="jumlah_transaksi")
            .to_dict("records")
        )

    return {
        "transaksi_per_customer": customer_df.to_dict("records"),
        "segmentasi": segmen.to_dict("records"),
        "trend_customer_loyal": trend_customer,
        "distribusi_pekerjaan": pekerjaan_df.to_dict("records"),
        "trend_pekerjaan": trend_pekerjaan
    }

@app.get("/wilayah")
def wilayah(
    top: str = "top5",
    penjualan: str | None = None,
    wiraniaga: str | None = None,
    salesman_status: str | None = None,
    supervisor: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None
):

    df = pd.read_sql("""
        SELECT
            tgl_invoice,
            nomor_invoice,
            kecamatan,
            kelurahan,
            penjualan,
            finco,
            wiraniaga,
            salesman_status,
            supervisor
        FROM penjualan
        WHERE tgl_invoice IS NOT NULL
    """, engine)

    df["kecamatan"] = df["kecamatan"].astype(str)
    df["kelurahan"] = df["kelurahan"].astype(str)
    df["finco"] = df["finco"].astype(str)

    df = apply_date_filter(df, start_date, end_date)
    df = apply_global_filter(
        df,
        penjualan,
        wiraniaga,
        salesman_status,
        supervisor
    )

    def filter_top(df_):
        if top == "top5":
            return df_.head(5)
        if top == "top10":
            return df_.head(10)
        if top == "top15":
            return df_.head(15)
        return df_

    # PENJUALAN PER KECAMATAN
    penjualan_kecamatan = (
        df
        .groupby("kecamatan")["nomor_invoice"]
        .nunique()
        .reset_index(name="total_transaksi")
        .sort_values("total_transaksi", ascending=False)
    )

    kec_order = filter_top(penjualan_kecamatan)["kecamatan"].tolist()

    # FILTER KELURAHAN VALID
    df_kel = df[
        df["kelurahan"].notna() &
        (df["kelurahan"].str.strip() != "") &
        (df["kelurahan"] != "0")
    ].copy()

    # PENJUALAN PER KELURAHAN
    penjualan_kelurahan = (
        df_kel
        .groupby("kelurahan")["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah_transaksi")
        .sort_values("jumlah_transaksi", ascending=False)
    )

    # METODE PENJUALAN PER KECAMATAN
    metode_kecamatan = (
        df
        .groupby(["kecamatan", "penjualan"])["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah_transaksi")
    )

    metode_kecamatan = metode_kecamatan[
        metode_kecamatan["kecamatan"].isin(kec_order)
    ]

    metode_kecamatan["rank_kec"] = metode_kecamatan["kecamatan"].map(
        {k: i for i, k in enumerate(kec_order)}
    )

    metode_kecamatan["rank_metode"] = metode_kecamatan["penjualan"].str.upper().map({
        "CASH": 0,
        "KREDIT": 1
    }).fillna(99)

    metode_kecamatan = (
        metode_kecamatan
        .sort_values(["rank_kec", "rank_metode"])
        .drop(columns=["rank_kec", "rank_metode"])
    )

    # METODE PENJUALAN PER KELURAHAN
    kel_order = penjualan_kelurahan["kelurahan"].tolist()

    metode_kelurahan = (
        df_kel
        .groupby(["kelurahan", "penjualan"])["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah_transaksi")
    )

    metode_kelurahan["rank_kel"] = metode_kelurahan["kelurahan"].map(
        {k: i for i, k in enumerate(kel_order)}
    )

    metode_kelurahan["rank_metode"] = metode_kelurahan["penjualan"].str.upper().map({
        "CASH": 0,
        "KREDIT": 1
    }).fillna(99)

    metode_kelurahan = (
        metode_kelurahan
        .sort_values(["rank_kel", "rank_metode"])
        .drop(columns=["rank_kel", "rank_metode"])
    )

    # FINCO PER KECAMATAN 
    df_fin = df_kel[
        df_kel["finco"].notna() &
        (df_kel["finco"].str.strip() != "") &
        (df_kel["finco"] != "0")
    ].copy()

    finco_kecamatan = (
        df_fin
        .groupby(["kecamatan", "finco"])["nomor_invoice"]
        .nunique()
        .reset_index(name="jumlah_transaksi")
    )

    finco_kecamatan = finco_kecamatan[
        finco_kecamatan["kecamatan"].isin(kec_order)
    ]

    # RESPONSE
    return {
        "penjualan_kecamatan": filter_top(penjualan_kecamatan).to_dict("records"),
        "penjualan_kelurahan": filter_top(penjualan_kelurahan).to_dict("records"),

        "metode_penjualan_kecamatan": metode_kecamatan.to_dict("records"),
        "metode_penjualan_kelurahan": filter_top(metode_kelurahan).to_dict("records"),

        "finco_kecamatan": finco_kecamatan.to_dict("records")
    }

from fastapi import Query, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime
import pandas as pd
import io
from openpyxl import Workbook
from openpyxl.utils.dataframe import dataframe_to_rows


@app.get("/unduh-data")
def unduh_data(
    jenis_data: str = Query(..., description="penjualan | status_sales"),
    tanggal_awal: str = Query(..., description="DD/MM/YYYY"),
    tanggal_akhir: str = Query(..., description="DD/MM/YYYY")
):
    try:
        # PARSE TANGGAL
        start = datetime.strptime(tanggal_awal, "%d/%m/%Y")
        end = datetime.strptime(tanggal_akhir, "%d/%m/%Y")

        # PILIH DATA
        if jenis_data == "penjualan":
            query = """
                SELECT *
                FROM penjualan
                WHERE tgl_invoice BETWEEN %(start)s AND %(end)s
                ORDER BY tgl_invoice
            """
            filename = "penjualan.xlsx"

        elif jenis_data == "status_sales":
            query = """
                SELECT *
                FROM transaksi_sales
                WHERE tanggal BETWEEN %(start)s AND %(end)s
                ORDER BY tanggal
            """
            filename = "status_sales.xlsx"

        else:
            raise HTTPException(
                status_code=400,
                detail="jenis_data harus penjualan atau status_sales"
            )

        # LOAD DATA
        df = pd.read_sql(
            query,
            engine,
            params={"start": start, "end": end}
        )

        if df.empty:
            raise HTTPException(
                status_code=404,
                detail="Data tidak ditemukan pada rentang tanggal tersebut"
            )

        # EXPORT XLSX
        wb = Workbook()
        ws = wb.active
        ws.title = "Data"

        for r in dataframe_to_rows(df, index=False, header=True):
            ws.append(r)

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Format tanggal harus DD/MM/YYYY"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
