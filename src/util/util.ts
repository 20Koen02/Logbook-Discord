import { init } from "@paralleldrive/cuid2";

export const createId = init({
  length: 10,
});

export const getThemeColor = () =>
  Number(`0xf89b29`);

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
