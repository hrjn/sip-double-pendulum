export interface Theme {
  bg: string;
  panel: string;
  text: string;
  subtext: string;
  grid: string;
  rod1: string;
  rod2: string;
  bob1: string;
  bob2: string;
  twin1: string;
  twin2: string;
  anchor: string;
  accent: string;
  warning: string;
}

export const DARK: Theme = {
  bg: "#0d1117",
  panel: "#161b22",
  text: "#e6edf3",
  subtext: "#8b949e",
  grid: "#30363d",
  rod1: "#58a6ff",
  rod2: "#f778ba",
  bob1: "#58a6ff",
  bob2: "#f778ba",
  twin1: "#3fb950",
  twin2: "#d29922",
  anchor: "#8b949e",
  accent: "#58a6ff",
  warning: "#f85149",
};

export const LIGHT: Theme = {
  bg: "#f6f8fa",
  panel: "#ffffff",
  text: "#1f2328",
  subtext: "#656d76",
  grid: "#d0d7de",
  rod1: "#0969da",
  rod2: "#bf3989",
  bob1: "#0969da",
  bob2: "#bf3989",
  twin1: "#1a7f37",
  twin2: "#9a6700",
  anchor: "#656d76",
  accent: "#0969da",
  warning: "#cf222e",
};
