export interface Sport {
  id: number;
  name: string;
  logo: string;
}

export type Sports = Sport[]

export const DEFAULT_SPORT: Sport = {
  id: -1,
  name: "default",
  logo: "",
}
