import chalk from "chalk";

import { init } from "@paralleldrive/cuid2";

export const createId = init({
  length: 10,
});

const themeColors = {
  primary: "#f89b29",
  text: "#ff8e4d",
  variable: "#ff624d",
  error: "#f5426c",
};

type colorType = keyof typeof themeColors;

export const getThemeColor = (color: colorType) =>
  Number(`0x${themeColors[color].substring(1)}`);

export const color = (color: colorType, message: unknown) => {
  return chalk.hex(themeColors[color])(message);
};

export const toKebabCase = (input: string) => {
  return input
    .toLowerCase() // Convert to lowercase
    .replace(/[^a-z0-9\s]/g, "") // Remove non-alphanumeric characters (except spaces)
    .trim() // Remove leading/trailing whitespace
    .replace(/\s+/g, "-"); // Replace spaces with hyphens (kebab-case)
};

export const capitalize = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};
