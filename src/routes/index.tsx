import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ANGGOTA_BEBAS,
  PETUGAS,
  RATES,
  cariAnggotaBebas,
  type VehicleType,
} from "../lib/parkir-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kasir Parkir — Motor Rp 2.000 · Mobil Rp 5.000" },
      {
        name: "description",
        content:
          "Aplikasi kasir parkir: login petugas, catat plat nomor, tarif flat motor Rp 2.000 dan mobil Rp 5.000, kartu bebas biaya, dan total pendapatan harian.",
      },
      { property: "og:title", content: "Kasir Parkir — Motor Rp 2.000 · Mobil Rp 5.000" },
      {
        property: "og:description",
        content:
          "Login petugas, catat plat nomor, pilih motor atau mobil, checkout, dan lihat total pendapatan harian.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

interface ParkedVehicle {
  id: string;
  plate: string;
  type: VehicleType;
  entryAt: number;
  /** ID anggota bebas biaya, kalau ada. */
  bebasId?: string;
  bebasNama?: string;
}

interface Receipt {
  id: string;
  plate: string;
  type: VehicleType;
  entryAt: number;
  paidAt: number;
  amount: number;
  bebasId?: string;
}

const ACTIVE_KEY = "parkir.active";
const RECEIPTS_KEY = "parkir.receipts";
const SESSION_KEY = "parkir.session";

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const clock = (t: number) =>
  new Date(t)
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    .replace(".", ":");
const isToday = (t: number) =>
  new Date(t).toDateString() === new Date().toDateString();

function durationLabel(from: number, to: number) {
  const mins = Math.max(0, Math.floor((to - from) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} menit`;
  return `${h} j ${m} m`;
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

interface Session {
  nama: string;
  peran: string;
  username: string;
}

function Index() {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setSession(load<Session | null>(SESSION_KEY, null));
    setHydrated(true);
  }, []);

  function handleLogin(s: Session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }

  if (!hydrated) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!session) return <LoginScreen onLogin={handleLogin} />;

  return <Kasir session={session} onLogout={handleLogout} />;
}

/* ------------------------------- LOGIN ---------------------------------- */

function LoginScreen({ onLogin }: { onLogin: (s: Session) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = PETUGAS.find(
      (p) =>
        p.username === username.trim().toLowerCase() && p.password === password
    );
    if (!found) {
      setError("Nama pengguna atau kata sandi salah.");
      return;
    }
    setError(null);
    onLogin({ nama: found.nama, peran: found.peran, username: found.username });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-xl bg-primary font-mono text-2xl font-bold text-primary-foreground">
            P
          </span>
          <div className="leading-tight">
            <h1 className="text-xl font-bold tracking-tight">Kasir Parkir</h1>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Motor Rp 2.000 · Mobil Rp 5.000
            </p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="ticket-notch rounded-2xl border border-border bg-card p-6"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Masuk petugas
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Login</h2>

          <label
            htmlFor="username"
            className="mt-6 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
          >
            Nama pengguna
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            spellCheck={false}
            placeholder="kasir"
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-mono text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <label
            htmlFor="password"
            className="mt-4 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
          >
            Kata sandi
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••"
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-mono text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {error && (
            <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Masuk
          </button>

          <div className="mt-5 border-t border-dashed border-border pt-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Akun contoh
            </p>
            <ul className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
              {PETUGAS.map((p) => (
                <li key={p.username} className="flex justify-between">
                  <span className="text-foreground">
                    {p.username} / {p.password}
                  </span>
                  <span>{p.peran}</span>
                </li>
              ))}
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------- KASIR --------------------------------- */

function Kasir({
  session,
  onLogout,
}: {
  session: Session;
  onLogout: () => void;
}) {
  const [active, setActive] = useState<ParkedVehicle[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [plate, setPlate] = useState("");
  const [type, setType] = useState<VehicleType>("motor");
  const [error, setError] = useState<string | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<ParkedVehicle | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const plateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActive(load<ParkedVehicle[]>(ACTIVE_KEY, []));
    setReceipts(load<Receipt[]>(RECEIPTS_KEY, []));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (active.length > 0 || localStorage.getItem(ACTIVE_KEY)) {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
    }
  }, [active]);

  useEffect(() => {
    if (receipts.length > 0 || localStorage.getItem(RECEIPTS_KEY)) {
      localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
    }
  }, [receipts]);

  // Cocokkan plat yang sedang diketik dengan daftar anggota bebas biaya.
  const bebasMatch = useMemo(() => cariAnggotaBebas(plate), [plate]);

  useEffect(() => {
    if (bebasMatch) setType(bebasMatch.type);
  }, [bebasMatch]);

  const todaysReceipts = useMemo(
    () => receipts.filter((r) => isToday(r.paidAt)),
    [receipts]
  );

  const totals = useMemo(() => {
    const motor = todaysReceipts.filter((r) => r.type === "motor");
    const mobil = todaysReceipts.filter((r) => r.type === "mobil");
    const sum = (list: Receipt[]) => list.reduce((a, r) => a + r.amount, 0);
    return {
      total: sum(todaysReceipts),
      motorCount: motor.length,
      mobilCount: mobil.length,
      motorTotal: sum(motor),
      mobilTotal: sum(mobil),
      bebasCount: todaysReceipts.filter((r) => r.bebasId).length,
    };
  }, [todaysReceipts]);

  function handleMasuk(e: React.FormEvent) {
    e.preventDefault();
    const clean = plate.trim().toUpperCase().replace(/\s+/g, " ");
    if (!clean) {
      setError("Isi nomor plat dulu.");
      return;
    }
    if (active.some((v) => v.plate === clean)) {
      setError(`Plat ${clean} sudah tercatat parkir.`);
      return;
    }
    const anggota = cariAnggotaBebas(clean);
    setError(null);
    setActive((prev) => [
      {
        id: `${Date.now()}`,
        plate: clean,
        type: anggota ? anggota.type : type,
        entryAt: Date.now(),
        ...(anggota ? { bebasId: anggota.id, bebasNama: anggota.nama } : {}),
      },
      ...prev,
    ]);
    setPlate("");
    plateRef.current?.focus();
  }

  function handleCheckoutConfirm() {
    if (!checkoutTarget) return;
    setReceipts((prev) => [
      {
        id: checkoutTarget.id,
        plate: checkoutTarget.plate,
        type: checkoutTarget.type,
        entryAt: checkoutTarget.entryAt,
        paidAt: Date.now(),
        amount: checkoutTarget.bebasId ? 0 : RATES[checkoutTarget.type],
        ...(checkoutTarget.bebasId ? { bebasId: checkoutTarget.bebasId } : {}),
      },
      ...prev,
    ]);
    setActive((prev) => prev.filter((v) => v.id !== checkoutTarget.id));
    setCheckoutTarget(null);
  }

  const sortedActive = useMemo(
    () => [...active].sort((a, b) => a.entryAt - b.entryAt),
    [active]
  );

  const checkoutAmount = checkoutTarget
    ? checkoutTarget.bebasId
      ? 0
      : RATES[checkoutTarget.type]
    : 0;

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary font-mono text-xl font-bold text-primary-foreground">
              P
            </span>
            <div className="leading-tight">
              <h1 className="text-lg font-bold tracking-tight">Kasir Parkir</h1>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Motor Rp 2.000 · Mobil Rp 5.000
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-bold">{session.nama}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {session.peran} · {clock(now)}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs font-bold uppercase tracking-wide transition-colors hover:bg-secondary"
            >
              Keluar
            </button>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
          {/* Kolom kiri: form masuk + rekap */}
          <div className="flex flex-col gap-5">
            <form
              onSubmit={handleMasuk}
              className="ticket-notch rounded-2xl border border-border bg-card p-5"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                ( a ) · Masuk
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Catat kendaraan
              </h2>

              <label
                htmlFor="plat"
                className="mt-5 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
              >
                Nomor plat
              </label>
              <input
                id="plat"
                ref={plateRef}
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="B 1234 XYZ"
                spellCheck={false}
                autoComplete="off"
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-mono text-xl font-bold tracking-wider text-foreground placeholder:font-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />

              {bebasMatch && (
                <p className="mt-2 rounded-lg bg-secondary px-3 py-2 text-sm">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                    Bebas biaya
                  </span>
                  <br />
                  {bebasMatch.nama} · {bebasMatch.id}
                </p>
              )}

              <span className="mt-4 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Jenis kendaraan
              </span>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {(Object.keys(RATES) as VehicleType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    aria-pressed={type === t}
                    className={`rounded-lg px-3 py-3 text-left ring-1 transition-colors ${
                      type === t
                        ? t === "motor"
                          ? "bg-motor text-motor-foreground ring-motor"
                          : "bg-mobil text-mobil-foreground ring-mobil"
                        : "bg-transparent text-foreground ring-border hover:bg-secondary"
                    }`}
                  >
                    <span className="block text-base font-bold capitalize">
                      {t}
                    </span>
                    <span className="mt-0.5 block font-mono text-xs opacity-80">
                      {rupiah(RATES[t])}
                    </span>
                  </button>
                ))}
              </div>

              {error && (
                <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Catat masuk
              </button>
              <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Tarif flat sekali bayar
              </p>
            </form>

            {/* Rekap hari ini */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  ( c ) · Hari ini
                </p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {todaysReceipts.length} keluar
                </p>
              </div>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Total pendapatan
              </p>
              <p className="mt-1 text-4xl font-bold tracking-tight">
                {rupiah(totals.total)}
              </p>
              <div className="mt-4 space-y-2 border-t border-dashed border-border pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-motor" />
                    Motor
                  </span>
                  <span className="font-mono">
                    {totals.motorCount}× · {rupiah(totals.motorTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-mobil" />
                    Mobil
                  </span>
                  <span className="font-mono">
                    {totals.mobilCount}× · {rupiah(totals.mobilTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Bebas biaya</span>
                  <span className="font-mono">{totals.bebasCount}× · Rp 0</span>
                </div>
              </div>
            </section>
          </div>

          {/* Kolom kanan: daftar parkir + anggota bebas */}
          <div className="flex flex-col gap-5">
            <section className="ticket-notch h-fit rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between border-b border-dashed border-border pb-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  ( b ) · Sedang parkir
                </p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {sortedActive.length} kendaraan
                </p>
              </div>

              {sortedActive.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Belum ada kendaraan. Catat plat nomor di form masuk.
                </p>
              ) : (
                <ul className="divide-y divide-dashed divide-border">
                  {sortedActive.map((v) => (
                    <li key={v.id} className="flex items-center gap-4 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-lg font-bold uppercase tracking-tight">
                          {v.plate}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                              v.type === "motor"
                                ? "bg-motor text-motor-foreground"
                                : "bg-mobil text-mobil-foreground"
                            }`}
                          >
                            {v.type}
                          </span>
                          {v.bebasId && (
                            <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                              bebas · {v.bebasId}
                            </span>
                          )}
                          <span className="font-mono text-xs text-muted-foreground">
                            masuk {clock(v.entryAt)} ·{" "}
                            {durationLabel(v.entryAt, now)}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-sm text-muted-foreground">
                        {v.bebasId ? "Rp 0" : rupiah(RATES[v.type])}
                      </span>
                      <button
                        onClick={() => setCheckoutTarget(v)}
                        className="rounded-md bg-primary px-3 py-2 font-mono text-xs font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        Checkout
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Daftar anggota bebas biaya */}
            <section className="h-fit rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between border-b border-dashed border-border pb-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  ( d ) · Kartu bebas biaya
                </p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {ANGGOTA_BEBAS.length} orang
                </p>
              </div>
              <ul className="divide-y divide-dashed divide-border">
                {ANGGOTA_BEBAS.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3"
                  >
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      {a.id}
                    </span>
                    <span className="flex-1 text-sm font-semibold">{a.nama}</span>
                    <span className="font-mono text-sm font-bold uppercase tracking-tight">
                      {a.plate}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                        a.type === "motor"
                          ? "bg-motor text-motor-foreground"
                          : "bg-mobil text-mobil-foreground"
                      }`}
                    >
                      {a.type}
                    </span>
                    <span className="w-full font-mono text-[11px] text-muted-foreground sm:w-auto">
                      {a.keterangan}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>

      {/* Dialog checkout */}
      {checkoutTarget && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4"
          onClick={() => setCheckoutTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Tiket keluar
            </p>
            <p className="mt-2 font-mono text-2xl font-bold uppercase tracking-tight">
              {checkoutTarget.plate}
            </p>
            {checkoutTarget.bebasId && (
              <p className="mt-1 text-sm text-muted-foreground">
                {checkoutTarget.bebasNama} · {checkoutTarget.bebasId} · bebas biaya
              </p>
            )}
            <div className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jenis</span>
                <span className="font-bold capitalize">{checkoutTarget.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Masuk</span>
                <span className="font-mono">{clock(checkoutTarget.entryAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lama parkir</span>
                <span className="font-mono">
                  {durationLabel(checkoutTarget.entryAt, Date.now())}
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between border-t border-dashed border-border pt-4">
              <span className="text-sm text-muted-foreground">Total bayar</span>
              <span className="text-3xl font-bold tracking-tight">
                {rupiah(checkoutAmount)}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setCheckoutTarget(null)}
                className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
              >
                Batal
              </button>
              <button
                onClick={handleCheckoutConfirm}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {checkoutAmount === 0 ? "Keluar" : "Bayar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
