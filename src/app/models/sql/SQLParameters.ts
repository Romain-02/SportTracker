export type SQLParameterValue = string | number | null;

export type SQLParameters = {
  parameters: SQLParameterValue[];
  query: string;
};
