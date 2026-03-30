import {Sport} from "./Sport";

export interface SportType {
  id: number,
  name: string,
  sport: Sport
}

export type SportTypes = SportType[]

export interface SportTypeWithId {
  id: number,
  name: string,
  sportId: number
}

export type SportTypesWithId = SportTypeWithId[]

