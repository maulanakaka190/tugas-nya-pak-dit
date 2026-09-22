export const RATES = { motor: 2000, mobil: 5000 } as const;
export type VehicleType = keyof typeof RATES;

/** Petugas yang boleh masuk aplikasi kasir (contoh). */
export interface Petugas {
  username: string;
  password: string;
  nama: string;
  peran: string;
}

export const PETUGAS: Petugas[] = [
  { username: "admin", password: "1234", nama: "Pak Dit", peran: "Admin" },
  { username: "kasir", password: "1234", nama: "Maulana", peran: "Kasir" },
];

/** Anggota bebas biaya parkir (kartu langganan). */
export interface AnggotaBebas {
  id: string;
  nama: string;
  plate: string;
  type: VehicleType;
  keterangan: string;
}

export const ANGGOTA_BEBAS: AnggotaBebas[] = [
  {
    id: "BBS-001",
    nama: "Maulana Kaka",
    plate: "B 1234 MKA",
    type: "motor",
    keterangan: "Karyawan tetap",
  },
  {
    id: "BBS-002",
    nama: "Siti Rahmawati",
    plate: "B 5678 SRW",
    type: "motor",
    keterangan: "Karyawan tetap",
  },
  {
    id: "BBS-003",
    nama: "Budi Santoso",
    plate: "D 4321 BDS",
    type: "mobil",
    keterangan: "Pemilik ruko",
  },
  {
    id: "BBS-004",
    nama: "Dita Pramesti",
    plate: "F 9090 DTP",
    type: "mobil",
    keterangan: "Langganan bulanan",
  },
  {
    id: "BBS-005",
    nama: "Agus Hidayat",
    plate: "B 7777 AGS",
    type: "motor",
    keterangan: "Petugas keamanan",
  },
];

export function cariAnggotaBebas(plate: string) {
  const key = plate.replace(/\s+/g, "").toUpperCase();
  return (
    ANGGOTA_BEBAS.find((a) => a.plate.replace(/\s+/g, "").toUpperCase() === key) ??
    null
  );
}
